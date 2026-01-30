// public/js/admin.js

// 1. Security & Init
const token = localStorage.getItem('vault_token');
const role = localStorage.getItem('vault_role');

// Redirect if not admin
if (!token || role !== 'admin') window.location.href = 'login.html';

let socket; // Store socket instance

document.addEventListener('DOMContentLoaded', () => {
    // 1. Load logs from local storage immediately
    loadSavedLogs();

    // 2. Initial Data Fetch
    performFullSync(true); 

    // 3. Initialize Real-time System
    initRealTime();

    // 4. Default View
    switchView('dashboard');
});

// 2. Navigation Logic
window.switchView = (viewName) => {
    document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
    
    document.getElementById(`view-${viewName}`).classList.add('active');
    document.getElementById(`nav-${viewName}`).classList.add('active');
};

// ========================
// SECTION: REAL-TIME SYSTEM & LOGGING
// ========================

function initRealTime() {
    // Connect to the socket server
    socket = io();
    const connType = document.getElementById('sys-conn-type');

    // ON CONNECT
    socket.on('connect', () => {
        logEvent('✅ Connected to Real-time Stream');
        if(connType) {
            connType.innerText = 'WebSocket (Live)';
            connType.style.color = 'var(--success)';
        }
        // Force a sync on connection to ensure fresh data
        performFullSync(true);
    });

    socket.on('disconnect', () => {
        logEvent('❌ Disconnected from Stream');
        if(connType) {
            connType.innerText = 'Offline';
            connType.style.color = 'var(--danger)';
        }
    });

    // DATA UPDATES (The Core Auto-Update Logic)
    socket.on('data:updated', (data) => {
        // 1. Log the specific event
        logEvent(`⚡ UPDATE: ${data.message || 'Data changed'}`);
        
        // 2. Refresh ALL tables automatically
        performFullSync(true); 
        
        // 3. Visual Feedback (Flash the sync button)
        const btn = document.getElementById('sync-btn');
        if(btn) {
            btn.style.backgroundColor = '#f59e0b'; // Flash Orange
            setTimeout(() => btn.style.backgroundColor = '', 500);
        }
    });

    // SYSTEM METRICS (Real-time user count)
    socket.on('system:metrics', (data) => {
        const activeUsersEl = document.getElementById('sys-active-users');
        if (activeUsersEl) activeUsersEl.innerText = data.connections;
    });
}

// --- CENTRALIZED SYNC LOGIC ---
async function performFullSync(silent = false) {
    if(!silent) logEvent('> Retrieving data from MongoDB...');
    
    try {
        // Reload all data sections
        await Promise.all([
            loadStats(silent),
            loadInventory(silent),
            loadOrders(silent),
            loadUsers(silent),
            checkDbStatus(silent)
        ]);
        
        updateLastSyncTime();
        if(!silent) logEvent('✓ Data Sync Complete.');
        
    } catch (error) {
        logEvent('! Error during Sync: ' + error.message);
    }
}

// Manual Sync Button Logic
window.manualSync = async () => {
    const btn = document.getElementById('sync-btn');
    const originalText = '🔄 Manual Sync';
    btn.disabled = true;
    btn.innerHTML = '⏳ Syncing...';
    
    await performFullSync(false);
    
    btn.innerHTML = '✅ Synced!';
    btn.style.backgroundColor = 'var(--success)';

    setTimeout(() => {
        btn.disabled = false;
        btn.innerHTML = originalText;
        btn.style.backgroundColor = ''; 
    }, 1500);
};

// --- DB STATUS CHECK ---
async function checkDbStatus(silent) {
    try {
        const res = await fetch('/api/system/status');
        if(!res.ok) return; // Ignore if server route not ready
        
        const data = await res.json();
        
        const elements = {
            'sys-db-status': { val: data.dbStatus, color: data.connected ? 'var(--success)' : 'var(--danger)' },
            'sys-active-users': { val: data.activeConnections },
            'sys-latency': { val: data.latency >= 0 ? `${data.latency} ms` : 'N/A' },
            'sys-uptime': { val: formatUptime(data.uptime) },
            'sys-total-docs': { val: data.totalDocuments },
            'sys-env': { val: data.environment }
        };

        for (const [id, info] of Object.entries(elements)) {
            const el = document.getElementById(id);
            if(el) {
                el.innerText = info.val;
                if(info.color) el.style.color = info.color;
            }
        }

    } catch (err) {
        if(!silent) logEvent('! System API Unreachable');
    }
}

