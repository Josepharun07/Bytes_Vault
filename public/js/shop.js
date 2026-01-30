// public/js/shop.js

// --- 1. GLOBAL NAVIGATION LOGIC ---
const authLink = document.getElementById('auth-link');
const token = localStorage.getItem('vault_token');
const role = localStorage.getItem('vault_role');

if (authLink && token) {
    if (role === 'admin') {
        authLink.textContent = 'Admin Panel';
        authLink.href = 'dashboard.html';
    } else {
        authLink.textContent = 'My Profile';
        authLink.href = 'profile.html';
    }
    authLink.onclick = null;
}

// --- 2. DOM ELEMENTS ---
const shopGrid = document.getElementById('shop-grid');
const featuredGrid = document.getElementById('featured-grid');
const searchInput = document.getElementById('search-input');

// --- 3. FETCH PRODUCTS ---
async function loadProducts(filters = {}) {
    let url = '/api/products';
    const params = new URLSearchParams();

    if (filters.search) params.append('search', filters.search);
    if (filters.category && filters.category !== 'All') params.append('category', filters.category);

    if (params.toString()) url += `?${params.toString()}`;

    try {
        const res = await fetch(url);
        const result = await res.json();
        
        const targetGrid = shopGrid || featuredGrid;
        if (targetGrid) {
            renderGrid(targetGrid, result.data || []);
        }
    } catch (err) {
        console.error('Error loading products:', err);
    }
}

// --- 4. RENDER CARDS (DYNAMIC) ---
function renderGrid(container, products) {
    container.innerHTML = ''; 

    if (!products || products.length === 0) {
        container.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color: #64748b;">No products found in the Vault.</p>';
        return;
    }

    products.forEach(p => {
        // FIX: Robust Image Selection Logic
        let img = 'https://placehold.co/600x400?text=No+Image'; // Fallback

        // 1. Check the new Array format (Priority)
        if (p.images && p.images.length > 0) {
            img = p.images[0];
        } 
        // 2. Check legacy field, but IGNORE the known broken string
        else if (p.imageUrl && p.imageUrl !== 'uploads/products/no-image.jpg') {
            img = p.imageUrl;
        }

        // 3. Fix Local Pathing (Add leading slash if missing)
        if (!img.startsWith('http') && !img.startsWith('/')) {
            img = '/' + img;
        }
        
        // Stock Logic for Badge
        let badgeHtml = '';
        let opacityStyle = '';

        if (p.stockCount === 0) {
            badgeHtml = '<span class="badge" style="background:#fee2e2; color:#991b1b; position:absolute; top:10px; right:10px;">Out of Stock</span>';
            opacityStyle = 'opacity: 0.7;';
        } else if (p.stockCount < 5) {
            badgeHtml = `<span class="badge" style="background:#fef3c7; color:#92400e; position:absolute; top:10px; right:10px;">Low Stock: ${p.stockCount}</span>`;
        }

        const card = document.createElement('div');
        card.className = 'product-card';
        card.style = `position: relative; ${opacityStyle}`;
        card.setAttribute('onclick', `window.location.href='product.html?id=${p._id}'`);
        
        card.innerHTML = `
            ${badgeHtml}
            <img src="${img}" class="card-img-top" alt="${p.itemName}" onerror="this.src='https://placehold.co/600x400?text=Image+Error'">
            <div class="card-body">
                <h3 class="card-title">${p.itemName}</h3>
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span class="card-price">$${p.price}</span>
                    <span class="badge" style="background:#f1f5f9; border:1px solid #e2e8f0;">${p.category}</span>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

// --- 5. INITIALIZE ---
if (shopGrid || featuredGrid) {
    loadProducts();
}

// --- 6. EVENT LISTENERS ---
window.applyFilters = () => {
    const search = document.getElementById('search-input').value;
    const selectedCat = document.querySelector('.cat-filter:checked');
    const category = selectedCat ? selectedCat.value : 'All';
    loadProducts({ search, category });
};

// Listen for "Enter" in search
if (searchInput) {
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') applyFilters();
    });
}