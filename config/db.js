const mysql = require("mysql2/promise");

// Create a connection pool for MySQL.
const pool = mysql.createPool({
    host: "localhost",
    user: "root",
    database: "uptime_monitor",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool;