function formatUptime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h}h ${m}m ${s}s`;
}

function updateLastSyncTime() {
    const el = document.getElementById('sys-last-sync');
    if(el) el.innerText = new Date().toLocaleTimeString();
}

function logEvent(msg) {
    const box = document.getElementById('sync-logs');
    if(!box) return;
    const timeString = new Date().toLocaleTimeString();
    const fullMessage = `> [${timeString}] ${msg}`;
    const line = document.createElement('div');
    line.innerText = fullMessage;
    box.appendChild(line);
    box.scrollTop = box.scrollHeight;
    saveLogToStorage(fullMessage);
}

function saveLogToStorage(messageLine) {
    let logs = JSON.parse(localStorage.getItem('vault_logs') || '[]');
    logs.push(messageLine);
    if (logs.length > 50) logs.shift(); 
    localStorage.setItem('vault_logs', JSON.stringify(logs));
}

function loadSavedLogs() {
    const box = document.getElementById('sync-logs');
    if(!box) return;
    const logs = JSON.parse(localStorage.getItem('vault_logs') || '[]');
    if (logs.length > 0) {
        box.innerHTML = ''; 
        logs.forEach(logLine => {
            const line = document.createElement('div');
            line.innerText = logLine;
            box.appendChild(line);
        });
        box.scrollTop = box.scrollHeight;
    }
}

window.clearSystemLogs = () => {
    localStorage.removeItem('vault_logs');
    document.getElementById('sync-logs').innerHTML = '';
    logEvent('Logs Cleared.');
};

// ========================
// SECTION: DATA LOADERS
// ========================
async function loadStats(silent) {
    try {
        const res = await fetch('/api/orders/admin/stats', { headers: { 'Authorization': `Bearer ${token}` } });
        if(res.status === 401) return window.location.href = 'login.html';
        
        const result = await res.json();
        if (result.success) {
            document.getElementById('stat-revenue').innerText = `$${result.stats.revenue.toFixed(2)}`;
            document.getElementById('stat-orders').innerText = result.stats.orders;
            document.getElementById('stat-users').innerText = result.stats.users;
            
            // Populate Best Sellers if present
            if(document.getElementById('top-products-list')) {
                // This would usually come from analytics endpoint, but for now we rely on analytics.js to fill that
            }
        }
    } catch (err) { console.error(err); }
}

async function loadInventory(silent) {
    try {
        const res = await fetch('/api/products');
        const result = await res.json();
        const tbody = document.getElementById('table-body');
        tbody.innerHTML = ''; 

        if (result.data && result.data.length > 0) {
            result.data.forEach(p => {
                let img = 'https://placehold.co/100?text=No+Img';
                
                if (p.images && p.images.length > 0) {
                    img = p.images[0];
                } else if (p.imageUrl && p.imageUrl !== 'uploads/products/no-image.jpg') {
                    img = p.imageUrl;
                }

                if (!img.startsWith('http') && !img.startsWith('/')) {
                    img = '/' + img;
                }
                const stockDisplay = p.stockCount < 5 
                    ? `<span style="color:var(--danger); font-weight:bold;">${p.stockCount} (Low)</span>` 
                    : p.stockCount;

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><img src="${img}" width="40" height="40" style="object-fit:cover; border-radius:8px;"></td>
                    <td>${p.itemName}</td>
                    <td><span class="badge" style="background:#f1f5f9;">${p.category}</span></td>
                    <td>$${p.price}</td>
                    <td>${stockDisplay}</td>
                    <td>
                        <button class="btn-danger" onclick="deleteProduct('${p._id}')" style="padding:4px 10px;">Del</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
            if(!silent) logEvent(`✓ Inventory: Loaded ${result.data.length} Products`);
        } else {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No products found.</td></tr>';
        }
    } catch (err) { console.error("Inventory Error:", err); }
}

async function loadOrders(silent) {
    try {
        const res = await fetch('/api/orders/admin/all', { headers: { 'Authorization': `Bearer ${token}` } });
        const result = await res.json();
        const tbody = document.getElementById('orders-body');
        tbody.innerHTML = '';

        if (result.data && result.data.length > 0) {
            result.data.forEach(o => {
                const tr = document.createElement('tr');
                
                // --- NEW ORDER ACTION UI ---
                // We create a specific ID for the select box to grab its value later
                // We added a "Save" button to trigger the update
                const actionHtml = `
                    <div style="display:flex; gap:5px; align-items:center;">
                        <select id="status-select-${o._id}" style="padding:5px; border:1px solid #cbd5e1; border-radius:6px;">
                            <option value="Pending" ${o.status==='Pending'?'selected':''}>Pending</option>
                            <option value="Shipped" ${o.status==='Shipped'?'selected':''}>Shipped</option>
                            <option value="Delivered" ${o.status==='Delivered'?'selected':''}>Delivered</option>
                            <option value="Cancelled" ${o.status==='Cancelled'?'selected':''}>Cancelled</option>
                        </select>
                        <button class="btn-primary" onclick="submitOrderStatus('${o._id}')" style="padding: 5px 10px; font-size: 0.8rem;">
                            💾
                        </button>
                    </div>
                `;

                tr.innerHTML = `
                    <td style="font-family:monospace">#${o._id.slice(-4)}</td>
                    <td>${o.user ? o.user.fullName : 'Unknown'}</td>
                    <td>${new Date(o.createdAt).toLocaleDateString()}</td>
                    <td>$${o.totalAmount.toFixed(2)}</td>
                    <td><span class="badge" style="background:${getStatusColor(o.status)}; color:white;">${o.status}</span></td>
                    <td>${actionHtml}</td>
                `;
                tbody.appendChild(tr);
            });
            if(!silent) logEvent(`✓ Orders: Loaded ${result.data.length} Records`);
        } else {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No orders found.</td></tr>';
        }
    } catch (err) { console.error(err); }
}

async function loadUsers(silent) {
    try {
        const res = await fetch('/api/users', { headers: { 'Authorization': `Bearer ${token}` } });
        const result = await res.json();
        const tbody = document.getElementById('users-body');
        tbody.innerHTML = '';

        if (result.data && result.data.length > 0) {
            result.data.forEach(u => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${u.fullName}</td>
                    <td>${u.emailAddress}</td>
                    <td><span class="badge" style="background: ${u.privilegeLevel==='admin'?'var(--primary)':'#cbd5e1'}; color: ${u.privilegeLevel==='admin'?'white':'black'}">${u.privilegeLevel}</span></td>
                    <td>${new Date(u.registrationDate).toLocaleDateString()}</td>
                    <td>
                        ${u.privilegeLevel === 'admin' 
                            ? `<button class="btn-secondary" onclick="changeRole('${u._id}', 'customer')">Demote</button>` 
                            : `<button class="btn-primary" style="padding:5px;" onclick="changeRole('${u._id}', 'admin')">Promote</button>`}
                        <button class="btn-secondary" onclick="openPassModal('${u._id}', '${u.emailAddress}')">Reset</button>
                        <button class="btn-danger" onclick="deleteUser('${u._id}')">Del</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
            if(!silent) logEvent(`✓ Users: Loaded ${result.data.length} Accounts`);
        }
    } catch (err) { console.error(err); }
}

// --- STANDARD ACTIONS ---

// New function to handle manual order status submission
window.submitOrderStatus = async (id) => {
    const selectEl = document.getElementById(`status-select-${id}`);
    const newStatus = selectEl.value;

    const btn = selectEl.nextElementSibling; // The save button
    const originalContent = btn.innerHTML;
    btn.innerHTML = '...';
    btn.disabled = true;

    try {
        const res = await fetch(`/api/orders/admin/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ status: newStatus })
        });

        const data = await res.json();
        
        if (data.success) {
            logEvent(`Order #${id.slice(-4)} updated to ${newStatus}`);
            // Note: The socket broadcast from backend will trigger a full table reload,
            // so we don't necessarily need to reload manually, but we do so for instant feedback.
            loadOrders(true);
        } else {
            alert('Update Failed: ' + data.message);
            btn.innerHTML = originalContent;
            btn.disabled = false;
        }
    } catch (err) {
        console.error(err);
        alert('Network Error');
        btn.innerHTML = originalContent;
        btn.disabled = false;
    }
};

