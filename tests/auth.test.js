const request = require("supertest");
const app = require("../app");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const getConnection = require("../database/db");

// Mock the db connection wrapper
jest.mock("../database/db");

describe("Auth API Endpoints", () => {
    let mockConn;
    
    beforeAll(() => {
        // Set env vars
        process.env.JWT_SECRET = "test_secret";
        
        mockConn = {
            execute: jest.fn(),
            close: jest.fn()
        };
        getConnection.mockResolvedValue(mockConn);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test("POST /api/login with valid credentials should return token", async () => {
        // Mock bcrypt to avoid true hashing overhead in unit test, though we can let it run real compare
        const hash = await bcrypt.hash("Admin123", 10);
        
        mockConn.execute.mockResolvedValue({
            rows: [["admin", hash]] // MATCH: dbPassword = result.rows[0][1]
        });

        const res = await request(app)
            .post("/api/login")
            .send({ username: "admin", password: "Admin123" });

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty("token");
        expect(mockConn.execute).toHaveBeenCalledTimes(1);
    });

    test("POST /api/login with missing credentials should return 400", async () => {
        const res = await request(app)
            .post("/api/login")
            .send({ username: "admin" });

        expect(res.statusCode).toEqual(400);
        expect(res.body).toHaveProperty("error", "Username and password required");
    });

    test("POST /api/login with wrong password should return 401", async () => {
        const hash = await bcrypt.hash("Admin123", 10);
        
        mockConn.execute.mockResolvedValue({
            rows: [["admin", hash]]
        });

        const res = await request(app)
            .post("/api/login")
            .send({ username: "admin", password: "wrongpassword" });

        expect(res.statusCode).toEqual(401);
        expect(res.body).toHaveProperty("error", "Wrong password");
    });
    
    test("POST /api/login with unknown user should return 401", async () => {
        mockConn.execute.mockResolvedValue({
            rows: []
        });

        const res = await request(app)
            .post("/api/login")
            .send({ username: "unknown", password: "password" });

        expect(res.statusCode).toEqual(401);
        expect(res.body).toHaveProperty("error", "Invalid user");
    });

    test("GET /api/protected with valid token should return 200", async () => {
        const token = jwt.sign({ username: "admin" }, process.env.JWT_SECRET, { expiresIn: "1h" });
        
        const res = await request(app)
            .get("/api/protected")
            .set("Authorization", `Bearer ${token}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty("message", "Secure data for user admin");
    });
    
    test("GET /api/protected without token should return 401", async () => {
        const res = await request(app)
            .get("/api/protected");

        expect(res.statusCode).toEqual(401);
    });
});
