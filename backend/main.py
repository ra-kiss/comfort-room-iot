#!/usr/bin/env python3
"""
ComfortRoom REST API
FastAPI backend for IoT Room Selection Decision Support System
"""

from datetime import datetime
from typing import Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import psycopg2
from psycopg2.extras import RealDictCursor

from decision import Weights, DesiredProfile, rank_rooms

# Database configuration (same as simulator.py)
DB_CONFIG = {
    "host": "localhost",
    "database": "comfortroom_db",
    "user": "comfortroom",
    "password": "comfortroom",
}

app = FastAPI(
    title="ComfortRoom API",
    description="IoT Room Selection Decision Support System - REST API",
    version="1.0.0",
)

# Enable CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Pydantic models for response schemas
class Room(BaseModel):
    id: int
    name: str
    building: Optional[str]
    floor: Optional[int]
    capacity: int
    has_projector: bool
    has_whiteboard: bool
    has_power_outlets: int
    is_accessible: bool


class SensorData(BaseModel):
    id: int
    room_id: int
    timestamp: datetime
    temperature: Optional[float]
    co2: Optional[int]
    humidity: Optional[float]
    sound: Optional[float]


class CalendarEvent(BaseModel):
    id: int
    room_id: int
    title: str
    start_time: datetime
    end_time: datetime
    organizer: Optional[str]


# Request/Response models for recommendation endpoint
class RecommendationWeights(BaseModel):
    """User preference weights for room scoring (should sum to 1.0)."""
    temperature: float = Field(default=0.25, ge=0, le=1, description="Weight for temperature importance")
    co2: float = Field(default=0.30, ge=0, le=1, description="Weight for CO2/air quality importance")
    humidity: float = Field(default=0.20, ge=0, le=1, description="Weight for humidity importance")
    sound: float = Field(default=0.25, ge=0, le=1, description="Weight for noise level importance")


class RoomRequirements(BaseModel):
    """Room facility requirements."""
    min_capacity: Optional[int] = Field(default=None, ge=1, description="Minimum room capacity")
    needs_projector: Optional[bool] = Field(default=None, description="Room must have projector")
    needs_whiteboard: Optional[bool] = Field(default=None, description="Room must have whiteboard")
    needs_accessible: Optional[bool] = Field(default=None, description="Room must be accessible")
    min_power_outlets: Optional[int] = Field(default=None, ge=0, description="Minimum power outlets")


class DesiredProfileRequest(BaseModel):
    """User's desired ideal values for each criterion."""
    temperature: Optional[float] = Field(default=None, description="Desired temperature in Celsius")
    co2: Optional[int] = Field(default=None, description="Desired CO2 level in ppm")
    humidity: Optional[float] = Field(default=None, description="Desired humidity percentage")
    sound: Optional[float] = Field(default=None, description="Desired sound level in dB")


class RecommendationRequest(BaseModel):
    """Request body for room recommendation."""
    weights: RecommendationWeights = Field(default_factory=RecommendationWeights)
    requirements: RoomRequirements = Field(default_factory=RoomRequirements)
    desired_profile: Optional[DesiredProfileRequest] = Field(default=None, description="User's desired ideal values")


class RoomScore(BaseModel):
    """Individual room score in recommendation results."""
    room_id: int
    room_name: str
    rank: int
    score: float
    individual_scores: dict
    sensor_values: dict
    facilities: dict


def get_db_connection():
    """Create database connection with dictionary cursor."""
    return psycopg2.connect(**DB_CONFIG, cursor_factory=RealDictCursor)


# ============================================================
# API Endpoints
# ============================================================

