// public/js/admin.js

// 1. Security & Init
const token = localStorage.getItem('vault_token');
const role = localStorage.getItem('vault_role');

if (!token || role !== 'admin') window.location.href = 'login.html';

document.addEventListener('DOMContentLoaded', () => {
    loadStats();
    loadInventory();
    loadOrders();
    loadUsers();
    
    // Default View
    switchView('dashboard');
});

// 2. Navigation Logic
window.switchView = (viewName) => {
    document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    
    document.getElementById(`view-${viewName}`).classList.add('active');
    document.getElementById(`nav-${viewName}`).classList.add('active');
    
    const titles = { 'dashboard': 'Overview', 'inventory': 'Product Management', 'orders': 'Order Fulfillment', 'users': 'User Management' };
    document.getElementById('page-title').innerText = titles[viewName];
};

// ========================
// SECTION: DASHBOARD STATS
// ========================
async function loadStats() {
    try {
        const res = await fetch('/api/orders/admin/stats', { headers: { 'Authorization': `Bearer ${token}` } });
        const result = await res.json();
        if (result.success) {
            document.getElementById('stat-revenue').innerText = `$${result.stats.revenue.toFixed(2)}`;
            document.getElementById('stat-orders').innerText = result.stats.orders;
            document.getElementById('stat-users').innerText = result.stats.users;
            
            // Low Stock
            const list = document.getElementById('low-stock-list');
            list.innerHTML = result.stats.lowStock.map(p => `
                <li style="padding:10px; border-bottom:1px solid #eee; display:flex; justify-content:space-between;">
                    <span>${p.itemName}</span>
                    <span style="color:red; font-weight:bold;">${p.stockCount} left</span>
                </li>
            `).join('');
        }
    } catch (err) { console.error(err); }
}

// ========================
// SECTION: INVENTORY (RESTORED LOGIC)
// ========================

// 1. Fetch & Render Table
async function loadInventory() {
    try {
        const res = await fetch('/api/products');
        const result = await res.json();
        const tbody = document.getElementById('table-body');
        
        tbody.innerHTML = ''; // Clear

        if (result.data && result.data.length > 0) {
            result.data.forEach(p => {
                const img = p.imageUrl || 'uploads/products/no-image.jpg';
                
                // Low Stock Badge
                const stockDisplay = p.stockCount < 5 
                    ? `<span style="color:red; font-weight:bold;">${p.stockCount} (Low)</span>` 
                    : p.stockCount;

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><img src="${img}" width="40" height="40" style="object-fit:cover; border-radius:4px;"></td>
                    <td>${p.itemName}</td>
                    <td>${p.category}</td>
                    <td>$${p.price}</td>
                    <td>${stockDisplay}</td>
                    <td>
                        <button class="btn-danger" onclick="deleteProduct('${p._id}')" style="padding:5px 10px;">Del</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No products found.</td></tr>';
        }
    } catch (err) {
        console.error("Inventory Error:", err);
    }
}

// 2. Add Spec Field Logic (RESTORED)
function addSpecField() {
    const container = document.getElementById('specs-container');
    const div = document.createElement('div');
    div.className = 'spec-row';
    div.style.display = 'grid';
    div.style.gridTemplateColumns = '1fr 1fr 30px';
    div.style.gap = '10px';
    
    div.innerHTML = `
        <input type="text" placeholder="Spec Name (e.g. Color)" class="form-control spec-key">
        <input type="text" placeholder="Value (e.g. Red)" class="form-control spec-val">
        <button type="button" class="remove-spec" style="background:var(--vault-danger); color:white; border:none; border-radius:4px; cursor:pointer;">&times;</button>
    `;
    
    div.querySelector('.remove-spec').addEventListener('click', function() {
        this.parentElement.remove();
    });

    container.appendChild(div);
}

// Event Listener for Add Spec Button
const addSpecBtn = document.getElementById('add-spec-btn');
if (addSpecBtn) {
    addSpecBtn.addEventListener('click', addSpecField);
}

// 3. Open Modal Logic (RESTORED SKU GEN)
const productModal = document.getElementById('product-modal');
document.getElementById('add-product-btn').onclick = () => {
    productModal.style.display = 'block';
    
    // Reset Form & Specs
    document.getElementById('add-product-form').reset();
    document.getElementById('specs-container').innerHTML = '';
    addSpecField(); // Add one default row

    // Generate Random SKU (Prevents "SKU Exists" error)
    const randomSku = 'PROD-' + Math.floor(1000 + Math.random() * 9000);
    const skuInput = document.querySelector('input[name="sku"]');
    if(skuInput) skuInput.value = randomSku;
};

// 4. Form Submit Logic (FIXED AUTH HEADER)
document.getElementById('add-product-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // 1. Get Token again to be safe
    const currentToken = localStorage.getItem('vault_token');
    
    if (!currentToken) {
        alert("Session expired. Please login again.");
        window.location.href = 'login.html';
        return;
    }

    const formData = new FormData(e.target);

    // Collect Specs
    const specsObj = {};
    document.querySelectorAll('.spec-row').forEach(row => {
        const key = row.querySelector('.spec-key').value.trim();
        const val = row.querySelector('.spec-val').value.trim();
        if (key && val) {
            specsObj[key] = val;
        }
    });

    formData.append('specs', JSON.stringify(specsObj));

    try {
        const res = await fetch('/api/products', { 
            method: 'POST', 
            headers: {
                // ✅ WE ADD TOKEN HERE
                'Authorization': `Bearer ${currentToken}`
                // ❌ DO NOT ADD 'Content-Type': 'multipart/form-data'
                // The browser adds it automatically with the correct "boundary" for files.
            },
            body: formData
        });
        
        const data = await res.json();

        if (data.success) {
            alert('Product Added Successfully');
            document.getElementById('product-modal').style.display = 'none';
            loadInventory();
        } else {
            alert('Error: ' + data.message);
        }
    } catch (err) {
        console.error(err);
        alert('Upload Failed');
    }
});


window.deleteProduct = async (id) => {
    if(confirm('Delete?')) {
        await fetch(`/api/products/${id}`, { 
            method: 'DELETE', 
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            } 
        });
        loadInventory();
    }
}

