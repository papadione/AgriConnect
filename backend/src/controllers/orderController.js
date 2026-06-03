// Contrôleur des commandes
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const WhatsAppService = require('../services/whatsappService');

// Créer une commande
exports.createOrder = async (req, res) => {
    try {
        const { farmerId, items, deliveryAddress, deliveryPhone, notes } = req.body;
        
        if (!farmerId || !items || !deliveryAddress) {
            return res.status(400).json({ erreur: 'Veuillez remplir tous les champs obligatoires' });
        }
        
        const buyerId = req.user.id;
        
        console.log('Création commande - Acheteur ID:', buyerId);
        console.log('Création commande - Producteur ID:', farmerId);
        
        let totalAmount = 0;
        const validatedItems = [];
        
        for (const item of items) {
            const product = await Product.findById(item.productId);
            
            if (!product) {
                return res.status(404).json({ erreur: `Produit ${item.productId} non trouvé` });
            }
            
            if (product.quantity < item.quantity) {
                return res.status(400).json({ erreur: `Stock insuffisant pour ${product.name}` });
            }
            
            const subtotal = product.price * item.quantity;
            totalAmount += subtotal;
            
            validatedItems.push({
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: product.price,
                subtotal: subtotal
            });
        }
        
        const deliveryFee = 0;
        
        const order = await Order.create(buyerId, {
            farmerId,
            items: validatedItems,
            totalAmount: totalAmount + deliveryFee,
            deliveryFee,
            deliveryAddress,
            deliveryPhone,
            notes
        });
        
        const buyer = await User.findById(buyerId);
        const farmer = await User.findById(farmerId);

        if (buyer && buyer.phone) {
            await WhatsAppService.sendOrderConfirmed(buyer.phone, order.order_number);
        }

        if (farmer && farmer.phone) {
            await WhatsAppService.sendNewOrderNotification(farmer.phone, order.order_number, buyer.full_name, totalAmount);
        }
        
        res.status(201).json({
            succes: true,
            commande: order
        });
        
    } catch (error) {
        console.error('Erreur création commande:', error);
        res.status(500).json({ erreur: 'Erreur lors de la création de la commande' });
    }
};

// Obtenir mes commandes (acheteur)
exports.getMyOrders = async (req, res) => {
    try {
        const orders = await Order.findByBuyer(req.user.id);
        
        res.json({
            succes: true,
            commandes: orders
        });
        
    } catch (error) {
        console.error('Erreur récupération commandes:', error);
        res.status(500).json({ erreur: 'Erreur lors de la récupération des commandes' });
    }
};

// Obtenir les commandes reçues (agriculteur)
exports.getReceivedOrders = async (req, res) => {
    try {
        if (req.user.role !== 'farmer') {
            return res.status(403).json({ erreur: 'Accès réservé aux agriculteurs' });
        }
        
        const orders = await Order.findByFarmer(req.user.id);
        
        res.json({
            succes: true,
            commandes: orders
        });
        
    } catch (error) {
        console.error('Erreur récupération commandes reçues:', error);
        res.status(500).json({ erreur: 'Erreur lors de la récupération des commandes' });
    }
};

// Obtenir une commande par ID
exports.getOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        const order = await Order.findById(id);
        
        if (!order) {
            return res.status(404).json({ erreur: 'Commande non trouvée' });
        }
        
        if (order.buyer_id !== req.user.id && order.farmer_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ erreur: 'Accès non autorisé' });
        }
        
        res.json({
            succes: true,
            commande: order
        });
        
    } catch (error) {
        console.error('Erreur récupération commande:', error);
        res.status(500).json({ erreur: 'Erreur lors de la récupération de la commande' });
    }
};

// Mettre à jour le statut d'une commande (avec WhatsApp)
exports.updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        const validStatus = ['pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled'];
        
        if (!validStatus.includes(status)) {
            return res.status(400).json({ erreur: 'Statut invalide' });
        }
        
        const order = await Order.findById(id);
        
        if (!order) {
            return res.status(404).json({ erreur: 'Commande non trouvée' });
        }
        
        const isFarmer = req.user.role === 'farmer';
        const isBuyer = req.user.role === 'buyer' && order.buyer_id === req.user.id;
        
        if (!isFarmer && !isBuyer && req.user.role !== 'admin') {
            return res.status(403).json({ erreur: 'Accès non autorisé' });
        }
        
        if (isBuyer && status !== 'cancelled') {
            return res.status(403).json({ erreur: 'Vous ne pouvez que annuler votre commande' });
        }
        
        if (isBuyer && order.status !== 'pending') {
            return res.status(403).json({ erreur: 'Vous ne pouvez annuler qu\'une commande en attente' });
        }
        
        const updatedOrder = await Order.updateStatus(id, status, req.user.id, req.user.role);
        
        // === ENVOI DES MESSAGES WHATSAPP SELON LE STATUT ===
        const buyer = await User.findById(order.buyer_id);
        const farmer = await User.findById(order.farmer_id);
        
        switch(status) {
            case 'confirmed':
                if (buyer && buyer.phone) {
                    await WhatsAppService.sendOrderConfirmed(buyer.phone, order.order_number);
                }
                break;
            case 'shipped':
                if (buyer && buyer.phone) {
                    await WhatsAppService.sendOrderShipped(buyer.phone, order.order_number);
                }
                break;
            case 'delivered':
                if (buyer && buyer.phone) {
                    await WhatsAppService.sendOrderDelivered(buyer.phone, order.order_number);
                }
                break;
            case 'cancelled':
                if (buyer && buyer.phone) {
                    await WhatsAppService.sendOrderCancelled(buyer.phone, order.order_number);
                }
                if (farmer && farmer.phone) {
                    await WhatsAppService.sendMessage(farmer.phone, `❌ La commande ${order.order_number} a été annulée`);
                }
                break;
        }
        
        res.json({
            succes: true,
            commande: updatedOrder
        });
        
    } catch (error) {
        console.error('Erreur mise à jour statut:', error);
        res.status(500).json({ erreur: 'Erreur lors de la mise à jour du statut' });
    }
};