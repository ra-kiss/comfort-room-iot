# Database Design and Justification

**Project:** ComfortRoom IoT Decision Support System

**Requirement #2:** Specify a database to store room facilities

---

## Database Choice: PostgreSQL


**Why PostgreSQL:**

- **Time-Series Friendly:** Excellent support for timestamp-based queries with efficient indexing (B-tree on timestamp columns)
- **ACID Compliance:** Guarantees data integrity for sensor readings - no lost or corrupted data
- **Widely Adopted:** Extensive documentation and large community support
- **Constraint Support:** CHECK constraints ensure only valid sensor values are stored (e.g., temperature between -10°C and 50°C)
- **JSON Support:** Native JSONB type available if flexible schema needed

**Alternatives Considered:**

- **SQLite:** Simpler setup but lacks concurrent write support (potentially problematic if multiple sensors write simultaneously)
- **MongoDB:** NoSQL flexibility not needed; relational structure better fits room-sensor relationships

---

## Schema Design

### Table: `rooms`

Stores room information and facilities.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| name | VARCHAR(100) | Room name (e.g., "Room A101") |
| building | VARCHAR(100) | Building name |
| floor | INTEGER | Floor number |
| capacity | INTEGER | Maximum occupancy |
| has_projector | BOOLEAN | Projector available |
| has_whiteboard | BOOLEAN | Whiteboard available |
| has_power_outlets | INTEGER | Number of power outlets |
| is_accessible | BOOLEAN | Wheelchair accessible |
| created_at | TIMESTAMP | Record creation time |

*For testing, this table can be populated with* `insert_dummy_data.sql`

### Table: `sensor_data`

Stores timestamped environmental readings.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| room_id | INTEGER | Foreign key → rooms.id |
| timestamp | TIMESTAMP | Reading time |
| temperature | DECIMAL(4,1) | Temperature in °C |
| co2 | INTEGER | CO2 level in ppm |
| humidity | DECIMAL(4,1) | Relative humidity % |
| sound | DECIMAL(4,1) | Sound level in dB |

**Constraints:**
- Temperature: -10°C to 50°C
- CO2: 300 to 5000 ppm
- Humidity: 0% to 100%
- Sound: 0 to 130 dB

*For testing, this table can be populated with the Python simulator*

### Table: `calendar_events`

Stores room bookings and schedules.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| room_id | INTEGER | Foreign key → rooms.id |
| title | VARCHAR(200) | Event title |
| start_time | TIMESTAMP | Event start |
| end_time | TIMESTAMP | Event end |
| organizer | VARCHAR(100) | Event organizer |
| created_at | TIMESTAMP | Record creation time |

**Constraints:**
- end_time must be after start_time

*For testing, this table can be populated with* `insert_dummy_data.sql`

---

## Entity Relationship

```
┌─────────────┐       ┌──────────────┐
│    rooms    │       │  sensor_data │
├─────────────┤       ├──────────────┤
│ id (PK)     │──┐    │ id (PK)      │
│ name        │  │    │ room_id (FK) │───┐
│ capacity    │  └───<│ timestamp    │   │
│ has_*       │       │ temperature  │   │
│ ...         │       │ co2, etc.    │   │
└─────────────┘       └──────────────┘   │
      │                                  │
      │       ┌──────────────────┐       │
      │       │ calendar_events  │       │
      │       ├──────────────────┤       │
      └──────<│ room_id (FK)     │───────┘
              │ title            │
              │ start_time       │
              │ end_time         │
              └──────────────────┘

One room → Many sensor readings
One room → Many calendar events
```



