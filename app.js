require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");

const authRoutes = require("./routes/authRoutes");

const app = express();

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

// Serve frontend
app.use(express.static(path.join(__dirname, "frontend")));

// routes
app.use("/api", authRoutes);

// Export app for testing
module.exports = app;

// Only start the server if not imported by tests
if (require.main === module) {
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
        console.log("Server running on port", port);
    });
}