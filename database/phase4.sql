-- =======================================================
-- STUDENT COURSE REGISTRATION SYSTEM (SCRS)
-- Phase 4: Transactions, Concurrency Control, Atomicity & Integrity
-- =======================================================

USE course_db;

-- -------------------------------------------------------
-- TEST 1: SUCCESSFUL TRANSACTION (COMMIT)
-- Atomicity: Changes are permanently committed.
-- -------------------------------------------------------
START TRANSACTION;

INSERT INTO registrations (student_id, course_id, registration_date, status)
VALUES (1, 5, CURDATE(), 'Active');

COMMIT;

-- Verify insertion
SELECT * FROM registrations WHERE student_id = 1 AND course_id = 5;

-- -------------------------------------------------------
-- TEST 2: FAILED TRANSACTION (ROLLBACK)
-- Atomicity: Aborted operation leaves database unaltered.
-- -------------------------------------------------------
START TRANSACTION;

INSERT INTO registrations (student_id, course_id, registration_date, status)
VALUES (2, 5, CURDATE(), 'Active');

-- Simulated error condition / business logic rollback
ROLLBACK;

-- Verify that student 2 is NOT registered for course 5
SELECT * FROM registrations WHERE student_id = 2 AND course_id = 5;

-- -------------------------------------------------------
-- TEST 3: PARTIAL ROLLBACK USING SAVEPOINT
-- Demonstrates granular control within a transaction.
-- -------------------------------------------------------
START TRANSACTION;

INSERT INTO registrations (student_id, course_id, registration_date, status)
VALUES (3, 5, CURDATE(), 'Active');

SAVEPOINT registration_point;

-- Attempt an unwanted modification
UPDATE registrations
SET status = 'Cancelled'
WHERE student_id = 3 AND course_id = 5;

-- Rollback only to the savepoint
ROLLBACK TO registration_point;

-- Commit the valid insertion
COMMIT;

-- Verify student 3 registration remains 'Active'
SELECT * FROM registrations WHERE student_id = 3 AND course_id = 5;

-- -------------------------------------------------------
-- TEST 4: INTEGRITY ENFORCEMENT - DUPLICATE REGISTRATION
-- UNIQUE (student_id, course_id) must prevent duplicates.
-- -------------------------------------------------------
START TRANSACTION;

-- Should fail with Error 1062: Duplicate entry
-- INSERT INTO registrations (student_id, course_id, registration_date, status)
-- VALUES (1, 1, CURDATE(), 'Active');

ROLLBACK;

-- -------------------------------------------------------
-- TEST 5: INTEGRITY ENFORCEMENT - FOREIGN KEY CONSTRAINT
-- Foreign key must block invalid student_id or course_id.
-- -------------------------------------------------------
START TRANSACTION;

-- Should fail with Error 1452: Cannot add child row (foreign key constraint fails)
-- INSERT INTO registrations (student_id, course_id, registration_date, status)
-- VALUES (9999, 1, CURDATE(), 'Active');

ROLLBACK;

-- -------------------------------------------------------
-- FINAL VALIDATION QUERIES
-- -------------------------------------------------------
SELECT 'Students' AS Entity, COUNT(*) AS TotalCount FROM students
UNION ALL
SELECT 'Faculty', COUNT(*) FROM faculty
UNION ALL
SELECT 'Courses', COUNT(*) FROM courses
UNION ALL
SELECT 'Registrations', COUNT(*) FROM registrations;

