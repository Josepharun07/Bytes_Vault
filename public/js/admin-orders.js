// public/js/admin-orders.js

// 1. Security Check
const token = localStorage.getItem('vault_token');
const role = localStorage.getItem('vault_role');

if (!token || role !== 'admin') {
    window.location.href = 'login.html';
}

// 2. Fetch Orders
async function loadAllOrders() {
    try {
        const res = await fetch('/api/orders/admin/all', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const result = await res.json();
        const tbody = document.getElementById('orders-body');
        tbody.innerHTML = '';

        if (result.data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No orders found.</td></tr>';
            return;
        }

        result.data.forEach(order => {
            const date = new Date(order.createdAt).toLocaleDateString();
            const customerName = order.user ? order.user.fullName : 'Unknown User';
            const customerEmail = order.user ? order.user.emailAddress : '';

            // Status Dropdown Logic
            const statuses = ['Pending', 'Shipped', 'Delivered', 'Cancelled'];
            let optionsHtml = '';
            
            statuses.forEach(s => {
                const selected = order.status === s ? 'selected' : '';
                optionsHtml += `<option value="${s}" ${selected}>${s}</option>`;
            });

            const row = document.createElement('tr');
            row.innerHTML = `
                <td style="font-family:monospace; font-size:0.9rem;">${order._id}</td>
                <td>
                    <strong>${customerName}</strong><br>
                    <span style="font-size:0.8rem; color:#666;">${customerEmail}</span>
                </td>
                <td>${date}</td>
                <td>$${order.totalAmount.toFixed(2)}</td>
                <td>
                    <span class="badge" style="background:${getStatusColor(order.status)}; color:white;">${order.status}</span>
                </td>
                <td>
                    <select onchange="updateStatus('${order._id}', this.value)" style="padding:5px; border-radius:4px;">
                        ${optionsHtml}
                    </select>
                </td>
            `;
            tbody.appendChild(row);
        });

    } catch (err) {
        console.error(err);
        alert('Failed to load orders');
    }
}

// 3. Update Status Function
window.updateStatus = async (orderId, newStatus) => {
    try {
        const res = await fetch(`/api/orders/${orderId}/status`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({ status: newStatus })
        });

        if (res.ok) {
            // Reload to update the badge color
            loadAllOrders(); 
        } else {
            alert('Failed to update status');
        }
    } catch (err) {
        console.error(err);
    }
};

// Helper for colors
function getStatusColor(status) {
    if (status === 'Pending') return 'orange';
    if (status === 'Shipped') return 'blue';
    if (status === 'Delivered') return 'green';
    return 'red';
}

// Init
loadAllOrders();