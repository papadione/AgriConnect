// Contrôleur d'administration
const db = require('../config/db');
const bcrypt = require('bcryptjs');

// Vérifier si l'utilisateur est admin (middleware)
const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ erreur: 'Accès réservé aux administrateurs' });
    }
    next();
};

// ================= STATISTIQUES =================
const getStats = async (req, res) => {
    try {
        const stats = await db.query(`
            SELECT 
                (SELECT COUNT(*) FROM users) as total_users,
                (SELECT COUNT(*) FROM users WHERE role = 'farmer') as total_farmers,
                (SELECT COUNT(*) FROM users WHERE role = 'buyer') as total_buyers,
                (SELECT COUNT(*) FROM users WHERE role = 'wholesaler') as total_wholesalers,
                (SELECT COUNT(*) FROM products) as total_products,
                (SELECT COUNT(*) FROM orders) as total_orders,
                (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE status = 'delivered') as total_revenue
        `);
        
        res.json({
            succes: true,
            statistiques: stats.rows[0]
        });
    } catch (error) {
        console.error('Erreur récupération statistiques:', error);
        res.status(500).json({ erreur: 'Erreur serveur' });
    }
};

// ================= UTILISATEURS =================
const getAllUsers = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT u.id, u.phone, u.full_name, u.role, u.location, u.is_active, u.created_at,
                   COALESCE(f.farm_name, '') as farm_name
            FROM users u
            LEFT JOIN farmers f ON u.id = f.user_id
            ORDER BY u.id
        `);
        
        res.json({
            succes: true,
            utilisateurs: result.rows
        });
    } catch (error) {
        console.error('Erreur récupération utilisateurs:', error);
        res.status(500).json({ erreur: 'Erreur serveur' });
    }
};

const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Vérifier que l'utilisateur existe
        const checkUser = await db.query('SELECT * FROM users WHERE id = $1', [id]);
        if (checkUser.rows.length === 0) {
            return res.status(404).json({ erreur: 'Utilisateur non trouvé' });
        }
        
        // Ne pas supprimer son propre compte
        if (parseInt(id) === req.user.id) {
            return res.status(400).json({ erreur: 'Vous ne pouvez pas supprimer votre propre compte' });
        }
        
        // Supprimer l'utilisateur
        await db.query('DELETE FROM users WHERE id = $1', [id]);
        
        res.json({
            succes: true,
            message: 'Utilisateur supprimé avec succès'
        });
    } catch (error) {
        console.error('Erreur suppression utilisateur:', error);
        res.status(500).json({ erreur: 'Erreur serveur' });
    }
};

const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { fullName, role, location, isActive, password } = req.body;
        
        let query = `
            UPDATE users 
            SET full_name = COALESCE($1, full_name),
                role = COALESCE($2, role),
                location = COALESCE($3, location),
                is_active = COALESCE($4, is_active)
        `;
        const values = [fullName, role, location, isActive];
        let paramCount = 5;
        
        if (password && password !== '') {
            const hashedPassword = await bcrypt.hash(password, 10);
            query += `, password = $${paramCount}`;
            values.push(hashedPassword);
            paramCount++;
        }
        
        query += ` WHERE id = $${paramCount} RETURNING id, phone, full_name, role, location, is_active`;
        values.push(id);
        
        const result = await db.query(query, values);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ erreur: 'Utilisateur non trouvé' });
        }
        
        res.json({
            succes: true,
            utilisateur: result.rows[0]
        });
    } catch (error) {
        console.error('Erreur modification utilisateur:', error);
        res.status(500).json({ erreur: 'Erreur serveur' });
    }
};

const createUser = async (req, res) => {
    try {
        const { phone, password, fullName, role, location } = req.body;
        
        // Vérifier si le numéro existe déjà
        const existingUser = await db.query('SELECT * FROM users WHERE phone = $1', [phone]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ erreur: 'Ce numéro de téléphone est déjà utilisé' });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const result = await db.query(`
            INSERT INTO users (phone, password, full_name, role, location, is_active)
            VALUES ($1, $2, $3, $4, $5, true)
            RETURNING id, phone, full_name, role, location
        `, [phone, hashedPassword, fullName, role, location]);
        
        res.status(201).json({
            succes: true,
            utilisateur: result.rows[0]
        });
    } catch (error) {
        console.error('Erreur création utilisateur:', error);
        res.status(500).json({ erreur: 'Erreur serveur' });
    }
};

// ================= PRODUITS =================
const getAllProductsAdmin = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT p.*, 
                   u.full_name as farmer_name,
                   c.name as category_name
            FROM products p
            JOIN users u ON p.farmer_id = u.id
            LEFT JOIN categories c ON p.category_id = c.id
            ORDER BY p.id DESC
        `);
        
        const produits = result.rows.map(row => {
            // Gérer les images
            let images = [];
            if (row.images) {
                try {
                    if (typeof row.images === 'string') {
                        images = JSON.parse(row.images);
                    } else if (Array.isArray(row.images)) {
                        images = row.images;
                    }
                    images = images.map(img => img.url || img);
                } catch (e) {
                    images = [];
                }
            }
            
            // S'assurer que toutes les propriétés existent
            return {
                id: row.id,
                nom: row.name || 'Sans nom',
                name: row.name,
                prix: parseFloat(row.price) || 0,
                price: parseFloat(row.price) || 0,
                quantite: parseFloat(row.quantity) || 0,
                quantity: parseFloat(row.quantity) || 0,
                unite: row.unit || 'kg',
                unit: row.unit || 'kg',
                disponible: row.is_available === true,
                is_available: row.is_available === true,
                farmer_name: row.farmer_name || 'Inconnu',
                category_name: row.category_name || 'Non catégorisé',
                images: images,
                description: row.description || '',
                created_at: row.created_at
            };
        });
        
        res.json({
            succes: true,
            produits: produits
        });
    } catch (error) {
        console.error('Erreur récupération produits:', error);
        res.status(500).json({ erreur: 'Erreur serveur' });
    }
};

const deleteProductAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await db.query('DELETE FROM products WHERE id = $1 RETURNING id', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ erreur: 'Produit non trouvé' });
        }
        
        res.json({
            succes: true,
            message: 'Produit supprimé avec succès'
        });
    } catch (error) {
        console.error('Erreur suppression produit:', error);
        res.status(500).json({ erreur: 'Erreur serveur' });
    }
};

// ================= COMMANDES =================
const getAllOrders = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT o.*,
                   buyer.full_name as buyer_name,
                   farmer.full_name as farmer_name
            FROM orders o
            JOIN users buyer ON o.buyer_id = buyer.id
            JOIN users farmer ON o.farmer_id = farmer.id
            ORDER BY o.created_at DESC
        `);
        
        res.json({
            succes: true,
            commandes: result.rows
        });
    } catch (error) {
        console.error('Erreur récupération commandes:', error);
        res.status(500).json({ erreur: 'Erreur serveur' });
    }
};

const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        const validStatus = ['pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled'];
        if (!validStatus.includes(status)) {
            return res.status(400).json({ erreur: 'Statut invalide' });
        }
        
        const result = await db.query(`
            UPDATE orders 
            SET status = $1,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING *
        `, [status, id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ erreur: 'Commande non trouvée' });
        }
        
        res.json({
            succes: true,
            commande: result.rows[0]
        });
    } catch (error) {
        console.error('Erreur mise à jour commande:', error);
        res.status(500).json({ erreur: 'Erreur serveur' });
    }
};

module.exports = {
    isAdmin,
    getStats,
    getAllUsers,
    deleteUser,
    updateUser,
    createUser,
    getAllProductsAdmin,
    deleteProductAdmin,
    getAllOrders,
    updateOrderStatus
};