function addSpecField() {
    const container = document.getElementById('specs-container');
    const div = document.createElement('div');
    div.className = 'spec-row';
    div.style.display = 'grid';
    div.style.gridTemplateColumns = '1fr 1fr 30px';
    div.style.gap = '10px';
    div.innerHTML = `
        <input type="text" placeholder="Spec Name" class="form-control spec-key">
        <input type="text" placeholder="Value" class="form-control spec-val">
        <button type="button" class="remove-spec" style="background:var(--danger); color:white; border:none; border-radius:4px; cursor:pointer;">&times;</button>
    `;
    div.querySelector('.remove-spec').addEventListener('click', function() { this.parentElement.remove(); });
    container.appendChild(div);
}
const addSpecBtn = document.getElementById('add-spec-btn');
if (addSpecBtn) addSpecBtn.addEventListener('click', addSpecField);

document.getElementById('add-product-btn').onclick = () => {
    document.getElementById('product-modal').style.display = 'block';
    document.getElementById('add-product-form').reset();
    document.getElementById('specs-container').innerHTML = '';
    addSpecField();
    const skuInput = document.querySelector('input[name="sku"]');
    if(skuInput) skuInput.value = 'PROD-' + Math.floor(1000 + Math.random() * 9000);
};

document.getElementById('add-product-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const currentToken = localStorage.getItem('vault_token');
    if (!currentToken) return window.location.href = 'login.html';

    const formData = new FormData(e.target);
    const specsObj = {};
    document.querySelectorAll('.spec-row').forEach(row => {
        const key = row.querySelector('.spec-key').value.trim();
        const val = row.querySelector('.spec-val').value.trim();
        if (key && val) specsObj[key] = val;
    });
    formData.append('specs', JSON.stringify(specsObj));

    try {
        const res = await fetch('/api/products', { 
            method: 'POST', 
            headers: { 'Authorization': `Bearer ${currentToken}` },
            body: formData
        });
        const data = await res.json();
        if (data.success) {
            alert('Product Added');
            document.getElementById('product-modal').style.display = 'none';
            // The socket will handle reload, but we can do it locally too
        } else {
            alert('Error: ' + data.message);
        }
    } catch (err) { console.error(err); alert('Upload Failed'); }
});

