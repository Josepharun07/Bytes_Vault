// public/js/pos.js

// 1. Security Check
const token = localStorage.getItem('vault_token');
const role = localStorage.getItem('vault_role');

if (!token || (role !== 'staff' && role !== 'admin')) {
    window.location.href = 'login.html';
}

// 2. Logout
document.getElementById('logout-btn').onclick = () => {
    localStorage.clear();
    window.location.href = 'login.html';
};

// 3. Shared Variables
const posGrid = document.getElementById('pos-grid');
const cartTable = document.getElementById('pos-cart-body');
let currentCart = []; // In-memory cart for POS (faster than localStorage)

// 4. Load Products
async function loadPosProducts() {
    try {
        const res = await fetch('/api/products');
        const result = await res.json();
        renderPosGrid(result.data || []);
    } catch (err) {
        console.error(err);
    }
}

// 5. Render Grid
function renderPosGrid(products) {
    posGrid.innerHTML = '';
    products.forEach(p => {
        let img = p.images?.[0] || p.imageUrl || 'https://placehold.co/100';
        if (!img.startsWith('http') && !img.startsWith('/')) img = '/' + img;

        const card = document.createElement('div');
        card.className = 'product-card small-card';
        card.onclick = () => addToPosCart(p);
        
        card.innerHTML = `
            <div style="position:relative;">
                <img src="${img}" style="width:100%; height:120px; object-fit:cover;">
                <span class="badge" style="position:absolute; top:5px; right:5px; background:rgba(0,0,0,0.7); color:white;">${p.stockCount}</span>
            </div>
            <div style="padding:0.8rem;">
                <h4 style="font-size:0.9rem; margin-bottom:5px;">${p.itemName}</h4>
                <div style="font-weight:bold; color:var(--primary);">$${p.price}</div>
            </div>
        `;
        posGrid.appendChild(card);
    });
}

// 6. Cart Logic
function addToPosCart(product) {
    if(product.stockCount <= 0) return alert('Out of stock');
    
    const existing = currentCart.find(i => i._id === product._id);
    if(existing) {
        if(existing.qty < product.stockCount) existing.qty++;
    } else {
        currentCart.push({ ...product, qty: 1 });
    }
    renderPosCart();
}

function removeFromCart(id) {
    currentCart = currentCart.filter(i => i._id !== id);
    renderPosCart();
}

function renderPosCart() {
    cartTable.innerHTML = '';
    let subtotal = 0;

    currentCart.forEach(item => {
        subtotal += item.price * item.qty;
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.itemName}</td>
            <td>x${item.qty}</td>
            <td>$${(item.price * item.qty).toFixed(2)}</td>
            <td><button onclick="removeFromCart('${item._id}')" style="color:red; background:none; border:none; cursor:pointer;">&times;</button></td>
        `;
        cartTable.appendChild(row);
    });

    const tax = subtotal * 0.1;
    const total = subtotal + tax;

    document.getElementById('pos-subtotal').innerText = `$${subtotal.toFixed(2)}`;
    document.getElementById('pos-tax').innerText = `$${tax.toFixed(2)}`;
    document.getElementById('pos-total').innerText = `$${total.toFixed(2)}`;
    
    // Enable/Disable Checkout Button
    document.getElementById('btn-checkout').disabled = currentCart.length === 0;
}

// 7. Checkout Logic
document.getElementById('btn-checkout').addEventListener('click', async () => {
    if(currentCart.length === 0) return;

    // Capture Inputs
    const custName = document.getElementById('pos-cust-name').value.trim() || 'Walk-in Customer';
    const custEmail = document.getElementById('pos-cust-email').value.trim();

    const btn = document.getElementById('btn-checkout');
    btn.disabled = true;
    btn.innerText = 'Processing...';

    const payload = {
        cartItems: currentCart,
        source: 'POS', 
        // Send the specific buyer details
        buyerDetails: {
            name: custName,
            email: custEmail
        },
        // Shipping address is less relevant for POS, but required by schema
        shippingAddress: {
            fullName: custName,
            address: 'In-Store Pickup',
            city: 'Local',
            zip: '00000'
        }
    };

    try {
        const res = await fetch('/api/orders', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (data.success) {
            alert(`Sale Complete!\nOrder ID: ${data.order._id}\nStaff: ${data.order.staffName || 'You'}`); // Optional feedback
            
            // Reset Cart & Inputs
            currentCart = [];
            document.getElementById('pos-cust-name').value = '';
            document.getElementById('pos-cust-email').value = '';
            renderPosCart();
            loadPosProducts(); 
        } else {
            alert('Error: ' + data.message);
        }
    } catch (err) {
        console.error(err);
        alert('Network Error');
    } finally {
        btn.disabled = false;
        btn.innerText = 'Complete Sale';
    }
});

// Init
loadPosProducts();