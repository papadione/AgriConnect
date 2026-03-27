// Modèle Utilisateur
const db = require('../config/db');
const bcrypt = require('bcryptjs');

class User {
    // Inscription d'un nouvel utilisateur
    static async register(phone, password, fullName, role, location) {
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const query = `
            INSERT INTO users (phone, password, full_name, role, location)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, phone, full_name, role, location, created_at
        `;
        
        const result = await db.query(query, [phone, hashedPassword, fullName, role, location]);
        return result.rows[0];
    }
    
    // Connexion utilisateur
    static async login(phone, password) {
        const query = 'SELECT * FROM users WHERE phone = $1 AND is_active = true';
        const result = await db.query(query, [phone]);
        
        if (result.rows.length === 0) return null;
        
        const user = result.rows[0];
        const isValid = await bcrypt.compare(password, user.password);
        
        if (!isValid) return null;
        
        // Mettre à jour la date de dernière connexion
        await db.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);
        
        return user;
    }
    
    // Rechercher un utilisateur par téléphone
    static async findByPhone(phone) {
        const query = 'SELECT * FROM users WHERE phone = $1';
        const result = await db.query(query, [phone]);
        return result.rows[0];
    }
    
    // Rechercher un utilisateur par ID
    static async findById(id) {
        const query = `
            SELECT u.*, 
                   f.farm_name,
                   f.is_verified as farmer_verified
            FROM users u
            LEFT JOIN farmers f ON u.id = f.user_id
            WHERE u.id = $1
        `;
        const result = await db.query(query, [id]);
        return result.rows[0];
    }
    
    // Créer un profil producteur
    static async createFarmerProfile(userId) {
        const query = `
            INSERT INTO farmers (user_id)
            VALUES ($1)
            ON CONFLICT (user_id) DO NOTHING
            RETURNING user_id
        `;
        const result = await db.query(query, [userId]);
        return result.rows[0];
    }
    
    // Mettre à jour le profil
    static async updateProfile(userId, data) {
        const { fullName, location, avatarUrl } = data;
        const query = `
            UPDATE users 
            SET full_name = COALESCE($1, full_name),
                location = COALESCE($2, location),
                avatar_url = COALESCE($3, avatar_url),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $4
            RETURNING id, phone, full_name, role, location, avatar_url
        `;
        const result = await db.query(query, [fullName, location, avatarUrl, userId]);
        return result.rows[0];
    }
}

module.exports = User;