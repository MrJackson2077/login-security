const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const { loginLimiter } = require("../middleware/rateLimiter");
const authenticateToken = require("../middleware/auth");

// login API (protected by rate limiter)
router.post("/login", loginLimiter, authController.login);

// register API
router.post("/register", authController.register);

// reset password API
router.post("/reset-password", authController.resetPassword);

// protected route to test JWT token
router.get("/protected", authenticateToken, (req, res) => {
    res.json({ message: `Secure data for user ${req.user.username}` });
});

module.exports = router;