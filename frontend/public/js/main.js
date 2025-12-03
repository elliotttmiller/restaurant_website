/*==================== SHOW MENU ====================*/
const showMenu = (toggleId, navMobileId) =>{
    const toggle = document.getElementById(toggleId),
    navMobile = document.getElementById(navMobileId)
    
    // Validate that variables exist
    if(toggle && navMobile){
        // ensure toggle is keyboard accessible
        toggle.setAttribute('role','button')
        toggle.setAttribute('aria-controls', navMobileId)
        toggle.setAttribute('aria-expanded', 'false')

        toggle.addEventListener('click', ()=>{
            // Toggle the show-menu class on mobile menu
            const opening = !navMobile.classList.contains('show-menu')
            navMobile.classList.toggle('show-menu')
            toggle.setAttribute('aria-expanded', opening ? 'true' : 'false')

            if(opening){
                // focus the first link inside the mobile nav for keyboard users
                const first = navMobile.querySelector('a, button, [tabindex]')
                if(first && typeof first.focus === 'function') first.focus()
            } else {
                // return focus to the toggle for accessibility
                if(typeof toggle.focus === 'function') toggle.focus()
            }
        })
    }
}
showMenu('nav-toggle','nav-menu-mobile')

/*==================== REMOVE MENU MOBILE ====================*/
const navLink = document.querySelectorAll('.nav__link')

function linkAction(){
    const navMenuMobile = document.getElementById('nav-menu-mobile')
    // When we click on each nav__link, we remove the show-menu class
    if(navMenuMobile){
        navMenuMobile.classList.remove('show-menu')
        // update aria-expanded on toggle button if present
        const toggle = document.getElementById('nav-toggle')
        if(toggle) toggle.setAttribute('aria-expanded', 'false')
    }
}
navLink.forEach(n => n.addEventListener('click', linkAction))

/*==================== SCROLL SECTIONS ACTIVE LINK ====================*/
const sections = document.querySelectorAll('section[id]')

function scrollActive(){
    const scrollY = window.pageYOffset

    sections.forEach(current =>{
        const sectionHeight = current.offsetHeight
        const sectionTop = current.offsetTop - 50;
        sectionId = current.getAttribute('id')

        if(scrollY > sectionTop && scrollY <= sectionTop + sectionHeight){
            const links = document.querySelectorAll('.nav__menu a[href*=' + sectionId + ']')
            links.forEach(link => link.classList.add('active-link'))
        }else{
            const links = document.querySelectorAll('.nav__menu a[href*=' + sectionId + ']')
            links.forEach(link => link.classList.remove('active-link'))
        }
    })
}
window.addEventListener('scroll', scrollActive)

/*==================== CHANGE BACKGROUND HEADER ====================*/ 
function scrollHeader(){
    const nav = document.getElementById('header')
    // When the scroll is greater than 200 viewport height, add the scroll-header class to the header tag
    if(this.scrollY >= 200) nav.classList.add('scroll-header'); else nav.classList.remove('scroll-header')
}
window.addEventListener('scroll', scrollHeader)

/*==================== SHOW SCROLL TOP ====================*/ 
function scrollTop(){
    const scrollTop = document.getElementById('scroll-top');
    // When the scroll is higher than 560 viewport height, add the show-scroll class to the a tag with the scroll-top class
    if(this.scrollY >= 560) scrollTop.classList.add('show-scroll'); else scrollTop.classList.remove('show-scroll')
}
window.addEventListener('scroll', scrollTop)

/*==================== DARK LIGHT THEME ====================*/ 
const themeButton = document.getElementById('theme-button')
const themeButtonMobile = document.getElementById('theme-button-mobile')
const darkTheme = 'dark-theme'
const iconTheme = 'bx-sun'
const headerLogo = document.getElementById('header-logo')

// Previously selected topic (if user selected)
const selectedTheme = localStorage.getItem('selected-theme')
const selectedIcon = localStorage.getItem('selected-icon')

