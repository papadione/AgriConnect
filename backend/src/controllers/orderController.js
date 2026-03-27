// Contrôleur des commandes
const Order = require('../models/Order');
const Product = require('../models/Product');

// Créer une commande
exports.createOrder = async (req, res) => {
    try {
        const { farmerId, items, deliveryAddress, deliveryPhone, notes } = req.body;
        
        if (!farmerId || !items || !deliveryAddress) {
            return res.status(400).json({ erreur: 'Veuillez remplir tous les champs obligatoires' });
        }
        
        // Calculer le total
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
        
        const deliveryFee = 0; // À calculer selon la distance
        
        const order = await Order.create(req.user.id, {
            farmerId,
            items: validatedItems,
            totalAmount: totalAmount + deliveryFee,
            deliveryFee,
            deliveryAddress,
            deliveryPhone,
            notes
        });
        
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
        
        // Vérifier que l'utilisateur a le droit de voir cette commande
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

// Mettre à jour le statut d'une commande
exports.updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        const validStatus = ['pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled'];
        
        if (!validStatus.includes(status)) {
            return res.status(400).json({ erreur: 'Statut invalide' });
        }
        
        const order = await Order.updateStatus(id, status, req.user.id, req.user.role);
        
        if (!order) {
            return res.status(404).json({ erreur: 'Commande non trouvée ou vous n\'avez pas les droits' });
        }
        
        res.json({
            succes: true,
            commande: order
        });
        
    } catch (error) {
        console.error('Erreur mise à jour statut:', error);
        res.status(500).json({ erreur: 'Erreur lors de la mise à jour du statut' });
    }
};