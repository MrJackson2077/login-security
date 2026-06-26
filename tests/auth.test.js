const request = require("supertest");
const app = require("../app");
const jwt = require("jsonwebtoken");

// Mock the userService layer — keeps tests fast and DB-free
jest.mock("../services/userService");
const { validateCredentials, createUser, updatePassword } = require("../services/userService");

describe("Auth API Endpoints", () => {

    beforeAll(() => {
        process.env.JWT_SECRET = "test_secret";
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // ---------------- LOGIN TESTS ---------------- //
    test("POST /api/login with valid credentials should return token", async () => {
        validateCredentials.mockResolvedValue("admin");

        const res = await request(app)
            .post("/api/login")
            .send({ username: "admin", password: "Admin123" });

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty("token");
    });

    test("POST /api/login with missing credentials should return 400", async () => {
        const res = await request(app)
            .post("/api/login")
            .send({ username: "admin" });

        expect(res.statusCode).toEqual(400);
        expect(res.body).toHaveProperty("error", "Username and password required");
    });

    test("POST /api/login with wrong password should return 401", async () => {
        validateCredentials.mockResolvedValue(null);

        const res = await request(app)
            .post("/api/login")
            .send({ username: "admin", password: "wrongpassword" });

        expect(res.statusCode).toEqual(401);
        expect(res.body).toHaveProperty("error", "Invalid username or password");
    });

    // ---------------- PROTECTED ROUTE TESTS ---------------- //
    test("GET /api/protected with valid token should return 200", async () => {
        const token = jwt.sign({ username: "admin" }, process.env.JWT_SECRET, { expiresIn: "1h" });

        const res = await request(app)
            .get("/api/protected")
            .set("Authorization", `Bearer ${token}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty("message", "Secure data for user admin");
    });

    test("GET /api/protected without token should return 401", async () => {
        const res = await request(app).get("/api/protected");
        expect(res.statusCode).toEqual(401);
    });

    // ---------------- REGISTER TESTS ---------------- //
    test("POST /api/register with new user should return 201", async () => {
        createUser.mockResolvedValue(true);

        const res = await request(app)
            .post("/api/register")
            .send({ username: "newuser", password: "password123" });

        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty("message", "User registered successfully");
    });

    test("POST /api/register with existing user should return 409", async () => {
        createUser.mockResolvedValue(false);

        const res = await request(app)
            .post("/api/register")
            .send({ username: "existinguser", password: "password123" });

        expect(res.statusCode).toEqual(409);
        expect(res.body).toHaveProperty("error", "User already exists");
    });

    // ---------------- RESET PASSWORD TESTS ---------------- //
    test("POST /api/reset-password for existing user should return 200", async () => {
        updatePassword.mockResolvedValue(true);

        const res = await request(app)
            .post("/api/reset-password")
            .send({ username: "admin", password: "newpassword" });

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty("message", "Password reset successfully");
    });

    test("POST /api/reset-password for unknown user should return 404", async () => {
        updatePassword.mockResolvedValue(false);

        const res = await request(app)
            .post("/api/reset-password")
            .send({ username: "unknown", password: "newpassword" });

        expect(res.statusCode).toEqual(404);
        expect(res.body).toHaveProperty("error", "User not found");
    });
});
