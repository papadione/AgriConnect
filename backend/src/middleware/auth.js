// Middleware d'authentification
const { verifyToken } = require('../utils/jwt');

const authMiddleware = async (req, res, next) => {
    try {
        // Récupérer le token du header
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Accès non autorisé' });
        }
        
        // Extraire le token
        const token = authHeader.split(' ')[1];
        
        // Vérifier le token
        const decoded = verifyToken(token);
        
        if (!decoded) {
            return res.status(401).json({ error: 'Token invalide ou expiré' });
        }
        
        // Ajouter les infos utilisateur à la requête
        req.user = decoded;
        next();
        
    } catch (error) {
        console.error('Erreur authentification:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
};

module.exports = authMiddleware;