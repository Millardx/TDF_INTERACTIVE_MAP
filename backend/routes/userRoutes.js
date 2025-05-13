//userRoutes.js
const express = require('express');
const { getUsers, addUser, updateUser, deleteUser, checkEmailExists } = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const { validateAddUser, validateUpdateUser } = require('../validators/userValidator');


const router = express.Router();

router.get('/all', authMiddleware(['admin']), getUsers);
router.post('/add', authMiddleware(['admin']), validateAddUser, addUser);
router.get('/check-email', authMiddleware(['admin']), checkEmailExists);
router.put('/update/:id', authMiddleware(['admin']), validateUpdateUser, updateUser);
router.delete('/delete/:id', authMiddleware(['admin']), deleteUser);

module.exports = router;
