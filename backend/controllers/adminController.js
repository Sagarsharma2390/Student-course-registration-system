const { promisePool } = require('../config/db');

// Admin Login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required.'
            });
        }

        const [rows] = await promisePool.execute(
            `SELECT admin_id, name, email, phone
             FROM admin
             WHERE email = ? AND password = ?`,
            [email.trim().toLowerCase(), password]
        );

        if (rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid admin credentials.'
            });
        }

        const admin = rows[0];

        return res.status(200).json({
            success: true,
            message: 'Admin authentication successful',
            admin: {
                admin_id: admin.admin_id,
                name: admin.name,
                email: admin.email,
                phone: admin.phone
            }
        });

    } catch (error) {
        console.error('Error in admin login:', error);
        return res.status(500).json({
            success: false,
            message: 'Unable to connect to the database. Please try again.'
        });
    }
};

// Admin Dashboard Statistics
exports.getStats = async (req, res) => {
    try {
        // Query counts using efficient COUNT queries
        const [studentCount] = await promisePool.execute('SELECT COUNT(*) AS total FROM students');
        const [facultyCount] = await promisePool.execute('SELECT COUNT(*) AS total FROM faculty');
        const [courseCount] = await promisePool.execute('SELECT COUNT(*) AS total FROM courses');
        const [regTotal] = await promisePool.execute('SELECT COUNT(*) AS total FROM registrations');
        const [regActive] = await promisePool.execute("SELECT COUNT(*) AS total FROM registrations WHERE status = 'Active'");
        const [regCancelled] = await promisePool.execute("SELECT COUNT(*) AS total FROM registrations WHERE status = 'Cancelled'");

        // Also fetch recent registrations for dashboard display
        const [recentRegistrations] = await promisePool.execute(
            `SELECT r.registration_id, s.name AS student_name, c.course_name,
                    f.faculty_name, r.registration_date, r.status
             FROM registrations r
             JOIN students s ON r.student_id = s.student_id
             JOIN courses c ON r.course_id = c.course_id
             LEFT JOIN faculty f ON c.faculty_id = f.faculty_id
             ORDER BY r.registration_id DESC
             LIMIT 5`
        );

        return res.status(200).json({
            success: true,
            stats: {
                totalStudents: studentCount[0].total,
                totalFaculty: facultyCount[0].total,
                totalCourses: courseCount[0].total,
                totalRegistrations: regTotal[0].total,
                activeRegistrations: regActive[0].total,
                cancelledRegistrations: regCancelled[0].total
            },
            recentRegistrations
        });

    } catch (error) {
        console.error('Error fetching admin statistics:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve administrative statistics.'
        });
    }
};

