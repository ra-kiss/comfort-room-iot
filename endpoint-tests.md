# ComfortRoom API Endpoint Tests

## Prerequisites

1. Start the database (PostgreSQL must be running)
2. Ensure the database has sample data:
   ```bash
   psql -U comfortroom -d comfortroom_db -f database/schema.sql
   psql -U comfortroom -d comfortroom_db -f database/insert_dummy_data.sql
   ```
3. Run the simulator to generate sensor data:
   ```bash
   cd backend
   python simulator.py --once
   ```

## Start the API Server

```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Or run directly:
```bash
cd backend
python main.py
```

The API will be available at `http://localhost:8000`

---

## Test Endpoints

### 1. Root Endpoint

```bash
curl http://localhost:8000/
```

Expected: Welcome message with API info

---

### 2. Get All Rooms

```bash
curl http://localhost:8000/api/rooms
```

Expected: JSON array of all rooms with their facilities

---

### 3. Get Specific Room

```bash
# Get room 1
curl http://localhost:8000/api/rooms/1

# Get room 5
curl http://localhost:8000/api/rooms/5

# Test 404 error (non-existent room)
curl http://localhost:8000/api/rooms/999
```

Expected: JSON object with room details, or 404 error for non-existent room

---

### 4. Get Sensor Data for a Room

```bash
# Get sensor data for room 1 (default limit: 100)
curl http://localhost:8000/api/sensors/1

# Get sensor data with custom limit
curl "http://localhost:8000/api/sensors/1?limit=10"

# Get sensor data with time range (ISO format)
curl "http://localhost:8000/api/sensors/1?start=2024-01-01T00:00:00&end=2025-12-31T23:59:59"

# Test 404 error (non-existent room)
curl http://localhost:8000/api/sensors/999
```

Expected: JSON array of sensor readings (temperature, CO2, humidity, sound)

---

### 5. Get Latest Sensor Reading

```bash
# Get latest reading for room 1
curl http://localhost:8000/api/sensors/1/latest

# Get latest reading for room 3
curl http://localhost:8000/api/sensors/3/latest
```

Expected: Single most recent sensor reading for the room

---

### 6. Get Calendar Events for a Room

```bash
# Get events for room 1 (defaults to today onwards)
curl http://localhost:8000/api/calendar/1

# Get events for room 6
curl http://localhost:8000/api/calendar/6

# Get events with time range
curl "http://localhost:8000/api/calendar/1?start=2024-01-01T00:00:00&end=2025-12-31T23:59:59"

# Test 404 error (non-existent room)
curl http://localhost:8000/api/calendar/999
```

Expected: JSON array of calendar events for the room

---

### 7. Get Room Recommendations (POST)

```bash
# Get recommendations with default weights (no filters)
curl -X POST http://localhost:8000/api/recommend \
  -H "Content-Type: application/json" \
  -d '{}'

# Get recommendations with custom weights
curl -X POST http://localhost:8000/api/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "weights": {
      "temperature": 0.3,
      "co2": 0.4,
      "humidity": 0.15,
      "sound": 0.15
    }
  }'

# Get recommendations with facility requirements
curl -X POST http://localhost:8000/api/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "requirements": {
      "min_capacity": 20,
      "needs_projector": true
    }
  }'

# Full request with weights and requirements
curl -X POST http://localhost:8000/api/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "weights": {
      "temperature": 0.25,
      "co2": 0.35,
      "humidity": 0.20,
      "sound": 0.20
    },
    "requirements": {
      "min_capacity": 25,
      "needs_projector": true,
      "needs_whiteboard": true,
      "needs_accessible": true
    }
  }'

# Prioritize air quality (CO2) for health-conscious users
curl -X POST http://localhost:8000/api/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "weights": {
      "temperature": 0.15,
      "co2": 0.50,
      "humidity": 0.15,
      "sound": 0.20
    }
  }'

# Prioritize quiet rooms for exams/focus work
curl -X POST http://localhost:8000/api/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "weights": {
      "temperature": 0.20,
      "co2": 0.20,
      "humidity": 0.10,
      "sound": 0.50
    }
  }'
```

