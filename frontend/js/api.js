// =========================================
// AgriConnect Sénégal — api.js
// =========================================

// Fonction pour faire des requêtes authentifiées
async function apiRequest(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`http://localhost:3000/api/v1${endpoint}`, {
        ...options,
        headers
    });
    
    return await response.json();
}

// Récupérer tous les produits
async function getProducts(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    const url = `/produits${params ? `?${params}` : ''}`;
    return await apiRequest(url);
}

// Récupérer un produit par ID
async function getProductById(id) {
    return await apiRequest(`/produits/${id}`);
}

// Récupérer les produits de l'agriculteur connecté
async function getMyProducts() {
    return await apiRequest('/produits/mes-produits');
}

// Créer un produit
async function createProduct(productData) {
    return await apiRequest('/produits', {
        method: 'POST',
        body: JSON.stringify(productData)
    });
}

// Modifier un produit
async function updateProduct(id, productData) {
    return await apiRequest(`/produits/${id}`, {
        method: 'PUT',
        body: JSON.stringify(productData)
    });
}

// Supprimer un produit
async function deleteProduct(id) {
    return await apiRequest(`/produits/${id}`, {
        method: 'DELETE'
    });
}

// Activer/Désactiver un produit
async function toggleProductStatus(id, isAvailable) {
    return await apiRequest(`/produits/${id}/statut`, {
        method: 'PATCH',
        body: JSON.stringify({ isAvailable })
    });
}

// Upload d'image
async function uploadImage(file) {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await fetch(`http://localhost:3000/api/v1/upload`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData
    });
    
    return await response.json();
}