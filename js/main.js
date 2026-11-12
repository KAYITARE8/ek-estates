function renderHeader(activePage) {
  const pages = [
    { href: 'index.html', label: 'Home' },
    { href: 'properties.html', label: 'Properties' },
    { href: 'about.html', label: 'About' },
    { href: 'contact.html', label: 'Contact' }
  ];
  const navLinks = pages.map(p => `<a href="${p.href}" class="${activePage === p.href ? 'active' : ''}">${p.label}</a>`).join('');
  const user = typeof getUser === 'function' ? getUser() : null;
  const authBtn = user && user.token
    ? `<div class="user-account" id="userAccount">
        <button type="button" class="user-account-toggle" onclick="toggleUserMenu(event)" aria-haspopup="true" aria-expanded="false" id="userAccountToggle">
          &#128100; ${escapeHtml(user.name)} <span aria-hidden="true">&#9662;</span>
        </button>
        <div class="user-account-menu" id="userAccountMenu" role="menu">
          <a href="property-request.html" role="menuitem">Request</a>
          <a href="property-notifications.html" role="menuitem">Notifications</a>
          <button type="button" onclick="signOutUser()" role="menuitem">Logout</button>
        </div>
      </div>`
    : `<button class="btn-login-header" onclick="openLoginModal()">&#128274; Login</button>`;
  return `
    <header class="header">
      <div class="container header-inner">
        <a href="index.html" class="logo">
          <img class="login-logo" src="Option%204%20-%20Wordmark%402x.png" alt="ek real estate logo">
        </a>
        <button class="nav-toggle" onclick="toggleNav()" aria-label="Menu">&#9776;</button>
        <nav class="nav" id="mainNav">${navLinks}</nav>
        <a href="cart.html" class="cart-icon-btn" title="View Cart">
          &#128722;
          <span class="cart-badge" id="cartBadge" style="display:none">0</span>
        </a>
        ${authBtn}
      </div>
    </header>`;
}

function toggleUserMenu(event) {
  event.stopPropagation();
  const menu = document.getElementById('userAccountMenu');
  const toggle = document.getElementById('userAccountToggle');
  const isOpen = menu.classList.toggle('open');
  toggle.setAttribute('aria-expanded', String(isOpen));
}

function closeUserMenu() {
  const menu = document.getElementById('userAccountMenu');
  const toggle = document.getElementById('userAccountToggle');
  if (!menu || !toggle) return;
  menu.classList.remove('open');
  toggle.setAttribute('aria-expanded', 'false');
}

function signOutUser() {
  userLogout();
  window.location.href = 'index.html';
}

document.addEventListener('click', event => {
  const account = document.getElementById('userAccount');
  if (account && !account.contains(event.target)) closeUserMenu();
});

function renderLoginModal() {
  return `
    <div class="modal-overlay" id="loginModal" onclick="if(event.target===this)closeLoginModal()">
      <div class="login-modal-card">
        <div class="login-modal-logo">
          <img class="login-logo login-modal-wordmark" src="Option%204%20-%20Wordmark%402x.png" alt="ek real estate logo">
        </div>
        <div class="lm-tabs">
          <button class="lm-tab active" onclick="switchLoginModalTab('signin')">Sign In</button>
          <button class="lm-tab" onclick="switchLoginModalTab('signup')">Sign Up</button>
        </div>
        <div id="loginModalAlert"></div>
        <form id="signinForm" onsubmit="handleModalLogin(event)">
          <div class="lm-group">
            <label>Email</label>
            <input type="email" id="lmEmail" required autocomplete="email">
          </div>
          <div class="lm-group">
            <label>Password</label>
            <input type="password" id="lmPassword" required autocomplete="current-password">
          </div>
          <button type="submit" class="lm-btn">Sign In</button>
        </form>
        <form id="signupForm" style="display:none" onsubmit="handleModalRegister(event)">
          <div class="lm-group">
            <label>Full Name</label>
            <input type="text" id="suName" required>
          </div>
          <div class="lm-group">
            <label>Email</label>
            <input type="email" id="suEmail" required autocomplete="email">
          </div>
          <div class="lm-group">
            <label>Password</label>
            <input type="password" id="suPassword" required minlength="6">
          </div>
          <button type="submit" class="lm-btn">Create Account</button>
        </form>
        <button class="lm-close" onclick="closeLoginModal()">&times;</button>
      </div>
    </div>`;
}

