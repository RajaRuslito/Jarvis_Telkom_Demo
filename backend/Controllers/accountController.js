// Required Dependencies
const multer = require("multer"); // Middleware for handling file uploads
const pool = require('../db'); // Database connection pool
const upload = require("../middleware/multer"); // Middleware for file upload configuration
const bcrypt = require('bcrypt'); // Library for hashing passwords
const jwt = require('jsonwebtoken'); // Library for generating JSON Web Tokens

// Login Controller
/**
 * Handles user login by verifying email and password.
 * Generates a JWT token for authenticated users.
 */
async function login(req, res) {
    const { email, password } = req.body; // Extract email and password from request body

    try {
        // Query the database to find the user by email
        const result = await pool.query(
            'SELECT * FROM account WHERE email = $1',
            [email]
        );

        // If the email doesn't exist, return an error
        if (result.rowCount === 0) {
            return res.status(401).json({ error: "Incorrect email or password" });
        }

        const account = result.rows[0]; // Get account details from query result
        // Compare the provided password with the stored hashed password
        const isPasswordValid = await bcrypt.compare(password, account.password);

        // If the password is incorrect, return an error
        if (!isPasswordValid) {
            return res.status(401).json({ error: "Incorrect email or password" });
        }

        // Generate a JWT token with the account's id, email, and roles
        const secret = process.env.JWT_SECRET || 'defaultSecretKey'; // Get the JWT secret key from environment variables
        const token = jwt.sign(
            { id: account.id, email: account.email, roles: account.roles },
            secret,
            { expiresIn: '1d' } // Token expiration time of 1 day
        );

        // Respond with a success message, the generated token, and account details
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
        console.error('Error in login:', error); // Log the error for debugging
        res.status(500).json({ error: "An error occurred" }); // Return a generic error message
    }
}

// Signup Controller
/**
 * Registers a new user by validating input and creating an account in the database.
 */
async function signup(req, res) {
    const { name, email, password, roles = 'User' } = req.body; // Destructure the request body and set a default role as 'User'

    // Validate the role, ensuring it's either 'User', 'Admin', or 'Super Admin'
    if (!['User', 'Admin', 'Super Admin'].includes(roles)) {
        return res.status(400).json({ error: "Invalid role" });
    }

    // Validate name (between 3 and 50 characters)
    if (!name || name.trim().length < 3 || name.trim().length > 50) {
        return res.status(400).json({ error: "Name must be between 3 and 50 characters" });
    }

    // Validate email format using a regular expression
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: "Invalid email format" });
    }

    // Validate password length (between 8 and 100 characters)
    if (!password || password.length < 8 || password.length > 100) {
        return res.status(400).json({ error: "Password must be between 8 and 100 characters" });
    }

    try {
        // Check if the email already exists in the database
        const emailCheckQuery = 'SELECT COUNT(*) FROM account WHERE email = $1';
        const emailCheck = await pool.query(emailCheckQuery, [email]);

        if (parseInt(emailCheck.rows[0].count, 10) > 0) {
            return res.status(400).json({ error: "Email is already in use" });
        }

        // Hash the password using bcrypt
        const hashedPassword = await bcrypt.hash(password, 10);
        // Insert the new user account into the database
        const insertaccountQuery = `
            INSERT INTO account (name, email, password, roles) 
            VALUES ($1, $2, $3, $4) 
            RETURNING *`;
        const result = await pool.query(insertaccountQuery, [name.trim(), email.trim(), hashedPassword, roles]);

        const newaccount = result.rows[0]; // Get the newly created account from the query result

        // Respond with success message and the new account details
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
        console.error('Error registering account:', error); // Log error for debugging
        res.status(500).json({ error: "An error occurred" }); // Return generic error message
    }
}

// Get All Accounts
/**
 * Retrieves all accounts from the database.
 */
async function getAllaccount(req, res) {
    try {
        // Query the database to get all accounts
        const result = await pool.query('SELECT * FROM account;');
        
        // If no accounts are found, return an error
        if (!result.rows.length) {
            return res.status(404).json({ error: "No account found" });
        }

        // Respond with the list of all accounts
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error in fetch:', error); // Log error for debugging
        res.status(500).json({ error: "An error occurred" }); // Return generic error message
    }
}

// Update Account
/**
 * Updates account details based on the provided account ID.
 */
async function accountUpdate(req, res) {
    const id = parseInt(req.params.id, 10); // Parse the account ID from the URL parameters
    const { name, email, roles } = req.body; // Destructure name, email, and roles from the request body

    // Check if any required fields are missing
    if (!name || !email || !roles) {
        console.error("Missing Fields:", {name, email, roles });
        return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    try {
        // Query to update the account details
        const result = await pool.query(
            `UPDATE account 
             SET name = $2, email = $3, roles = $4 
             WHERE id = $1 RETURNING *`,
            [id, name, email, roles]
        );
        
        // If no account is found with the given ID, return an error
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Account not found" });
        } else {
            // Respond with the updated account details
            res.json(result.rows[0]);
        }
    } catch (error) {
        console.error("Error updating account:", error); // Log error for debugging
        res.status(500).json({ error: "Error updating account" }); // Return generic error message
    }
}

// Get Account by ID
/**
 * Fetches an account by its unique ID.
 */
async function getaccountById(req, res) {
    const { id } = req.params; // Get the account ID from the URL parameters

    try {
        // Query the database to find the account by its ID
        const result = await pool.query(
            'SELECT * FROM account WHERE id = $1',
            [id]
        );

        // If no account is found, return an error
        if (result.rowCount === 0) {
            return res.status(404).json({ error: "No account found for the given account ID" });
        }

        // Respond with the account details
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Error in getaccountById:', error); // Log error for debugging
        res.status(500).json({ error: "An error occurred" }); // Return generic error message
    }
}

// Logout Controller
/**
 * Handles user logout. In a typical case, JWT token would be invalidated.
 * For simplicity, this just responds with a success message.
 */
async function logout(req, res) {
    try {
        // Respond with a logout success message
        res.status(200).json({ message: 'Logout successful' });
    } catch (error) {
        console.error('Error in logout:', error); // Log error for debugging
        res.status(500).json({ error: 'An error occurred' }); // Return generic error message
    }
}

// Exporting controllers for use in routes
module.exports = {
    login,
    signup,
    getAllaccount,
    getaccountById,
    logout,
    accountUpdate,
    upload
};
