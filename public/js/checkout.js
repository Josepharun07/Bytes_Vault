// public/js/checkout.js

// 1. Security Check
const token = localStorage.getItem('vault_token');
if (!token) {
    alert('Please login to checkout.');
    window.location.href = 'login.html';
}

// 2. Load Cart Data into Summary
const cartItems = Cart.get();
if (cartItems.length === 0) {
    alert('Cart is empty');
    window.location.href = 'shop.html';
}

const list = document.getElementById('order-items');
cartItems.forEach(item => {
    const li = document.createElement('li');
    li.innerHTML = `
        <div style="display:flex; justify-content:space-between; margin-bottom: 0.5rem;">
            <span>${item.qty}x ${item.itemName}</span>
            <span>$${(item.price * item.qty).toFixed(2)}</span>
        </div>
    `;
    list.appendChild(li);
});

// Calculate Totals
const totals = Cart.getTotals();
document.getElementById('checkout-total').innerText = `$${totals.total}`;

// 3. Handle Submit
document.getElementById('checkout-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const shippingAddress = {
        fullName: document.getElementById('fullName').value,
        address: document.getElementById('address').value,
        city: document.getElementById('city').value,
        zip: document.getElementById('zip').value,
        country: "India" // Default for now
    };

    try {
        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({
                cartItems: cartItems,
                shippingAddress: shippingAddress
            })
        });

        const result = await response.json();

        if (result.success) {
            alert('Order Placed Successfully! Order ID: ' + result.order._id);
            localStorage.removeItem(Cart.key); // Clear Cart
            window.location.href = 'shop.html'; // Or 'profile.html' later
        } else {
            alert('Error: ' + result.message);
        }

    } catch (err) {
        console.error(err);
        alert('Transaction Failed');
    }
});