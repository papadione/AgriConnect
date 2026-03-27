// Contrôleur d'authentification
const User = require('../models/User');
const { generateToken } = require('../utils/jwt');

// Fonction utilitaire pour traduire les rôles en français
const traduireRole = (role) => {
    const roles = {
        'farmer': 'agriculteur',
        'buyer': 'acheteur',
        'admin': 'administrateur'
    };
    return roles[role] || role;
};

// Inscription
exports.register = async (req, res) => {
    try {
        const { phone, password, fullName, role, location } = req.body;
        
        // Vérifier si le numéro existe déjà
        const existingUser = await User.findByPhone(phone);
        if (existingUser) {
            return res.status(400).json({ erreur: 'Ce numéro de téléphone est déjà utilisé' });
        }
        
        // Créer l'utilisateur
        const user = await User.register(phone, password, fullName, role, location);
        
        // Si c'est un agriculteur, créer son profil
        if (role === 'farmer') {
            await User.createFarmerProfile(user.id);
        }
        
        // Générer le token
        const token = generateToken(user.id, user.phone, user.role);
        
        res.status(201).json({
            succes: true,
            token,
            utilisateur: {
                id: user.id,
                telephone: user.phone,
                nomComplet: user.full_name,
                role: traduireRole(user.role),
                localisation: user.location
            }
        });
        
    } catch (error) {
        console.error('Erreur inscription:', error);
        res.status(500).json({ erreur: 'Erreur lors de l\'inscription' });
    }
};

// Connexion
exports.login = async (req, res) => {
    try {
        const { phone, password } = req.body;
        
        const user = await User.login(phone, password);
        
        if (!user) {
            return res.status(401).json({ erreur: 'Numéro de téléphone ou mot de passe incorrect' });
        }
        
        const token = generateToken(user.id, user.phone, user.role);
        
        res.json({
            succes: true,
            token,
            utilisateur: {
                id: user.id,
                telephone: user.phone,
                nomComplet: user.full_name,
                role: traduireRole(user.role),
                localisation: user.location
            }
        });
        
    } catch (error) {
        console.error('Erreur connexion:', error);
        res.status(500).json({ erreur: 'Erreur lors de la connexion' });
    }
};

// Obtenir le profil
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({ erreur: 'Utilisateur non trouvé' });
        }
        
        res.json({
            succes: true,
            utilisateur: {
                id: user.id,
                telephone: user.phone,
                nomComplet: user.full_name,
                role: traduireRole(user.role),
                localisation: user.location,
                nomFerme: user.farm_name,
                estVerifie: user.farmer_verified || false
            }
        });
        
    } catch (error) {
        console.error('Erreur profil:', error);
        res.status(500).json({ erreur: 'Erreur serveur' });
    }
};

// Mettre à jour le profil
exports.updateProfile = async (req, res) => {
    try {
        const { fullName, location, avatarUrl } = req.body;
        
        const user = await User.updateProfile(req.user.id, {
            fullName,
            location,
            avatarUrl
        });
        
        res.json({
            succes: true,
            utilisateur: {
                id: user.id,
                telephone: user.phone,
                nomComplet: user.full_name,
                role: traduireRole(user.role),
                localisation: user.location,
                avatarUrl: user.avatar_url
            }
        });
        
    } catch (error) {
        console.error('Erreur mise à jour profil:', error);
        res.status(500).json({ erreur: 'Erreur lors de la mise à jour' });
    }
};