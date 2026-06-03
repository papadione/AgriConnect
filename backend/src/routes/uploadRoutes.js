const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const authMiddleware = require('../middleware/auth');
const UploadService = require('../services/uploadService'); // ← Utilise ton nom de fichier

const storage = multer.memoryStorage();

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
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: fileFilter
});

router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ erreur: 'Aucune image téléchargée' });
        }
        
        const imageUrl = await UploadService.uploadImage(req.file.buffer, req.file.originalname);
        
        console.log('✅ Image uploadée sur Cloudinary:', imageUrl);
        
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