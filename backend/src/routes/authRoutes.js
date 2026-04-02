// Routes d'authentification
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validateRequest } = require('../middleware/validation');
const authMiddleware = require('../middleware/auth');

// Importer le contrôleur
const authController = require('../controllers/authController');

// Vérifier que le contrôleur est bien chargé
console.log('authController chargé:', Object.keys(authController));

// Validation personnalisée pour les numéros sénégalais
const estNumeroValide = (value) => {
    const cleaned = value.replace(/\s/g, '');
    const regex = /^(?:\+221|221)?(70|75|76|77|78)[0-9]{7}$/;
    return regex.test(cleaned);
};

// Validation pour l'inscription
const validationInscription = [
    body('phone')
        .custom(estNumeroValide)
        .withMessage('Numéro de téléphone sénégalais invalide (ex: 77 123 45 67)'),
    body('password').isLength({ min: 6 }).withMessage('Mot de passe minimum 6 caractères'),
    body('fullName').notEmpty().withMessage('Nom complet requis'),
    body('role').isIn(['buyer', 'farmer', 'wholesaler']).withMessage('Le rôle doit être "acheteur" ou "agriculteur" ou "Grossiste"'),
    body('location').optional()
];

// Validation pour la connexion
const validationConnexion = [
    body('phone')
        .custom(estNumeroValide)
        .withMessage('Numéro de téléphone sénégalais invalide'),
    body('password').notEmpty().withMessage('Mot de passe requis')
];

// Vérifier que les fonctions existent avant de les utiliser
console.log('authController.register existe:', typeof authController.register);
console.log('authController.login existe:', typeof authController.login);
console.log('authController.getProfile existe:', typeof authController.getProfile);
console.log('authController.updateProfile existe:', typeof authController.updateProfile);

// Routes en français
if (authController.register) router.post('/inscription', validationInscription, validateRequest, authController.register);
if (authController.login) router.post('/connexion', validationConnexion, validateRequest, authController.login);
if (authController.getProfile) router.get('/profil', authMiddleware, authController.getProfile);
if (authController.updateProfile) router.put('/profil', authMiddleware, authController.updateProfile);

// Routes en anglais
if (authController.register) router.post('/register', validationInscription, validateRequest, authController.register);
if (authController.login) router.post('/login', validationConnexion, validateRequest, authController.login);
if (authController.getProfile) router.get('/profile', authMiddleware, authController.getProfile);
if (authController.updateProfile) router.put('/profile', authMiddleware, authController.updateProfile);

module.exports = router;