// ========================
// SECTION: ORDERS
// ========================
async function loadOrders() {
    const res = await fetch('/api/orders/admin/all', { headers: { 'Authorization': `Bearer ${token}` } });
    const result = await res.json();
    const tbody = document.getElementById('orders-body');
    
    tbody.innerHTML = result.data.map(o => `
        <tr>
            <td style="font-family:monospace">#${o._id.slice(-4)}</td>
            <td>${o.user ? o.user.fullName : 'Unknown'}</td>
            <td>${new Date(o.createdAt).toLocaleDateString()}</td>
            <td>$${o.totalAmount.toFixed(2)}</td>
            <td><span class="badge">${o.status}</span></td>
            <td>
                <select onchange="updateOrderStatus('${o._id}', this.value)">
                    <option value="Pending" ${o.status==='Pending'?'selected':''}>Pending</option>
                    <option value="Shipped" ${o.status==='Shipped'?'selected':''}>Shipped</option>
                    <option value="Delivered" ${o.status==='Delivered'?'selected':''}>Delivered</option>
                    <option value="Cancelled" ${o.status==='Cancelled'?'selected':''}>Cancelled</option>
                </select>
            </td>
        </tr>
    `).join('');
}

window.updateOrderStatus = async (id, status) => {
    await fetch(`/api/orders/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status })
    });
    loadOrders(); // Refresh to update badge color
};

// ========================
// SECTION: USERS
// ========================
async function loadUsers() {
    const res = await fetch('/api/users', { headers: { 'Authorization': `Bearer ${token}` } });
    const result = await res.json();
    const tbody = document.getElementById('users-body');
    
    tbody.innerHTML = result.data.map(u => `
        <tr>
            <td>${u.fullName}</td>
            <td>${u.emailAddress}</td>
            <td><span class="badge">${u.privilegeLevel}</span></td>
            <td>${new Date(u.registrationDate).toLocaleDateString()}</td>
            <td>
                ${u.privilegeLevel === 'admin' 
                    ? `<button class="btn-secondary" onclick="changeRole('${u._id}', 'customer')">Demote</button>` 
                    : `<button class="btn-primary" style="padding:5px;" onclick="changeRole('${u._id}', 'admin')">Promote</button>`}
                <button class="btn-secondary" style="background:orange; color:black;" onclick="openPassModal('${u._id}', '${u.emailAddress}')">Reset Pass</button>
                <button class="btn-danger" onclick="deleteUser('${u._id}')">Del</button>
            </td>
        </tr>
    `).join('');
}

// 1. Change Role
window.changeRole = async (id, role) => {
    if(confirm(`Change role to ${role}?`)) {
        await fetch(`/api/users/${id}/role`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ role })
        });
        loadUsers();
    }
};

// 2. Delete User
window.deleteUser = async (id) => {
    if(confirm('Delete this user PERMANENTLY?')) {
        await fetch(`/api/users/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
        loadUsers();
    }
};

// 3. Create User
window.openUserModal = () => document.getElementById('user-modal').style.display = 'block';

document.getElementById('create-user-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        fullName: document.getElementById('new-name').value,
        email: document.getElementById('new-email').value,
        password: document.getElementById('new-pass').value,
        role: document.getElementById('new-role').value
    };

    const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
    });
    
    const data = await res.json();
    if(res.ok) {
        alert('User Created');
        document.getElementById('user-modal').style.display = 'none';
        loadUsers();
    } else {
        alert(data.message);
    }
});

// 4. Reset Password
window.openPassModal = (id, email) => {
    // Debugging line
    console.log("Opening Reset Modal for:", email);

    document.getElementById('reset-user-id').value = id;
    document.getElementById('reset-user-email').innerText = email;
    
    const modal = document.getElementById('password-modal');
    modal.style.display = 'block';
    
    // Auto-focus the input so you can type immediately
    setTimeout(() => {
        document.getElementById('reset-new-pass').focus();
    }, 100);
};

document.getElementById('reset-pass-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('reset-user-id').value;
    const newPass = document.getElementById('reset-new-pass').value;

    const res = await fetch(`/api/users/${id}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ newPassword: newPass })
    });

    if(res.ok) {
        alert('Password Updated');
        document.getElementById('password-modal').style.display = 'none';
    }
});

// Global Helpers
window.closeModal = (id) => document.getElementById(id).style.display = 'none';
document.getElementById('logout-btn').onclick = () => {
    localStorage.clear();
    window.location.href = 'login.html';
};