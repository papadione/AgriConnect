// Routes des produits
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require('../middleware/auth');

// Routes publiques
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);

// Routes protégées
router.use(authMiddleware);
router.post('/', productController.createProduct);
router.get('/farmer/:farmerId?', productController.getFarmerProducts);
router.put('/:id', productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

module.exports = router;