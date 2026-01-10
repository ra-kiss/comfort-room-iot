#!/usr/bin/env python3
"""
ComfortRoom Data Simulator
Generates fake sensor data for testing without hardware.
Run: python simulator.py
"""

import random
import time
from datetime import datetime
from typing import Optional

import psycopg2
from psycopg2.extras import execute_values


# Database configuration
DB_CONFIG = {
    "host": "localhost",
    "database": "comfortroom_db",
    "user": "comfortroom",
    "password": "comfortroom",
}

# Simulation parameters (based on docs/criteria.md ranges)
SENSOR_RANGES = {
    "temperature": {"min": 18.0, "max": 26.0, "ideal": 22.0},  # Celsius
    "co2": {"min": 400, "max": 1400, "ideal": 600},            # ppm
    "humidity": {"min": 35.0, "max": 65.0, "ideal": 50.0},     # %
    "sound": {"min": 25.0, "max": 55.0, "ideal": 30.0},        # dB
}

# How often to insert data (seconds)
INSERT_INTERVAL = 3


def get_db_connection():
    """Create database connection."""
    return psycopg2.connect(**DB_CONFIG)


def get_room_ids(conn) -> list[int]:
    """Fetch all room IDs from database."""
    with conn.cursor() as cur:
        cur.execute("SELECT id FROM rooms ORDER BY id")
        return [row[0] for row in cur.fetchall()]


def generate_sensor_value(config: dict, previous: Optional[float] = None) -> float:
    """
    Generate a realistic sensor value.
    Values tend toward ideal with some random variation.
    If previous value exists, change gradually (realistic drift).
    """
    min_val, max_val, ideal = config["min"], config["max"], config["ideal"]

    if previous is not None:
        # Gradual drift from previous value (more realistic)
        max_change = (max_val - min_val) * 0.05  # 5% max change per interval
        drift = random.uniform(-max_change, max_change)

        # Slight bias toward ideal
        if previous > ideal:
            drift -= random.uniform(0, max_change * 0.3)
        elif previous < ideal:
            drift += random.uniform(0, max_change * 0.3)

        new_val = previous + drift
    else:
        # Initial value: weighted toward ideal
        weight = random.triangular(0, 1, 0.6)  # Bias toward middle-high
        new_val = min_val + (max_val - min_val) * weight

    # Clamp to valid range
    return round(max(min_val, min(max_val, new_val)), 1)


def generate_room_data(room_id: int, previous_data: Optional[dict] = None) -> dict:
    """Generate sensor data for a single room."""
    data = {"room_id": room_id, "timestamp": datetime.now()}

    for sensor, config in SENSOR_RANGES.items():
        prev_val = previous_data.get(sensor) if previous_data else None
        if sensor == "co2":
            data[sensor] = int(generate_sensor_value(config, prev_val))
        else:
            data[sensor] = generate_sensor_value(config, prev_val)

    return data


def insert_sensor_data(conn, data_list: list[dict]):
    """Batch insert sensor data."""
    with conn.cursor() as cur:
        values = [
            (
                d["room_id"],
                d["timestamp"],
                d["temperature"],
                d["co2"],
                d["humidity"],
                d["sound"],
            )
            for d in data_list
        ]
        execute_values(
            cur,
            """
            INSERT INTO sensor_data (room_id, timestamp, temperature, co2, humidity, sound)
            VALUES %s
            """,
            values,
        )
    conn.commit()


def run_simulator():
    """Main simulation loop."""
    print("ComfortRoom Data Simulator")
    print("=" * 40)
    print(f"Inserting data every {INSERT_INTERVAL} seconds")
    print("Press Ctrl+C to stop\n")

    conn = get_db_connection()
    room_ids = get_room_ids(conn)

    if not room_ids:
        print("ERROR: No rooms found in database.")
        print("Run insert_dummy_data.sql first.")
        return

    print(f"Found {len(room_ids)} rooms: {room_ids}\n")

    # Track previous values for realistic drift
    previous_data: dict[int, dict] = {}

    try:
        iteration = 0
        while True:
            iteration += 1
            data_list = []

            for room_id in room_ids:
                data = generate_room_data(room_id, previous_data.get(room_id))
                data_list.append(data)
                previous_data[room_id] = data

            insert_sensor_data(conn, data_list)

            # Print summary
            timestamp = datetime.now().strftime("%H:%M:%S")
            print(f"[{timestamp}] Inserted {len(data_list)} readings (iteration {iteration})")

            # Print sample data every 5 iterations
            if iteration % 5 == 1:
                sample = data_list[0]
                print(f"  Sample (Room {sample['room_id']}): "
                      f"temp={sample['temperature']}°C, "
                      f"CO2={sample['co2']}ppm, "
                      f"humidity={sample['humidity']}%, "
                      f"sound={sample['sound']}dB")

            time.sleep(INSERT_INTERVAL)

    except KeyboardInterrupt:
        print("\n\nSimulator stopped.")
    finally:
        conn.close()


def insert_single_batch():
    """Insert a single batch of data (useful for testing)."""
    conn = get_db_connection()
    room_ids = get_room_ids(conn)

    data_list = [generate_room_data(room_id) for room_id in room_ids]
    insert_sensor_data(conn, data_list)

    print(f"Inserted {len(data_list)} sensor readings.")
    for d in data_list:
        print(f"  Room {d['room_id']}: {d['temperature']}°C, {d['co2']}ppm, "
              f"{d['humidity']}%, {d['sound']}dB")

    conn.close()


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == "--once":
        # Single batch mode for testing
        insert_single_batch()
    else:
        # Continuous simulation
        run_simulator()
