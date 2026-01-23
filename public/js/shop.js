// public/js/shop.js

// --- 1. GLOBAL NAVIGATION LOGIC (Runs on every page) ---
const authLink = document.getElementById('auth-link');
const token = localStorage.getItem('vault_token');
const role = localStorage.getItem('vault_role');

if (authLink && token) {
    // User is logged in
    if (role === 'admin') {
        authLink.textContent = 'Admin Panel';
        authLink.href = 'dashboard.html';
    } else {
        authLink.textContent = 'My Profile'; // Link to customer history
        authLink.href = 'profile.html';
    }
    // Remove any previous onclick events to ensure the link works
    authLink.onclick = null;
}

// --- 2. DOM ELEMENTS ---
const shopGrid = document.getElementById('shop-grid');
const featuredGrid = document.getElementById('featured-grid');
const searchInput = document.getElementById('search-input');

// --- 3. CORE LOGIC: FETCH PRODUCTS ---
async function loadProducts(filters = {}) {
    let url = '/api/products';
    const params = new URLSearchParams();

    // Handle Filters
    if (filters.search) {
        params.append('search', filters.search);
    }
    if (filters.category && filters.category !== 'All') {
        params.append('category', filters.category);
    }

    // Append query string
    if (params.toString()) url += `?${params.toString()}`;

    try {
        const res = await fetch(url);
        const result = await res.json();
        
        // Determine which grid is on the current page
        const targetGrid = shopGrid || featuredGrid;
        
        if (targetGrid) {
            renderGrid(targetGrid, result.data || []);
        }

    } catch (err) {
        console.error('Error loading products:', err);
    }
}

// --- 4. RENDER LOGIC: CREATE CARDS ---
function renderGrid(container, products) {
    container.innerHTML = ''; // Clear previous results

    if (!products || products.length === 0) {
        container.innerHTML = '<p style="grid-column: 1/-1; text-align:center;">No products found.</p>';
        return;
    }

    products.forEach(p => {
        // Fallback image if missing
        const img = p.imageUrl || 'uploads/products/no-image.jpg';
        
        const card = document.createElement('div');
        card.className = 'product-card';
        // Make the whole card clickable
        card.onclick = () => window.location.href = `product.html?id=${p._id}`;
        
        card.innerHTML = `
            <img src="${img}" class="card-img-top" alt="${p.itemName}" onerror="this.src='https://placehold.co/200'">
            <div class="card-body">
                <h3 class="card-title">${p.itemName}</h3>
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span class="card-price">$${p.price}</span>
                    <span class="badge">${p.category}</span>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

// --- 5. INITIALIZATION ---
// Only run load logic if a grid exists on this page
if (shopGrid || featuredGrid) {
    loadProducts();
}

// --- 6. EVENT LISTENERS (Search & Filter) ---
// These only exist on the Shop page, so we check if searchInput exists first
if (searchInput) {
    // Allow pressing "Enter" in search box
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') applyFilters();
    });

    // Global function called by the "Apply Filters" button in HTML
    window.applyFilters = () => {
        const search = searchInput.value;
        
        // Get the selected Radio button value
        const selectedCat = document.querySelector('.cat-filter:checked');
        const category = selectedCat ? selectedCat.value : 'All';

        loadProducts({ search, category });
    };
}
