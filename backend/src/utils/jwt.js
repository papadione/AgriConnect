// Gestion des tokens JWT
const jwt = require('jsonwebtoken');
const { jwt: jwtConfig } = require('../config/env');

// Générer un token
const generateToken = (userId, phone, role) => {
    return jwt.sign(
        { id: userId, phone, role },
        jwtConfig.secret,
        { expiresIn: jwtConfig.expire }
    );
};

// Vérifier un token
const verifyToken = (token) => {
    try {
        return jwt.verify(token, jwtConfig.secret);
    } catch (error) {
        return null;
    }
};

module.exports = { generateToken, verifyToken };