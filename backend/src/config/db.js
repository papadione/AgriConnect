/**
 * DB CONFIG
 * Établit la connexion avec PostgreSQL en utilisant les variables d'environnement
 */
const { Pool } = require('pg');
require('dotenv').config();

// Création du pool de connexion : PostgreSQL gère automatiquement plusieurs requêtes
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Test simple pour vérifier que la connexion est bien active
pool.connect((err) => {
    if (err) {
        console.error("❌ Erreur de connexion à la base de données :", err.message);
    } else {
        console.log("✅ Connexion à la base de données établie");
    }
});

module.exports = pool;