document.addEventListener('DOMContentLoaded', async () => {
    const productGrid = document.getElementById('product-list');
    const products = await apiCall('/products');

    if (products.error) {
        productGrid.innerHTML = `<p>${products.error}</p>`;
        return;
    }

    productGrid.innerHTML = products.map(p => `
        <div class="product-card">
            <span class="category-badge">${p.category}</span>
            <h3>${p.name}</h3>
            <p class="product-price"><strong>${p.price} FCFA</strong> / ${p.unit}</p>
            <p class="product-origin">📍 ${p.region}</p>
            <button class="btn-details">Voir détails</button>
        </div>
    `).join('');
});