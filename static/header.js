/* ------------------------- */
/* MODERN HEADER FUNCTIONALITY */
/* ------------------------- */

const header = document.querySelector('.modern-header');
const navLinks = document.querySelectorAll('.nav-link');
const mobileMenu = document.querySelector('.mobile-menu');
const navigation = document.querySelector('.navigation');

// Sticky & scroll effects
window.addEventListener('scroll', () => {
  if(window.scrollY > 50){
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }
});

// Mobile menu toggle
mobileMenu.addEventListener('click', () => {
  navigation.classList.toggle('show');
  mobileMenu.classList.toggle('open');
});

// Active link detection
navLinks.forEach(link => {
  if(link.href === window.location.href){
    link.classList.add('active');
  }
});
