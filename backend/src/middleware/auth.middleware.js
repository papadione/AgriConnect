const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    try {
        // 1. On récupère le token dans l'en-tête (ex: Bearer ey...)
        const token = req.headers.authorization.split(' ')[1]; 
        
        // 2. On vérifie la signature avec la clé secrète du .env
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        
        // 3. On stocke les infos décodées dans 'req.user' pour le contrôleur
        req.user = decodedToken;
        
        // 4. On passe à la suite
        next();
        
    } catch (error) {
        res.status(401).json({ error: "Accès refusé ! Token absent ou invalide." });
    }
};