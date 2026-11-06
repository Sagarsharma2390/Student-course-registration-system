const { promisePool } = require('../config/db');

// Get all faculty members
exports.getAllFaculty = async (req, res) => {
    try {
        const [rows] = await promisePool.execute(
            `SELECT faculty_id, faculty_name, email, department
             FROM faculty
             ORDER BY faculty_name ASC`
        );
        return res.status(200).json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error('Error fetching faculty:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve faculty records.'
        });
    }
};

// Add new faculty
exports.addFaculty = async (req, res) => {
    try {
        const { faculty_name, email, department } = req.body;

        if (!faculty_name || !email || !department) {
            return res.status(400).json({
                success: false,
                message: 'All fields (Faculty Name, Email, Department) are required.'
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid faculty email address.'
            });
        }

        // Check for duplicate email
        const [existing] = await promisePool.execute(
            'SELECT faculty_id FROM faculty WHERE email = ?',
            [email.trim().toLowerCase()]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'A faculty member with this email already exists.'
            });
        }

        const [result] = await promisePool.execute(
            `INSERT INTO faculty (faculty_name, email, department)
             VALUES (?, ?, ?)`,
            [faculty_name.trim(), email.trim().toLowerCase(), department.trim()]
        );

        return res.status(201).json({
            success: true,
            message: 'Faculty member added successfully',
            faculty_id: result.insertId
        });

    } catch (error) {
        console.error('Error adding faculty:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                success: false,
                message: 'A faculty member with this email already exists.'
            });
        }
        return res.status(500).json({
            success: false,
            message: 'Unable to add faculty member. Please try again.'
        });
    }
};

