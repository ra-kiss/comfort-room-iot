-- ComfortRoom Database Schema
-- IoT Room Selection Decision Support System
-- Requirement #2: Database Design

-----------------------------------------------------------
-- TABLES
-----------------------------------------------------------

-- Rooms: stores room information and facilities
CREATE TABLE rooms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    building VARCHAR(100),
    floor INTEGER,
    capacity INTEGER NOT NULL,
    has_projector BOOLEAN DEFAULT FALSE,
    has_whiteboard BOOLEAN DEFAULT FALSE,
    has_power_outlets INTEGER DEFAULT 0,
    is_accessible BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sensor Data: timestamped environmental readings per room
CREATE TABLE sensor_data (
    id SERIAL PRIMARY KEY,
    room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    temperature DECIMAL(4,1),      -- Celsius (e.g., 22.5)
    co2 INTEGER,                   -- ppm (e.g., 650)
    humidity DECIMAL(4,1),         -- Percentage (e.g., 45.0)
    sound DECIMAL(4,1),            -- dB (e.g., 35.5)

    -- Index for fast time-range queries
    CONSTRAINT valid_temperature CHECK (temperature BETWEEN -10 AND 50),
    CONSTRAINT valid_co2 CHECK (co2 BETWEEN 300 AND 5000),
    CONSTRAINT valid_humidity CHECK (humidity BETWEEN 0 AND 100),
    CONSTRAINT valid_sound CHECK (sound BETWEEN 0 AND 130)
);

-- Calendar Events: room bookings and schedules
CREATE TABLE calendar_events (
    id SERIAL PRIMARY KEY,
    room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    organizer VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-----------------------------------------------------------
-- INDEXES (for query performance)
-----------------------------------------------------------

CREATE INDEX idx_sensor_data_room_time ON sensor_data(room_id, timestamp DESC);
CREATE INDEX idx_sensor_data_timestamp ON sensor_data(timestamp DESC);
CREATE INDEX idx_calendar_events_room ON calendar_events(room_id);
CREATE INDEX idx_calendar_events_time ON calendar_events(start_time, end_time);
