// Gestion des variables d'environnement
require('dotenv').config();

module.exports = {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    
    db: {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        name: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
    },
    
    jwt: {
        secret: process.env.JWT_SECRET,
        expire: process.env.JWT_EXPIRE,
    }
};