-- ComfortRoom Sample Data
-- Run this after schema.sql to populate test data

-----------------------------------------------------------
-- SAMPLE ROOMS
-----------------------------------------------------------

INSERT INTO rooms (name, building, floor, capacity, has_projector, has_whiteboard, has_power_outlets, is_accessible) VALUES
    ('Room A101', 'Building A', 1, 30, TRUE, TRUE, 10, TRUE),
    ('Room A102', 'Building A', 1, 25, TRUE, TRUE, 8, TRUE),
    ('Room A201', 'Building A', 2, 40, TRUE, TRUE, 15, FALSE),
    ('Room B101', 'Building B', 1, 20, TRUE, FALSE, 6, TRUE),
    ('Room B102', 'Building B', 1, 15, FALSE, TRUE, 4, TRUE),
    ('Room B201', 'Building B', 2, 50, TRUE, TRUE, 20, TRUE),
    ('Lab C101', 'Building C', 1, 25, TRUE, TRUE, 25, TRUE),
    ('Seminar D101', 'Building D', 1, 12, TRUE, TRUE, 6, FALSE),
    ('Lecture Hall E', 'Building E', 0, 100, TRUE, TRUE, 30, TRUE),
    ('Study Room F', 'Building F', 1, 8, FALSE, TRUE, 4, TRUE);

-----------------------------------------------------------
-- SAMPLE CALENDAR EVENTS (next 7 days)
-----------------------------------------------------------

INSERT INTO calendar_events (room_id, title, start_time, end_time, organizer) VALUES
    -- Room A101
    (1, 'Introduction to Programming', CURRENT_DATE + INTERVAL '8 hours', CURRENT_DATE + INTERVAL '10 hours', 'Prof. Schmidt'),
    (1, 'Data Structures', CURRENT_DATE + INTERVAL '10 hours 30 minutes', CURRENT_DATE + INTERVAL '12 hours', 'Prof. Schmidt'),
    (1, 'Algorithms', CURRENT_DATE + INTERVAL '14 hours', CURRENT_DATE + INTERVAL '16 hours', 'Dr. Weber'),

    -- Room A102
    (2, 'Web Development', CURRENT_DATE + INTERVAL '9 hours', CURRENT_DATE + INTERVAL '11 hours', 'Prof. Muller'),
    (2, 'Database Systems', CURRENT_DATE + INTERVAL '13 hours', CURRENT_DATE + INTERVAL '15 hours', 'Dr. Fischer'),

    -- Room A201
    (3, 'Operating Systems', CURRENT_DATE + INTERVAL '8 hours', CURRENT_DATE + INTERVAL '10 hours', 'Prof. Becker'),
    (3, 'Computer Networks', CURRENT_DATE + INTERVAL '11 hours', CURRENT_DATE + INTERVAL '13 hours', 'Dr. Hoffmann'),

    -- Room B101
    (4, 'Software Engineering', CURRENT_DATE + INTERVAL '9 hours', CURRENT_DATE + INTERVAL '11 hours', 'Prof. Wagner'),

    -- Room B201
    (6, 'Machine Learning', CURRENT_DATE + INTERVAL '10 hours', CURRENT_DATE + INTERVAL '12 hours', 'Prof. Koch'),
    (6, 'Artificial Intelligence', CURRENT_DATE + INTERVAL '14 hours', CURRENT_DATE + INTERVAL '17 hours', 'Prof. Koch'),

    -- Lab C101
    (7, 'IoT Workshop', CURRENT_DATE + INTERVAL '8 hours', CURRENT_DATE + INTERVAL '12 hours', 'Dr. Richter'),

    -- Lecture Hall E
    (9, 'Introduction to Computer Science', CURRENT_DATE + INTERVAL '8 hours', CURRENT_DATE + INTERVAL '10 hours', 'Prof. Klein'),
    (9, 'Mathematics for CS', CURRENT_DATE + INTERVAL '11 hours', CURRENT_DATE + INTERVAL '13 hours', 'Prof. Wolf'),

    -- Tomorrow's events
    (1, 'Python Workshop', CURRENT_DATE + INTERVAL '1 day 9 hours', CURRENT_DATE + INTERVAL '1 day 12 hours', 'Dr. Weber'),
    (3, 'Cloud Computing', CURRENT_DATE + INTERVAL '1 day 14 hours', CURRENT_DATE + INTERVAL '1 day 16 hours', 'Prof. Becker'),
    (6, 'Deep Learning', CURRENT_DATE + INTERVAL '1 day 10 hours', CURRENT_DATE + INTERVAL '1 day 13 hours', 'Prof. Koch');
