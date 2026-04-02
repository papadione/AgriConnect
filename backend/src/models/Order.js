// Modèle Commande
const db = require('../config/db');

class Order {
    // Générer un numéro de commande unique
    static generateOrderNumber() {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `CMD-${year}${month}${day}-${random}`;
    }
    
    // Créer une nouvelle commande
    static async create(buyerId, data) {
        const { farmerId, items, totalAmount, deliveryFee, deliveryAddress, deliveryPhone, notes } = data;
        const orderNumber = this.generateOrderNumber();
        
        console.log('Création commande - Buyer ID dans model:', buyerId);
        console.log('Création commande - Farmer ID dans model:', farmerId);
        
        await db.query('BEGIN');
        
        try {
            const orderQuery = `
                INSERT INTO orders (order_number, buyer_id, farmer_id, total_amount, delivery_fee, delivery_address, delivery_phone, notes, status)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
                RETURNING id, order_number, total_amount, status, created_at
            `;
            
            const orderResult = await db.query(orderQuery, [
                orderNumber, buyerId, farmerId, totalAmount, deliveryFee, 
                deliveryAddress, deliveryPhone, notes
            ]);
            
            const order = orderResult.rows[0];
            
            for (const item of items) {
                const itemQuery = `
                    INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
                    VALUES ($1, $2, $3, $4, $5)
                `;
                await db.query(itemQuery, [
                    order.id, item.productId, item.quantity, item.unitPrice, item.subtotal
                ]);
                
                await db.query(
                    'UPDATE products SET quantity = quantity - $1 WHERE id = $2',
                    [item.quantity, item.productId]
                );
            }
            
            await db.query('COMMIT');
            return order;
            
        } catch (error) {
            await db.query('ROLLBACK');
            throw error;
        }
    }
    
    // Récupérer les commandes d'un acheteur
    static async findByBuyer(buyerId) {
        const query = `
            SELECT o.*, 
                   u.full_name as farmer_name,
                   u.phone as farmer_phone
            FROM orders o
            JOIN users u ON o.farmer_id = u.id
            WHERE o.buyer_id = $1
            ORDER BY o.created_at DESC
        `;
        const result = await db.query(query, [buyerId]);
        return result.rows;
    }
    
    // Récupérer les commandes d'un producteur
    static async findByFarmer(farmerId) {
        const query = `
            SELECT o.*, 
                   u.full_name as buyer_name,
                   u.phone as buyer_phone
            FROM orders o
            JOIN users u ON o.buyer_id = u.id
            WHERE o.farmer_id = $1
            ORDER BY o.created_at DESC
        `;
        const result = await db.query(query, [farmerId]);
        return result.rows;
    }
    
    // Récupérer une commande avec ses détails
    static async findById(orderId) {
        const query = `
            SELECT o.*,
                   buyer.full_name as buyer_name,
                   buyer.phone as buyer_phone,
                   farmer.full_name as farmer_name,
                   farmer.phone as farmer_phone,
                   json_agg(json_build_object(
                       'product_id', p.id,
                       'product_name', p.name,
                       'quantity', oi.quantity,
                       'unit_price', oi.unit_price,
                       'subtotal', oi.subtotal
                   )) as items
            FROM orders o
            JOIN users buyer ON o.buyer_id = buyer.id
            JOIN users farmer ON o.farmer_id = farmer.id
            JOIN order_items oi ON o.id = oi.order_id
            JOIN products p ON oi.product_id = p.id
            WHERE o.id = $1
            GROUP BY o.id, buyer.full_name, buyer.phone, farmer.full_name, farmer.phone
        `;
        const result = await db.query(query, [orderId]);
        return result.rows[0];
    }
    
    // Mettre à jour le statut d'une commande
    static async updateStatus(orderId, status, userId, role) {
        let query;
        let params;
        
        // L'acheteur ne peut modifier que ses propres commandes
        if (role === 'buyer') {
            query = `UPDATE orders SET status = $1 WHERE id = $2 AND buyer_id = $3 RETURNING *`;
            params = [status, orderId, userId];
        } else {
            // L'agriculteur ou admin peut modifier toutes les commandes de ses produits
            query = `UPDATE orders SET status = $1 WHERE id = $2 RETURNING *`;
            params = [status, orderId];
        }
        
        const result = await db.query(query, params);
        
        if (status === 'delivered' && result.rows.length > 0) {
            await db.query('UPDATE orders SET delivered_at = CURRENT_TIMESTAMP WHERE id = $1', [orderId]);
        }
        
        return result.rows[0];
    }
}

module.exports = Order;