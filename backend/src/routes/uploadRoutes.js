const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const authMiddleware = require('../middleware/auth');

// Configuration de multer pour sauvegarder les images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../../uploads/'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
        cb(null, true);
    } else {
        cb(new Error('Seules les images sont autorisées'));
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
    fileFilter: fileFilter
});

// Route d'upload (protégée)
router.post('/', authMiddleware, upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ erreur: 'Aucune image téléchargée' });
        }
        
        const imageUrl = `/uploads/${req.file.filename}`;
        
        console.log('✅ Image uploadée:', imageUrl);
        
        res.json({
            succes: true,
            url: imageUrl
        });
    } catch (error) {
        console.error('Erreur upload:', error);
        res.status(500).json({ erreur: 'Erreur lors de l\'upload' });
    }
});

module.exports = router;