// Simple Order page script: render products, manage cart, persist to localStorage
(function(){
  const PRODUCTS = [
    { id: 'b1', name: 'Bear Trap Burger', desc: '8oz Angus patty, lettuce, tomato, special sauce', price: 11.95 },
    { id: 'f1', name: 'Fried Cauliflower or Mushrooms', desc: 'Lightly battered, served with ranch', price: 8.50 },
    { id: 'c1', name: 'Classic Caesar Salad', desc: 'Romaine, parmesan, house caesar', price: 7.25 },
    { id: 'b2', name: 'Basket of Fries', desc: 'Crispy seasoned fries', price: 4.50 }
  ];

  const STORAGE_KEY = 'bt_cart_v1';

  // DOM refs
  const productsList = document.getElementById('products-list');
  const cartItemsEl = document.getElementById('cart-items');
  const cartSubtotal = document.getElementById('cart-subtotal');
  const cartTax = document.getElementById('cart-tax');
  const cartTotal = document.getElementById('cart-total');
  const clearCartBtn = document.getElementById('clear-cart');
  const placeOrderBtn = document.getElementById('place-order');
  const checkoutForm = document.getElementById('checkout-form');
  const orderMessage = document.getElementById('order-message');
  const cartButton = document.getElementById('cart-button');

  let cart = loadCart();

  // Render products
  function renderProducts(){
    if(!productsList) return;
    productsList.innerHTML = '';
    PRODUCTS.forEach(p => {
      const card = document.createElement('article');
      card.className = 'product-card modern-container';
      card.innerHTML = `
        <h3 class="product-name">${escapeHtml(p.name)}</h3>
        <p class="product-desc">${escapeHtml(p.desc)}</p>
        <div class="product-foot">
          <span class="product-price">${formatMoney(p.price)}</span>
          <button class="button add-to-cart" data-id="${p.id}">Add</button>
        </div>
      `;
      productsList.appendChild(card);
    });

    // Attach listeners
    const addBtns = productsList.querySelectorAll('.add-to-cart');
    addBtns.forEach(btn => btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      addToCart(id, 1);
    }));
  }

  // Cart functions
  function loadCart(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      if(!raw) return {};
      return JSON.parse(raw) || {};
    }catch(e){
      console.warn('Failed to load cart', e);
      return {};
    }
  }

  function saveCart(){
    try{
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    }catch(e){
      console.warn('Failed to save cart', e);
    }
  }

  function addToCart(productId, qty = 1){
    if(!productId) return;
    const prod = PRODUCTS.find(p => p.id === productId);
    if(!prod) return;
    if(!cart[productId]) cart[productId] = { ...prod, qty: 0 };
    cart[productId].qty += qty;
    saveCart();
    renderCart();
    flashCartMessage(`${prod.name} added to cart`);
  }

  function removeFromCart(productId){
    if(!cart[productId]) return;
    delete cart[productId];
    saveCart();
    renderCart();
  }

  function updateQty(productId, qty){
    if(!cart[productId]) return;
    const q = parseInt(qty, 10) || 0;
    if(q <= 0){
      removeFromCart(productId);
    } else {
      cart[productId].qty = q;
      saveCart();
      renderCart();
    }
  }

  function clearCart(){
    cart = {};
    saveCart();
    renderCart();
  }

  function computeTotals(){
    const items = Object.values(cart);
    const subtotal = items.reduce((s,i) => s + (i.price * i.qty), 0);
    const tax = subtotal * 0.06;
    const total = subtotal + tax;
    return { subtotal, tax, total };
  }

  function renderCart(){
    if(!cartItemsEl) return;
    const items = Object.values(cart);
    cartItemsEl.innerHTML = '';
    if(items.length === 0){
      cartItemsEl.innerHTML = '<p class="muted">Your cart is empty</p>';
    } else {
      const list = document.createElement('div');
      list.className = 'cart-list';
      items.forEach(item => {
        const row = document.createElement('div');
        row.className = 'cart-item';
        row.innerHTML = `
          <div class="cart-item-left">
            <div class="cart-item-name">${escapeHtml(item.name)}</div>
            <div class="cart-item-desc muted">${escapeHtml(item.desc)}</div>
          </div>
          <div class="cart-item-right">
            <div class="cart-item-controls">
              <input class="cart-qty" type="number" min="1" value="${item.qty}" data-id="${item.id}" aria-label="Quantity for ${escapeHtml(item.name)}">
              <button class="button cart-remove" data-id="${item.id}">Remove</button>
            </div>
            <div class="cart-item-price">${formatMoney(item.price * item.qty)}</div>
          </div>
        `;
        list.appendChild(row);
      });
      cartItemsEl.appendChild(list);

      // attach qty change & remove handlers
      cartItemsEl.querySelectorAll('.cart-qty').forEach(input => {
        input.addEventListener('change', (e) => {
          const id = input.getAttribute('data-id');
          updateQty(id, input.value);
        });
      });
      cartItemsEl.querySelectorAll('.cart-remove').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          removeFromCart(id);
        });
      });
    }

    const totals = computeTotals();
    if(cartSubtotal) cartSubtotal.textContent = formatMoney(totals.subtotal);
    if(cartTax) cartTax.textContent = formatMoney(totals.tax);
    if(cartTotal) cartTotal.textContent = formatMoney(totals.total);
  }

  // Small helpers
  function formatMoney(n){
    return '$' + n.toFixed(2);
  }

  function escapeHtml(s){
    if(!s) return '';
    return String(s).replace(/[&<>\"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[c];
    });
  }

  function flashCartMessage(msg){
    if(!orderMessage) return;
    orderMessage.textContent = msg;
    orderMessage.classList.add('visible');
    setTimeout(() => {
      orderMessage.classList.remove('visible');
      orderMessage.textContent = '';
    }, 2500);
  }

  // Cart button behaviour: scroll to cart panel (on this page) and give it focus
  function wireCartButton(){
    if(!cartButton) return;
    cartButton.addEventListener('click', (e) => {
      // Prevent the default anchor navigation so we can smoothly scroll to the cart panel
      if (e && typeof e.preventDefault === 'function') e.preventDefault();
      const cartPanel = document.querySelector('.cart-panel');
      if(cartPanel){
        cartPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // focus first input if any
        const focusable = cartPanel.querySelector('input, button, [tabindex]');
        if(focusable) focusable.focus();
      }
    });
  }

  // Checkout form: for now, do not submit orders to a backend. Show a friendly message and clear cart.
  function wireCheckout(){
    if(!checkoutForm) return;
    checkoutForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const totals = computeTotals();
      if(totals.subtotal <= 0){
        flashCartMessage('Add items to your cart before placing an order.');
        return;
      }
      // simulate order placement
      flashCartMessage('Order placed (demo). We do not process payments here.');
      clearCart();
      checkoutForm.reset();
    });
  }

  // Clear cart button
  function wireClearCart(){
    if(!clearCartBtn) return;
    clearCartBtn.addEventListener('click', (e) => {
      e.preventDefault();
      clearCart();
      flashCartMessage('Cart cleared');
    });
  }

  // Initialization
  function init(){
    renderProducts();
    renderCart();
    wireClearCart();
    wireCheckout();
    wireCartButton();

    // expose for debugging
    window.__bt_cart = cart;
  }

  // run
  document.addEventListener('DOMContentLoaded', init);
})();
