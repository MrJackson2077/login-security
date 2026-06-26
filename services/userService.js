const bcrypt = require("bcrypt");
const getConnection = require("../database/db");

/**
 * Find a user by username. Returns the row or null.
 */
async function findUser(username) {
    const conn = await getConnection();
    const result = await conn.execute(
        `SELECT USERNAME, PASSWORD FROM LOGIN_USERS WHERE USERNAME = :username`,
        [username]
    );
    return result.rows.length > 0 ? result.rows[0] : null;
}

/**
 * Create a new user with a hashed password.
 * Returns false if the user already exists.
 */
async function createUser(username, password) {
    const conn = await getConnection();

    // Check if user already exists
    const existing = await conn.execute(
        `SELECT USERNAME FROM LOGIN_USERS WHERE USERNAME = :username`,
        [username]
    );
    if (existing.rows.length > 0) return false;

    // Hash password and insert
    const hashedPassword = await bcrypt.hash(password, 10);
    await conn.execute(
        `INSERT INTO LOGIN_USERS (USERNAME, PASSWORD) VALUES (:username, :password)`,
        [username, hashedPassword],
        { autoCommit: true }
    );
    return true;
}

/**
 * Reset a user's password. Returns false if the user does not exist.
 */
async function updatePassword(username, newPassword) {
    const conn = await getConnection();

    // Check user exists
    const existing = await conn.execute(
        `SELECT USERNAME FROM LOGIN_USERS WHERE USERNAME = :username`,
        [username]
    );
    if (existing.rows.length === 0) return false;

    // Hash and update
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await conn.execute(
        `UPDATE LOGIN_USERS SET PASSWORD = :password WHERE USERNAME = :username`,
        [hashedPassword, username],
        { autoCommit: true }
    );
    return true;
}

/**
 * Validate a user's password against the hash stored in the DB.
 * Returns the username if valid, or null if not.
 */
async function validateCredentials(username, password) {
    const user = await findUser(username);
    if (!user) return null;

    const [dbUsername, dbPassword] = user;
    const isMatch = await bcrypt.compare(password, dbPassword);
    return isMatch ? dbUsername : null;
}

module.exports = { findUser, createUser, updatePassword, validateCredentials };
