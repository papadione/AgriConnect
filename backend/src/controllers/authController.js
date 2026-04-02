// Contrôleur d'authentification
const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const bcrypt = require('bcryptjs');

// Fonction utilitaire pour traduire les rôles en français
const traduireRole = (role) => {
    const roles = {
        'farmer': 'agriculteur',
        'buyer': 'acheteur',
        'wholesaler': 'grossiste',
        'admin': 'administrateur'
    };
    return roles[role] || role;
};

// Inscription
const register = async (req, res) => {
    try {
        const { phone, password, fullName, role, location } = req.body;
        
        const existingUser = await User.findByPhone(phone);
        if (existingUser) {
            return res.status(400).json({ erreur: 'Ce numéro de téléphone est déjà utilisé' });
        }
        
        const user = await User.register(phone, password, fullName, role, location);
        
        if (role === 'farmer') {
            await User.createFarmerProfile(user.id);
        }
        
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
const login = async (req, res) => {
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
const getProfile = async (req, res) => {
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
const updateProfile = async (req, res) => {
    try {
        const { fullName, location, phone, currentPassword, newPassword } = req.body;
        
        console.log('Données reçues pour mise à jour:', { fullName, location, phone });
        
        const updateData = {};
        if (fullName !== undefined && fullName !== '') updateData.fullName = fullName;
        if (location !== undefined && location !== '') updateData.location = location;
        
        // Si changement de téléphone
        if (phone !== undefined && phone !== '') {
            // Nettoyer le numéro (supprimer espaces et 221)
            let cleanedPhone = phone.toString().replace(/\s/g, '').replace(/\D/g, '');
            if (cleanedPhone.startsWith('221')) {
                cleanedPhone = cleanedPhone.substring(3);
            }
            if (cleanedPhone.startsWith('0')) {
                cleanedPhone = cleanedPhone.substring(1);
            }
            
            // Vérifier que le numéro n'est pas déjà utilisé par UN AUTRE utilisateur
            const existingUser = await User.findByPhone(cleanedPhone);
            
            if (existingUser && existingUser.id !== req.user.id) {
                return res.status(400).json({ erreur: 'Ce numéro de téléphone est déjà utilisé par un autre compte' });
            }
            
            // Stocker sans le 221
            updateData.phone = cleanedPhone;
        }
        
        // Si changement de mot de passe
        if (currentPassword && newPassword) {
            const user = await User.findById(req.user.id);
            const isValid = await bcrypt.compare(currentPassword, user.password);
            if (!isValid) {
                return res.status(401).json({ erreur: 'Mot de passe actuel incorrect' });
            }
            updateData.password = await bcrypt.hash(newPassword, 10);
        }
        
        const user = await User.updateProfile(req.user.id, updateData);
        
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
                localisation: user.location
            }
        });
        
    } catch (error) {
        console.error('Erreur mise à jour profil:', error);
        res.status(500).json({ erreur: 'Erreur lors de la mise à jour du profil' });
    }
};

// EXPORT - Toutes les fonctions sont maintenant des const
module.exports = {
    register,
    login,
    getProfile,
    updateProfile
};