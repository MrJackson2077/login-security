const jwt = require("jsonwebtoken");

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Format: Bearer TOKEN

    if (!token) return res.status(401).json({ error: "Access denied. No token provided." });

    jwt.verify(token, process.env.JWT_SECRET || "default_secret_for_tests", (err, user) => {
        if (err) return res.status(403).json({ error: "Invalid or expired token." });
        
        req.user = user;
        next();
    });
}

module.exports = authenticateToken;
