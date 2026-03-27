/**
 * AUTH ROUTES
 * Définit les points d'entrée (endpoints) pour l'authentification
 */
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// Route : POST /api/auth/register
// Appelle la fonction 'register' du contrôleur
router.post('/register', authController.register);

// Route : POST /api/auth/login
// Appelle la fonction 'login' du contrôleur
router.post('/login', authController.login);

// Exportation du module pour server.js
module.exports = router;