function openLoginModal() {
  const modal = document.getElementById('loginModal');
  if (modal) modal.classList.add('active');
}

function closeLoginModal() {
  const modal = document.getElementById('loginModal');
  if (modal) modal.classList.remove('active');
}

async function handleModalLogin(e) {
  e.preventDefault();
  const alertEl = document.getElementById('loginModalAlert');
  alertEl.innerHTML = '';
  const res = await userLogin(
    document.getElementById('lmEmail').value,
    document.getElementById('lmPassword').value
  );
  if (res.ok) {
    closeLoginModal();
    if (res.role === 'admin') {
      window.location.href = 'admin.html';
    } else {
      location.reload();
    }
  } else {
    alertEl.innerHTML = `<div class="lm-error">Invalid email or password.</div>`;
  }
}

async function handleModalRegister(e) {
  e.preventDefault();
  const alertEl = document.getElementById('loginModalAlert');
  alertEl.innerHTML = '';
  const res = await registerUser(
    document.getElementById('suName').value,
    document.getElementById('suEmail').value,
    document.getElementById('suPassword').value
  );
  if (res.ok) {
    const loginRes = await userLogin(
      document.getElementById('suEmail').value,
      document.getElementById('suPassword').value
    );
    closeLoginModal();
    if (loginRes.ok && loginRes.role === 'admin') {
      window.location.href = 'admin.html';
    } else {
      location.reload();
    }
  } else {
    let msg = 'Registration failed. Please try again.';
    if (res.error && (res.error.includes('409') || res.error.includes('already'))) msg = 'Email already registered. Please sign in.';
    alertEl.innerHTML = `<div class="lm-error">${msg}</div>`;
  }
}

function switchLoginModalTab(tab) {
  document.getElementById('signinForm').style.display = tab === 'signin' ? '' : 'none';
  document.getElementById('signupForm').style.display = tab === 'signup' ? '' : 'none';
  document.getElementById('loginModalAlert').innerHTML = '';
  document.querySelectorAll('.lm-tab').forEach((t, i) => t.classList.toggle('active', (i === 0) === (tab === 'signin')));
}

function renderFooter(settings) {
  return `
    <footer class="footer">
      <div class="container">
        <div class="footer-grid">
          <div>
            <h3>${settings.companyName}</h3>
            <p>${settings.about}</p>
          </div>
          <div>
            <h3>Quick Links</h3>
            <ul class="footer-links">
              <li><a href="index.html">Home</a></li>
              <li><a href="properties.html">Properties</a></li>
              <li><a href="about.html">About Us</a></li>
              <li><a href="contact.html">Contact</a></li>
            </ul>
          </div>
          <div>
            <h3>Property Types</h3>
            <ul class="footer-links">
              <li><a href="properties.html?type=house">Houses</a></li>
              <li><a href="properties.html?type=apartment">Apartments</a></li>
              <li><a href="properties.html?type=land">Land</a></li>
              <li><a href="properties.html?type=commercial">Commercial</a></li>
            </ul>
          </div>
          <div>
            <h3>Contact Us</h3>
            <ul class="footer-contact">
              <li>&#128222; ${settings.phone}</li>
              <li>&#9993; ${settings.email}</li>
              <li>&#128205; ${settings.address}</li>
            </ul>
          </div>
        </div>
        <div class="footer-bottom">
          <span>&copy; ${new Date().getFullYear()} ${settings.companyName}. All rights reserved.</span>
          <span>Operating in Rwanda</span>
        </div>
      </div>
    </footer>`;
}

function toggleNav() {
  document.getElementById('mainNav').classList.toggle('open');
}

function renderPropertyCard(property) {
  const badgeClass = property.status === 'sale' ? 'badge-sale' : 'badge-rent';
  const meta = [];
  if (property.bedrooms > 0) meta.push(`<span>&#128719; ${escapeHtml(property.bedrooms)} Beds</span>`);
  if (property.bathrooms > 0) meta.push(`<span>&#128705; ${escapeHtml(property.bathrooms)} Baths</span>`);
  meta.push(`<span>&#9632; ${escapeHtml(property.area)} m&sup2;</span>`);
  const propertyUrl = `property.html?id=${encodeURIComponent(property.id)}`;
  return `
    <div class="property-card">
      <a href="${propertyUrl}">
        <div class="property-card-img">
          <img src="${escapeHtml(property.image)}" alt="${escapeHtml(property.title)}" loading="lazy">
          <span class="property-badge ${badgeClass}">${escapeHtml(getStatusLabel(property.status))}</span>
          <span class="badge-type">${escapeHtml(getTypeLabel(property.type))}</span>
        </div>
        <div class="property-card-body">
          <h3>${escapeHtml(property.title)}</h3>
          <div class="property-price">${formatPrice(property.price, property.currency)}</div>
          <div class="property-location">&#128205; ${escapeHtml(property.location)}</div>
          <div class="property-meta">${meta.join('')}</div>
        </div>
      </a>
      <div class="property-card-footer">
        <a href="${propertyUrl}" class="btn btn-outline btn-sm">View Details</a>
        <button class="btn btn-primary btn-sm add-to-cart-btn" data-property-id="${escapeHtml(property.id)}">&#128722; Add to Cart</button>
      </div>
    </div>`;
}

