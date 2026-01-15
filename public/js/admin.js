// public/js/admin.js

// 1. Security Check
const token = localStorage.getItem('vault_token');
const role = localStorage.getItem('vault_role');

if (!token || role !== 'admin') {
    window.location.href = 'login.html';
}

// 2. DOM Elements
const tableBody = document.getElementById('table-body');
const modal = document.getElementById('product-modal');
const addProductBtn = document.getElementById('add-product-btn'); // The big blue button
const closeBtn = document.querySelector('.close-modal');
const form = document.getElementById('add-product-form');
const logoutBtn = document.getElementById('logout-btn');
const specsContainer = document.getElementById('specs-container');
const addSpecBtn = document.getElementById('add-spec-btn'); // The small button inside modal

// 3. Load Products on Start
document.addEventListener('DOMContentLoaded', () => {
    loadInventory();
});

async function loadInventory() {
    try {
        const response = await fetch('/api/products');
        const result = await response.json();

        tableBody.innerHTML = ''; 

        if (result.data) {
            result.data.forEach(product => {
                const row = document.createElement('tr');
                
                // Safety check for image URL
                const imgUrl = product.imageUrl || 'uploads/products/no-image.jpg';

                const stockDisplay = product.stockCount < 5 
                    ? `<span class="stock-low">${product.stockCount} (Low)</span>` 
                    : product.stockCount;

                row.innerHTML = `
                    <td><img src="${imgUrl}" class="product-thumb" alt="Img" onerror="this.src='https://placehold.co/50'"></td>
                    <td>${product.itemName}</td>
                    <td>${product.category}</td>
                    <td>$${product.price}</td>
                    <td>${stockDisplay}</td>
                    <td>
                        <button class="btn-danger" data-id="${product._id}">Delete</button>
                    </td>
                `;
                tableBody.appendChild(row);
            });

            // Attach delete listeners dynamically
            document.querySelectorAll('.btn-danger').forEach(btn => {
                btn.addEventListener('click', (e) => deleteItem(e.target.dataset.id));
            });
        }
    } catch (err) {
        console.error('Failed to load inventory', err);
    }
}

// 4. FUNCTION: Add Spec Field
function addSpecField() {
    console.log("Add Spec Clicked"); // Debug log

    const div = document.createElement('div');
    div.className = 'spec-row';
    
    div.innerHTML = `
        <input type="text" placeholder="Spec Name (e.g. Color)" class="spec-key">
        <input type="text" placeholder="Value (e.g. Red)" class="spec-val">
        <button type="button" class="remove-spec" style="background:var(--vault-danger); color:white; border:none; padding: 5px 10px; cursor:pointer;">&times;</button>
    `;
    
    // Attach remove listener immediately
    div.querySelector('.remove-spec').addEventListener('click', function() {
        this.parentElement.remove();
    });

    specsContainer.appendChild(div);
}

// 5. EVENT LISTENER: Add Spec Button
if (addSpecBtn) {
    addSpecBtn.addEventListener('click', (e) => {
        e.preventDefault(); // Stop form submission just in case
        addSpecField();
    });
}

// 6. EVENT LISTENER: Open Modal & Generate SKU
addProductBtn.onclick = () => {
    modal.style.display = 'block';
    form.reset();
    specsContainer.innerHTML = ''; // Clear old specs
    
    addSpecField(); // Add one default row

    // Generate Random SKU
    const randomSku = 'PROD-' + Math.floor(1000 + Math.random() * 9000);
    const skuInput = document.querySelector('input[name="sku"]');
    if(skuInput) skuInput.value = randomSku;
};

// 7. EVENT LISTENER: Form Submit
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
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
        const response = await fetch('/api/products', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            alert('Product Added Successfully!');
            modal.style.display = 'none';
            loadInventory();
        } else {
            alert('Error: ' + result.message);
        }
    } catch (err) {
        console.error(err);
        alert('Upload failed');
    }
});

// 8. FUNCTION: Delete Item
async function deleteItem(id) {
    if(!confirm('Delete this item?')) return;

    try {
        const response = await fetch(`/api/products/${id}`, {
            method: 'DELETE'
        });
        if (response.ok) loadInventory();
    } catch (err) {
        alert('Delete failed');
    }
}

// 9. Close Modal Logic
closeBtn.onclick = () => modal.style.display = 'none';
window.onclick = (event) => {
    if (event.target == modal) modal.style.display = 'none';
};

logoutBtn.onclick = () => {
    localStorage.clear();
    window.location.href = 'login.html';
};