window.deleteProduct = async (id) => {
    if(confirm('Delete?')) {
        await fetch(`/api/products/${id}`, { 
            method: 'DELETE', 
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } 
        });
        // The socket will trigger auto-update
    }
}

function getStatusColor(status) {
    if (status === 'Pending') return 'var(--warning)';
    if (status === 'Shipped') return 'var(--primary)';
    if (status === 'Delivered') return 'var(--success)';
    return 'var(--danger)';
}

window.changeRole = async (id, role) => {
    if(confirm(`Change role to ${role}?`)) {
        await fetch(`/api/users/${id}/role`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ role })
        });
    }
};

window.deleteUser = async (id) => {
    if(confirm('Delete user PERMANENTLY?')) {
        await fetch(`/api/users/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
    }
};

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
    } else {
        alert(data.message);
    }
});

window.openPassModal = (id, email) => {
    document.getElementById('reset-user-id').value = id;
    document.getElementById('reset-user-email').innerText = email;
    document.getElementById('password-modal').style.display = 'block';
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

window.closeModal = (id) => document.getElementById(id).style.display = 'none';
document.getElementById('logout-btn').onclick = () => {
    localStorage.clear();
    window.location.href = 'login.html';
};


// ========================
// SECTION: ANALYTICS & CHARTS
// ========================

let salesChartInstance = null;
let categoryChartInstance = null;

async function loadAnalytics() {
    // Only load charts if we are in dashboard view to save resources
    if(!document.getElementById('salesChart')) return;

    try {
        const headers = { 'Authorization': `Bearer ${token}` };

        // 1. Fetch Trend Data
        const trendRes = await fetch('/api/analytics/trend', { headers });
        const trendData = await trendRes.json();

        // 2. Fetch Category Data
        const catRes = await fetch('/api/analytics/categories', { headers });
        const catData = await catRes.json();

        // 3. Fetch Top Products
        const topRes = await fetch('/api/analytics/top-products', { headers });
        const topData = await topRes.json();

        if (trendData.success) renderSalesChart(trendData.data);
        if (catData.success) renderCategoryChart(catData.data);
        if (topData.success) renderTopProducts(topData.data);

    } catch (err) {
        console.error("Analytics Error:", err);
    }
}

// Call analytics load after init
setTimeout(loadAnalytics, 1000);

function renderSalesChart(data) {
    const ctx = document.getElementById('salesChart').getContext('2d');
    if (salesChartInstance) salesChartInstance.destroy();

    const labels = data.map(d => d._id);
    const values = data.map(d => d.totalSales);

    salesChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Revenue ($)',
                data: values,
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

function renderCategoryChart(data) {
    const ctx = document.getElementById('categoryChart').getContext('2d');
    if (categoryChartInstance) categoryChartInstance.destroy();

    const labels = data.map(d => d._id);
    const values = data.map(d => d.revenue);
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

    categoryChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: colors,
                borderWidth: 0
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

function renderTopProducts(data) {
    const tbody = document.getElementById('top-products-list');
    if(!tbody) return;
    tbody.innerHTML = data.map(p => `
        <tr style="border-bottom:1px solid #eee;">
            <td style="padding:10px 0;">${p._id}</td>
            <td style="text-align:center;">${p.qty}</td>
            <td style="text-align:center; font-weight:bold; color:var(--success);">$${p.revenue.toFixed(2)}</td>
        </tr>
    `).join('');
}

// ========================
// SECTION: EXPORT TOOLS
// ========================

window.exportCSV = async (type) => {
    let url = type === 'inventory' ? '/api/products' : '/api/orders/admin/all';
    
    try {
        const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
        const json = await res.json();
        
        if (!json.success) return alert('Failed to fetch data');

        const items = json.data;
        if (items.length === 0) return alert('No data to export');

        // Convert JSON to CSV
        const replacer = (key, value) => value === null ? '' : value; 
        const header = Object.keys(items[0]);
        const csv = [
            header.join(','), // Header Row
            ...items.map(row => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(',')) // Data Rows
        ].join('\r\n');

        // Trigger Download
        const blob = new Blob([csv], { type: 'text/csv' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = `${type}_report_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();

    } catch (err) {
        console.error(err);
        alert('Export Failed');
    }
};