// We obtain the current theme that the interface has by validating the dark-theme class
const getCurrentTheme = () => document.body.classList.contains(darkTheme) ? 'dark' : 'light'
// Guard access to themeButton in case the element is missing on a page
const getCurrentIcon = () => {
    if (!themeButton) return 'bx-sun'
    return themeButton.classList.contains(iconTheme) ? 'bx-moon' : 'bx-sun'
}

// Function to update logo based on theme (safe: no-op if header not present)
const updateHeaderLogo = () => {
    if (!headerLogo) return;
    // Determine desired src (use relative path so comparisons are reliable)
    const desired = document.body.classList.contains(darkTheme)
    ? 'img/bear-trap-header-dark.svg'
    : 'img/bear-trap-header-light.svg'
    // Use getAttribute to compare the raw attribute value (avoids absolute URL differences)
    const current = headerLogo.getAttribute('src') || ''
    if (current !== desired) {
        headerLogo.setAttribute('src', desired)
        // Also set the DOM property for immediate rendering
        try { headerLogo.src = desired } catch (e) { /* ignore */ }
    }
}
    // Function to update menu logo based on theme (menu page only)
    const updateMenuLogo = () => {
        const menuLogo = document.querySelector('.menu-logo')
        if (!menuLogo) return
        if (document.body.classList.contains(darkTheme)) {
            menuLogo.src = 'img/menu-logo-dark.svg'
        } else {
            menuLogo.src = 'img/menu-logo-light.svg'
        }
    }

// Function to update footer logo based on theme
const updateFooterLogo = () => {
    const footerLogo = document.querySelector('.footer__logo-img')
    if (footerLogo) {
        if (document.body.classList.contains(darkTheme)) {
            footerLogo.src = 'img/bear-trap-footer-dark.svg'
        } else {
            footerLogo.src = 'img/bear-trap-footer-light.svg'
        }
    }
}

// Function to toggle theme
const toggleTheme = () => {
    document.body.classList.toggle(darkTheme)
    themeButton.classList.toggle(iconTheme)
    if(themeButtonMobile) themeButtonMobile.classList.toggle(iconTheme)
    localStorage.setItem('selected-theme', getCurrentTheme())
    localStorage.setItem('selected-icon', getCurrentIcon())
    updateHeaderLogo()
    updateFooterLogo()
        updateMenuLogo()
}

// We validate if the user previously chose a topic
if (selectedTheme) {
    // If the validation is fulfilled, we apply the stored theme safely
    document.body.classList[selectedTheme === 'dark' ? 'add' : 'remove'](darkTheme)
    if (themeButton) themeButton.classList[selectedIcon === 'bx-moon' ? 'add' : 'remove'](iconTheme)
    if (themeButtonMobile) themeButtonMobile.classList[selectedIcon === 'bx-moon' ? 'add' : 'remove'](iconTheme)
    // Ensure logos are updated to reflect the restored theme
    try { updateHeaderLogo() } catch (e) { /* ignore */ }
    try { updateFooterLogo() } catch (e) { /* ignore */ }
    try { updateMenuLogo() } catch (e) { /* ignore */ }
}

// Ensure header/footer logos reflect the current theme on every page load.
// This is intentionally minimal and only sets the image src if the elements exist.
// Update logos on load (call directly and also on DOMContentLoaded to be robust)
try { updateHeaderLogo(); updateFooterLogo(); updateMenuLogo(); } catch (e) { /* ignore */ }
document.addEventListener('DOMContentLoaded', () => {
    try { updateHeaderLogo(); updateFooterLogo(); updateMenuLogo(); } catch (e) { /* ignore */ }
});

// Activate / deactivate the theme manually with the button (desktop)
if (themeButton) themeButton.addEventListener('click', toggleTheme)

// Activate / deactivate the theme manually with the button (mobile)
if(themeButtonMobile){
    themeButtonMobile.addEventListener('click', toggleTheme)
}

/*==================== SCROLL REVEAL ANIMATION ====================*/
const sr = ScrollReveal({
    origin: 'top',
    distance: '30px',
    duration: 2000,
    reset: true
});