@app.get("/")
def root():
    """API root - welcome message."""
    return {
        "message": "ComfortRoom API",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/api/rooms", response_model=list[Room])
def get_rooms():
    """
    Get all rooms.

    Returns a list of all rooms with their facilities.
    """
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            cur.execute("""
                SELECT id, name, building, floor, capacity,
                       has_projector, has_whiteboard, has_power_outlets, is_accessible
                FROM rooms
                ORDER BY name
            """)
            rooms = cur.fetchall()
        conn.close()
        return rooms
    except psycopg2.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.get("/api/rooms/{room_id}", response_model=Room)
def get_room(room_id: int):
    """
    Get a specific room by ID.

    Returns room details including all facilities.
    """
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            cur.execute("""
                SELECT id, name, building, floor, capacity,
                       has_projector, has_whiteboard, has_power_outlets, is_accessible
                FROM rooms
                WHERE id = %s
            """, (room_id,))
            room = cur.fetchone()
        conn.close()

        if not room:
            raise HTTPException(status_code=404, detail=f"Room {room_id} not found")
        return room
    except psycopg2.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.get("/api/sensors/{room_id}", response_model=list[SensorData])
def get_sensor_data(
    room_id: int,
    start: Optional[datetime] = Query(None, description="Start time filter (ISO format)"),
    end: Optional[datetime] = Query(None, description="End time filter (ISO format)"),
    limit: int = Query(100, ge=1, le=1000, description="Max number of records to return"),
):
    """
    Get sensor data for a specific room.

    Supports optional time range filtering with `start` and `end` query parameters.
    Returns most recent data first.
    """
    try:
        conn = get_db_connection()

        # First verify room exists
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM rooms WHERE id = %s", (room_id,))
            if not cur.fetchone():
                conn.close()
                raise HTTPException(status_code=404, detail=f"Room {room_id} not found")

        # Build query with optional time filters
        query = """
            SELECT id, room_id, timestamp, temperature, co2, humidity, sound
            FROM sensor_data
            WHERE room_id = %s
        """
        params = [room_id]

        if start:
            query += " AND timestamp >= %s"
            params.append(start)
        if end:
            query += " AND timestamp <= %s"
            params.append(end)

        query += " ORDER BY timestamp DESC LIMIT %s"
        params.append(limit)

        with conn.cursor() as cur:
            cur.execute(query, params)
            data = cur.fetchall()
        conn.close()

        return data
    except psycopg2.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.get("/api/calendar/{room_id}", response_model=list[CalendarEvent])
def get_calendar_events(
    room_id: int,
    start: Optional[datetime] = Query(None, description="Start time filter (ISO format)"),
    end: Optional[datetime] = Query(None, description="End time filter (ISO format)"),
):
    """
    Get calendar events for a specific room.

    Supports optional time range filtering. By default returns events from today onwards.
    """
    try:
        conn = get_db_connection()

        # First verify room exists
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM rooms WHERE id = %s", (room_id,))
            if not cur.fetchone():
                conn.close()
                raise HTTPException(status_code=404, detail=f"Room {room_id} not found")

        # Build query with optional time filters
        query = """
            SELECT id, room_id, title, start_time, end_time, organizer
            FROM calendar_events
            WHERE room_id = %s
        """
        params = [room_id]

        if start:
            query += " AND start_time >= %s"
            params.append(start)
        else:
            # Default: from start of today
            query += " AND start_time >= CURRENT_DATE"

        if end:
            query += " AND end_time <= %s"
            params.append(end)

        query += " ORDER BY start_time ASC"

        with conn.cursor() as cur:
            cur.execute(query, params)
            events = cur.fetchall()
        conn.close()

        return events
    except psycopg2.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.get("/api/sensors/{room_id}/latest")
def get_latest_sensor_data(room_id: int):
    """
    Get the most recent sensor reading for a room.

    Useful for real-time displays.
    """
    try:
        conn = get_db_connection()

        # Verify room exists
        with conn.cursor() as cur:
            cur.execute("SELECT id, name FROM rooms WHERE id = %s", (room_id,))
            room = cur.fetchone()
            if not room:
                conn.close()
                raise HTTPException(status_code=404, detail=f"Room {room_id} not found")

        # Get latest sensor data
        with conn.cursor() as cur:
            cur.execute("""
                SELECT id, room_id, timestamp, temperature, co2, humidity, sound
                FROM sensor_data
                WHERE room_id = %s
                ORDER BY timestamp DESC
                LIMIT 1
            """, (room_id,))
            data = cur.fetchone()
        conn.close()

        if not data:
            return {
                "room_id": room_id,
                "room_name": room["name"],
                "message": "No sensor data available",
                "data": None
            }

        return {
            "room_id": room_id,
            "room_name": room["name"],
            "data": dict(data)
        }
    except psycopg2.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


# ============================================================
# Recommendation Endpoint (API2)
# ============================================================

@app.post("/api/recommend", response_model=list[RoomScore])
def recommend_rooms(request: RecommendationRequest):
    """
    Get room recommendations based on preferences and requirements.

    Ranks all rooms by comfort score using latest sensor data.
    Filters rooms based on facility requirements.

    Request body:
    - weights: importance of each criterion (temperature, co2, humidity, sound)
    - requirements: facility filters (min_capacity, needs_projector, etc.)

    Returns ranked list of rooms with scores.
    """
    try:
        conn = get_db_connection()
        req = request.requirements

        # Build query to filter rooms by requirements
        query = """
            SELECT id, name, building, floor, capacity,
                   has_projector, has_whiteboard, has_power_outlets, is_accessible
            FROM rooms
            WHERE 1=1
        """
        params = []

        if req.min_capacity is not None:
            query += " AND capacity >= %s"
            params.append(req.min_capacity)

        if req.needs_projector is True:
            query += " AND has_projector = TRUE"

        if req.needs_whiteboard is True:
            query += " AND has_whiteboard = TRUE"

        if req.needs_accessible is True:
            query += " AND is_accessible = TRUE"

        if req.min_power_outlets is not None:
            query += " AND has_power_outlets >= %s"
            params.append(req.min_power_outlets)

        query += " ORDER BY name"

        with conn.cursor() as cur:
            cur.execute(query, params)
            rooms = cur.fetchall()

        if not rooms:
            conn.close()
            return []

        # Get latest sensor data for each room
        rooms_with_sensors = []
        with conn.cursor() as cur:
            for room in rooms:
                cur.execute("""
                    SELECT temperature, co2, humidity, sound
                    FROM sensor_data
                    WHERE room_id = %s
                    ORDER BY timestamp DESC
                    LIMIT 1
                """, (room["id"],))
                sensor_data = cur.fetchone()

                room_data = {
                    "room_id": room["id"],
                    "room_name": room["name"],
                    "temperature": float(sensor_data["temperature"]) if sensor_data and sensor_data["temperature"] else None,
                    "co2": int(sensor_data["co2"]) if sensor_data and sensor_data["co2"] else None,
                    "humidity": float(sensor_data["humidity"]) if sensor_data and sensor_data["humidity"] else None,
                    "sound": float(sensor_data["sound"]) if sensor_data and sensor_data["sound"] else None,
                    "facilities": {
                        "building": room["building"],
                        "floor": room["floor"],
                        "capacity": room["capacity"],
                        "has_projector": room["has_projector"],
                        "has_whiteboard": room["has_whiteboard"],
                        "has_power_outlets": room["has_power_outlets"],
                        "is_accessible": room["is_accessible"],
                    }
                }
                rooms_with_sensors.append(room_data)

        conn.close()

        # Convert request weights to decision module Weights
        weights = Weights(
            temperature=request.weights.temperature,
            co2=request.weights.co2,
            humidity=request.weights.humidity,
            sound=request.weights.sound,
        )

        # Convert desired_profile if provided
        desired_profile = None
        if request.desired_profile:
            desired_profile = DesiredProfile(
                temperature=request.desired_profile.temperature,
                co2=request.desired_profile.co2,
                humidity=request.desired_profile.humidity,
                sound=request.desired_profile.sound,
            )

        # Rank rooms using decision algorithm
        ranked = rank_rooms(rooms_with_sensors, weights, desired_profile)

        # Add facilities to results
        facilities_map = {r["room_id"]: r["facilities"] for r in rooms_with_sensors}
        for room in ranked:
            room["facilities"] = facilities_map[room["room_id"]]

        return ranked

    except psycopg2.Error as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
