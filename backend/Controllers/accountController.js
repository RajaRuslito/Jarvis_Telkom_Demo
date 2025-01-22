const multer = require("multer");
const pool = require('../db');
const upload = require("../middleware/multer");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Login Controller
async function login(req, res) {
    const { email, password } = req.body;

    try {
        const result = await pool.query(
            'SELECT * FROM account WHERE email = $1',
            [email]
        );

        if (result.rowCount === 0) {
            return res.status(401).json({ error: "Incorrect email or password" });
        }

        const account = result.rows[0];
        const isPasswordValid = await bcrypt.compare(password, account.password);

        if (!isPasswordValid) {
            return res.status(401).json({ error: "Incorrect email or password" });
        }

        // Generate token
        const secret = process.env.JWT_SECRET || 'defaultSecretKey';
        const token = jwt.sign(
            { id: account.id, email: account.email, roles: account.roles },
            secret,
            { expiresIn: '1d' }
        );

        res.status(200).json({
            message: "Login Successful",
            token,
            account: {
                id: account.id,
                email: account.email,
                name: account.name,
                roles: account.roles,
            },
        });
    } catch (error) {
        console.error('Error in login:', error);
        res.status(500).json({ error: "An error occurred" });
    }
}

// Signup Controller
async function signup(req, res) {
    const { name, email, password, roles = 'User' } = req.body; // Default role is 'User'

    if (!['User', 'Admin', 'Super Admin'].includes(roles)) {
        return res.status(400).json({ error: "Invalid role" });
    }

    if (!name || name.trim().length < 3 || name.trim().length > 50) {
        return res.status(400).json({ error: "Name must be between 3 and 50 characters" });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: "Invalid email format" });
    }
    if (!password || password.length < 8 || password.length > 100) {
        return res.status(400).json({ error: "Password must be between 8 and 100 characters" });
    }

    try {
        const emailCheckQuery = 'SELECT COUNT(*) FROM account WHERE email = $1';
        const emailCheck = await pool.query(emailCheckQuery, [email]);

        if (parseInt(emailCheck.rows[0].count, 10) > 0) {
            return res.status(400).json({ error: "Email is already in use" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const insertaccountQuery = `
            INSERT INTO account (name, email, password, roles) 
            VALUES ($1, $2, $3, $4) 
            RETURNING *`;
        const result = await pool.query(insertaccountQuery, [name.trim(), email.trim(), hashedPassword, roles]);

        const newaccount = result.rows[0];

        res.status(201).json({
            message: "Signup successful",
            account: {
                id: newaccount.id,
                name: newaccount.name,
                email: newaccount.email,
                roles: newaccount.roles,
            },
        });
    } catch (error) {
        console.error('Error registering account:', error);
        res.status(500).json({ error: "An error occurred" });
    }
}

// Get All Accounts
async function getAllaccount(req, res) {
    try {
        const result = await pool.query('SELECT * FROM account;');
        if (!result.rows.length) {
            return res.status(404).json({ error: "No account found" });
        }
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error in fetch:', error);
        res.status(500).json({ error: "An error occurred" });
    }
}

// Update account
async function accountUpdate(req, res) {
    const id = parseInt(req.params.id, 10);
    const { name, email, roles } = req.body;

    if (!name || !email || !roles) {
        console.error("Missing Fields:", {name, email, roles });
        return res.status(400).json({ success: false, message: "Missing required fields" });
    }
    try {
        const result = await pool.query(
            `UPDATE account 
             SET name = $2, email = $3, roles = $4 
             WHERE id = $1 RETURNING *`,
            [id, name, email, roles]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Account not found" });
        } else {
            res.json(result.rows[0]);
        }
    } catch (error) {
        console.error("Error updating account:", error);
        res.status(500).json({ error: "Error updating account" });
    }
}

// Get Account by ID
async function getaccountById(req, res) {
    const { id } = req.params;

    try {
        const result = await pool.query(
            'SELECT * FROM account WHERE id = $1',
            [id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "No account found for the given account ID" });
        }

        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Error in getaccountById:', error);
        res.status(500).json({ error: "An error occurred" });
    }
}

// Logout Controller
async function logout(req, res) {
    try {
        res.status(200).json({ message: 'Logout successful' });
    } catch (error) {
        console.error('Error in logout:', error);
        res.status(500).json({ error: 'An error occurred' });
    }
}

module.exports = {
    login,
    signup,
    getAllaccount,
    getaccountById,
    logout,
    accountUpdate,
    upload
};
