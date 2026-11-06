-- =======================================================
-- STUDENT COURSE REGISTRATION SYSTEM (SCRS)
-- Phase 3: Advanced SQL, Views, Indexes, Procedures & Functions
-- =======================================================

USE course_db;

-- -------------------------------------------------------
-- 1. COMPLEX JOIN QUERIES
-- -------------------------------------------------------

-- Query 1: Student registration details with course and faculty
SELECT
    s.student_id,
    s.name AS student_name,
    c.course_name,
    c.credits,
    f.faculty_name,
    r.registration_date,
    r.status
FROM students s
JOIN registrations r ON s.student_id = r.student_id
JOIN courses c ON r.course_id = c.course_id
JOIN faculty f ON c.faculty_id = f.faculty_id;

-- Query 2: Course catalog with assigned faculty
SELECT
    c.course_id,
    c.course_name,
    c.credits,
    c.department,
    c.semester,
    f.faculty_name,
    f.email AS faculty_email
FROM courses c
LEFT JOIN faculty f ON c.faculty_id = f.faculty_id;

-- -------------------------------------------------------
-- 2. SUBQUERIES & AGGREGATIONS
-- -------------------------------------------------------

-- Subquery 1: Students with course count higher than average registration count
SELECT
    s.student_id,
    s.name,
    COUNT(r.registration_id) AS course_count
FROM students s
JOIN registrations r ON s.student_id = r.student_id
GROUP BY s.student_id, s.name
HAVING COUNT(r.registration_id) > (
    SELECT AVG(course_count)
    FROM (
        SELECT student_id, COUNT(*) AS course_count
        FROM registrations
        GROUP BY student_id
    ) AS student_counts
);

-- Subquery 2: Courses with registration count higher than average course registrations
SELECT
    c.course_id,
    c.course_name,
    COUNT(r.registration_id) AS registration_count
FROM courses c
JOIN registrations r ON c.course_id = r.course_id
GROUP BY c.course_id, c.course_name
HAVING COUNT(r.registration_id) > (
    SELECT AVG(registration_count)
    FROM (
        SELECT course_id, COUNT(*) AS registration_count
        FROM registrations
        GROUP BY course_id
    ) AS course_counts
);

-- -------------------------------------------------------
-- 3. CREATE VIEW: Student_Course_Summary
-- -------------------------------------------------------

CREATE OR REPLACE VIEW Student_Course_Summary AS
SELECT
    s.student_id,
    s.name AS student_name,
    s.email AS student_email,
    c.course_id,
    c.course_name,
    c.credits,
    f.faculty_name,
    r.registration_id,
    r.registration_date,
    r.status
FROM students s
JOIN registrations r ON s.student_id = r.student_id
JOIN courses c ON r.course_id = c.course_id
JOIN faculty f ON c.faculty_id = f.faculty_id;

-- Query the view
SELECT * FROM Student_Course_Summary;

-- -------------------------------------------------------
-- 4. PERFORMANCE OPTIMIZATION: INDEXES
-- -------------------------------------------------------

CREATE INDEX idx_registration_student ON registrations(student_id);
CREATE INDEX idx_registration_course ON registrations(course_id);
CREATE INDEX idx_course_faculty ON courses(faculty_id);

-- Check indexes
SHOW INDEX FROM registrations;
SHOW INDEX FROM courses;

-- -------------------------------------------------------
-- 5. EXPLAIN QUERIES DEMONSTRATING INDEX USAGE
-- -------------------------------------------------------

EXPLAIN SELECT * FROM registrations WHERE student_id = 1;
EXPLAIN SELECT * FROM courses WHERE faculty_id = 1;

-- -------------------------------------------------------
-- 6. STORED FUNCTION: GetStudentCourseCount
-- -------------------------------------------------------

DROP FUNCTION IF EXISTS GetStudentCourseCount;

DELIMITER //

CREATE FUNCTION GetStudentCourseCount(p_student_id INT)
RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE course_count INT DEFAULT 0;

    SELECT COUNT(*)
    INTO course_count
    FROM registrations
    WHERE student_id = p_student_id;

    RETURN course_count;
END //

DELIMITER ;

-- Test function
SELECT GetStudentCourseCount(1) AS course_count_student_1;

-- -------------------------------------------------------
-- 7. STORED PROCEDURE: UpdateRegistrationStatus
-- -------------------------------------------------------

DROP PROCEDURE IF EXISTS UpdateRegistrationStatus;

DELIMITER //

CREATE PROCEDURE UpdateRegistrationStatus(
    IN p_registration_id INT,
    IN p_new_status VARCHAR(20)
)
BEGIN
    UPDATE registrations
    SET status = p_new_status
    WHERE registration_id = p_registration_id;
END //

DELIMITER ;

-- Test procedure
-- CALL UpdateRegistrationStatus(1, 'Active');