function renderPropertiesGrid(properties, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  if (properties.length === 0) {
    container.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><h3>No Properties Found</h3><p>Try adjusting your search filters.</p></div>`;
    return;
  }
  container.innerHTML = properties.map(renderPropertyCard).join('');
  container.querySelectorAll('.add-to-cart-btn').forEach(button => {
    button.addEventListener('click', () => {
      const property = properties.find(item => String(item.id) === button.dataset.propertyId);
      if (property) addToCart(property);
    });
  });
}

function getUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const result = {};
  for (const [key, value] of params) result[key] = value;
  return result;
}

function filterProperties(properties, filters) {
  return properties.filter(p => {
    if (filters.status && p.status !== filters.status) return false;
    if (filters.type && p.type !== filters.type) return false;
    if (filters.district && p.district !== filters.district) return false;
    if (filters.minPrice && p.price < parseInt(filters.minPrice)) return false;
    if (filters.maxPrice && p.price > parseInt(filters.maxPrice)) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (!p.title.toLowerCase().includes(q) && !p.location.toLowerCase().includes(q) && !p.description.toLowerCase().includes(q)) return false;
    }
    return true;
  });
}

async function handleInquirySubmit(e, propertyId) {
  e.preventDefault();
  const form = e.target;
  const property = propertyId ? await getProperty(propertyId) : null;
  await addInquiry({
    name: form.name.value,
    email: form.email.value,
    phone: form.phone.value,
    message: form.message.value,
    propertyId: propertyId || '',
    propertyTitle: property ? property.title : 'General Inquiry'
  });
  const alertEl = document.getElementById('formAlert');
  if (alertEl) {
    alertEl.innerHTML = '<div class="alert alert-success">Thank you! Your inquiry has been sent. We will contact you shortly.</div>';
    form.reset();
    setTimeout(() => { alertEl.innerHTML = ''; }, 5000);
  }
}

async function handleContactSubmit(e) {
  e.preventDefault();
  const form = e.target;
  await addInquiry({
    name: form.name.value,
    email: form.email.value,
    phone: form.phone.value,
    message: form.message.value,
    propertyId: '',
    propertyTitle: 'Contact Form - ' + (form.subject.value || 'General')
  });
  const alertEl = document.getElementById('formAlert');
  if (alertEl) {
    alertEl.innerHTML = '<div class="alert alert-success">Message sent successfully! We will get back to you soon.</div>';
    form.reset();
    setTimeout(() => { alertEl.innerHTML = ''; }, 5000);
  }
}

function renderAgentCard(agent) {
  const initials = agent.name.split(' ').map(n => n[0]).join('').substring(0, 2);
  const avatar = agent.photo
    ? `<img src="${agent.photo}" alt="${agent.name}" loading="lazy">`
    : initials;
  return `
    <div class="agent-card">
      <div class="agent-avatar">${avatar}</div>
      <h3>${agent.name}</h3>
      <div class="agent-role">${agent.role}</div>
      <div class="agent-contact">&#128222; ${agent.phone}<br>&#9993; ${agent.email}</div>
    </div>`;
}

async function initPage(activePage) {
  const headerEl = document.getElementById('site-header');
  const footerEl = document.getElementById('site-footer');
  if (headerEl) headerEl.innerHTML = renderHeader(activePage);
  if (!document.getElementById('loginModal')) {
    document.body.insertAdjacentHTML('beforeend', renderLoginModal());
  }
  const settings = await getSettings();
  if (footerEl) footerEl.innerHTML = renderFooter(settings);
  if (typeof updateCartBadge === 'function') updateCartBadge();
  return settings;
}
