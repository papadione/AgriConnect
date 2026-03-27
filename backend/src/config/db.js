const { Pool } = require('pg');
require('dotenv').config();

console.log('🔍 Connexion à PostgreSQL en cours...');

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});

// Test de connexion immédiat
pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ Erreur de connexion:', err.message);
        console.error('   Vérifie vos identifiants dans .env');
        return;
    }
    release();
    console.log('✅ Connecté à PostgreSQL');
    console.log(`   Base: ${process.env.DB_NAME}`);
    console.log(`   Hôte: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
});

pool.on('error', (err) => {
    console.error('❌ Erreur PostgreSQL inattendue:', err.message);
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool
};