require("dotenv").config();
const oracledb = require("oracledb");

async function testDB() {
    let conn;
    try {
        console.log("Connecting to DB:", process.env.DB_CONNECTION_STRING);
        conn = await oracledb.getConnection({
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            connectionString: process.env.DB_CONNECTION_STRING
        });
        
        console.log("Connected! Describing LOGIN_USERS table:");
        const result = await conn.execute(`
            SELECT column_name, data_type, data_length
            FROM all_tab_columns
            WHERE table_name = 'LOGIN_USERS'
        `);
        console.log(result.rows);
    } catch (err) {
        console.error("DB Error:", err);
    } finally {
        if (conn) {
            await conn.close();
        }
    }
}
testDB();
