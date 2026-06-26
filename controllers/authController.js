// controllers / authController.js(MAIN LOGIC)
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const getConnection = require("../database/db");

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: "Username and password required" });
        }

        const conn = await getConnection();

        const result = await conn.execute(
            `SELECT USERNAME, PASSWORD FROM LOGIN_USERS WHERE USERNAME = :username`,
            [username]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: "Invalid user" });
        }

        const dbPassword = result.rows[0][1];

        const isMatch = await bcrypt.compare(password, dbPassword);

        if (!isMatch) {
            return res.status(401).json({ error: "Wrong password" });
        }

        const token = jwt.sign(
            { username },
            process.env.JWT_SECRET || "default_secret_for_tests",
            { expiresIn: "1h" }
        );

        res.json({ token });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
};