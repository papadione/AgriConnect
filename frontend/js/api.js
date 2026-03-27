/**
 * API.JS : Gestionnaire central des appels Fetch
 * Évite de répéter l'URL du serveur et gère les tokens de sécurité.
 */
const API_URL = "http://localhost:5000/api";

async function apiCall(endpoint, method = 'GET', body = null) {
    // On récupère le badge de sécurité (Token) stocké dans le navigateur
    const token = localStorage.getItem('token');
    
    // En-têtes standards
    const headers = { 'Content-Type': 'application/json' };
    
    // Si connecté, on envoie le badge au serveur pour prouver notre identité
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const config = { method, headers };
    if (body) config.body = JSON.stringify(body);

    try {
        const response = await fetch(`${API_URL}${endpoint}`, config);
        
        // Sécurité : Si le serveur dit que le token n'est plus bon (401)
        if (response.status === 401) {
            localStorage.clear();
            window.location.href = 'index.html';
            return;
        }

        return await response.json();
    } catch (error) {
        console.error("ERREUR RÉSEAU :", error);
        return { error: "Le serveur AgriConnect est hors ligne." };
    }
}