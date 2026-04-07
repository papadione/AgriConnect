// =========================================
// AgriConnect Sénégal — admin.js
// =========================================

const API_URL = 'http://localhost:3000/api/v1';

// Vérifier si l'utilisateur est admin
function checkAdminAuth() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
        window.location.href = 'index.html';
        return null;
    }
    
    const userData = JSON.parse(user);
    if (userData.role !== 'administrateur') {
        alert('Accès réservé aux administrateurs');
        window.location.href = 'index.html';
        return null;
    }
    
    const adminInfo = document.getElementById('adminInfo');
    if (adminInfo) {
        adminInfo.innerHTML = `<strong>${userData.nomComplet}</strong> (Administrateur)`;
    }
    
    return { token, user: userData };
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

// Gestion des onglets
function setupTabs() {
    const tabs = document.querySelectorAll('.admin-tab');
    const contents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tab;
            
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.style.display = 'none');
            
            tab.classList.add('active');
            const activeContent = document.getElementById(`tab-${target}`);
            if (activeContent) activeContent.style.display = 'block';
            
            // Recharger les données selon l'onglet
            if (target === 'dashboard') loadStats();
            if (target === 'users') loadUsers();
            if (target === 'products') loadProducts();
            if (target === 'orders') loadOrders();
        });
    });
}

