// Modèle Produit
const db = require('../config/db');

class Product {
    // Créer un nouveau produit
    static async create(farmerId, data) {
        const { name, categoryId, description, price, unit, quantity, minOrder, images } = data;
        
        let imagesJson = '[]';
        if (images && Array.isArray(images) && images.length > 0) {
            const imagesArray = images.map(img => ({ url: img }));
            imagesJson = JSON.stringify(imagesArray);
        } else if (typeof images === 'string' && images) {
            imagesJson = JSON.stringify([{ url: images }]);
        }
        
        const query = `
            INSERT INTO products (farmer_id, name, category_id, description, price, unit, quantity, min_order, images)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)
            RETURNING id, farmer_id, name, price, unit, quantity, created_at
        `;
        
        const result = await db.query(query, [
            farmerId, 
            name, 
            categoryId, 
            description, 
            price, 
            unit, 
            quantity, 
            minOrder || 1, 
            imagesJson
        ]);
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
        
        if (filters.categoryId) {
            query += ` AND p.category_id = $${paramCount}`;
            values.push(filters.categoryId);
            paramCount++;
        }
        
        if (filters.region) {
            query += ` AND u.location = $${paramCount}`;
            values.push(filters.region);
            paramCount++;
        }
        
        if (filters.maxPrice) {
            query += ` AND p.price <= $${paramCount}`;
            values.push(filters.maxPrice);
            paramCount++;
        }
        
        if (filters.search) {
            query += ` AND p.name ILIKE $${paramCount}`;
            values.push(`%${filters.search}%`);
            paramCount++;
        }
        
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
        
        const limit = filters.limit || 20;
        const offset = filters.offset || 0;
        query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        values.push(limit, offset);
        
        const result = await db.query(query, values);
        
        const formattedRows = result.rows.map(row => {
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
            return { ...row, images };
        });
        
        return formattedRows;
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
            await db.query('UPDATE products SET views = views + 1 WHERE id = $1', [id]);
            
            let images = [];
            if (result.rows[0].images) {
                try {
                    if (typeof result.rows[0].images === 'string') {
                        images = JSON.parse(result.rows[0].images);
                    } else if (Array.isArray(result.rows[0].images)) {
                        images = result.rows[0].images;
                    }
                    images = images.map(img => img.url || img);
                } catch (e) {
                    images = [];
                }
            }
            result.rows[0].images = images;
        }
        
        return result.rows[0];
    }
    
    // Récupérer les produits d'un agriculteur
    static async findByFarmer(farmerId) {
        const query = `
            SELECT p.*, c.name as category_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.farmer_id = $1
            ORDER BY p.created_at DESC
        `;
        const result = await db.query(query, [farmerId]);
        
        const formattedRows = result.rows.map(row => {
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
            return { ...row, images };
        });
        
        return formattedRows;
    }
    
    // Mettre à jour un produit
    static async update(id, farmerId, data) {
        const { name, price, quantity, description, unit, categoryId, isAvailable } = data;
        
        const query = `
            UPDATE products 
            SET name = COALESCE($1, name),
                price = COALESCE($2, price),
                quantity = COALESCE($3, quantity),
                description = COALESCE($4, description),
                unit = COALESCE($5, unit),
                category_id = COALESCE($6, category_id),
                is_available = COALESCE($7, is_available),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $8 AND farmer_id = $9
            RETURNING *
        `;
        
        const result = await db.query(query, [
            name, price, quantity, description, unit, categoryId, isAvailable, id, farmerId
        ]);
        return result.rows[0];
    }
    
    // Mettre à jour le statut (activer/désactiver)
    static async updateStatus(id, farmerId, isAvailable) {
        const query = `
            UPDATE products 
            SET is_available = $1,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $2 AND farmer_id = $3
            RETURNING *
        `;
        
        const result = await db.query(query, [isAvailable, id, farmerId]);
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