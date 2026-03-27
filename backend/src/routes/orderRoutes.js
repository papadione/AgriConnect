// Routes des commandes
const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middleware/auth');

// Toutes les routes nécessitent authentification
router.use(authMiddleware);

router.post('/', orderController.createOrder);
router.get('/mes-commandes', orderController.getMyOrders);
router.get('/recues', orderController.getReceivedOrders);
router.get('/:id', orderController.getOrderById);
router.put('/:id/statut', orderController.updateOrderStatus);

module.exports = router;