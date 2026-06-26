// controllers/authController.js
// Handles HTTP requests only — all business logic lives in userService.js
const jwt = require("jsonwebtoken");
const { createUser, updatePassword, validateCredentials } = require("../services/userService");

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: "Username and password required" });
        }

        const validUser = await validateCredentials(username, password);

        if (!validUser) {
            return res.status(401).json({ error: "Invalid username or password" });
        }

        const token = jwt.sign(
            { username: validUser },
            process.env.JWT_SECRET || "default_secret_for_tests",
            { expiresIn: "1h" }
        );

        res.json({ token });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
};

exports.register = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: "Username and password required" });
        }

        const created = await createUser(username, password);

        if (!created) {
            return res.status(409).json({ error: "User already exists" });
        }

        res.status(201).json({ message: "User registered successfully" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: "Username and new password required" });
        }

        const updated = await updatePassword(username, password);

        if (!updated) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({ message: "Password reset successfully" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
};