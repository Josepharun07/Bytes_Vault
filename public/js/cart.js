// public/js/cart.js

const Cart = {
  key: "bytes_vault_cart",

  // 1. Get current cart from Storage
  get() {
    const stored = localStorage.getItem(this.key);
    return stored ? JSON.parse(stored) : [];
  },

  // 2. Add Item
  add(product, qty = 1) {
    const cart = this.get();
    const existing = cart.find((item) => item._id === product._id);

    if (existing) {
      existing.qty += qty;
    } else {
      cart.push({ ...product, qty });
    }

    this.save(cart);
    this.updateBadge();
    alert("Item added to cart!");
  },

  // 3. Remove Item
  remove(id) {
    let cart = this.get();
    cart = cart.filter((item) => item._id !== id);
    this.save(cart);
    this.renderCartPage(); // Refresh UI if on cart page
  },

  // 4. Update Quantity
  updateQty(id, newQty) {
    const cart = this.get();
    const item = cart.find((i) => i._id === id);

    if (item && newQty > 0) {
      item.qty = parseInt(newQty);
      this.save(cart);
      this.renderCartPage();
    }
  },

  // 5. Save to Storage
  save(cart) {
    localStorage.setItem(this.key, JSON.stringify(cart));
    this.updateBadge();
  },

  // 6. Update Navbar Badge
  updateBadge() {
    const cart = this.get();
    const count = cart.reduce((acc, item) => acc + item.qty, 0);
    const badge = document.getElementById("cart-count");
    if (badge) badge.innerText = `(${count})`;
  },

  // 7. Calculate Totals
  getTotals() {
    const cart = this.get();
    const subtotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
    const tax = subtotal * 0.1; // 10% Tax
    return {
      subtotal: subtotal.toFixed(2),
      tax: tax.toFixed(2),
      total: (subtotal + tax).toFixed(2),
    };
  },

  // 8. Render the Cart Page Table
  renderCartPage() {
    const tbody = document.getElementById("cart-body");
    const summaryDiv = document.getElementById("cart-summary");

    if (!tbody) return; // Not on cart page

    const cart = this.get();
    tbody.innerHTML = "";

    if (cart.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="6" style="text-align:center; padding: 2rem;">Your cart is empty. <a href="shop.html">Go Shopping</a></td></tr>';
      if (summaryDiv) summaryDiv.style.display = "none";
      return;
    }

    if (summaryDiv) summaryDiv.style.display = "block";

    cart.forEach((item) => {
      const img = item.imageUrl || "uploads/products/no-image.jpg";
      const total = (item.price * item.qty).toFixed(2);

      const row = document.createElement("tr");
      row.innerHTML = `
                <td>
                    <div class="cart-item">
                        <img src="${img}" alt="${item.itemName}" class="cart-thumb" onerror="this.src='https://placehold.co/80'">
                        <div>
                            <p class="cart-item-name">${item.itemName}</p>
                        </div>
                    </div>
                </td>
                <td>$${item.price}</td>
                <td>
                    <input type="number" value="${item.qty}" min="1" 
                           onchange="Cart.updateQty('${item._id}', this.value)" 
                           class="qty-input">
                </td>
                <td>$${total}</td>
                <td>
                    <button onclick="Cart.remove('${item._id}')" class="btn-danger cart-remove">&times;</button>
                </td>
            `;
      tbody.appendChild(row);
    });

    // Update Summary Box
    const totals = this.getTotals();
    document.getElementById("subtotal").innerText = `$${totals.subtotal}`;
    document.getElementById("tax").innerText = `$${totals.tax}`;
    document.getElementById("grand-total").innerText = `$${totals.total}`;
  },
};

// Initialize Badge on Load
document.addEventListener("DOMContentLoaded", () => {
  Cart.updateBadge();
  Cart.renderCartPage();
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.clear();
      window.location.href = "index.html";
    });
  }
});
