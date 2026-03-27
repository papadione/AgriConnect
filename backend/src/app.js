// Point d'entrée principal de l'API
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const { port } = require('./config/env');

const app = express();

// Middlewares globaux
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir les fichiers statiques (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/produits', productRoutes);
app.use('/api/v1/commandes', orderRoutes);
app.use('/api/v1/upload', uploadRoutes);

// Route de santé
app.get('/api/v1/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'AgriConnect API fonctionne',
        timestamp: new Date().toISOString()
    });
});

// Route 404
app.use((req, res) => {
    res.status(404).json({ error: 'Route non trouvée' });
});

// Middleware d'erreur global
app.use((err, req, res, next) => {
    console.error('Erreur serveur:', err);
    res.status(500).json({ error: 'Erreur interne du serveur' });
});

// Démarrage du serveur
app.listen(port, () => {
    console.log(`🚀 Serveur démarré sur http://localhost:${port}`);
    console.log(`📝 Environnement: ${process.env.NODE_ENV}`);
    console.log(`✅ API disponible: http://localhost:${port}/api/v1`);
});

module.exports = app;