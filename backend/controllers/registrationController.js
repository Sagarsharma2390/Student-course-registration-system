const { pool, promisePool } = require('../config/db');

// Register for a course (ACID Transaction Demo)
exports.registerCourse = async (req, res) => {
    let connection;
    try {
        const { student_id, course_id } = req.body;

        if (!student_id || !course_id) {
            return res.status(400).json({
                success: false,
                message: 'Student ID and Course ID are required.'
            });
        }

        const studentIdInt = parseInt(student_id, 10);
        const courseIdInt = parseInt(course_id, 10);

        if (isNaN(studentIdInt) || isNaN(courseIdInt)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid Student ID or Course ID.'
            });
        }

        // 1. Validate student exists
        const [studentRows] = await promisePool.execute(
            'SELECT student_id, name FROM students WHERE student_id = ?',
            [studentIdInt]
        );
        if (studentRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Student does not exist.'
            });
        }

        // 2. Validate course exists
        const [courseRows] = await promisePool.execute(
            'SELECT course_id, course_name FROM courses WHERE course_id = ?',
            [courseIdInt]
        );
        if (courseRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Course does not exist.'
            });
        }

        // 3. Check duplicate registration
        const [duplicateRows] = await promisePool.execute(
            'SELECT registration_id, status FROM registrations WHERE student_id = ? AND course_id = ?',
            [studentIdInt, courseIdInt]
        );
        if (duplicateRows.length > 0) {
            const existingStatus = duplicateRows[0].status;
            if (existingStatus === 'Active') {
                return res.status(409).json({
                    success: false,
                    message: 'You are already registered for this course.'
                });
            } else {
                return res.status(409).json({
                    success: false,
                    message: `You previously had a registration for this course (Status: ${existingStatus}).`
                });
            }
        }

        // 4. Start Transaction for ACID compliance
        connection = await pool.promise().getConnection();
        await connection.beginTransaction();

        // 5. Insert registration
        const [insertResult] = await connection.execute(
            `INSERT INTO registrations (student_id, course_id, registration_date, status)
             VALUES (?, ?, CURDATE(), 'Active')`,
            [studentIdInt, courseIdInt]
        );

        // 6. Commit transaction
        await connection.commit();

        return res.status(201).json({
            success: true,
            message: 'Course registered successfully',
            registration_id: insertResult.insertId
        });

    } catch (error) {
        // 7. Rollback on error
        if (connection) {
            try {
                await connection.rollback();
            } catch (rbErr) {
                console.error('Error during rollback:', rbErr);
            }
        }

        console.error('Error registering course:', error);

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                success: false,
                message: 'You are already registered for this course.'
            });
        }

        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(400).json({
                success: false,
                message: 'Foreign key integrity violation: Student or Course does not exist.'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Registration transaction failed. Transaction rolled back.'
        });

    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// Get all registrations (Admin Report with JOIN)
exports.getAllRegistrations = async (req, res) => {
    try {
        const [rows] = await promisePool.execute(
            `SELECT
                r.registration_id,
                r.registration_date,
                r.status,
                s.student_id,
                s.name AS student_name,
                s.email AS student_email,
                s.department AS student_department,
                c.course_id,
                c.course_name,
                c.credits,
                f.faculty_name
             FROM registrations r
             JOIN students s ON r.student_id = s.student_id
             JOIN courses c ON r.course_id = c.course_id
             LEFT JOIN faculty f ON c.faculty_id = f.faculty_id
             ORDER BY r.registration_id DESC`
        );

        return res.status(200).json({
            success: true,
            data: rows
        });

    } catch (error) {
        console.error('Error fetching registrations:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve registrations report.'
        });
    }
};

// Get registrations for a specific student
exports.getStudentRegistrations = async (req, res) => {
    try {
        const { studentId } = req.params;
        const studentIdInt = parseInt(studentId, 10);

        if (isNaN(studentIdInt)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid Student ID.'
            });
        }

        const [rows] = await promisePool.execute(
            `SELECT
                r.registration_id,
                r.registration_date,
                r.status,
                c.course_id,
                c.course_name,
                c.credits,
                c.department,
                c.semester,
                f.faculty_name
             FROM registrations r
             JOIN courses c ON r.course_id = c.course_id
             LEFT JOIN faculty f ON c.faculty_id = f.faculty_id
             WHERE r.student_id = ?
             ORDER BY r.registration_id DESC`,
            [studentIdInt]
        );

        return res.status(200).json({
            success: true,
            data: rows
        });

    } catch (error) {
        console.error('Error fetching student registrations:', error);
        return res.status(500).json({
            success: false,
            message: 'Unable to retrieve your course enrollments.'
        });
    }
};

// Cancel a registration (Preserve history, status = 'Cancelled')
exports.cancelRegistration = async (req, res) => {
    try {
        const { id } = req.params;
        const regIdInt = parseInt(id, 10);

        if (isNaN(regIdInt)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid Registration ID.'
            });
        }

        // Verify registration exists
        const [existing] = await promisePool.execute(
            'SELECT registration_id, status FROM registrations WHERE registration_id = ?',
            [regIdInt]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Registration record not found.'
            });
        }

        if (existing[0].status === 'Cancelled') {
            return res.status(400).json({
                success: false,
                message: 'This registration is already cancelled.'
            });
        }

        // Use Phase 3 Stored Procedure: UpdateRegistrationStatus
        await promisePool.execute(
            'CALL UpdateRegistrationStatus(?, ?)',
            [regIdInt, 'Cancelled']
        );

        return res.status(200).json({
            success: true,
            message: 'Registration cancelled successfully'
        });

    } catch (error) {
        console.error('Error cancelling registration:', error);
        // Fallback to direct UPDATE if procedure fails
        try {
            await promisePool.execute(
                "UPDATE registrations SET status = 'Cancelled' WHERE registration_id = ?",
                [req.params.id]
            );
            return res.status(200).json({
                success: true,
                message: 'Registration cancelled successfully'
            });
        } catch (fbErr) {
            console.error('Fallback cancel error:', fbErr);
            return res.status(500).json({
                success: false,
                message: 'Failed to cancel course registration.'
            });
        }
    }
};

// Update registration status (General Admin use)
exports.updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({
                success: false,
                message: 'New status is required.'
            });
        }

        const validStatuses = ['Active', 'Cancelled', 'Completed'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
            });
        }

        await promisePool.execute(
            'CALL UpdateRegistrationStatus(?, ?)',
            [id, status]
        );

        return res.status(200).json({
            success: true,
            message: `Registration status updated to ${status}`
        });

    } catch (error) {
        console.error('Error updating status:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update registration status.'
        });
    }
};

