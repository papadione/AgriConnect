/**
 * SERVER.JS : Point d'entrée de l'application Node.js
 * Ce fichier initialise les variables d'environnement et lance le serveur.
 */
require('dotenv').config(); // Charge les secrets du fichier .env (DB_PASS, JWT_SECRET)
const app = require('./src/app'); // Importe la configuration Express depuis src/app.js

const PORT = process.env.PORT || 5000;

// Lancement de l'écoute sur le port spécifié
app.listen(PORT, () => {
    console.log(`-----------------------------------------`);
    console.log(`🚀 AGRI-CONNECT BACKEND DÉMARRÉ`);
    console.log(`📍 URL : http://localhost:${PORT}`);
    console.log(`-----------------------------------------`);
});