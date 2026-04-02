// Routes des produits
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require('../middleware/auth');

// Routes publiques (pas besoin de token)
router.get('/', productController.getAllProducts);

// Routes protégées (authentification requise)
router.use(authMiddleware);

// Routes spécifiques DOIVENT être AVANT la route avec paramètre :id
router.get('/mes-produits', productController.getFarmerProducts);
router.post('/', productController.createProduct);
router.put('/:id', productController.updateProduct);
router.patch('/:id/statut', productController.toggleProductStatus);
router.delete('/:id', productController.deleteProduct);

// Route avec paramètre :id DOIT être en DERNIER
router.get('/:id', productController.getProductById);

module.exports = router;