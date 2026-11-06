const { promisePool } = require('../config/db');

// Get all courses with faculty details (JOIN)
exports.getAllCourses = async (req, res) => {
    try {
        const [rows] = await promisePool.execute(
            `SELECT
                c.course_id,
                c.course_name,
                c.credits,
                c.department,
                c.semester,
                c.faculty_id,
                f.faculty_name,
                f.email AS faculty_email
             FROM courses c
             LEFT JOIN faculty f ON c.faculty_id = f.faculty_id
             ORDER BY c.course_id ASC`
        );
        return res.status(200).json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error('Error fetching courses:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve course catalog.'
        });
    }
};

// Get single course by ID
exports.getCourseById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await promisePool.execute(
            `SELECT
                c.course_id,
                c.course_name,
                c.credits,
                c.department,
                c.semester,
                c.faculty_id,
                f.faculty_name,
                f.email AS faculty_email
             FROM courses c
             LEFT JOIN faculty f ON c.faculty_id = f.faculty_id
             WHERE c.course_id = ?`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Course not found.'
            });
        }

        return res.status(200).json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        console.error('Error fetching course by ID:', error);
        return res.status(500).json({
            success: false,
            message: 'Error retrieving course details.'
        });
    }
};

// Add new course
exports.addCourse = async (req, res) => {
    try {
        const { course_name, credits, department, semester, faculty_id } = req.body;

        if (!course_name || !credits || !department || !semester || !faculty_id) {
            return res.status(400).json({
                success: false,
                message: 'All fields (Course Name, Credits, Department, Semester, Faculty) are required.'
            });
        }

        const creditsInt = parseInt(credits, 10);
        const semesterInt = parseInt(semester, 10);
        const facultyIdInt = parseInt(faculty_id, 10);

        if (isNaN(creditsInt) || creditsInt <= 0 || creditsInt > 10) {
            return res.status(400).json({
                success: false,
                message: 'Credits must be a valid number between 1 and 10.'
            });
        }

        if (isNaN(semesterInt) || semesterInt <= 0 || semesterInt > 8) {
            return res.status(400).json({
                success: false,
                message: 'Semester must be a valid number between 1 and 8.'
            });
        }

        // Validate faculty exists
        const [facultyRows] = await promisePool.execute(
            'SELECT faculty_id FROM faculty WHERE faculty_id = ?',
            [facultyIdInt]
        );

        if (facultyRows.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Selected faculty does not exist.'
            });
        }

        const [result] = await promisePool.execute(
            `INSERT INTO courses (course_name, credits, department, semester, faculty_id)
             VALUES (?, ?, ?, ?, ?)`,
            [course_name.trim(), creditsInt, department.trim(), semesterInt, facultyIdInt]
        );

        return res.status(201).json({
            success: true,
            message: 'Course created successfully',
            course_id: result.insertId
        });

    } catch (error) {
        console.error('Error adding course:', error);
        return res.status(500).json({
            success: false,
            message: 'Unable to save course. Please try again.'
        });
    }
};

