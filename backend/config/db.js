const mysql = require('mysql2');
const dotenv = require('dotenv');

dotenv.config();

// Create connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'course_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test connection on startup
pool.getConnection((err, connection) => {
    if (err) {
        console.error('MySQL connection error:', err.message);
    } else {
        console.log('MySQL connected successfully!');
        connection.release();
    }
});

// Export promise-based pool for modern async/await
const promisePool = pool.promise();

module.exports = {
    pool,
    promisePool
};

