// Simple Order page script: render products, manage cart, persist to localStorage
(function(){
  // Full PRODUCTS list derived from the printed menu (appetizers, burgers, chicken/seafood, sandwiches, pizza, salad bar)
  // Products with customizable: true will show a "Customize" button that opens a modal
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

    // BURGER BASKETS (customizable)
    { id: 'bur-bare', name: 'Bare Bear', desc: 'Plain hamburger on a bun. Includes choice of fries, tots or coleslaw', price: 10.50, customizable: true },
    { id: 'bur-cheesy', name: 'Cheesy Bear', desc: 'Choice of cheese (American, Pepperjack or Swiss). Includes side', price: 11.00, customizable: true },
    { id: 'bur-baconcheesy', name: 'Bacon Cheesy Bear', desc: "We've added bacon to our cheeseburger. Includes side", price: 12.00, customizable: true },
    { id: 'bur-mushroomswiss', name: 'Mushroom & Swiss Bear', desc: 'Swiss cheese and seasoned mushrooms. Includes side', price: 12.50, customizable: true },
    { id: 'bur-california', name: 'California Bear', desc: 'Lettuce, tomato, onion and mayo side. Add cheese $.50. Includes side', price: 13.00, customizable: true },
    { id: 'bur-hula', name: 'Hula Bear', desc: 'Teriyaki sauce, swiss cheese, bacon & grilled pineapple. Includes side', price: 14.00, customizable: true },
    { id: 'bur-ole', name: 'Ole Bear', desc: 'Topped with homemade bleu cheese dressing and bacon. Includes side', price: 14.00, customizable: true },
    { id: 'bur-brisket', name: 'Brisket Burger Bear', desc: 'Sliced brisket, cheddar & sautéed onions. Includes side', price: 14.00, customizable: true },
    { id: 'bur-western', name: 'Western Bacon Bear', desc: 'American cheese, BBQ sauce, bacon and onion petals. Includes side', price: 13.00, customizable: true },
    { id: 'bur-spicy', name: 'Spicy Bear', desc: "Nacho cheese, jalapeno peppers and drizzled with Frank's wing sauce. Includes side", price: 12.50, customizable: true },

    // CHICKEN & SEAFOOD
    { id: 'sea-shrimp', name: 'Shrimp', desc: 'Eight large shrimp fried to a golden brown served with tartar and/or cocktail sauce; includes side', price: 13.50 },
    { id: 'sea-sunfish', name: 'Sunfish', desc: 'Three sunfish fillets served with tartar sauce and a side of your choice', price: 14.50 },
    { id: 'sea-surfnsurf', name: 'Surf & Surf', desc: 'Two cod fillets plus four breaded shrimp; served with coleslaw and sauces', price: 13.50 },
    { id: 'sea-gizzards', name: 'Chicken Gizzards', desc: 'A half pound of golden fried chicken gizzards', price: 12.50 },
    { id: 'sea-boneless', name: 'Boneless Wings', desc: "Rolled in BBQ, Frank's wing sauce or teriyaki or on the side.", price: 12.50 },
    { id: 'sea-popcorn', name: 'Popcorn Chicken', desc: 'A generous portion served with your favorite sauce for dipping', price: 11.50 },
    { id: 'sea-strips', name: 'Chicken Strips', desc: '3-4 chicken strips (depending on size)', price: 12.50 },
    { id: 'sea-drummies', name: 'Chicken Drummies', desc: 'Five large chicken drummies', price: 13.00 },

    // SANDWICHES (customizable)
    { id: 'snd-fish', name: 'Fish Sandwich', desc: 'Large battered haddock fillet served on hoagie with lettuce & tomato. Add cheese $.50', price: 14.50, customizable: true },
    { id: 'snd-chicken', name: 'Chicken Sandwich', desc: 'Breaded or grilled chicken on toasted ciabatta with lettuce & tomato', price: 13.50, customizable: true },
    { id: 'snd-spicychicken', name: 'Spicy Chicken Sandwich', desc: "Dredged in Frank's Hot Sauce topped with pepper jack, lettuce & tomato", price: 14.50, customizable: true },
    { id: 'snd-chk-honey-bacon-swiss', name: 'Chicken, Honey Mustard, Bacon & Swiss', desc: 'Breaded or grilled chicken topped with swiss, bacon & honey mustard', price: 15.00, customizable: true },
    { id: 'snd-cordon', name: 'Chicken Cordon Blue', desc: 'Topped with ham & swiss on toasted ciabatta', price: 14.50, customizable: true },
    { id: 'snd-hula-grilled', name: 'Hula Grilled Chicken', desc: 'Grilled chicken with Swiss, bacon & pineapple drizzled with teriyaki', price: 14.50, customizable: true },
    { id: 'snd-frenchdip', name: 'French Dip', desc: 'Sliced roast beef & swiss on hoagie with au jus', price: 14.00, customizable: true },
    { id: 'snd-philly', name: 'Philly Cheesesteak', desc: 'Shredded roast beef, swiss, sautéed onions & peppers on hoagie', price: 14.50, customizable: true },
    { id: 'snd-steak', name: 'Steak Sandwich', desc: 'Grilled steak with sautéed onions & mushrooms on ciabatta', price: 14.50, customizable: true },
    { id: 'snd-porky', name: 'Porky Bear (Pork Tenderloin)', desc: '7oz breaded pork tenderloin with pickles & onion', price: 13.00, customizable: true },
    { id: 'snd-brisket', name: 'BBQ Brisket Sandwich', desc: 'Sliced beef brisket, cheddar, BBQ sauce & sautéed onions', price: 15.00, customizable: true },

    // SALAD BAR
    { id: 'sal-saladbar', name: 'Salad Bar', desc: 'Unlimited trips to our salad bar (Tue-Sat 4:30pm-8:00pm)', price: 13.00 },

    // JIMMY'S PIZZA (all pizzas same price)
    { id: 'piz-meatlovers', name: "Meat Lovers Pizza", desc: 'Sausage, Pepperoni, Beef & Canadian Bacon', price: 13.00 },
    { id: 'piz-chickenbaconranch', name: "Chicken Bacon Ranch Pizza", desc: '', price: 13.00 },
    { id: 'piz-cheese', name: 'Cheese Pizza', desc: '', price: 13.00 },
    { id: 'piz-pepperoni', name: 'Pepperoni Pizza', desc: '', price: 13.00 },
    { id: 'piz-deluxe', name: 'Deluxe Pizza', desc: 'Pepperoni, Sausage, Mushrooms, Onion and Green Peppers', price: 13.00 }
  ];

  // Customization options for burgers and sandwiches
  const CUSTOMIZATION_OPTIONS = {
    burger: {
      cheese: [
        { id: 'no-cheese', label: 'No Cheese', price: 0 },
        { id: 'american', label: 'American Cheese', price: 0 },
        { id: 'pepperjack', label: 'Pepper Jack Cheese', price: 0 },
        { id: 'swiss', label: 'Swiss Cheese', price: 0 },
        { id: 'cheddar', label: 'Cheddar Cheese', price: 0 }
      ],
      toppings: [
        { id: 'lettuce', label: 'Lettuce', price: 0 },
        { id: 'tomato', label: 'Tomato', price: 0 },
        { id: 'onion', label: 'Onion', price: 0 },
        { id: 'pickles', label: 'Pickles', price: 0 },
        { id: 'bacon', label: 'Add Bacon', price: 1.50 },
        { id: 'mushrooms', label: 'Add Mushrooms', price: 1.00 },
        { id: 'jalapenos', label: 'Add Jalapeños', price: 0.50 }
      ],
      sauces: [
        { id: 'ketchup', label: 'Ketchup', price: 0 },
        { id: 'mustard', label: 'Mustard', price: 0 },
        { id: 'mayo', label: 'Mayo', price: 0 },
        { id: 'bbq', label: 'BBQ Sauce', price: 0 },
        { id: 'ranch', label: 'Ranch', price: 0 }
      ],
      sides: [
        { id: 'fries', label: 'French Fries', price: 0 },
        { id: 'tots', label: 'Tater Tots', price: 0 },
        { id: 'coleslaw', label: 'Coleslaw', price: 0 },
        { id: 'seasoned-fries', label: 'Seasoned Fries', price: 1.00 },
        { id: 'sweet-potato', label: 'Sweet Potato Fries', price: 2.00 },
        { id: 'onion-petals', label: 'Onion Petals', price: 2.00 }
      ]
    },
    sandwich: {
      bread: [
        { id: 'hoagie', label: 'Hoagie Bun', price: 0 },
        { id: 'ciabatta', label: 'Ciabatta', price: 0 },
        { id: 'wheat', label: 'Wheat Bread', price: 0 }
      ],
      cheese: [
        { id: 'no-cheese', label: 'No Cheese', price: 0 },
        { id: 'american', label: 'American Cheese', price: 0.50 },
        { id: 'pepperjack', label: 'Pepper Jack Cheese', price: 0.50 },
        { id: 'swiss', label: 'Swiss Cheese', price: 0.50 },
        { id: 'cheddar', label: 'Cheddar Cheese', price: 0.50 }
      ],
      toppings: [
        { id: 'lettuce', label: 'Lettuce', price: 0 },
        { id: 'tomato', label: 'Tomato', price: 0 },
        { id: 'onion', label: 'Onion', price: 0 },
        { id: 'pickles', label: 'Pickles', price: 0 },
        { id: 'bacon', label: 'Add Bacon', price: 1.50 }
      ],
      sauces: [
        { id: 'mayo', label: 'Mayo', price: 0 },
        { id: 'mustard', label: 'Mustard', price: 0 },
        { id: 'ranch', label: 'Ranch', price: 0 },
        { id: 'honey-mustard', label: 'Honey Mustard', price: 0 }
      ],
      sides: [
        { id: 'fries', label: 'French Fries', price: 0 },
        { id: 'tots', label: 'Tater Tots', price: 0 },
        { id: 'coleslaw', label: 'Coleslaw', price: 0 },
        { id: 'seasoned-fries', label: 'Seasoned Fries', price: 1.00 },
        { id: 'sweet-potato', label: 'Sweet Potato Fries', price: 2.00 }
      ]
    }
  };

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

  // Render products grouped into sections (mirrors menu layout)
  function renderProducts(){
    if(!productsList) return;
    productsList.innerHTML = '';

    // helper to map id prefix to human-friendly section title
    const sectionMap = {
      app: 'Appetizers',
      bur: 'Burger Baskets',
      sea: 'Chicken & Seafood',
      snd: 'Sandwiches',
      sal: 'Salad Bar',
      piz: "Jimmy's Pizza"
    };

    // Group products by prefix before the first dash (e.g. 'app-', 'bur-')
    const groups = {};
    const order = []; // preserve insertion order
    PRODUCTS.forEach(p => {
      const prefix = (p.id || '').split('-')[0] || 'misc';
      if(!groups[prefix]){ groups[prefix] = []; order.push(prefix); }
      groups[prefix].push(p);
    });

    // Preferred section order if present, fall back to discovered order
    const preferred = ['app','bur','sea','snd','sal','piz'];
    const finalOrder = [];
    preferred.forEach(k => { if(groups[k]) finalOrder.push(k); });
    order.forEach(k => { if(!finalOrder.includes(k)) finalOrder.push(k); });

  // Remove the Salad Bar section from the Order page (not available for online ordering)
  const filteredOrder = finalOrder.filter(k => k !== 'sal');

  // Render each section with a heading and its products
  filteredOrder.forEach(sectionKey => {
      const products = groups[sectionKey];
      const title = sectionMap[sectionKey] || sectionKey;

      // section wrapper (gives meaningful anchor IDs for quick navigation)
      const sectionEl = document.createElement('section');
      sectionEl.className = 'order-section';
      sectionEl.id = `section-${sectionKey}`;

      const heading = document.createElement('h2');
      heading.className = 'order-category';
      heading.textContent = title;
      sectionEl.appendChild(heading);

      // Use the same descriptive copy used on the Menu page for consistency
      if(sectionKey === 'bur'){
        const desc = document.createElement('p');
        // match the menu page class so shared CSS rules apply
        desc.className = 'section-note';
        desc.textContent = 'Includes choice of french fries, tater tots or coleslaw. Upgrade to seasoned fries $1.00, sweet potato fries or onion petals $2.00 or salad bar $4.00. Extra burger patty $3.00';
        sectionEl.appendChild(desc);
      } else if(sectionKey === 'sea'){
        const desc = document.createElement('p');
        desc.className = 'section-note';
        desc.textContent = 'Includes choice of french fries, tater tots or coleslaw. Upgrade to seasoned fries $1.00, sweet potato fries or onion petals $2.00 or salad bar $4.00.';
        sectionEl.appendChild(desc);
      }

      const listWrap = document.createElement('div');
      listWrap.className = 'products-list-section';

      products.forEach(p => {
        const card = document.createElement('article');
        card.className = 'product-card modern-container';
        
        // Determine button text and action based on whether item is customizable
        const buttonText = p.customizable ? 'Customize' : 'Add to Cart';
        const buttonAction = p.customizable ? 'customize' : 'add';
        
        card.innerHTML = `
          <h3 class="product-name">${escapeHtml(p.name)}</h3>
          <p class="product-desc">${escapeHtml(p.desc)}</p>
          <div class="product-foot">
            <span class="product-price">${formatMoney(p.price)}</span>
            <button class="button ${buttonAction}-btn" data-id="${p.id}" aria-label="${buttonText} ${escapeHtml(p.name)}">
              <i class='bx ${p.customizable ? 'bx-edit' : 'bx-cart-alt'}'></i>
            </button>
          </div>
        `;
        listWrap.appendChild(card);
      });

      sectionEl.appendChild(listWrap);
      productsList.appendChild(sectionEl);
    });

    // Attach listeners to all add and customize buttons
    const addBtns = productsList.querySelectorAll('.add-btn');
    addBtns.forEach(btn => btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      addToCart(id, 1);
    }));
    
    const customizeBtns = productsList.querySelectorAll('.customize-btn');
    customizeBtns.forEach(btn => btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      openCustomizationModal(id);
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
        // Show customizations if present
        const descHtml = item.customizations ? `<div class="cart-item-desc muted">${escapeHtml(item.customizations)}</div>` : '';
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

    // update header cart badge
    updateCartBadge();
  }

  // update the small numeric badge on the header cart button
  function updateCartBadge(){
    if(!cartButton) return;
    const totalQty = Object.values(cart).reduce((s,i) => s + (i.qty || 0), 0);
    // find existing badge
    let badge = cartButton.querySelector('.cart-badge');
    if(totalQty > 0){
      if(!badge){
        badge = document.createElement('span');
        badge.className = 'cart-badge';
        badge.setAttribute('aria-hidden', 'false');
        cartButton.appendChild(badge);
      }
      badge.textContent = String(totalQty);
    } else {
      if(badge) badge.remove();
    }
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

  // Customization modal functions
  function openCustomizationModal(productId){
    const prod = PRODUCTS.find(p => p.id === productId);
    if(!prod || !prod.customizable) return;
    
    // Determine customization type (burger or sandwich)
    const custType = prod.id.startsWith('bur-') ? 'burger' : 'sandwich';
    const options = CUSTOMIZATION_OPTIONS[custType];
    
    // Create modal overlay
    const modal = document.createElement('div');
    modal.className = 'customize-modal-overlay';
    modal.innerHTML = `
      <div class="customize-modal" role="dialog" aria-modal="true" aria-labelledby="customize-title">
        <div class="customize-header">
          <h2 id="customize-title">Customize ${escapeHtml(prod.name)}</h2>
          <button class="customize-close" aria-label="Close customization"><i class='bx bx-x'></i></button>
        </div>
        <div class="customize-body">
          <form id="customize-form" class="customize-form">
            ${custType === 'sandwich' ? renderCustomSection('Bread Choice', 'bread', options.bread, 'radio') : ''}
            ${renderCustomSection('Cheese', 'cheese', options.cheese, 'radio')}
            ${renderCustomSection('Toppings', 'toppings', options.toppings, 'checkbox')}
            ${renderCustomSection('Sauces', 'sauces', options.sauces, 'checkbox')}
            ${renderCustomSection('Side Choice', 'sides', options.sides, 'radio')}
            
            <div class="customize-footer">
              <div class="customize-price">
                <span>Total:</span>
                <strong id="customize-total">${formatMoney(prod.price)}</strong>
              </div>
              <button type="submit" class="button button-primary">Add to Cart</button>
            </div>
          </form>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Set defaults
    const form = modal.querySelector('#customize-form');
    if(custType === 'sandwich'){
      form.querySelector('input[name="bread"][value="hoagie"]').checked = true;
    }
    form.querySelector('input[name="cheese"][value="american"]').checked = true;
    form.querySelector('input[name="sides"][value="fries"]').checked = true;
    
    // Update total when options change
    const updateTotal = () => {
      let total = prod.price;
      const formData = new FormData(form);
      
      // Calculate additional costs
      for(const category in options){
        const items = options[category];
        const selected = formData.getAll(category);
        selected.forEach(val => {
          const item = items.find(i => i.id === val);
          if(item) total += item.price;
        });
      }
      
      modal.querySelector('#customize-total').textContent = formatMoney(total);
    };
    
    form.addEventListener('change', updateTotal);
    
    // Handle form submission
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const customizations = {};
      
      for(const category in options){
        customizations[category] = formData.getAll(category);
      }
      
      addCustomizedToCart(productId, customizations);
      closeCustomizationModal(modal);
    });
    
    // Close button
    modal.querySelector('.customize-close').addEventListener('click', () => {
      closeCustomizationModal(modal);
    });
    
    // Click outside to close
    modal.addEventListener('click', (e) => {
      if(e.target === modal) closeCustomizationModal(modal);
    });
    
    // Escape to close
    const escapeHandler = (e) => {
      if(e.key === 'Escape'){
        closeCustomizationModal(modal);
        document.removeEventListener('keydown', escapeHandler);
      }
    };
    document.addEventListener('keydown', escapeHandler);
    
    // Show modal with animation
    setTimeout(() => modal.classList.add('open'), 10);
  }
  
  function renderCustomSection(title, category, items, inputType){
    return `
      <fieldset class="customize-section">
        <legend>${title}</legend>
        <div class="customize-options">
          ${items.map(item => `
            <label class="customize-option">
              <input type="${inputType}" name="${category}" value="${item.id}">
              <span class="option-label">${escapeHtml(item.label)}</span>
              ${item.price > 0 ? `<span class="option-price">+${formatMoney(item.price)}</span>` : ''}
            </label>
          `).join('')}
        </div>
      </fieldset>
    `;
  }
  
  function closeCustomizationModal(modal){
    modal.classList.remove('open');
    setTimeout(() => modal.remove(), 300);
  }
  
  function addCustomizedToCart(productId, customizations){
    const prod = PRODUCTS.find(p => p.id === productId);
    if(!prod) return;
    
    // Calculate total price with customizations
    let totalPrice = prod.price;
    const custType = prod.id.startsWith('bur-') ? 'burger' : 'sandwich';
    const options = CUSTOMIZATION_OPTIONS[custType];
    
    for(const category in customizations){
      const selected = customizations[category];
      if(options[category]){
        selected.forEach(val => {
          const item = options[category].find(i => i.id === val);
          if(item) totalPrice += item.price;
        });
      }
    }
    
    // Create a unique cart ID with customizations
    const customHash = JSON.stringify(customizations);
    const cartId = `${productId}_${Date.now()}`;
    
    // Build description of customizations
    let customDesc = [];
    for(const category in customizations){
      if(options[category]){
        const labels = customizations[category].map(val => {
          const item = options[category].find(i => i.id === val);
          return item ? item.label : val;
        }).filter(Boolean);
        if(labels.length > 0){
          customDesc.push(`${category}: ${labels.join(', ')}`);
        }
      }
    }
    
    cart[cartId] = { 
      id: cartId, 
      name: prod.name, 
      price: totalPrice,
      customizations: customDesc.join(' | '),
      qty: 1 
    };
    
    saveCart();
    renderCart();
    flashCartMessage(`${prod.name} added to cart`);
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
