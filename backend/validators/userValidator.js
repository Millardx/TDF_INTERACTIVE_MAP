const { body, validationResult } = require('express-validator');

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

const validateAddUser = [
    body('name').notEmpty().withMessage('Name is required'),
    body('email')
        .isEmail().withMessage('Please enter a valid email address'),
    body('password')
        .matches(passwordRegex).withMessage('Password must be at least 8 characters, include 1 uppercase, 1 lowercase, 1 number, and 1 special character'),
    body('role')
        .isIn(['admin', 'staff']).withMessage('Role must be either admin or staff'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

const validateUpdateUser = [
    body('name').optional().notEmpty().withMessage('Name cannot be empty if provided'),
    body('email').optional().isEmail().withMessage('Please enter a valid email address'),
    body('password')
        .optional()
        .matches(passwordRegex)
        .withMessage('Password must be at least 8 characters, include 1 uppercase, 1 lowercase, 1 number, and 1 special character'),
    body('role').optional().isIn(['admin', 'staff']).withMessage('Role must be either admin or staff'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

module.exports = { validateAddUser, validateUpdateUser };
