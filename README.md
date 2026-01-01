# ComfortRoom
> IoT Room Selection Decision Support System

---


## ✅ Build Checklist 

### **Step 1: Foundation**

**1. Write Protocol Justifications** (Requirement #1)

- [x] Create `docs/protocols.md` file
- [x] Comm A (Sensors → Arduino): Write "I2C - standard for sensor communication, low pin count"
- [x] Comm B (Arduino → Raspberry Pi): Write "Serial/UART - simple, built-in to both devices"
- [x] Comm C (DB → Raspberry Pi): Write "HTTP/REST - standard web protocol, works with any DB"
- [x] Comm D (Calendar → Raspberry Pi): Write "HTTP/REST - Google Calendar API or similar"
- [x] 1 paragraph each, done

**2. Find Standards for Criteria** (Requirement #3)

- [x] Google "EN 16798-1 CO2 levels" → Note: <1000ppm = good, >1400ppm = poor
- [x] Google "office temperature standards" → Note: 20-24°C optimal
- [x] Google "WHO humidity recommendations" → Note: 40-60% optimal
- [x] Google "classroom sound levels" → Note: <35dB optimal
- [x] Create `docs/criteria.md` with these thresholds
- [x] Done - remember to use these numbers later

**3. Setup Development Environment**

- [x] Install Python 3.10+, Node.js, PostgreSQL
- [x] Create subfolders: `backend/`, `frontend-user/`, `frontend-admin/`, `docs/`

---

### **Step 2: Database + Simulator**

**4. Build Simple Database** (Requirement #2)

- [x] Create `database/schema.sql`:
  ```sql
  CREATE TABLE rooms (id, name, capacity, has_projector, has_whiteboard);
  CREATE TABLE sensor_data (timestamp, room_id, temperature, co2, humidity, sound);
  CREATE TABLE calendar_events (room_id, start_time, end_time, title);
  ```
- [x] Run schema, create 5-10 sample rooms
- [x] Write why you chose PostgreSQL in `docs/database.md` (e.g., "widely used, handles time-series data well")

**5. Build Data Simulator** (No hardware yet)

- [x] Create `backend/simulator.py`:
  - Generates random sensor data every minute
  - Temperature: 19-25°C, CO2: 400-1200ppm, Humidity: 35-65%, Sound: 30-70dB
  - Inserts into database
- [x] Run it, verify data appears in database
- [x] Create fake calendar events (8am-5pm classes)

---

### **Step 3-4: Backend APIs**

**6. Build REST API1** (Requirement #5 - Part 1)

- [x] Install FastAPI: `pip install fastapi uvicorn sqlalchemy`
- [x] Create `backend/main.py`
- [x] Add these endpoints:
  ```python
  GET /api/rooms - list all rooms
  GET /api/rooms/{id} - room details + facilities
  GET /api/sensors/{room_id} - sensor data (add ?start= and ?end= params)
  GET /api/calendar/{room_id} - events for room
  ```
- [x] Test each with browser or Postman
- [x] Swagger docs auto-generated at `/docs`

**7. Build Decision Algorithm** (Requirement #4)

- [x] Create `backend/decision.py`
- [x] Write simple weighted sum (skip complex AHP for now):
  ```python
  def calculate_score(room_data, weights):
      temp_score = map_to_score(room_data['temperature'], ideal=22)
      co2_score = map_to_score(room_data['co2'], ideal=600, lower_is_better=True)
      # ... same for humidity, sound
      final = (temp_score * weights['temp'] + 
               co2_score * weights['co2'] + ...)
      return final
  ```
- [x] Mapping function: if value = ideal → score 100, further away → lower score
- [x] Test with sample data

**8. Build REST API2** (Requirement #5 - Part 2)

- [x] Add to `backend/main.py`:
  ```python
  POST /api/recommend
  Body: {"weights": {"temp": 0.3, "co2": 0.4, ...}, 
         "requirements": {"min_capacity": 20, "needs_projector": true}}
  Returns: [{"room_id": 1, "score": 85}, {"room_id": 3, "score": 72}, ...]
  ```
- [x] Connect to your decision algorithm
- [x] Test: does it return ranked rooms?

---

### **Step 5: User Interface**

**9. Build UI1 - Room Selection** (Requirement #6 - UI1)

- [ ] `npx create-react-app frontend-user`
- [ ] Install Material-UI: `npm install @mui/material`
- [ ] Create one page with:
  - **Sliders for weights:** "Temperature importance: 1-10" (convert to 0-1)
  - **Inputs:** "Min capacity", "Need projector?" checkbox
  - **Button:** "Find Rooms"
  - **Results:** Show ranked list of rooms with scores
- [ ] Add second tab with embedded Swagger (`<iframe src="http://localhost:8000/docs">`)

---

### **Step 6: Admin Dashboard**

**10. Build UI2 - Admin Dashboard** (Requirement #6 - UI2)

- [ ] `npx create-react-app frontend-admin`
- [ ] Install Recharts: `npm install recharts`
- [ ] Create dashboard with:
  - **Room selector dropdown**
  - **Date range picker**
  - **4 charts:** Temperature over time, CO2 over time, Humidity, Sound
  - **Table:** Room facilities list
  - **Calendar view:** Show upcoming events (can be simple list)
- [ ] Fetch data from API1

---

### **Step 7: Documentation**

**11. Take Screenshots**

- [ ] UI1: preference sliders
- [ ] UI1: results ranking
- [ ] UI1: Swagger tab
- [ ] UI2: sensor charts
- [ ] UI2: room facilities
- [ ] API testing in Postman/browser

**12. Write Report**

- [ ] **Introduction:** Explain the project
- [ ] **Requirement 1:** Paste your protocol justifications from `docs/protocols.md`
- [ ] **Requirement 2:** Paste database schema, explain why PostgreSQL
- [ ] **Requirement 3:** Paste criteria from `docs/criteria.md` with standards
- [ ] **Requirement 4:** Explain your decision algorithm (weighted sum formula)
- [ ] **Requirement 5:** Screenshot Swagger docs, explain API design
- [ ] **Requirement 6:** Screenshots of both UIs, explain features
- [ ] **Project Management:** "Solo project - completed in 7 weeks" + simple timeline
- [ ] **Conclusion:** "System works with simulated data, ready for hardware in January"
- [ ] Insert all screenshots

---

### **Step 8: Polish & Submit**

**13. Final Checks**

- [ ] Run simulator, verify data flows to database
- [ ] Test all API endpoints
- [ ] Test UI1 can get room recommendations
- [ ] Test UI2 shows charts
- [ ] Fix any obvious bugs
- [ ] Add brief comments to code

**14. Package & Submit**

- [ ] Create GitHub repo or zip file
- [ ] Include: backend/, frontend-user/, frontend-admin/, database/, docs/, README
- [ ] Include: Final report PDF with screenshots
- [ ] Submit

---

## 📁 Your Project Structure

```
comfort-room/
├── docs/
│   ├── protocols.md          (Req #1)
│   ├── criteria.md           (Req #3)
│   ├── database.md           (Req #2)
│   └── final-report.pdf      (Everything)
├── database/
│   └── schema.sql
├── backend/
│   ├── main.py               (FastAPI app)
│   ├── decision.py           (Algorithm)
│   ├── simulator.py          (Fake sensors)
│   └── requirements.txt
├── frontend-user/            (UI1 - React app)
│   └── src/
├── frontend-admin/           (UI2 - React app)
│   └── src/
└── README.md
```

---

## 🛠️ Simple Tech Stack

**Backend:** Python + FastAPI + PostgreSQL  
**Frontend:** React + Material-UI + Recharts  
**Simulator:** Python script (runs in background)


---

## 🎯 Minimum Viable Product Checklist

- [ ] Database with 3 tables, sample data
- [ ] Simulator inserting sensor data every minute
- [ ] API with 5+ endpoints + Swagger docs
- [ ] Decision algorithm that ranks rooms
- [ ] UI1: input preferences, show ranked rooms, Swagger tab
- [ ] UI2: show sensor charts and room info
- [ ] Report explaining all 6 requirements + screenshots
- [ ] Everything runs on local laptop
