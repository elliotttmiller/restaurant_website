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

  // KIDS MENU
  { id: 'kid-popcorn', name: 'Popcorn Chicken', desc: '', price: 6.00 },
  { id: 'kid-minicorndogs', name: 'Mini Corndogs', desc: '', price: 6.00 },
  { id: 'kid-cheeseburger', name: 'Cheese Burger', desc: '', price: 6.00 },
  { id: 'kid-macncheese', name: 'Macaroni & Cheese', desc: '', price: 6.00 },

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

  // UI state: current active category filter
  let currentCategory = 'all';

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
  const checkoutButton = document.getElementById('checkout-button');
  const checkoutModal = document.getElementById('checkout-modal');
  const checkoutModalClose = document.getElementById('checkout-modal-close');

  let cart = loadCart();

  // Render products grouped into sections (mirrors menu layout)
  function renderProducts(){
    if(!productsList) return;
    productsList.innerHTML = '';
    // Apply category filter before grouping
    const productsToRender = PRODUCTS.filter(p => {
      if(currentCategory === 'all') return true;
      if(currentCategory === 'pizza') return String(p.id).startsWith('piz');
      if(currentCategory === 'burgers') return String(p.id).startsWith('bur');
      if(currentCategory === 'appetizers' || currentCategory === 'app') return String(p.id).startsWith('app');
      if(currentCategory === 'sea' || currentCategory === 'chicken') return String(p.id).startsWith('sea');
      if(currentCategory === 'sandwiches' || currentCategory === 'snd') return String(p.id).startsWith('snd');
      if(currentCategory === 'kids') return (p.name || '').toLowerCase().includes('kids') || String(p.id).startsWith('kid');
      return true;
    });

    // helper to map id prefix to human-friendly section title
    const sectionMap = {
      app: 'Appetizers',
      kid: 'Kids Menu',
      bur: 'Burger Baskets',
      sea: 'Chicken & Seafood',
      snd: 'Sandwiches',
      sal: 'Salad Bar',
      piz: "Jimmy's Pizza"
    };

    // Group products by prefix before the first dash (e.g. 'app-', 'bur-')
    const groups = {};
    const order = []; // preserve insertion order
    productsToRender.forEach(p => {
      const prefix = (p.id || '').split('-')[0] || 'misc';
      if(!groups[prefix]){ groups[prefix] = []; order.push(prefix); }
      groups[prefix].push(p);
    });

    // Preferred section order if present, fall back to discovered order
  const preferred = ['app','bur','sea','snd','sal','piz'];
    const finalOrder = [];
    preferred.forEach(k => { if(groups[k]) finalOrder.push(k); });
    order.forEach(k => { if(!finalOrder.includes(k)) finalOrder.push(k); });
    // Ensure Kids Menu ('kid') appears at the end of the order when present
    if(groups['kid'] && !finalOrder.includes('kid')) finalOrder.push('kid');

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
      else if(sectionKey === 'kid'){
        const desc = document.createElement('p');
        desc.className = 'section-note';
        desc.textContent = 'All include a child size drink and fries for $6.00';
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
          <div class="product-meta">
            <h3 class="product-name">${escapeHtml(p.name)}</h3>
            <p class="product-desc">${escapeHtml(p.desc)}</p>
          </div>
          <div class="product-foot">
            <span class="product-price">${formatMoney(p.price)}</span>
            <button class="button ${buttonAction}-btn product-action-btn" data-id="${p.id}" aria-label="${buttonText} ${escapeHtml(p.name)}">
              <span class="btn-label">${buttonText}</span>
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

    // wire category tabs active state (in case tabs were clicked before render)
    const tabs = document.querySelectorAll('.category-tabs .tab');
    tabs.forEach(t => {
      t.classList.toggle('active', t.getAttribute('data-category') === currentCategory);
    });
  }

  // Set category filter and re-render products
  function setCategoryFilter(cat){
    currentCategory = cat || 'all';
    // update active class on tabs
    document.querySelectorAll('.category-tabs .tab').forEach(t => {
      t.classList.toggle('active', t.getAttribute('data-category') === currentCategory);
    });
    renderProducts();
  }

  function wireCategoryTabs(){
    // Wire both desktop tabs and mobile dropdown items
    const tabs = document.querySelectorAll('.category-tabs .tab, .category-dropdown-list .tab');
    tabs.forEach(tab => tab.addEventListener('click', (e) => {
      const cat = tab.getAttribute('data-category') || 'all';
      setCategoryFilter(cat);
      // if mobile dropdown is open, close it and update toggle label
      const dropdown = document.querySelector('.category-dropdown');
      const toggle = document.getElementById('category-dropdown-toggle');
      if(dropdown && dropdown.classList.contains('open')){
        dropdown.classList.remove('open');
        if(toggle) { toggle.setAttribute('aria-expanded','false'); toggle.textContent = (tab.textContent || 'Food Menu') + ' ▾'; }
      } else if(toggle){
        // update toggle label to selected category for clarity
        toggle.textContent = (tab.textContent || 'Food Menu') + ' ▾';
      }
    }));

    // Dropdown toggle behaviour (mobile)
    const dropdownToggle = document.getElementById('category-dropdown-toggle');
    const dropdownEl = document.querySelector('.category-dropdown');
    if(dropdownToggle && dropdownEl){
      dropdownToggle.addEventListener('click', (e) =>{
        e.stopPropagation();
        const open = dropdownEl.classList.toggle('open');
        dropdownToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });

      // click outside to close
      document.addEventListener('click', (e) => {
        if(!dropdownEl.contains(e.target)){
          if(dropdownEl.classList.contains('open')){
            dropdownEl.classList.remove('open');
            dropdownToggle.setAttribute('aria-expanded','false');
          }
        }
      });
    }
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
        // Determine if this is a Kids item (id prefix 'kid')
        const isKids = String(item.id || '').startsWith('kid');
        const kidsTag = isKids ? '<span class="kids-tag">(Kids)</span>' : '';
        const kidsDesc = isKids ? '<div class="cart-item-kids muted">Child size drink and fries</div>' : '';
        const customDesc = item.customizations ? `<div class="cart-item-desc muted">${escapeHtml(item.customizations)}</div>` : '';
        // Combine customizations and kids note (kids note shown below name)
        const descHtml = [customDesc, kidsDesc].filter(Boolean).join('');
        // layout: left (name) | right-group (qty stepper + price + remove)
        // Render a modern desktop stepper when on wider screens; fall back to numeric label on small screens
        const isDesktop = (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(min-width: 900px)').matches);

        const qtyControlHtml = isDesktop ? `
            <div class="qty-stepper" data-id="${item.id}" aria-label="Quantity control for ${escapeHtml(item.name)}">
              <button class="qty-btn qty-decrement" aria-label="Decrease quantity">−</button>
              <input class="qty-value" type="number" min="1" value="${item.qty}" aria-label="Quantity for ${escapeHtml(item.name)}">
              <button class="qty-btn qty-increment" aria-label="Increase quantity">+</button>
            </div>
          ` : `
            <div class="cart-qty" aria-hidden="false">${item.qty}</div>
          `;

        row.innerHTML = `
          <div class="cart-item-left">
            <div class="cart-item-name">${escapeHtml(item.name)} ${kidsTag}</div>
            ${descHtml}
          </div>
          <div class="cart-item-right">
            ${qtyControlHtml}
            <div class="cart-item-price">${formatMoney(item.price * item.qty)}</div>
            <button class="cart-remove" data-id="${item.id}" aria-label="Remove ${escapeHtml(item.name)}"><i class='bx bx-x'></i></button>
          </div>
        `;
        list.appendChild(row);
      });
      cartItemsEl.appendChild(list);
      // attach remove handlers
      cartItemsEl.querySelectorAll('.cart-remove').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          removeFromCart(id);
        });
      });

      // attach qty stepper handlers (desktop)
      cartItemsEl.querySelectorAll('.qty-stepper').forEach(stepper => {
        const id = stepper.getAttribute('data-id');
        const dec = stepper.querySelector('.qty-decrement');
        const inc = stepper.querySelector('.qty-increment');
        const input = stepper.querySelector('.qty-value');

        if(dec){ dec.addEventListener('click', (e) => {
          e.preventDefault();
          const next = Math.max(1, (parseInt(input.value, 10) || 1) - 1);
          updateQty(id, next);
        }); }

        if(inc){ inc.addEventListener('click', (e) => {
          e.preventDefault();
          const next = (parseInt(input.value, 10) || 1) + 1;
          updateQty(id, next);
        }); }

        if(input){
          input.addEventListener('change', (e) => {
            let v = parseInt(input.value, 10) || 1;
            if(v < 1) v = 1;
            updateQty(id, v);
          });

          // allow keyboard arrow adjustments locally before update
          input.addEventListener('keydown', (e) => {
            if(e.key === 'ArrowUp' || e.key === 'ArrowDown'){
              e.preventDefault();
              const cur = parseInt(input.value, 10) || 1;
              const nv = e.key === 'ArrowUp' ? cur + 1 : Math.max(1, cur - 1);
              input.value = nv;
            }
            if(e.key === 'Enter'){
              input.blur();
            }
          });
        }
      });

      // close any open qty menus when clicking outside
      document.addEventListener('click', (e) => {
        cartItemsEl.querySelectorAll('.cart-qty-wrap.open').forEach(w => {
          if(!w.contains(e.target)){
            w.classList.remove('open');
            const b = w.querySelector('.cart-qty-btn'); if(b) b.setAttribute('aria-expanded','false');
          }
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

  // Convert 24-hour time (HH:MM) to human-friendly 12-hour format with AM/PM
  function formatTimeToAmPm(hhmm){
    if(!hhmm) return '';
    const parts = String(hhmm).split(':');
    if(parts.length < 2) return hhmm;
    let h = parseInt(parts[0],10);
    const m = parts[1];
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if(h === 0) h = 12;
    return `${h}:${m} ${ampm}`;
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

  // Timing modal (ASAP / Schedule) - small lightweight modal
  function openTimingModal(){
    const modal = document.createElement('div');
    modal.className = 'timing-modal-overlay';
    modal.innerHTML = `
      <div class="timing-modal" role="dialog" aria-modal="true" aria-labelledby="timing-title">
        <div class="timing-header">
          <h3 id="timing-title">Order timing</h3>
          <button class="timing-close" aria-label="Close timing"><i class='bx bx-x'></i></button>
        </div>
        <div class="timing-body">
          <label class="timing-option"><input type="radio" name="timing" value="asap" checked> ASAP 15-25 min</label>
          <label class="timing-option schedule-row"><input type="radio" name="timing" value="schedule"> Schedule for later</label>
          <div class="schedule-time-row" style="display:none; margin-top:.6rem;">
            <label for="schedule-time">Choose time</label>
            <input id="schedule-time" type="time">
          </div>
        </div>
        <div class="timing-footer">
          <button class="button timing-cancel">Cancel</button>
          <button class="button button-primary timing-confirm">Confirm</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const close = () => {
      modal.classList.remove('open');
      setTimeout(() => modal.remove(), 220);
    };

    // show/hide time input
    const radios = modal.querySelectorAll('input[name="timing"]');
    const schedRow = modal.querySelector('.schedule-time-row');
    radios.forEach(r => r.addEventListener('change', () => {
      if(r.value === 'schedule' && r.checked){ schedRow.style.display = 'block'; }
      if(r.value === 'asap' && r.checked){ schedRow.style.display = 'none'; }
    }));

    modal.querySelector('.timing-close').addEventListener('click', close);
    modal.querySelector('.timing-cancel').addEventListener('click', (e) => { e.preventDefault(); close(); });

    modal.querySelector('.timing-confirm').addEventListener('click', (e) => {
      e.preventDefault();
      const selected = modal.querySelector('input[name="timing"]:checked').value;
      const toggle = document.getElementById('timing-toggle');
      if(!toggle) { close(); return; }
      if(selected === 'asap'){
        // On confirm, show a compact label and mark selection so auto-labeling won't override
        toggle.textContent = 'ASAP 15-25 min ▾';
        toggle.dataset.timing = 'asap';
      } else {
        const timeInput = modal.querySelector('#schedule-time');
        const t = timeInput && timeInput.value ? timeInput.value : '';
        const pretty = t ? formatTimeToAmPm(t) : '';
        toggle.textContent = pretty ? `Scheduled: ${pretty} ▾` : 'Scheduled ▾';
        toggle.dataset.timing = 'scheduled';
        if(t) toggle.dataset.timingValue = t;
      }
      close();
    });

    // click outside to close
    modal.addEventListener('click', (e) => { if(e.target === modal) close(); });
    document.addEventListener('keydown', function esc(e){ if(e.key === 'Escape'){ close(); document.removeEventListener('keydown', esc); } });

    setTimeout(() => modal.classList.add('open'), 10);
  }

  function wireTimingToggle(){
    const t = document.getElementById('timing-toggle');
    if(!t) return;
    // initialize timing state marker on the toggle
    t.dataset.timing = t.dataset.timing || 'default';

    // show a compact label on small screens for space savings (only when user hasn't chosen a timing)
    const applyCompactLabel = () => {
      try{
        if(t.dataset.timing === 'default'){
          if(window.matchMedia && window.matchMedia('(max-width: 768px)').matches){
            t.textContent = 'ASAP Pickup ▾';
          } else {
            // restore fuller label for larger screens
            t.textContent = 'ASAP · Pickup in 15 - 25 min ▾';
          }
        }
      }catch(e){ /* ignore */ }
    };

    applyCompactLabel();
    // update on resize
    window.addEventListener('resize', applyCompactLabel);

    t.addEventListener('click', (e) => {
      if(e && typeof e.preventDefault === 'function') e.preventDefault();
      openTimingModal();
    });
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
    
    // Create a unique cart ID with timestamp and random suffix to avoid collisions
    const cartId = `${productId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Build description of customizations with proper formatting
    let customDesc = [];
    const categoryNames = {
      'bread': 'Bread',
      'cheese': 'Cheese',
      'toppings': 'Toppings',
      'sauces': 'Sauces',
      'sides': 'Side'
    };
    
    for(const category in customizations){
      if(options[category]){
        const labels = customizations[category].map(val => {
          const item = options[category].find(i => i.id === val);
          return item ? item.label : val;
        }).filter(Boolean);
        if(labels.length > 0){
          const catName = categoryNames[category] || category;
          customDesc.push(`${catName}: ${labels.join(', ')}`);
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

  // Checkout form: Process payment through Square Web Payments SDK
  function wireCheckout(){
    if(!checkoutForm) return;
    checkoutForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      // Validate cart has items
      const totals = computeTotals();
      if(totals.subtotal <= 0){
        flashCartMessage('Add items to your cart before placing an order.');
        return;
      }

      // Get customer information
      const customerName = document.getElementById('customer-name')?.value?.trim();
      const customerPhone = document.getElementById('customer-phone')?.value?.trim();
      const customerEmail = document.getElementById('customer-email')?.value?.trim();

      // Validate required fields
      if (!customerName || !customerPhone) {
        flashCartMessage('Please fill in your name and phone number.');
        return;
      }

      // Prepare cart items for Square
      const cartItems = Object.values(cart).map(item => ({
        name: item.name,
        quantity: item.qty,
        price: item.price,
        customizations: item.customizations || '',
        totalPrice: item.price * item.qty
      }));

      // Prepare order data
      const orderData = {
        items: cartItems,
        subtotal: totals.subtotal,
        tax: totals.tax,
        total: totals.total
      };

      const customerData = {
        name: customerName,
        phone: customerPhone,
        email: customerEmail,
        pickupTime: getPickupTime(), // Get selected pickup time
        note: '' // Could add a notes field
      };

      // Disable submit button during processing
      const submitButton = document.getElementById('place-order');
      const originalText = submitButton.textContent;
      submitButton.disabled = true;
      submitButton.textContent = 'Processing...';

      try {
        // Check if Square Payment integration is available and initialized
        if (!window.SquarePayment || typeof window.SquarePayment.handleEcosystemCheckout !== 'function') {
          // Fallback: Square Payment SDK not loaded or not initialized
          // This means we need to handle payment differently or show an error
          throw new Error('Payment system is initializing. Please wait a moment and try again.');
        }

        // Use the Square Web Payments SDK integration for complete checkout
        // This handles: inventory check, customer management, order creation, payment processing
        const result = await window.SquarePayment.handleEcosystemCheckout(orderData, customerData);

        if (result.success) {
          // Payment successful!
          clearCart();
          checkoutForm.reset();
          
          // Show success message with order details
          const successMessage = `
            <div class="order-success">
              <i class='bx bx-check-circle' style="font-size: 3rem; color: var(--first-color);"></i>
              <h3>Order Placed Successfully!</h3>
              <p><strong>Order ID:</strong> ${result.orderId}</p>
              ${result.payment.receiptUrl ? `<p><a href="${result.payment.receiptUrl}" target="_blank" class="button">View Receipt</a></p>` : ''}
              <p>We'll have your order ready for pickup shortly.</p>
              <p>Estimated time: 15-25 minutes</p>
            </div>
          `;
          
          if(orderMessage) {
            orderMessage.innerHTML = successMessage;
            orderMessage.classList.add('visible');
            orderMessage.classList.add('success');
          }

          // Close cart drawer after a short delay
          setTimeout(() => {
            const overlay = document.getElementById('cart-overlay');
            if (overlay) {
              overlay.classList.remove('open');
              overlay.setAttribute('aria-hidden', 'true');
            }
          }, 3000);

          // Optional: Start polling for order status updates
          if (result.orderId) {
            startOrderStatusPolling(result.orderId);
          }
        } else {
          throw new Error(result.error || 'Payment failed');
        }
      
      } catch (error) {
        console.error('Checkout error:', error);
        const errorMessage = error.message || 'Payment failed. Please try again or call us to place your order.';
        flashCartMessage(errorMessage);
        if (window.SquarePayment && window.SquarePayment.showPaymentMessage) {
          window.SquarePayment.showPaymentMessage(errorMessage, 'error');
        }
      } finally {
        // Re-enable submit button
        submitButton.disabled = false;
        submitButton.textContent = originalText;
      }
    });
  }

  // Get selected pickup time from timing toggle
  function getPickupTime() {
    const toggle = document.getElementById('timing-toggle');
    if (!toggle) return 'ASAP';
    
    const timing = toggle.dataset.timing || 'default';
    if (timing === 'scheduled' && toggle.dataset.timingValue) {
      // Validate time format (HH:MM)
      if (!toggle.dataset.timingValue.match(/^\d{1,2}:\d{2}$/)) {
        console.warn('Invalid time format, defaulting to ASAP');
        return 'ASAP';
      }
      
      // Return scheduled time in ISO format
      const today = new Date();
      const [hours, minutes] = toggle.dataset.timingValue.split(':');
      today.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
      return today.toISOString();
    }
    
    return 'ASAP';
  }

  // Poll for order status updates (optional real-time updates)
  function startOrderStatusPolling(orderId) {
    if (!orderId) return;
    
    let pollCount = 0;
    const maxPolls = 20; // Poll for up to 10 minutes (20 polls × 30s = 600s)
    
    const pollInterval = setInterval(async () => {
      pollCount++;
      
      if (pollCount >= maxPolls) {
        clearInterval(pollInterval);
        return;
      }
      
      try {
        const response = await fetch(`/api/square/order-status/${orderId}`);
        if (!response.ok) {
          clearInterval(pollInterval);
          return;
        }
        
        const data = await response.json();
        if (data.success && data.status) {
          console.log(`Order ${orderId} status: ${data.status}`);
          
          // Update UI if needed based on status
          // DRAFT -> OPEN -> COMPLETED
          if (data.status === 'COMPLETED') {
            clearInterval(pollInterval);
            // Could show a notification that order is ready
          }
        }
      } catch (err) {
        console.warn('Order status poll error:', err);
      }
    }, 30000); // Poll every 30 seconds
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

  // Checkout Modal Behavior
  if (checkoutButton && checkoutModal && checkoutModalClose) {
    // Open modal on button click
    checkoutButton.addEventListener('click', (event) => {
      event.preventDefault();
      checkoutModal.setAttribute('aria-hidden', 'false');
      checkoutModal.classList.add('show-modal');
    });

    // Close modal on close button click
    checkoutModalClose.addEventListener('click', () => {
      checkoutModal.setAttribute('aria-hidden', 'true');
      checkoutModal.classList.remove('show-modal');
    });

    // Close modal on backdrop click
    checkoutModal.addEventListener('click', (event) => {
      if (event.target === checkoutModal) {
        checkoutModal.setAttribute('aria-hidden', 'true');
        checkoutModal.classList.remove('show-modal');
      }
    });
  }

  // Initialization
  function init(){
    renderProducts();
    renderCart();
    wireClearCart();
    wireCheckout();
    wireCartButton();
    wireTimingToggle();
    wireCategoryTabs();

    // expose for debugging
    window.__bt_cart = cart;
  }

  // run
  document.addEventListener('DOMContentLoaded', init);
})();
