// Simple Order page script: render products, manage cart, persist to localStorage
(function(){
  // Full PRODUCTS list derived from the printed menu (appetizers, burgers, chicken/seafood, sandwiches, pizza, salad bar)
  const PRODUCTS = [
    // APPETIZERS
    { id: 'app-cowboy', name: 'Cowboy Bites', desc: 'Corn, bacon, cheese and jalapenos inside', price: 8.50 },
    { id: 'app-hamcheese', name: 'Ham & Cheese Balls', desc: '', price: 8.50 },
    { id: 'app-friedveg', name: 'Fried Cauliflower or Mushrooms', desc: 'Served with cheese sauce', price: 8.50 },
    { id: 'app-mozz', name: 'Mozzarella Sticks', desc: 'Served with marinara', price: 8.50 },
    { id: 'app-seasonedfries', name: 'Seasoned Fries', desc: '', price: 6.00 },
    { id: 'app-fries-tots', name: 'French Fries or Tater Tots', desc: '', price: 5.00 },
    { id: 'app-firecracker', name: 'Firecracker Shrimp', desc: 'Redhook Ale beer-battered shrimp rolled in red sweet chili sauce', price: 8.50 },
    { id: 'app-pizzabites', name: 'Pepperoni Pizza Bites', desc: 'Served with marinara', price: 8.00 },
    { id: 'app-curds', name: 'Cheese Curds', desc: 'Served with marinara', price: 8.50 },
    { id: 'app-friedpickles', name: 'Fried Pickles', desc: '', price: 8.50 },
    { id: 'app-minicorndogs', name: 'Mini Corndogs', desc: '', price: 8.50 },
    { id: 'app-eggrolls', name: 'Southwestern Egg Rolls', desc: 'Three large egg rolls served with Ranch', price: 9.00 },
    { id: 'app-onionpetals', name: 'Onion Petals', desc: '', price: 8.50 },
    { id: 'app-pretzel', name: 'Cheese Stuffed Pretzel', desc: 'Served with marinara or nacho cheese', price: 6.00 },
    { id: 'app-special', name: 'Appetizer Special', desc: 'Ask your server about our appetizer special of the month', price: 0.00 },

    // BURGER BASKETS
    { id: 'bur-bare', name: 'Bare Bear', desc: 'Plain hamburger on a bun. Includes choice of fries, tots or coleslaw', price: 10.50 },
    { id: 'bur-cheesy', name: 'Cheesy Bear', desc: 'Choice of cheese (American, Pepperjack or Swiss). Includes side', price: 11.00 },
    { id: 'bur-baconcheesy', name: 'Bacon Cheesy Bear', desc: "We've added bacon to our cheeseburger. Includes side", price: 12.00 },
    { id: 'bur-mushroomswiss', name: 'Mushroom & Swiss Bear', desc: 'Swiss cheese and seasoned mushrooms. Includes side', price: 12.50 },
    { id: 'bur-california', name: 'California Bear', desc: 'Lettuce, tomato, onion and mayo side. Add cheese $.50. Includes side', price: 13.00 },
    { id: 'bur-hula', name: 'Hula Bear', desc: 'Teriyaki sauce, swiss cheese, bacon & grilled pineapple. Includes side', price: 14.00 },
    { id: 'bur-ole', name: 'Ole Bear', desc: 'Topped with homemade bleu cheese dressing and bacon. Includes side', price: 14.00 },
    { id: 'bur-brisket', name: 'Brisket Burger Bear', desc: 'Sliced brisket, cheddar & sautéed onions. Includes side', price: 14.00 },
    { id: 'bur-western', name: 'Western Bacon Bear', desc: 'American cheese, BBQ sauce, bacon and onion petals. Includes side', price: 13.00 },
    { id: 'bur-spicy', name: 'Spicy Bear', desc: "Nacho cheese, jalapeno peppers and drizzled with Frank's wing sauce. Includes side", price: 12.50 },

    // CHICKEN & SEAFOOD
    { id: 'sea-shrimp', name: 'Shrimp', desc: 'Eight large shrimp fried to a golden brown served with tartar and/or cocktail sauce; includes side', price: 13.50 },
    { id: 'sea-sunfish', name: 'Sunfish', desc: 'Three sunfish fillets served with tartar sauce and a side of your choice', price: 14.50 },
    { id: 'sea-surfnsurf', name: 'Surf & Surf', desc: 'Two cod fillets plus four breaded shrimp; served with coleslaw and sauces', price: 13.50 },
    { id: 'sea-gizzards', name: 'Chicken Gizzards', desc: 'A half pound of golden fried chicken gizzards', price: 12.50 },
    { id: 'sea-boneless', name: 'Boneless Wings', desc: "Rolled in BBQ, Frank's wing sauce or teriyaki or on the side.", price: 12.50 },
    { id: 'sea-popcorn', name: 'Popcorn Chicken', desc: 'A generous portion served with your favorite sauce for dipping', price: 11.50 },
    { id: 'sea-strips', name: 'Chicken Strips', desc: '3-4 chicken strips (depending on size)', price: 12.50 },
    { id: 'sea-drummies', name: 'Chicken Drummies', desc: 'Five large chicken drummies', price: 13.00 },

    // SANDWICHES
    { id: 'snd-fish', name: 'Fish Sandwich', desc: 'Large battered haddock fillet served on hoagie with lettuce & tomato. Add cheese $.50', price: 14.50 },
    { id: 'snd-chicken', name: 'Chicken Sandwich', desc: 'Breaded or grilled chicken on toasted ciabatta with lettuce & tomato', price: 13.50 },
    { id: 'snd-spicychicken', name: 'Spicy Chicken Sandwich', desc: "Dredged in Frank's Hot Sauce topped with pepper jack, lettuce & tomato", price: 14.50 },
    { id: 'snd-chk-honey-bacon-swiss', name: 'Chicken, Honey Mustard, Bacon & Swiss', desc: 'Breaded or grilled chicken topped with swiss, bacon & honey mustard', price: 15.00 },
    { id: 'snd-cordon', name: 'Chicken Cordon Blue', desc: 'Topped with ham & swiss on toasted ciabatta', price: 14.50 },
    { id: 'snd-hula-grilled', name: 'Hula Grilled Chicken', desc: 'Grilled chicken with Swiss, bacon & pineapple drizzled with teriyaki', price: 14.50 },
    { id: 'snd-frenchdip', name: 'French Dip', desc: 'Sliced roast beef & swiss on hoagie with au jus', price: 14.00 },
    { id: 'snd-philly', name: 'Philly Cheesesteak', desc: 'Shredded roast beef, swiss, sautéed onions & peppers on hoagie', price: 14.50 },
    { id: 'snd-steak', name: 'Steak Sandwich', desc: 'Grilled steak with sautéed onions & mushrooms on ciabatta', price: 14.50 },
    { id: 'snd-porky', name: 'Porky Bear (Pork Tenderloin)', desc: '7oz breaded pork tenderloin with pickles & onion', price: 13.00 },
    { id: 'snd-brisket', name: 'BBQ Brisket Sandwich', desc: 'Sliced beef brisket, cheddar, BBQ sauce & sautéed onions', price: 15.00 },

    // SALAD BAR
    { id: 'sal-saladbar', name: 'Salad Bar', desc: 'Unlimited trips to our salad bar (Tue-Sat 4:30pm-8:00pm)', price: 13.00 },

    // JIMMY'S PIZZA (all pizzas same price)
    { id: 'piz-meatlovers', name: "Meat Lovers Pizza", desc: 'Sausage, Pepperoni, Beef & Canadian Bacon', price: 13.00 },
    { id: 'piz-chickenbaconranch', name: "Chicken Bacon Ranch Pizza", desc: '', price: 13.00 },
    { id: 'piz-cheese', name: 'Cheese Pizza', desc: '', price: 13.00 },
    { id: 'piz-pepperoni', name: 'Pepperoni Pizza', desc: '', price: 13.00 },
    { id: 'piz-deluxe', name: 'Deluxe Pizza', desc: 'Pepperoni, Sausage, Mushrooms, Onion and Green Peppers', price: 13.00 }
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
          <button class="button add-to-cart" data-id="${p.id}" aria-label="Add ${escapeHtml(p.name)} to cart"><i class='bx bx-cart-alt'></i></button>
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
    // store a minimal item shape in the cart (do not include full description)
    if(!cart[productId]) cart[productId] = { id: prod.id, name: prod.name, price: prod.price, qty: 0 };
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
        // description intentionally omitted in cart items
        const descHtml = item.desc ? `<div class="cart-item-desc muted">${escapeHtml(item.desc)}</div>` : '';
        // layout: left (name) | right-group (qty + price) with a small top-right remove icon
        row.innerHTML = `
          <div class="cart-item-left">
            <div class="cart-item-name">${escapeHtml(item.name)}</div>
            ${descHtml}
          </div>
          <input class="cart-qty" type="number" min="1" value="${item.qty}" data-id="${item.id}" aria-label="Quantity for ${escapeHtml(item.name)}">
          <div class="cart-item-price">${formatMoney(item.price * item.qty)}</div>
          <button class="cart-remove" data-id="${item.id}" aria-label="Remove ${escapeHtml(item.name)}"><i class='bx bx-x'></i></button>
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

  // Cart button behaviour: toggle the site-wide cart drawer overlay
  function wireCartButton(){
    if(!cartButton) return;

    const overlay = document.getElementById('cart-overlay');
    const cartClose = () => {
      if(!overlay) return;
      overlay.classList.remove('open');
      overlay.setAttribute('aria-hidden', 'true');
      // return focus to cart button for accessibility
      if(cartButton) cartButton.focus();
    };

    const openCart = () => {
      if(!overlay) return;
      overlay.classList.add('open');
      overlay.setAttribute('aria-hidden', 'false');
      // focus first interactive element inside drawer
      const focusable = overlay.querySelector('input, button, [tabindex]');
      if(focusable) focusable.focus();
    };

    cartButton.addEventListener('click', (e) => {
      if (e && typeof e.preventDefault === 'function') e.preventDefault();
      const overlayEl = document.getElementById('cart-overlay');
      if(!overlayEl) return;
      if(overlayEl.classList.contains('open')){
        cartClose();
      } else {
        openCart();
      }
    });

    // close button + overlay click to close
    document.addEventListener('click', (e) => {
      const overlayEl = document.getElementById('cart-overlay');
      if(!overlayEl) return;
      const closeBtn = document.getElementById('cart-close');
      if(closeBtn && e.target === closeBtn) { cartClose(); }
      // if click outside drawer (on overlay background), close
      if(e.target === overlayEl) cartClose();
    });

    // close on Escape
    document.addEventListener('keydown', (e) => {
      if(e.key === 'Escape'){
        const overlayEl = document.getElementById('cart-overlay');
        if(overlayEl && overlayEl.classList.contains('open')) cartClose();
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
