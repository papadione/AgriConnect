// Routes d'authentification
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { validateRequest } = require('../middleware/validation');
const authMiddleware = require('../middleware/auth');

// Validation pour l'inscription
const registerValidation = [
    body('phone').isMobilePhone().withMessage('Numéro de téléphone invalide'),
    body('password').isLength({ min: 6 }).withMessage('Mot de passe minimum 6 caractères'),
    body('fullName').notEmpty().withMessage('Nom complet requis'),
    body('role').isIn(['buyer', 'farmer']).withMessage('Rôle invalide'),
    body('location').optional()
];

// Validation pour la connexion
const loginValidation = [
    body('phone').isMobilePhone().withMessage('Numéro de téléphone invalide'),
    body('password').notEmpty().withMessage('Mot de passe requis')
];

// Routes publiques
router.post('/register', registerValidation, validateRequest, authController.register);
router.post('/login', loginValidation, validateRequest, authController.login);

// Routes protégées
router.get('/profile', authMiddleware, authController.getProfile);
router.put('/profile', authMiddleware, authController.updateProfile);

module.exports = router;