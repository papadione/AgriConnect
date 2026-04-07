// Routes d'administration
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/auth');

// Toutes les routes nécessitent authentification
router.use(authMiddleware);

// Routes protégées par le rôle admin
router.use(adminController.isAdmin);

// Statistiques
router.get('/statistiques', adminController.getStats);

// Utilisateurs
router.get('/utilisateurs', adminController.getAllUsers);
router.post('/utilisateurs', adminController.createUser);
router.delete('/utilisateurs/:id', adminController.deleteUser);
router.put('/utilisateurs/:id', adminController.updateUser);

// Produits
router.get('/produits', adminController.getAllProductsAdmin);
router.delete('/produits/:id', adminController.deleteProductAdmin);

// Commandes
router.get('/commandes', adminController.getAllOrders);
router.put('/commandes/:id/statut', adminController.updateOrderStatus);

module.exports = router;