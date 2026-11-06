const { promisePool } = require('../config/db');

// Register a new student
exports.register = async (req, res) => {
    try {
        const { name, email, phone, department, semester, password } = req.body;

        // Validation
        if (!name || !email || !phone || !department || !semester || !password) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required.'
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address.'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long.'
            });
        }

        const semInt = parseInt(semester, 10);
        if (isNaN(semInt) || semInt < 1 || semInt > 8) {
            return res.status(400).json({
                success: false,
                message: 'Semester must be a valid number between 1 and 8.'
            });
        }

        // Check duplicate email
        const [existing] = await promisePool.execute(
            'SELECT student_id FROM students WHERE email = ?',
            [email]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Email already exists. Please use a different email or login.'
            });
        }

        // Parameterized INSERT
        const [result] = await promisePool.execute(
            `INSERT INTO students (name, email, phone, department, semester, password)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [name.trim(), email.trim().toLowerCase(), phone.trim(), department.trim(), semInt, password]
        );

        return res.status(201).json({
            success: true,
            message: 'Student registered successfully',
            student_id: result.insertId
        });

    } catch (error) {
        console.error('Error in student register:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                success: false,
                message: 'Email already exists.'
            });
        }
        return res.status(500).json({
            success: false,
            message: 'Unable to process registration. Please try again.'
        });
    }
};

// Student Login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required.'
            });
        }

        // Parameterized SELECT
        const [rows] = await promisePool.execute(
            `SELECT student_id, name, email, phone, department, semester
             FROM students
             WHERE email = ? AND password = ?`,
            [email.trim().toLowerCase(), password]
        );

        if (rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.'
            });
        }

        const student = rows[0];

        return res.status(200).json({
            success: true,
            message: 'Login successful',
            student: {
                student_id: student.student_id,
                name: student.name,
                email: student.email,
                phone: student.phone,
                department: student.department,
                semester: student.semester
            }
        });

    } catch (error) {
        console.error('Error in student login:', error);
        return res.status(500).json({
            success: false,
            message: 'Unable to connect to the database. Please try again.'
        });
    }
};

// Get all students (Admin/Listing)
exports.getAllStudents = async (req, res) => {
    try {
        const [rows] = await promisePool.execute(
            `SELECT student_id, name, email, phone, department, semester
             FROM students
             ORDER BY student_id DESC`
        );
        return res.status(200).json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error('Error fetching students:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve students list.'
        });
    }
};

// Get student by ID with course count from stored function
exports.getStudentById = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await promisePool.execute(
            `SELECT s.student_id, s.name, s.email, s.phone, s.department, s.semester,
                    GetStudentCourseCount(s.student_id) AS total_enrolled_courses
             FROM students s
             WHERE s.student_id = ?`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Student not found.'
            });
        }

        return res.status(200).json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        console.error('Error fetching student by ID:', error);
        return res.status(500).json({
            success: false,
            message: 'Error retrieving student profile.'
        });
    }
};

