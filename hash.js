const bcrypt = require("bcrypt");

async function generatePassword() {
    const hash = await bcrypt.hash("Admin123", 10);
    console.log("Hashed Password:", hash);
}

generatePassword();