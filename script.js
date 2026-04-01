const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');
const navLinks = document.querySelectorAll('.nav a');
const faqItems = document.querySelectorAll('.faq-item');
const yearEl = document.getElementById('year');

if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

if (navToggle && navMenu) {
  navToggle.addEventListener('click', () => {
    navMenu.classList.toggle('open');
    document.body.classList.toggle('menu-open', navMenu.classList.contains('open'));
  });

  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      navMenu.classList.remove('open');
      document.body.classList.remove('menu-open');
    });
  });

  document.addEventListener('click', (event) => {
    const isInsideNav = navMenu.contains(event.target);
    const isToggle = navToggle.contains(event.target);

    if (!isInsideNav && !isToggle) {
      navMenu.classList.remove('open');
      document.body.classList.remove('menu-open');
    }
  });
}

faqItems.forEach((item) => {
  const button = item.querySelector('.faq-question');

  button?.addEventListener('click', () => {
    const isActive = item.classList.contains('active');

    faqItems.forEach((faq) => faq.classList.remove('active'));

    if (!isActive) {
      item.classList.add('active');
    }
  });
});
