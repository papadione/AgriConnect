// Contrôleur d'authentification
const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const bcrypt = require('bcryptjs');
const SmsService = require('../services/smsService');

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

// Générer un code aléatoire à 6 chiffres
function generateValidationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Stocker les codes temporairement (en mémoire)
const validationCodes = new Map();

// Inscription - Étape 1: Envoyer le code SMS
const register = async (req, res) => {
    try {
        const { phone, password, fullName, role, location } = req.body;
        
        // Vérifier si le numéro existe déjà
        const existingUser = await User.findByPhone(phone);
        if (existingUser) {
            return res.status(400).json({ erreur: 'Ce numéro de téléphone est déjà utilisé' });
        }
        
        // Générer un code de validation
        const validationCode = generateValidationCode();
        
        // Stocker les données temporairement avec le code
        validationCodes.set(phone, {
            code: validationCode,
            expires: Date.now() + 10 * 60 * 1000, // 10 minutes
            data: { phone, password, fullName, role, location }
        });
        
        // Envoyer le code par SMS
        await SmsService.sendValidationCode(phone, validationCode);
        
        res.status(200).json({
            succes: true,
            message: 'Code de validation envoyé par SMS',
            requiresValidation: true,
            phone: phone
        });
        
    } catch (error) {
        console.error('Erreur inscription:', error);
        res.status(500).json({ erreur: 'Erreur lors de l\'inscription' });
    }
};

// Valider le code SMS et finaliser l'inscription
const validateCode = async (req, res) => {
    try {
        const { phone, code } = req.body;
        
        const pendingData = validationCodes.get(phone);
        
        if (!pendingData) {
            return res.status(400).json({ erreur: 'Aucune inscription en attente pour ce numéro' });
        }
        
        if (pendingData.expires < Date.now()) {
            validationCodes.delete(phone);
            return res.status(400).json({ erreur: 'Le code a expiré. Veuillez réessayer.' });
        }
        
        if (pendingData.code !== code) {
            return res.status(400).json({ erreur: 'Code invalide' });
        }
        
        const { data } = pendingData;
        
        // Créer l'utilisateur
        const user = await User.register(data.phone, data.password, data.fullName, data.role, data.location);
        
        if (data.role === 'farmer') {
            await User.createFarmerProfile(user.id);
        }
        
        // Supprimer les données temporaires
        validationCodes.delete(phone);
        
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
        console.error('Erreur validation code:', error);
        res.status(500).json({ erreur: 'Erreur lors de la validation' });
    }
};

// Renvoyer un nouveau code SMS
const resendCode = async (req, res) => {
    try {
        const { phone } = req.body;
        
        const pendingData = validationCodes.get(phone);
        
        if (!pendingData) {
            return res.status(400).json({ erreur: 'Aucune inscription en attente pour ce numéro' });
        }
        
        const newCode = generateValidationCode();
        
        pendingData.code = newCode;
        pendingData.expires = Date.now() + 10 * 60 * 1000;
        validationCodes.set(phone, pendingData);
        
        await SmsService.sendValidationCode(phone, newCode);
        
        res.json({
            succes: true,
            message: 'Nouveau code envoyé par SMS'
        });
        
    } catch (error) {
        console.error('Erreur renvoi code:', error);
        res.status(500).json({ erreur: 'Erreur lors du renvoi du code' });
    }
};

// Connexion (pas de changement)
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

// EXPORT
module.exports = {
    register,
    validateCode,
    resendCode,
    login,
    getProfile,
    updateProfile
};