// public/js/shop.js

async function loadShop() {
  try {
    // INTEGRATION FIX: Correct endpoint
    const res = await fetch("/api/products");
    const result = await res.json();
    const products = result.data || [];

    // INTEGRATION FIX: Ensure this ID exists in your shop.html
    const grid = document.getElementById("shop-grid"); 

    if (grid) {
      grid.innerHTML = products.map(p => {
        // Use our default image if none exists
        const img = p.imageUrl || 'uploads/products/no-image.jpg';
        
        return `
          <div class="product-card" onclick="window.location.href='product.html?id=${p._id}'">
            <img src="${img}" class="card-img-top" />
            <div class="card-body">
                <h3 class="card-title">${p.itemName}</h3>
                <div style="display:flex; justify-content:space-between;">
                    <span class="card-price">$${p.price}</span>
                    <span class="badge">${p.category}</span>
                </div>
            </div>
          </div>
        `;
      }).join("");
    }
  } catch (err) {
    console.error("Failed to load shop", err);
  }
}

// Check if we are on the shop page before running
if (document.getElementById("shop-grid")) {
    loadShop();
}