
const express = require('express');

const {
    login, 
    signup, 
    getAllaccount, 
    getaccountById, 
    logout,
    accountUpdate,
    upload 
} = require('../Controllers/accountController');

const router = express.Router();

const uploadMiddleware = upload.fields([
    { name: "name", maxCount: 1 },
    { name: "email", maxCount: 1 },
    { name: "password", maxCount: 1 },
    { name: "roles", maxCount: 1 },
 ]);

router.post('/login', uploadMiddleware, async (req, res) => {
    await login(req, res);
});

router.post('/signup', uploadMiddleware, async (req, res) => {
    await signup(req, res);
});

router.get('/', async (req, res) => {
    await getAllaccount(req, res);
});

router.get('/:id', async (req, res) => {
    await getaccountById(req, res);
});

router.put('/:id/update', uploadMiddleware, async (req, res) => {
    await accountUpdate(req, res);
});

router.post('/logout', async (req, res) => {
    await logout(req, res);
});

module.exports = router;
