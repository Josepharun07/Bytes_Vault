// public/js/product.js

const id = new URLSearchParams(window.location.search).get("id");
let currentProduct = null; 

// 1. Helper: Stock Badge
function getStockBadge(stock) {
  if (stock === 0) return '<span class="stock-badge out-of-stock">Out of Stock</span>';
  if (stock < 5) return `<span class="stock-badge low-stock">Only ${stock} left!</span>`;
  return `<span class="stock-badge in-stock">In Stock</span>`;
}

// 2. Helper: Render Stars
function renderStars(rating) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  let stars = '';
  for (let i = 0; i < 5; i++) {
    if (i < full) stars += '★';
    else if (i === full && half) stars += '☆'; // You can use a half-star char if available
    else stars += '☆';
  }
  return `<span class="stars" aria-label="Rating ${rating.toFixed(1)}">${stars}</span>`;
}

// 3. Main Load Function
async function loadProduct() {
  if (!id) return;

  try {
    const res = await fetch(`/api/products`); // Fetching all to find one (simplest for now)
    const result = await res.json();
    
    // Find product manually from list
    const product = result.data ? result.data.find(p => p._id === id) : null;

    if (!product) {
      document.getElementById("product-container").innerHTML = "<h2>Product not found</h2>";
      return;
    }

    currentProduct = product; 

    // FIX: Use correct path separator (/) not (\)
    const imgUrl = product.imageUrl || 'uploads/products/no-image.jpg';

    // Render Specs
    let specsHtml = '';
    if (product.specs) {
      const entries = typeof product.specs === 'object' ? product.specs : {};
      specsHtml = Object.entries(entries).map(([k, v]) => `
          <div class="spec-item">
            <span class="spec-label">${k}</span>
            <span class="spec-value">${v}</span>
          </div>
      `).join("");
    }

    // Render Product HTML
    document.getElementById("product-container").innerHTML = `
      <div class="product-image-section">
          ${getStockBadge(product.stockCount)}
          <img src="${imgUrl}" alt="${product.itemName}" class="product-image" onerror="this.src='https://placehold.co/400'"/>
      </div>
      <div class="product-info-section">
        <h1 class="product-title">${product.itemName}</h1>
        
        <div class="product-rating">
          ${renderStars(Number(product.rating || 0))}
          <span style="color:#666; margin-left:10px;">${(product.rating || 0).toFixed(1)} (${product.numReviews || 0} reviews)</span>
        </div>

        <div class="product-price">$${product.price.toFixed(2)}</div>
        
        <p style="color:#555; line-height:1.6; margin-bottom:1.5rem;">${product.description}</p>
        
        <hr style="margin: 1.5rem 0; border:0; border-top:1px solid #eee;">
        
        <div class="specs-section">
          <h3 style="margin-bottom:1rem; font-size:1.2rem;">Technical Specifications</h3>
          <div class="specs-grid">
            ${specsHtml || '<p>No specs available.</p>'}
          </div>
        </div>
        
        <div class="cart-section" style="margin-top:2rem;">
          <button id="add-to-cart-btn" class="btn-primary" style="padding: 1rem 2rem; font-size:1.1rem;" ${product.stockCount === 0 ? 'disabled' : ''}>
            ${product.stockCount === 0 ? 'Out of Stock' : 'Add to Cart'}
          </button>
        </div>
      </div>
    `;

    // Attach Cart Listener
    document.getElementById('add-to-cart-btn')?.addEventListener('click', () => {
      Cart.add(currentProduct);
    });

    // --- REVIEWS LOGIC ---
    renderReviews(product);

  } catch (err) {
    console.error(err);
    document.getElementById("product-container").innerHTML = "<p>Error loading product.</p>";
  }
}

// 4. Render Reviews & Form
function renderReviews(product) {
    const reviews = product.reviews || [];
    const reviewList = document.getElementById('reviews-list');
    
    if (reviews.length > 0) {
      reviewList.innerHTML = reviews.slice().reverse().map(r => `
          <li class="review-item">
            <div class="review-header">
              <span class="reviewer-name">${r.name || 'User'}</span>
              <span class="review-date">${new Date(r.createdAt).toLocaleDateString()}</span>
            </div>
            <div>${renderStars(Number(r.rating))}</div>
            <p style="margin-top:0.5rem;">${r.comment}</p>
          </li>
        `).join('');
    } else {
      reviewList.innerHTML = '<p style="color:#777; font-style:italic;">No reviews yet. Be the first!</p>';
    }

    // Review Form Logic
    const token = localStorage.getItem('vault_token');
    const wrapper = document.getElementById('review-form-wrapper');
    
    if (!token) {
      wrapper.innerHTML = `
        <div class="login-prompt">
          <p>Please <a href="login.html" style="color:var(--vault-blue);">Log In</a> to write a review.</p>
        </div>
      `;
    } else {
      wrapper.innerHTML = `
        <h3 style="margin-bottom:1rem;">Write a Review</h3>
        <form id="review-form">
          <div class="form-group">
            <label>Rating</label>
            <select name="rating" class="form-control" required>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>
          <div class="form-group">
            <label>Comment</label>
            <textarea name="comment" class="form-control" rows="3" required></textarea>
          </div>
          <button type="submit" class="btn-primary" data-loading>Submit Review</button>
        </form>
      `;

      // Handle Submit
      document.getElementById('review-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button[type="submit"]');
        window.Loaders?.start(btn, 'Submitting...');

        const formData = new FormData(e.target);
        const payload = {
          rating: formData.get('rating'),
          comment: formData.get('comment')
        };

        try {
          const r = await fetch(`/api/products/${id}/reviews`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
          });
          
          const out = await r.json();
          if (out.success) {
            alert('Review submitted!');
            location.reload(); // Reload to see new review
          } else {
            alert(out.message || 'Error submitting review');
          }
        } catch (err) {
          console.error(err);
          alert('Network Error');
        } finally {
          window.Loaders?.stop(btn);
        }
      });
    }
}

// Start
loadProduct();