// =========================================
// AgriConnect Sénégal — catalogue.js
// =========================================

const API_URL = 'http://localhost:3000/api/v1';

// Vérifier si l'utilisateur est connecté
function checkAuth() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
        window.location.href = 'index.html';
        return null;
    }
    
    return { token, user: JSON.parse(user) };
}

// Afficher le nom de l'utilisateur avec message personnalisé selon l'heure
function displayUserName() {
    const userData = checkAuth();
    if (userData) {
        const userNameSpan = document.getElementById('userNameDisplay');
        
        // Récupérer l'heure actuelle
        const now = new Date();
        const hour = now.getHours();
        
        // Déterminer le message de bienvenue selon l'heure
        let greeting = '';
        if (hour >= 5 && hour < 12) {
            greeting = 'Bonjour';
        } else if (hour >= 12 && hour < 18) {
            greeting = 'Bon après-midi';
        } else {
            greeting = 'Bonsoir';
        }
        
        // Mettre à jour le message
        if (userNameSpan) {
            userNameSpan.innerHTML = `${greeting}, <strong>${userData.user.nomComplet}</strong>`;
        }
    }
}

// Déconnexion
function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = 'index.html';
        });
    }
}

// Redirection vers le tableau de bord
function setupDashboardRedirect() {
    const dashboardBtn = document.getElementById('dashboardBtn');
    if (dashboardBtn) {
        dashboardBtn.addEventListener('click', () => {
            window.location.href = 'dashboard.html';
        });
    }
}

// Charger les produits
async function loadProducts() {
    const productsGrid = document.getElementById('productsGrid');
    
    try {
        const response = await fetch(`${API_URL}/produits`);
        const data = await response.json();
        
        if (data.succes && data.produits) {
            displayProducts(data.produits);
        } else {
            productsGrid.innerHTML = '<p class="empty-message">Aucun produit disponible</p>';
        }
    } catch (error) {
        console.error('Erreur chargement produits:', error);
        productsGrid.innerHTML = '<p class="error-message">Erreur de chargement des produits</p>';
    }
}

// Afficher les produits
function displayProducts(products) {
    const productsGrid = document.getElementById('productsGrid');
    
    if (!products || products.length === 0) {
        productsGrid.innerHTML = '<p class="empty-message">Aucun produit disponible</p>';
        return;
    }
    
    productsGrid.innerHTML = products.map(product => `
        <div class="product-card">
            <div class="product-image">
                ${product.images && product.images[0] ? 
                    `<img src="${product.images[0]}" alt="${product.nom}">` : 
                    '<span>🌾</span>'}
            </div>
            <div class="product-info">
                <h3 class="product-name">${product.nom}</h3>
                <p class="product-farmer">${product.producteur?.nom || 'Producteur'} • ${product.producteur?.localisation || ''}</p>
                <p class="product-price">${product.prix.toLocaleString()} FCFA <small>/${product.unite}</small></p>
                <div class="product-footer">
                    <span class="product-stock">Stock: ${product.quantite} ${product.unite}</span>
                    <button class="btn-add-cart" data-id="${product.id}">Ajouter</button>
                </div>
            </div>
        </div>
    `).join('');
    
    // Ajouter les événements aux boutons
    document.querySelectorAll('.btn-add-cart').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const productId = btn.dataset.id;
            addToCart(productId);
        });
    });
}

// Ajouter au panier
function addToCart(productId) {
    console.log('Produit ajouté:', productId);
    alert('Produit ajouté au panier');
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    displayUserName();
    setupLogout();
    setupDashboardRedirect();
    loadProducts();
});