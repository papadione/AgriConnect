/**
 * APP.JS : Configuration globale d'Express
 * Ce fichier centralise les middlewares et les routes.
 */
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// --- 1. MIDDLEWARES GLOBAUX ---
app.use(cors()); 
app.use(express.json()); 

console.log("------------------------------------------");
console.log("🔍 DIAGNOSTIC DES CHARGEMENTS :");

// --- 2. CHARGEMENT DES ROUTES (AVEC TRACEUR) ---

try {
    console.log("1/2 Tentative d'import de AUTH ROUTES...");
    const authRoutes = require('./routes/auth.routes');
    app.use('/api/auth', authRoutes);
    console.log("✅ AUTH ROUTES : Chargé avec succès.");
} catch (error) {
    console.error("❌ ERREUR dans 'auth.routes.js' ou son contrôleur :");
    console.error(error.message);
}

try {
    console.log("2/2 Tentative d'import de PRODUCT ROUTES...");
    const productRoutes = require('./routes/product.routes');
    app.use('/api/products', productRoutes);
    console.log("✅ PRODUCT ROUTES : Chargé avec succès.");
} catch (error) {
    console.error("❌ ERREUR dans 'product.routes.js' ou son contrôleur :");
    console.error(error.message);
}

console.log("------------------------------------------");

// --- 3. EXPORTATION ---
module.exports = app;