
import psycopg2

conn = psycopg2.connect(
    host="localhost",
    database="comfortroom_db",
    user="comfortroom",
    password="comfortroom"
)

events = [
    (1, 'Database Systems Lecture', '2026-01-11 09:00:00', '2026-01-11 10:30:00', 'Prof. Anderson'),                                                                                            
    (1, 'Software Engineering Lab', '2026-01-11 14:00:00', '2026-01-11 16:00:00', 'Dr. Martinez'),                                                                                              
    (1, 'Team Meeting - Project Alpha', '2026-01-12 10:00:00', '2026-01-12 11:00:00', 'Sarah Johnson'),                                                                                         
    (2, 'Web Development Class', '2026-01-11 10:00:00', '2026-01-11 12:00:00', 'Dr. Thompson'),
    (2, 'UX Design Workshop', '2026-01-11 15:00:00', '2026-01-11 17:00:00', 'Emily White'),
    (3, 'Machine Learning Seminar', '2026-01-11 11:00:00', '2026-01-11 13:00:00', 'Prof. Kumar'),
    (4, 'Network Security Lecture', '2026-01-11 08:00:00', '2026-01-11 10:00:00', 'Prof. Brown'),
    (5, 'IoT Systems Tutorial', '2026-01-11 13:00:00', '2026-01-11 15:00:00', 'Dr. Garcia'),
]

with conn.cursor() as cur:
    cur.executemany("""
        INSERT INTO calendar_events (room_id, title, start_time, end_time, organizer)
        VALUES (%s, %s, %s, %s, %s)
    """, events)
conn.commit()
print(f"Inserted {len(events)} calendar events")
conn.close()
