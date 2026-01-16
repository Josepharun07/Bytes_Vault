// public/js/profile.js

// 1. Security Check
const token = localStorage.getItem('vault_token');
if (!token) {
    window.location.href = 'login.html';
}

// 2. Logout Logic
document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.clear();
    window.location.href = 'index.html';
});

// 3. Load Profile Data
async function loadProfile() {
    try {
        // Fetch Orders
        const res = await fetch('/api/orders/myorders', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const result = await res.json();

        // Update Name (We try to get it from the first order or localstorage if saved)
        // ideally we would have a /api/auth/me endpoint, but we can infer or leave generic
        // document.getElementById('user-name').innerText = 'Customer'; 

        const tbody = document.getElementById('order-history-body');
        tbody.innerHTML = '';

        if (result.data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:1rem;">No orders yet. <a href="shop.html">Go Shop!</a></td></tr>';
            return;
        }

        result.data.forEach(order => {
            const date = new Date(order.createdAt).toLocaleDateString();
            
            // Format Items list (e.g., "2x GPU, 1x Mouse")
            const itemsSummary = order.items.map(i => `${i.qty}x ${i.itemName}`).join(', ');

            // Status Color Logic
            let statusColor = 'orange'; // Pending
            if (order.status === 'Shipped') statusColor = 'blue';
            if (order.status === 'Delivered') statusColor = 'green';
            if (order.status === 'Cancelled') statusColor = 'red';

            const row = document.createElement('tr');
            row.innerHTML = `
                <td style="font-family:monospace; color:#666;">#${order._id.slice(-6)}</td>
                <td>${date}</td>
                <td>${itemsSummary}</td>
                <td style="font-weight:bold;">$${order.totalAmount.toFixed(2)}</td>
                <td>
                    <span style="background:${statusColor}; color:white; padding:3px 8px; border-radius:4px; font-size:0.8rem;">
                        ${order.status}
                    </span>
                </td>
            `;
            tbody.appendChild(row);
        });

    } catch (err) {
        console.error(err);
        alert('Failed to load profile');
    }
}

loadProfile();