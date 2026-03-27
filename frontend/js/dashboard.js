// =========================================
// AgriConnect Sénégal — dashboard.js
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

// Afficher les informations du profil
function displayProfile() {
    const userData = checkAuth();
    if (userData) {
        const user = userData.user;
        
        // Récupérer l'heure pour le message de bienvenue
        const now = new Date();
        const hour = now.getHours();
        
        let greeting = '';
        if (hour >= 5 && hour < 12) {
            greeting = 'Bonjour';
        } else if (hour >= 12 && hour < 18) {
            greeting = 'Bon après-midi';
        } else {
            greeting = 'Bonsoir';
        }
        
        // Mettre à jour le nom
        const profileName = document.getElementById('profileName');
        if (profileName) {
            profileName.textContent = user.nomComplet;
        }
        
        // Mettre à jour le rôle
        const profileRole = document.getElementById('profileRole');
        if (profileRole) {
            profileRole.textContent = user.role === 'agriculteur' ? 'Agriculteur' : 'Acheteur';
        }
        
        // Mettre à jour la localisation
        const profileLocation = document.getElementById('profileLocation');
        if (profileLocation) {
            profileLocation.textContent = `${user.localisation}, Sénégal`;
        }
        
        // Mettre à jour le titre de la page
        document.title = `AgriConnect — ${user.nomComplet}`;
        
        // Afficher ou cacher l'onglet "Mes produits" selon le rôle
        const farmerTab = document.getElementById('farmerTab');
        if (farmerTab) {
            if (user.role !== 'agriculteur') {
                farmerTab.style.display = 'none';
            } else {
                farmerTab.style.display = 'block';
            }
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

// Redirection vers le catalogue
function setupCatalogueRedirect() {
    const catalogueBtn = document.getElementById('catalogueBtn');
    if (catalogueBtn) {
        catalogueBtn.addEventListener('click', () => {
            window.location.href = 'catalogue.html';
        });
    }
}

// Gestion des onglets
function setupTabs() {
    const tabs = document.querySelectorAll('.tab-dash');
    const panes = document.querySelectorAll('.tab-pane');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tab;
            
            tabs.forEach(t => t.classList.remove('active'));
            panes.forEach(p => p.classList.remove('active'));
            
            tab.classList.add('active');
            document.getElementById(`${target}Pane`)?.classList.add('active');
        });
    });
}

// Charger les commandes
async function loadOrders() {
    const token = localStorage.getItem('token');
    const userData = checkAuth();
    
    if (!userData) return;
    
    const ordersList = document.getElementById('ordersList');
    if (!ordersList) return;
    
    try {
        const response = await fetch(`${API_URL}/commandes/mes-commandes`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.succes && data.commandes && data.commandes.length > 0) {
            displayOrders(data.commandes);
        } else {
            ordersList.innerHTML = '<p class="empty-message">Aucune commande pour le moment</p>';
        }
    } catch (error) {
        console.error('Erreur chargement commandes:', error);
        ordersList.innerHTML = '<p class="error-message">Erreur de chargement des commandes</p>';
    }
}

// Afficher les commandes
function displayOrders(orders) {
    const ordersList = document.getElementById('ordersList');
    
    ordersList.innerHTML = orders.map(order => `
        <div class="order-card">
            <div class="order-header">
                <span class="order-number">${order.order_number}</span>
                <span class="order-status ${order.status}">${getStatusText(order.status)}</span>
            </div>
            <div class="order-info">
                <p>Date: ${new Date(order.created_at).toLocaleDateString('fr-FR')}</p>
                <p>Total: ${order.total_amount.toLocaleString()} FCFA</p>
            </div>
            <div class="order-total">
                <strong>${order.total_amount.toLocaleString()} FCFA</strong>
            </div>
        </div>
    `).join('');
}

// Traduire le statut en français
function getStatusText(status) {
    const statusMap = {
        'pending': 'En attente',
        'confirmed': 'Confirmée',
        'preparing': 'En préparation',
        'shipped': 'Expédiée',
        'delivered': 'Livrée',
        'cancelled': 'Annulée'
    };
    return statusMap[status] || status;
}

// Charger les produits (pour les agriculteurs)
async function loadProducts() {
    const token = localStorage.getItem('token');
    const userData = checkAuth();
    
    if (!userData || userData.user.role !== 'agriculteur') return;
    
    const productsList = document.getElementById('productsList');
    if (!productsList) return;
    
    try {
        const response = await fetch(`${API_URL}/produits/mes-produits`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.succes && data.produits && data.produits.length > 0) {
            displayProducts(data.produits);
        } else {
            productsList.innerHTML = '<p class="empty-message">Vous n\'avez pas encore de produits</p>';
        }
    } catch (error) {
        console.error('Erreur chargement produits:', error);
        productsList.innerHTML = '<p class="error-message">Erreur de chargement des produits</p>';
    }
}

// Afficher les produits
function displayProducts(products) {
    const productsList = document.getElementById('productsList');
    
    productsList.innerHTML = products.map(product => `
        <div class="product-item">
            <div class="product-item-info">
                <h4>${product.nom}</h4>
                <p>${product.prix.toLocaleString()} FCFA / ${product.unite} • Stock: ${product.quantite}</p>
            </div>
            <div class="product-item-actions">
                <button class="btn-edit" data-id="${product.id}">Modifier</button>
                <button class="btn-delete" data-id="${product.id}">Supprimer</button>
            </div>
        </div>
    `).join('');
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    displayProfile();
    setupLogout();
    setupCatalogueRedirect();
    setupTabs();
    loadOrders();
    loadProducts();
});