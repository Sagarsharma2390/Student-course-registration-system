const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { pool, promisePool } = require('./config/db');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static assets
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

// API Status endpoint
app.get('/api', (req, res) => {
    res.status(200).json({
        message: 'Student Course Registration System API is running'
    });
});

// Database connectivity test endpoint
app.get('/api/test-db', async (req, res) => {
    try {
        const [rows] = await promisePool.query('SELECT 1 + 1 AS solution');
        res.status(200).json({
            success: true,
            message: 'Database connected successfully.',
            solution: rows[0].solution
        });
    } catch (error) {
        console.error('Database connection test failed:', error);
        res.status(500).json({
            success: false,
            message: 'Database connection failed: ' + error.message
        });
    }
});

// Mount modular REST routes
const studentRoutes = require('./routes/studentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const courseRoutes = require('./routes/courseRoutes');
const facultyRoutes = require('./routes/facultyRoutes');
const registrationRoutes = require('./routes/registrationRoutes');

app.use('/api/students', studentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/registrations', registrationRoutes);

// Fallback for SPA/HTML routes if accessed directly
app.get('/', (req, res) => {
    if (req.accepts('html')) {
        res.sendFile(path.join(frontendPath, 'index.html'));
    } else {
        res.json({ message: 'Student Course Registration System API is running' });
    }
});

// 404 handler for API routes
app.use('/api', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'API route not found'
    });
});

// Global error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled server error:', err.stack);
    res.status(500).json({
        success: false,
        message: 'An internal server error occurred.'
    });
});

// Start Express Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
