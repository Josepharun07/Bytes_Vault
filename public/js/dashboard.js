const token = localStorage.getItem('token');
const logoutBtn = document.getElementById('logoutBtn');
const alertBox = document.getElementById('alertBox');
const productForm = document.getElementById('productForm');
const cancelEdit = document.getElementById('cancelEdit');
const formTitle = document.getElementById('formTitle');

//Redirect if there is no token
if (!token) {
    window.location.href = 'login.html';
}

// Load data on page load
fetchProducts();
fetchUsers();
fetchAdmins();

// Logout
logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = 'login.html';
});

// Helper: Show Alert
function showAlert(message, type = 'danger') {
    alertBox.textContent = message;
    alertBox.className = `alert alert-${type}`;
    alertBox.style.display = 'block';
    setTimeout(() => alertBox.style.display = 'none', 3000);
}

// ========== PRODUCTS ==========
async function fetchProducts() {
    try {
        const res = await fetch('/api/products');
        const data = await res.json();
        if (data.success) {
            renderProducts(data.data);
        }
    } catch (err) { showAlert('Failed to load products'); }
}

function renderProducts(products) {
    const tbody = document.getElementById('productTableBody');
    tbody.innerHTML = '';
    products.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${p.name}</td>
            <td>$${p.price.toFixed(2)}</td>
            <td>${p.stock}</td>
            <td>
                <button class="btn-small btn-edit" onclick="editProduct('${p._id}', '${p.name}', ${p.price}, ${p.stock}, '${p.description || ''}', '${p.imageUrl || ''}')">Edit</button>
                <button class="btn-small btn-delete" onclick="deleteProduct('${p._id}')">Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

productForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!token) {
        alert('Admin login required');
        return;
    }

    const formData = new FormData();
    formData.append('name', document.getElementById('productName').value);
    formData.append('price', document.getElementById('productPrice').value);
    formData.append('stock', document.getElementById('productStock').value);
    formData.append('description', document.getElementById('productDescription').value);
    formData.append('image', document.getElementById('productImage').files[0]);

    try {
        const res = await fetch('/api/products', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        const data = await res.json();

        if (data.success) {
            alert('Product added successfully');
            productForm.reset();
            fetchProducts();
        } else {
            alert(data.message);
        }
    } catch (err) {
        alert('Failed to add product');
    }
});


window.editProduct = (id, name, price, stock, desc, img) => {
    document.getElementById('productId').value = id;
    document.getElementById('productName').value = name;
    document.getElementById('productPrice').value = price;
    document.getElementById('productStock').value = stock;
    document.getElementById('productDescription').value = desc;
    document.getElementById('productImage').value = img;
    formTitle.textContent = 'Edit Product';
    cancelEdit.style.display = 'inline-block';
};

window.deleteProduct = async (id) => {
    if (!confirm('Delete this product?')) return;
    try {
        const res = await fetch(`/api/products/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
            showAlert('Product deleted', 'success');
            fetchProducts();
        } else { showAlert(data.message); }
    } catch (err) { showAlert('Delete failed'); }
};

cancelEdit.addEventListener('click', resetForm);

function resetForm() {
    productForm.reset();
    document.getElementById('productId').value = '';
    formTitle.textContent = 'Add New Product';
    cancelEdit.style.display = 'none';
}

// ========== ADMINS ==========
async function fetchAdmins() {
    try {
        const res = await fetch('/api/admins', { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();
        if (data.success) {
            document.getElementById('adminManagementSection').style.display = 'block';
            renderAdmins(data.data);
        }
    } catch (err) { console.log('Admin management not accessible'); }
}

function renderAdmins(admins) {
    const tbody = document.getElementById('adminTableBody');
    tbody.innerHTML = '';
    admins.forEach(a => {
        const tr = document.createElement('tr');
        const isSuperAdmin = a.role === 'superadmin';
        let btn = isSuperAdmin
            ? '<span style="color:#6c757d;">Super Admin</span>'
            : `<button class="btn-small btn-demote" onclick="demoteAdmin('${a._id}')">Demote</button>`;
        tr.innerHTML = `
            <td>${a.name}</td>
            <td>${a.email}</td>
            <td>${a.department || 'N/A'}</td>
            <td>${a.role}</td>
            <td>${btn}</td>
        `;
        tbody.appendChild(tr);
    });
}

window.demoteAdmin = async (id) => {
    if (!confirm('Demote this admin to customer?')) return;
    try {
        const res = await fetch(`/api/admins/demote/${id}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
            showAlert('Admin demoted', 'success');
            fetchAdmins();
            fetchUsers();
        } else { showAlert(data.message); }
    } catch (err) { showAlert('Demotion failed'); }
};

// ========== USERS ==========
async function fetchUsers() {
    try {
        const res = await fetch('/api/users', { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();
        if (data.success) {
            document.getElementById('userManagementSection').style.display = 'block';
            renderUsers(data.data);
        }
    } catch (err) { console.log('User management not accessible'); }
}

function renderUsers(users) {
    const tbody = document.getElementById('userTableBody');
    tbody.innerHTML = '';
    users.forEach(u => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${u.name}</td>
            <td>${u.email}</td>
            <td>
                <button class="btn-small btn-promote" onclick="promoteUser('${u._id}')">Promote</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.promoteUser = async (id) => {
    const dept = prompt('Enter department for new admin (IT, HR, Sales, Management, Other):', 'Other');
    if (!dept) return;
    try {
        const res = await fetch(`/api/admins/promote/${id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ department: dept })
        });
        const data = await res.json();
        if (data.success) {
            showAlert('User promoted to admin', 'success');
            fetchUsers();
            fetchAdmins();
        } else { showAlert(data.message); }
    } catch (err) { showAlert('Promotion failed'); }
};
