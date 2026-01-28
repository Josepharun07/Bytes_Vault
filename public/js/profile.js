// public/js/profile.js

// 1. Security Check
const token = localStorage.getItem("vault_token");
if (!token) {
  window.location.href = "login.html";
}

// 2. Logout Logic
document.getElementById("logout-btn").addEventListener("click", () => {
  localStorage.clear();
  window.location.href = "index.html";
});

// 2b. Set basic identity from storage if available
const storedName = localStorage.getItem("vault_name");
if (storedName) {
  document.getElementById("user-name").innerText = storedName;
  const initial = storedName.trim().charAt(0).toUpperCase();
  document.getElementById("user-avatar").innerText = initial || "BV";
}

// 3. Load Profile Data
async function loadProfile() {
  try {
    // Fetch Orders
    const res = await fetch("/api/orders/myorders", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const result = await res.json();

    const tbody = document.getElementById("order-history-body");
    tbody.innerHTML = "";

    const orders = result.data || [];
    document.getElementById("order-count").innerText = orders.length || "0";
    if (orders.length > 0) {
      const latest = orders[orders.length - 1];
      document.getElementById("last-order-date").innerText = new Date(
        latest.createdAt,
      ).toLocaleDateString();
    }

    if (orders.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="5" style="text-align:center; padding:1.25rem;">No orders yet. <a href="shop.html">Go shop</a></td></tr>';
      return;
    }

    orders.forEach((order) => {
      const date = new Date(order.createdAt).toLocaleDateString();
      const itemsSummary = order.items
        .map((i) => `${i.qty}x ${i.itemName}`)
        .join(", ");

      const statusClass =
        {
          Shipped: "status-pill shipped",
          Delivered: "status-pill delivered",
          Cancelled: "status-pill cancelled",
        }[order.status] || "status-pill pending";

      const row = document.createElement("tr");
      row.innerHTML = `
                <td class="mono">#${order._id.slice(-6)}</td>
                <td>${date}</td>
                <td>${itemsSummary}</td>
                <td class="strong">$${order.totalAmount.toFixed(2)}</td>
                <td><span class="${statusClass}">${order.status}</span></td>
            `;
      tbody.appendChild(row);
    });
  } catch (err) {
    console.error(err);
    alert("Failed to load profile");
  }
}

loadProfile();
