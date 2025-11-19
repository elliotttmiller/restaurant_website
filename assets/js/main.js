/*==================== SHOW MENU ====================*/
const showMenu = (toggleId, navMobileId) =>{
    const toggle = document.getElementById(toggleId),
    navMobile = document.getElementById(navMobileId)
    
    // Validate that variables exist
    if(toggle && navMobile){
        toggle.addEventListener('click', ()=>{
            // Toggle the show-menu class on mobile menu
            navMobile.classList.toggle('show-menu')
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
const getCurrentIcon = () => themeButton.classList.contains(iconTheme) ? 'bx-moon' : 'bx-sun'

// Function to update logo based on theme
const updateHeaderLogo = () => {
    if (document.body.classList.contains(darkTheme)) {
        headerLogo.src = 'assets/img/bear-trap-header-dark.svg'
    } else {
        headerLogo.src = 'assets/img/bear-trap-header-light.svg'
    }
}

// Function to update footer logo based on theme
const updateFooterLogo = () => {
    const footerLogo = document.querySelector('.footer__logo-img')
    if (footerLogo) {
        if (document.body.classList.contains(darkTheme)) {
            footerLogo.src = 'assets/img/bear-trap-footer-dark.svg'
        } else {
            footerLogo.src = 'assets/img/bear-trap-footer-light.svg'
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
}

// We validate if the user previously chose a topic
if (selectedTheme) {
  // If the validation is fulfilled, we ask what the issue was to know if we activated or deactivated the dark
  document.body.classList[selectedTheme === 'dark' ? 'add' : 'remove'](darkTheme)
  themeButton.classList[selectedIcon === 'bx-moon' ? 'add' : 'remove'](iconTheme)
  if(themeButtonMobile) themeButtonMobile.classList[selectedIcon === 'bx-moon' ? 'add' : 'remove'](iconTheme)
  updateHeaderLogo()
  updateFooterLogo()
}

// Activate / deactivate the theme manually with the button (desktop)
themeButton.addEventListener('click', toggleTheme)

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