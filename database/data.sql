-- =======================================================
-- STUDENT COURSE REGISTRATION SYSTEM (SCRS)
-- Sample Seed Data
-- =======================================================

USE course_db;

-- 1. Insert Faculty (if not exists)
INSERT IGNORE INTO faculty (faculty_id, faculty_name, email, department)
VALUES
(1, 'Dr. Raj Kumar', 'raj@college.com', 'Computer Science'),
(2, 'Dr. Anjali Sharma', 'anjali@college.com', 'Computer Science'),
(3, 'Prof. Amit Verma', 'amitv@college.com', 'Data Science');

-- 2. Insert Students (if not exists)
INSERT IGNORE INTO students (student_id, name, email, phone, department, semester, password)
VALUES
(1, 'Rahul Sharma', 'rahul@gmail.com', '9876543210', 'MCA', 1, 'rahul123'),
(2, 'Priya Singh', 'priya@gmail.com', '9876543211', 'MCA', 1, 'priya123'),
(3, 'Amit Kumar', 'amit@gmail.com', '9876543212', 'MSc CS', 2, 'amit123'),
(4, 'Neha Verma', 'neha@gmail.com', '9876543213', 'MCA', 2, 'neha123'),
(5, 'Arjun Patel', 'arjun@gmail.com', '9876543214', 'MSc CS', 1, 'arjun123');

-- 3. Insert Admin (if not exists)
INSERT IGNORE INTO admin (admin_id, name, email, phone, password)
VALUES
(1, 'Admin One', 'admin1@gmail.com', '9000000001', 'admin123'),
(2, 'Admin Two', 'admin2@gmail.com', '9000000002', 'admin456');

-- 4. Insert Courses (if not exists)
INSERT IGNORE INTO courses (course_id, course_name, credits, department, semester, faculty_id)
VALUES
(1, 'Database Management System', 4, 'Computer Science', 1, 1),
(2, 'Data Structures', 4, 'Computer Science', 1, 2),
(3, 'Machine Learning', 4, 'Data Science', 2, 3),
(4, 'Web Development', 3, 'Computer Science', 2, 1),
(5, 'Artificial Intelligence', 4, 'Data Science', 2, 3);

-- 5. Insert Registrations (if not exists)
INSERT IGNORE INTO registrations (registration_id, student_id, course_id, registration_date, status)
VALUES
(1, 1, 1, '2026-09-01', 'Active'),
(2, 1, 2, '2026-09-01', 'Active'),
(3, 2, 1, '2026-09-02', 'Active'),
(4, 2, 3, '2026-09-02', 'Active'),
(5, 3, 3, '2026-09-03', 'Active'),
(6, 4, 4, '2026-09-04', 'Active'),
(7, 5, 1, '2026-09-05', 'Cancelled');

