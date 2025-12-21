# Communication Protocol Justifications

**Project:** ComfortRoom IoT Decision Support System  
**Requirement #1:** Specify and justify communication protocols for Comm A, B, C, and D

---

## Comm A
> Sensors → Arduino

Chosen Protocol: **I2C (Inter-Integrated Circuit)**

### Justification:

**Why I2C:**

- **Industry Standard:** Most modern sensor modules (DHT22 for temperature/humidity, MQ-135 for CO2, sound sensors) come with built-in I2C interfaces
- **Minimal Wiring:** Requires only 2 data lines (SDA and SCL) plus power and ground, regardless of how many sensors are connected
- **Multi-Device Support:** Multiple sensors can share the same I2C bus using unique addresses (0x48, 0x76, etc.)
- **No Setup Required:** Arduino Wire library is built-in, sensors work immediately after connecting
- **Low Pin Usage:** Leaves Arduino's other pins free for future expansion

**Alternative Considered:**

- Analog pins (0-5V reading): Limited to 6 analog pins on Arduino Uno, would require one pin per sensor
- Digital protocols (SPI): Requires more wires (MISO, MOSI, SCK, CS per device)

**Conclusion:** I2C is the simplest, most scalable choice for Arduino sensor communication with zero configuration overhead.

---

## Comm B
> Arduino → Raspberry Pi

Chosen Protocol: **Serial over USB**

### Justification:

**Why Serial over USB:**

- **Zero Configuration:** Simply plug Arduino into Raspberry Pi USB port - no drivers, no setup
- **Automatic Recognition:** Arduino appears as `/dev/ttyACM0` or `/dev/ttyUSB0` on Raspberry Pi
- **Bidirectional:** Supports both sending sensor data to Pi and receiving commands from Pi
- **Built-in Error Handling:** USB provides error detection and correction
- **Universal Support:** Works with any Arduino-compatible board and any Linux system
- **No Additional Hardware:** Uses standard USB cable that comes with Arduino

**Data Format:**

- JSON over serial for easy parsing: `{"temp": 22.5, "co2": 650, "humidity": 45, "sound": 40}`
- Newline-delimited for simple line-by-line reading

**Alternative Considered:**

- I2C/SPI: Requires GPIO pin connections and voltage level shifting (Arduino = 5V, Pi = 3.3V), adds complexity
- Bluetooth: Requires pairing and additional hardware modules

**Conclusion:** Serial over USB is the most intuitive, plug-and-play solution with zero setup requirements.

---

## Comm C
> Room Facilities Database → Raspberry Pi

Chosen Protocol: **HTTP/REST API**

### Justification:

**Why REST API:**

- **Database Independence:** Works with any database (PostgreSQL, MySQL, SQLite) since the DB server exposes HTTP endpoints
- **Standard Web Protocol:** HTTP is universally supported, well-documented, and familiar to developers
- **Language Agnostic:** Raspberry Pi can use any language (Python, Node.js, etc.) to make HTTP requests
- **Firewall Friendly:** HTTP/HTTPS works through standard network configurations
- **Built-in Authentication:** Easy to add JWT tokens or API keys if needed later
- **Human Readable:** JSON responses are easy to debug and test with curl or Postman

**Endpoint Examples:**

```
GET /api/rooms                    → List all rooms
GET /api/rooms/{id}               → Get room details
GET /api/rooms/{id}/facilities    → Get room facilities
```

**Alternative Considered:**

- Direct Database Connection: Requires database credentials on Raspberry Pi, creates tight coupling, harder to scale or secure
- Message Queue (MQTT): Overkill for simple request-response patterns, adds unnecessary complexity

**Conclusion:** REST API is the standard, scalable approach for database communication that separates concerns and allows independent development of database and application layers.

---

## Comm D: Calendar/University Agenda
> Raspberry Pi

Chosen Protocol: **HTTP/REST API**

### Justification:

**Why REST API:**

- **External Service Standard:** Most calendar systems (Google Calendar, Outlook, university systems) expose REST APIs
- **Consistent with Architecture:** Uses same protocol as Comm C, simplifying Raspberry Pi implementation
- **Authentication Built-in:** REST APIs support OAuth2, API keys, or JWT tokens for secure access
- **Real-time or Polling:** Can poll for updates or use webhooks for real-time notifications
- **Structured Data:** Returns calendar events as JSON with standardized fields (start, end, title, location)

**Alternative Considered:**
- CalDAV: Calendar-specific protocol, more complex to implement, overkill for read-only access
- Direct Database Access: Requires VPN or internal network access, security concerns
- File Sync (iCal): Requires periodic file downloads, not real-time, harder to filter

**Conclusion:** REST API is the industry standard for calendar integration, providing secure, flexible, real-time access to scheduling data.

---

## Summary Table

| Communication | Protocol |
|--------------|----------|
| **Comm A** (Sensors → Arduino) | I2C | 
| **Comm B** (Arduino → Raspberry Pi) | Serial over USB |
| **Comm C** (Database → Raspberry Pi) | HTTP/REST API | 
| **Comm D** (Calendar → Raspberry Pi) | HTTP/REST API |