Expected: JSON array of ranked rooms with scores, individual criterion scores, and facilities

Example response:
```json
[
  {
    "room_id": 3,
    "room_name": "Room A201",
    "rank": 1,
    "score": 95.2,
    "individual_scores": {
      "temperature": 92.0,
      "co2": 98.5,
      "humidity": 100.0,
      "sound": 88.0
    },
    "sensor_values": {
      "temperature": 21.5,
      "co2": 580,
      "humidity": 48.0,
      "sound": 33.0
    },
    "facilities": {
      "building": "Building A",
      "floor": 2,
      "capacity": 40,
      "has_projector": true,
      "has_whiteboard": true,
      "has_power_outlets": 15,
      "is_accessible": false
    }
  }
]
```

---

## Swagger Documentation

Open in browser: **http://localhost:8000/docs**

This provides an interactive API documentation where you can test all endpoints directly.

Alternative (ReDoc): **http://localhost:8000/redoc**

---

## Quick Test Script

Run all tests at once:

```bash
echo "=== Testing ComfortRoom API ==="
echo ""
echo "1. Root endpoint:"
curl -s http://localhost:8000/ | head -c 200
echo -e "\n"

echo "2. Get all rooms:"
curl -s http://localhost:8000/api/rooms | head -c 500
echo -e "\n..."
echo ""

echo "3. Get room 1:"
curl -s http://localhost:8000/api/rooms/1
echo -e "\n"

echo "4. Get sensor data for room 1 (limit 3):"
curl -s "http://localhost:8000/api/sensors/1?limit=3"
echo -e "\n"

echo "5. Get latest sensor reading for room 1:"
curl -s http://localhost:8000/api/sensors/1/latest
echo -e "\n"

echo "6. Get calendar events for room 1:"
curl -s http://localhost:8000/api/calendar/1
echo -e "\n"

echo "7. Get room recommendations:"
curl -s -X POST http://localhost:8000/api/recommend \
  -H "Content-Type: application/json" \
  -d '{"requirements": {"min_capacity": 20}}'
echo -e "\n"

echo "=== All tests complete ==="
```

---

## Using Python requests

```python
import requests

BASE_URL = "http://localhost:8000"

# Get all rooms
rooms = requests.get(f"{BASE_URL}/api/rooms").json()
print(f"Found {len(rooms)} rooms")

# Get room 1 details
room = requests.get(f"{BASE_URL}/api/rooms/1").json()
print(f"Room: {room['name']}, Capacity: {room['capacity']}")

# Get sensor data
sensors = requests.get(f"{BASE_URL}/api/sensors/1", params={"limit": 5}).json()
print(f"Latest readings: {len(sensors)} records")

# Get calendar events
events = requests.get(f"{BASE_URL}/api/calendar/1").json()
print(f"Upcoming events: {len(events)}")

# Get room recommendations
recommendations = requests.post(
    f"{BASE_URL}/api/recommend",
    json={
        "weights": {"temperature": 0.25, "co2": 0.35, "humidity": 0.20, "sound": 0.20},
        "requirements": {"min_capacity": 20, "needs_projector": True}
    }
).json()
print(f"Recommended rooms: {len(recommendations)}")
for room in recommendations[:3]:
    print(f"  #{room['rank']} {room['room_name']}: Score {room['score']}")
```

---

## Using HTTPie (alternative to curl)

```bash
# Install: pip install httpie

http GET localhost:8000/api/rooms
http GET localhost:8000/api/rooms/1
http GET localhost:8000/api/sensors/1 limit==5
http GET localhost:8000/api/calendar/1

# POST recommend endpoint
http POST localhost:8000/api/recommend \
  weights:='{"temperature": 0.3, "co2": 0.4, "humidity": 0.15, "sound": 0.15}' \
  requirements:='{"min_capacity": 20}'
```
