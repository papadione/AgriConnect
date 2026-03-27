// Modèle Produit
const db = require('../config/db');

class Product {
    // Créer un nouveau produit
    static async create(farmerId, data) {
        const { name, categoryId, description, price, unit, quantity, minOrder, images } = data;
        
        const query = `
            INSERT INTO products (farmer_id, name, category_id, description, price, unit, quantity, min_order, images)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id, farmer_id, name, price, unit, quantity, created_at
        `;
        
        const result = await db.query(query, [farmerId, name, categoryId, description, price, unit, quantity, minOrder || 1, images || []]);
        return result.rows[0];
    }
    
    // Récupérer tous les produits (avec filtres)
    static async findAll(filters = {}) {
        let query = `
            SELECT p.*, 
                   u.full_name as farmer_name,
                   u.location as farmer_location,
                   c.name as category_name
            FROM products p
            JOIN users u ON p.farmer_id = u.id
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.is_available = true
        `;
        
        const values = [];
        let paramCount = 1;
        
        // Filtre par catégorie
        if (filters.categoryId) {
            query += ` AND p.category_id = $${paramCount}`;
            values.push(filters.categoryId);
            paramCount++;
        }
        
        // Filtre par région
        if (filters.region) {
            query += ` AND u.location = $${paramCount}`;
            values.push(filters.region);
            paramCount++;
        }
        
        // Filtre par prix max
        if (filters.maxPrice) {
            query += ` AND p.price <= $${paramCount}`;
            values.push(filters.maxPrice);
            paramCount++;
        }
        
        // Recherche par mot-clé
        if (filters.search) {
            query += ` AND p.name ILIKE $${paramCount}`;
            values.push(`%${filters.search}%`);
            paramCount++;
        }
        
        // Tri
        switch (filters.sort) {
            case 'price_asc':
                query += ` ORDER BY p.price ASC`;
                break;
            case 'price_desc':
                query += ` ORDER BY p.price DESC`;
                break;
            case 'popular':
                query += ` ORDER BY p.views DESC`;
                break;
            default:
                query += ` ORDER BY p.created_at DESC`;
        }
        
        // Pagination
        const limit = filters.limit || 20;
        const offset = filters.offset || 0;
        query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        values.push(limit, offset);
        
        const result = await db.query(query, values);
        return result.rows;
    }
    
    // Récupérer un produit par ID
    static async findById(id) {
        const query = `
            SELECT p.*, 
                   u.full_name as farmer_name,
                   u.location as farmer_location,
                   u.phone as farmer_phone,
                   c.name as category_name
            FROM products p
            JOIN users u ON p.farmer_id = u.id
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.id = $1
        `;
        const result = await db.query(query, [id]);
        
        if (result.rows.length > 0) {
            // Incrémenter le compteur de vues
            await db.query('UPDATE products SET views = views + 1 WHERE id = $1', [id]);
        }
        
        return result.rows[0];
    }
    
    // Récupérer les produits d'un producteur
    static async findByFarmer(farmerId) {
        const query = `
            SELECT p.*, c.name as category_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.farmer_id = $1
            ORDER BY p.created_at DESC
        `;
        const result = await db.query(query, [farmerId]);
        return result.rows;
    }
    
    // Mettre à jour un produit
    static async update(id, farmerId, data) {
        const { name, price, quantity, description, isAvailable } = data;
        
        const query = `
            UPDATE products 
            SET name = COALESCE($1, name),
                price = COALESCE($2, price),
                quantity = COALESCE($3, quantity),
                description = COALESCE($4, description),
                is_available = COALESCE($5, is_available),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $6 AND farmer_id = $7
            RETURNING *
        `;
        
        const result = await db.query(query, [name, price, quantity, description, isAvailable, id, farmerId]);
        return result.rows[0];
    }
    
    // Supprimer un produit
    static async delete(id, farmerId) {
        const query = 'DELETE FROM products WHERE id = $1 AND farmer_id = $2 RETURNING id';
        const result = await db.query(query, [id, farmerId]);
        return result.rows[0];
    }
}

module.exports = Product;