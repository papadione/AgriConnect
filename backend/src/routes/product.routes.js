/**
 * PRODUCT.ROUTES : Définition des chemins pour le catalogue
 */
const express = require('express');
const router = express.Router();
const productCtrl = require('../controllers/product.controller'); // Vérifie bien ce chemin !

// Route pour récupérer tous les produits
router.get('/', productCtrl.getAllProducts);

module.exports = router; // <--- TRÈS IMPORTANT : ne pas oublier l'export