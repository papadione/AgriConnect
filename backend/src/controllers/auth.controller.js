/**
 * AUTH.CONTROLLER : Version finale corrigée (password_hash)
 */
const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
    const { phone_number, password } = req.body;

    try {
        const cleanPhone = phone_number.replace(/[^\d+]/g, '');
        console.log(`\n--- 🔍 CONNEXION EN COURS ---`);

        // 1. On récupère l'utilisateur
        const result = await pool.query('SELECT * FROM users WHERE phone_number = $1', [cleanPhone]);
        const user = result.rows[0];

        if (!user) {
            console.log("❌ Aucun utilisateur avec ce numéro.");
            return res.status(401).json({ error: "Utilisateur non trouvé." });
        }

        // 2. RÉCUPÉRATION DU MOT DE PASSE (Via ta colonne 'password_hash')
        const dbPassword = user.password_hash; 

        console.log(`Saisi : "${password}"`);
        console.log(`En DB (password_hash) : "${dbPassword}"`);

        // 3. VÉRIFICATION (Texte clair ou Bcrypt)
        let validPassword = false;
        
        if (password === dbPassword) {
            validPassword = true;
            console.log("✅ Match en texte clair !");
        } else if (dbPassword && dbPassword.startsWith('$2b$')) {
            validPassword = await bcrypt.compare(password, dbPassword);
            if (validPassword) console.log("✅ Match via Bcrypt !");
        }

        if (!validPassword) {
            console.log("❌ Échec : Le mot de passe ne correspond pas.");
            return res.status(401).json({ error: "Mot de passe incorrect." });
        }

        // 4. GÉNÉRATION DU TOKEN
        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET || 'agriconnect_secret_2026',
            { expiresIn: '24h' }
        );

        console.log(`🚀 BIENVENUE : ${user.full_name}`);
        
        res.status(200).json({
            token: token,
            user: { 
                name: user.full_name,
                role: user.role 
            }
        });

    } catch (error) {
        console.error("[Erreur Auth]", error.message);
        res.status(500).json({ error: "Erreur serveur." });
    }
};

exports.register = async (req, res) => { res.send("OK"); };