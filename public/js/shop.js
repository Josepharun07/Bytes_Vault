// public/js/shop.js

const shopGrid = document.getElementById('shop-grid');
const featuredGrid = document.getElementById('featured-grid');
const searchInput = document.getElementById('search-input');
const authLink = document.getElementById('auth-link');

// 1. Check Login State (Update Navbar)
if (localStorage.getItem('vault_token')) {
    authLink.textContent = 'Logout';
    authLink.href = '#';
    authLink.onclick = () => {
        localStorage.clear();
        window.location.reload();
    };
}

// public/js/shop.js

// ... (Auth check remains the same) ...

async function loadProducts(filters = {}) {
    let url = '/api/products';
    const params = new URLSearchParams();

    // 1. Handle Search
    if (filters.search) {
        params.append('search', filters.search);
    }

    // 2. Handle Category
    // Only append if it's NOT "All" and NOT undefined
    if (filters.category && filters.category !== 'All') {
        params.append('category', filters.category);
    }

    if (params.toString()) url += `?${params.toString()}`;

    // Debugging: Log the URL to check if it's correct
    console.log("Fetching:", url); 

    try {
        const res = await fetch(url);
        const result = await res.json();
        const targetGrid = shopGrid || featuredGrid;
        if (targetGrid) renderGrid(targetGrid, result.data);
    } catch (err) {
        console.error('Error loading products:', err);
    }
}

// ... (renderGrid remains the same) ...

// --- UPDATED: Apply Filters Logic ---
if (shopGrid) {
    loadProducts(); // Load all on start

    // Search on Enter Key
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') applyFilters();
    });

    window.applyFilters = () => {
        const search = searchInput.value;
        
        // Get the selected Radio button
        const selectedCat = document.querySelector('.cat-filter:checked');
        const category = selectedCat ? selectedCat.value : 'All';

        loadProducts({ search, category });
    };
}
// // 2. Fetch & Render Logic
// async function loadProducts(filters = {}) {
//     let url = '/api/products';
    
//     // Construct Query String (e.g., ?search=gpu&category=GPU)
//     const params = new URLSearchParams();
//     if (filters.search) params.append('search', filters.search);
//     if (filters.category) params.append('category', filters.category);

//     if (params.toString()) url += `?${params.toString()}`;

//     try {
//         const res = await fetch(url);
//         const result = await res.json();
        
//         // Decide which grid to render to
//         const targetGrid = shopGrid || featuredGrid;
        
//         if (targetGrid) {
//             renderGrid(targetGrid, result.data);
//         }

//     } catch (err) {
//         console.error('Error loading products:', err);
//     }
// }

// 3. Render HTML Cards
function renderGrid(container, products) {
    container.innerHTML = ''; // Clear existing

    if (products.length === 0) {
        container.innerHTML = '<p>No products found.</p>';
        return;
    }

    products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        // When clicked, go to detail page (We build this next)
        card.onclick = () => window.location.href = `product.html?id=${product._id}`;

        card.innerHTML = `
            <img src="${product.imageUrl}" class="card-img-top" alt="${product.itemName}">
            <div class="card-body">
                <h3 class="card-title">${product.itemName}</h3>
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div class="card-price">$${product.price}</div>
                    <span class="badge">${product.category}</span>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

// 4. Handle Filters (Shop Page Only)
if (shopGrid) {
    // Initial Load
    loadProducts();

    // Search Listener (Debounce can be added later)
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') applyFilters();
    });

    window.applyFilters = () => {
        const search = searchInput.value;
        // Get all checked category boxes
        const checkedCats = Array.from(document.querySelectorAll('.cat-filter:checked'))
            .map(cb => cb.value);
        
        // Note: Backend currently supports single category, 
        // passing the first one for now. logic can be expanded.
        loadProducts({ 
            search, 
            category: checkedCats[0] 
        });
    };
} else if (featuredGrid) {
    // On Homepage, just load everything (or limit to top 4 in backend later)
    loadProducts();
}