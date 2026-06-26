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

    // ---------------- REGISTER TESTS ---------------- //
    test("POST /api/register with new user should return 201", async () => {
        // Mock that user doesn't exist
        mockConn.execute.mockResolvedValueOnce({ rows: [] }); 
        // Mock successful insert
        mockConn.execute.mockResolvedValueOnce({});

        const res = await request(app)
            .post("/api/register")
            .send({ username: "newuser", password: "password123" });

        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty("message", "User registered successfully");
        // Verify insert query was called
        expect(mockConn.execute).toHaveBeenCalledTimes(2);
    });

    test("POST /api/register with existing user should return 409", async () => {
        // Mock that user exists
        mockConn.execute.mockResolvedValueOnce({ rows: [["existinguser"]] }); 

        const res = await request(app)
            .post("/api/register")
            .send({ username: "existinguser", password: "password123" });

        expect(res.statusCode).toEqual(409);
        expect(res.body).toHaveProperty("error", "User already exists");
        expect(mockConn.execute).toHaveBeenCalledTimes(1); // Insert shouldn't run
    });

    // ---------------- RESET PASSWORD TESTS ---------------- //
    test("POST /api/reset-password for existing user should return 200", async () => {
        // Mock that user exists
        mockConn.execute.mockResolvedValueOnce({ rows: [["admin"]] }); 
        // Mock successful update
        mockConn.execute.mockResolvedValueOnce({});

        const res = await request(app)
            .post("/api/reset-password")
            .send({ username: "admin", password: "newpassword" });

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty("message", "Password reset successfully");
        expect(mockConn.execute).toHaveBeenCalledTimes(2);
    });

    test("POST /api/reset-password for unknown user should return 404", async () => {
        // Mock that user doesn't exist
        mockConn.execute.mockResolvedValueOnce({ rows: [] }); 

        const res = await request(app)
            .post("/api/reset-password")
            .send({ username: "unknown", password: "newpassword" });

        expect(res.statusCode).toEqual(404);
        expect(res.body).toHaveProperty("error", "User not found");
        expect(mockConn.execute).toHaveBeenCalledTimes(1);
    });

});