sr.reveal(`.home__data, .home__img,
            .about__data, .about__img,
            .services__content, .menu__content,
            .app__data, .app__img,
            .contact__data, .contact__button,
            .footer__content`, {
    interval: 200
})

/*==================== CLICKABLE SPECIALS ICONS ====================*/
const specialsLinks = document.querySelectorAll('.specials__link');

specialsLinks.forEach(link => {
    link.addEventListener('click', () => {
        const url = link.getAttribute('data-url');
        if (url) {
            if (url.startsWith('tel:')) {
                window.location.href = url;
            } else {
                window.open(url, '_blank');
            }
        }
    });
});

/*==================== MENU TITLE LINE DETECTION ====================*/
// Tag .menu-item with .single-line or .two-line depending on whether
// .item-name wraps to multiple lines. This allows CSS to tighten spacing
// for single-line items only.
function tagMenuTitleLines() {
    const items = document.querySelectorAll('.menu-item');
    items.forEach(item => {
        const title = item.querySelector('.item-name');
        if (!title) return;

        const cs = window.getComputedStyle(title);
        // Parse line-height; fallback to computed font-size * 1.2 if 'normal'
        let lineHeight = cs.lineHeight;
        let lh = 0;
        if (lineHeight === 'normal') {
            lh = parseFloat(cs.fontSize) * 1.2;
        } else {
            lh = parseFloat(lineHeight);
        }

        // Use offsetHeight to get the rendered height including fractional pixels
        const titleHeight = title.offsetHeight;

        // If titleHeight is greater than one line height (with small tolerance), it's multi-line
        const isMulti = titleHeight > (lh + 1); // 1px tolerance

        item.classList.remove('single-line', 'two-line');
        item.classList.add(isMulti ? 'two-line' : 'single-line');
    });
}

// Run on DOMContentLoaded and on resize (debounced)
document.addEventListener('DOMContentLoaded', () => {
    tagMenuTitleLines();
});

// Debug helper: print header icon presence and computed styles when page loads.
// Useful to diagnose why theme/cart icons appear on some pages but not others.
document.addEventListener('DOMContentLoaded', () => {
    try {
        const elTheme = document.getElementById('theme-button');
        const elCart = document.getElementById('cart-button');
        const info = (el) => {
            if (!el) return { found: false };
            const cs = window.getComputedStyle(el);
            const rect = el.getBoundingClientRect();
            return {
                found: true,
                tag: el.tagName,
                classes: Array.from(el.classList || []),
                display: cs.display,
                visibility: cs.visibility,
                opacity: cs.opacity,
                zIndex: cs.zIndex,
                rect: { x: rect.x, y: rect.y, w: rect.width, h: rect.height },
                offsetParent: el.offsetParent ? el.offsetParent.tagName : null,
                innerHTML: el.innerHTML && el.innerHTML.trim().slice(0,80)
            };
        };
        console.info('[HEADER DEBUG] theme-button:', info(elTheme));
        console.info('[HEADER DEBUG] cart-button:', info(elCart));
    } catch (e) {
        console.warn('Header debug failed', e);
    }
});

let _menuTitleResizeTimer = null;
window.addEventListener('resize', () => {
    clearTimeout(_menuTitleResizeTimer);
    _menuTitleResizeTimer = setTimeout(() => {
        tagMenuTitleLines();
    }, 150);
});

/*==================== CART BUTTON BEHAVIOR (GLOBAL) ====================*/
const cartButtons = document.querySelectorAll('.cart-button');
const cartOverlay = document.getElementById('cart-overlay');

if (cartButtons && cartOverlay) {
    cartButtons.forEach(cartButton => {
        cartButton.addEventListener('click', (event) => {
            event.preventDefault(); // Prevent default anchor behavior
            const isHidden = cartOverlay.getAttribute('aria-hidden') === 'true';
            cartOverlay.setAttribute('aria-hidden', isHidden ? 'false' : 'true');
            cartOverlay.classList.toggle('show-cart', isHidden);
        });
    });
}