// ================= STATISTIQUES =================
async function loadStats() {
    const { token } = checkAdminAuth();
    if (!token) return;
    
    try {
        const response = await fetch(`${API_URL}/admin/statistiques`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        
        if (data.succes) {
            const elements = {
                totalUsers: data.statistiques.total_users || 0,
                totalFarmers: data.statistiques.total_farmers || 0,
                totalBuyers: data.statistiques.total_buyers || 0,
                totalWholesalers: data.statistiques.total_wholesalers || 0,
                totalProducts: data.statistiques.total_products || 0,
                totalOrders: data.statistiques.total_orders || 0,
                totalRevenue: (data.statistiques.total_revenue || 0).toLocaleString() + ' FCFA'
            };
            
            for (const [id, value] of Object.entries(elements)) {
                const element = document.getElementById(id);
                if (element) element.textContent = value;
            }
        }
    } catch (error) {
        console.error('Erreur chargement stats:', error);
    }
}

// ================= UTILISATEURS =================
async function loadUsers() {
    const { token } = checkAdminAuth();
    if (!token) return;
    
    try {
        const response = await fetch(`${API_URL}/admin/utilisateurs`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        
        if (data.succes && data.utilisateurs) {
            displayUsers(data.utilisateurs);
        }
    } catch (error) {
        console.error('Erreur chargement utilisateurs:', error);
    }
}

function displayUsers(users) {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;
    
    const searchTerm = document.getElementById('searchUser')?.value.toLowerCase() || '';
    
    const filteredUsers = users.filter(user => 
        user.full_name.toLowerCase().includes(searchTerm) || 
        user.phone.includes(searchTerm)
    );
    
    if (filteredUsers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7">Aucun utilisateur trouvé</td></tr>';
        return;
    }
    
    tbody.innerHTML = filteredUsers.map(user => {
        let roleClass = '';
        let roleText = '';
        switch(user.role) {
            case 'admin': roleClass = 'badge-admin'; roleText = 'Admin'; break;
            case 'farmer': roleClass = 'badge-farmer'; roleText = 'Agriculteur'; break;
            case 'buyer': roleClass = 'badge-buyer'; roleText = 'Acheteur'; break;
            case 'wholesaler': roleClass = 'badge-wholesaler'; roleText = 'Grossiste'; break;
            default: roleClass = 'badge-buyer'; roleText = user.role;
        }
        
        return `
            <tr>
                <td>${user.id}</td>
                <td>${user.full_name}</td>
                <td>${user.phone}</td>
                <td><span class="badge ${roleClass}">${roleText}</span></td>
                <td>${user.location || '-'}</td>
                <td>${user.is_active ? '✅ Actif' : '❌ Inactif'}</td>
                <td>
                    <button class="action-btn edit" onclick="editUser(${user.id})">✏️</button>
                    <button class="action-btn delete" onclick="deleteUser(${user.id})">🗑️</button>
                </td>
            </tr>
        `;
    }).join('');
}

async function deleteUser(userId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.')) return;
    
    const { token } = checkAdminAuth();
    if (!token) return;
    
    try {
        const response = await fetch(`${API_URL}/admin/utilisateurs/${userId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('✅ Utilisateur supprimé avec succès');
            loadUsers();
            loadStats();
        } else {
            alert('❌ ' + (data.erreur || 'Erreur lors de la suppression'));
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert('❌ Erreur de connexion au serveur');
    }
}

function editUser(userId) {
    alert(`Modification de l'utilisateur ${userId} - Fonctionnalité à venir`);
}

// ================= PRODUITS =================
async function loadProducts() {
    const { token } = checkAdminAuth();
    if (!token) return;
    
    const tbody = document.getElementById('productsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="7">Chargement...</td></tr>';
    
    try {
        const response = await fetch(`${API_URL}/admin/produits`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        
        if (data.succes && data.produits) {
            displayProducts(data.produits);
        } else {
            tbody.innerHTML = '<tr><td colspan="7">Aucun produit trouvé</td></tr>';
        }
    } catch (error) {
        console.error('Erreur chargement produits:', error);
        tbody.innerHTML = '<tr><td colspan="7">Erreur de chargement</td></tr>';
    }
}

function displayProducts(products) {
    const tbody = document.getElementById('productsTableBody');
    if (!tbody) return;
    
    const searchTerm = document.getElementById('searchProduct')?.value.toLowerCase() || '';
    
    const filteredProducts = products.filter(product => 
        (product.nom || product.name || '').toLowerCase().includes(searchTerm)
    );
    
    if (filteredProducts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7">Aucun produit trouvé</td></tr>';
        return;
    }
    
    tbody.innerHTML = filteredProducts.map(product => {
        const nom = product.nom || product.name || 'Sans nom';
        const farmerName = product.farmer_name || '-';
        const prix = product.prix || 0;
        const quantite = product.quantite || 0;
        const unite = product.unite || 'kg';
        const disponible = product.disponible !== undefined ? product.disponible : true;
        
        const statusClass = disponible ? 'badge-delivered' : 'badge-cancelled';
        const statusText = disponible ? 'Disponible' : 'Indisponible';
        
        return `
            <tr>
                <td>${product.id}</td>
                <td>${nom}</td>
                <td>${farmerName}</td>
                <td>${prix.toLocaleString()} FCFA</td>
                <td>${quantite} ${unite}</td>
                <td><span class="badge ${statusClass}">${statusText}</span></td>
                <td>
                    <button class="action-btn edit" onclick="editProduct(${product.id})">✏️</button>
                    <button class="action-btn delete" onclick="deleteProduct(${product.id})">🗑️</button>
                </td>
            </tr>
        `;
    }).join('');
}

async function deleteProduct(productId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) return;
    
    const { token } = checkAdminAuth();
    if (!token) return;
    
    try {
        const response = await fetch(`${API_URL}/admin/produits/${productId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('✅ Produit supprimé avec succès');
            loadProducts();
            loadStats();
        } else {
            alert('❌ ' + (data.erreur || 'Erreur lors de la suppression'));
        }
    } catch (error) {
        console.error('Erreur:', error);
        alert('❌ Erreur de connexion au serveur');
    }
}

function editProduct(productId) {
    alert(`Modification du produit ${productId} - Fonctionnalité à venir`);
}

// ================= COMMANDES =================
async function loadOrders() {
    const { token } = checkAdminAuth();
    if (!token) return;
    
    const tbody = document.getElementById('ordersTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="8">Chargement...</td></tr>';
    
    try {
        const response = await fetch(`${API_URL}/admin/commandes`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        
        if (data.succes && data.commandes) {
            displayOrders(data.commandes);
        } else {
            tbody.innerHTML = '<tr><td colspan="8">Aucune commande trouvée</td></tr>';
        }
    } catch (error) {
        console.error('Erreur chargement commandes:', error);
        tbody.innerHTML = '<tr><td colspan="8">Erreur de chargement</td></tr>';
    }
}

function displayOrders(orders) {
    const tbody = document.getElementById('ordersTableBody');
    if (!tbody) return;
    
    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8">Aucune commande trouvée</td></tr>';
        return;
    }
    
    tbody.innerHTML = orders.map(order => {
        let statusClass = '';
        let statusText = '';
        switch(order.status) {
            case 'pending': statusClass = 'badge-pending'; statusText = 'En attente'; break;
            case 'confirmed': statusClass = 'badge-confirmed'; statusText = 'Confirmée'; break;
            case 'preparing': statusClass = 'badge-preparing'; statusText = 'Préparation'; break;
            case 'shipped': statusClass = 'badge-shipped'; statusText = 'Expédiée'; break;
            case 'delivered': statusClass = 'badge-delivered'; statusText = 'Livrée'; break;
            case 'cancelled': statusClass = 'badge-cancelled'; statusText = 'Annulée'; break;
            default: statusClass = 'badge-pending'; statusText = order.status;
        }
        
        return `
            <tr>
                <td>${order.id}</td>
                <td>${order.order_number}</td>
                <td>${order.buyer_name || '-'}</td>
                <td>${order.farmer_name || '-'}</td>
                <td>${Math.floor(order.total_amount).toLocaleString()} FCFA</td>
                <td><span class="badge ${statusClass}">${statusText}</span></td>
                <td>${new Date(order.created_at).toLocaleDateString('fr-FR')}</td>
                <td>
                    <button class="action-btn edit" onclick="editOrder(${order.id})">✏️</button>
                </td>
            </tr>
        `;
    }).join('');
}

function editOrder(orderId) {
    alert(`Modification de la commande ${orderId} - Fonctionnalité à venir`);
}

// Recherches
document.addEventListener('DOMContentLoaded', () => {
    const searchUser = document.getElementById('searchUser');
    if (searchUser) {
        searchUser.addEventListener('input', () => loadUsers());
    }
    
    const searchProduct = document.getElementById('searchProduct');
    if (searchProduct) {
        searchProduct.addEventListener('input', () => loadProducts());
    }
});

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    checkAdminAuth();
    setupLogout();
    setupTabs();
    loadStats();
    loadUsers();
});