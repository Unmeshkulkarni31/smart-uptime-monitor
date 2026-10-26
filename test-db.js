const pool = require("./config/db");

async function testConnection() {
    try {
        const [rows] = await pool.query(
            "SELECT DATABASE() AS databaseName, VERSION() AS mysqlVersion"
        );

        console.log("Database connection successful!");
        console.log(rows[0]);
    } catch (error) {
        console.error("Database connection failed:", error.message);
    } finally {
        await pool.end();
    }
}

testConnection();