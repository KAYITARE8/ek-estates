let currentFeatures = [];
let currentAgentPhoto = '';
let propertyRequestToCancel = null;

function checkAuth() {
  if (!isLoggedIn()) {
    window.location.href = 'admin-login.html';
    return false;
  }
  return true;
}

function toggleUserMenu(e) {
  e.stopPropagation();
  document.getElementById('userDropdownMenu').classList.toggle('active');
}

document.addEventListener('click', function (e) {
  const menu = document.getElementById('userDropdownMenu');
  if (menu && !e.target.closest('.user-dropdown')) menu.classList.remove('active');
});

function toggleSidebar() {
  const sidebar = document.getElementById('adminSidebar');
  const toggle = document.querySelector('.menu-toggle');
  const overlay = document.querySelector('.sidebar-overlay');
  const isOpen = sidebar.classList.toggle('open');
  toggle.setAttribute('aria-expanded', String(isOpen));
  toggle.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
  overlay.classList.toggle('active', isOpen);
}

function closeSidebar() {
  const sidebar = document.getElementById('adminSidebar');
  const toggle = document.querySelector('.menu-toggle');
  const overlay = document.querySelector('.sidebar-overlay');
  sidebar.classList.remove('open');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-label', 'Open navigation');
  overlay.classList.remove('active');
}

function showSection(sectionId) {
  if (window.matchMedia('(max-width: 768px)').matches) closeSidebar();
  document.querySelectorAll('.panel-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
  const section = document.getElementById(sectionId);
  if (section) section.classList.add('active');
  const navLink = document.querySelector(`[data-section="${sectionId}"]`);
  if (navLink) navLink.classList.add('active');
  const titles = { dashboard: 'Dashboard', properties: 'Manage Properties', agents: 'Manage Agents', inquiries: 'Inquiries', done: 'Review Queue', users: 'Registered Users', analytics: 'Analytics', settings: 'Settings', profile: 'My Profile' };
  const titleEl = document.getElementById('pageTitle');
  if (titleEl) titleEl.textContent = titles[sectionId] || 'Admin';
  if (sectionId === 'dashboard') renderDashboard();
  if (sectionId === 'properties') renderPropertiesTable();
  if (sectionId === 'agents') renderAgentsTable();
  if (sectionId === 'inquiries') renderInquiriesTable();
  if (sectionId === 'done') renderDoneTable();
  if (sectionId === 'settings') loadSettingsForm();
  if (sectionId === 'users') renderUsersTable();
  if (sectionId === 'analytics') renderAnalytics();
  if (sectionId === 'profile') loadProfileForm();
}

async function renderDashboard() {
  const [properties, agents, inquiries] = await Promise.all([getProperties(), getAgents(), getInquiries()]);
  const unread = inquiries.filter(i => !i.read).length;

  document.getElementById('dashProperties').textContent = properties.length;
  document.getElementById('dashAgents').textContent = agents.length;
  document.getElementById('dashInquiries').textContent = inquiries.length;
  document.getElementById('dashUnread').textContent = unread;

  const badge = document.getElementById('inquiryBadge');
  if (badge) { badge.textContent = unread; badge.style.display = unread > 0 ? 'inline' : 'none'; }

  document.getElementById('recentProperties').innerHTML = properties.slice(0, 5).length === 0
    ? '<tr><td colspan="5" class="empty-table">No properties yet</td></tr>'
    : properties.slice(0, 5).map(p => `
      <tr>
        <td><img src="${escapeHtml(p.image)}" class="table-img" alt=""></td>
        <td>${escapeHtml(p.title)}</td>
        <td>${formatPrice(p.price, p.currency)}</td>
        <td><span class="status-badge status-${escapeHtml(p.status)}">${escapeHtml(getStatusLabel(p.status))}</span></td>
        <td>${escapeHtml(p.location)}</td>
      </tr>`).join('');

  document.getElementById('recentInquiries').innerHTML = inquiries.slice(0, 5).length === 0
    ? '<tr><td colspan="4" class="empty-table">No inquiries yet</td></tr>'
    : inquiries.slice(0, 5).map(i => `
      <tr>
        <td>${escapeHtml(i.name)}</td>
        <td>${escapeHtml(i.propertyTitle || i.property_title || 'General')}</td>
        <td>${escapeHtml(new Date(i.date).toLocaleDateString())}</td>
        <td><span class="status-badge ${i.read ? 'status-read' : 'status-unread'}">${i.read ? 'Read' : 'New'}</span></td>
      </tr>`).join('');
}

async function renderPropertiesTable() {
  const properties = await getProperties();
  document.getElementById('propertiesTable').innerHTML = properties.length === 0
    ? '<tr><td colspan="7" class="empty-table">No properties. Click "Add Property" to create one.</td></tr>'
    : properties.map(p => `
      <tr>
        <td><img src="${escapeHtml(p.image)}" class="table-img" alt=""></td>
        <td>${escapeHtml(p.title)} ${p.featured ? '<span class="featured-star" title="Featured">&#9733;</span>' : ''}</td>
        <td>${escapeHtml(getTypeLabel(p.type))}</td>
        <td><span class="status-badge status-${escapeHtml(p.status)}">${escapeHtml(getStatusLabel(p.status))}</span></td>
        <td>${formatPrice(p.price, p.currency)}</td>
        <td>${escapeHtml(p.location)}</td>
        <td class="actions">
          <button class="btn btn-sm btn-outline" onclick="editProperty('${p.id}')">Edit</button>
          <button class="btn btn-sm btn-danger" onclick="confirmDeleteProperty('${p.id}')">Delete</button>
        </td>
      </tr>`).join('');
}

async function renderAgentsTable() {
  const agents = await getAgents();
  document.getElementById('agentsTable').innerHTML = agents.length === 0
    ? '<tr><td colspan="5" class="empty-table">No agents. Click "Add Agent" to create one.</td></tr>'
    : agents.map(a => `
      <tr>
        <td><strong>${a.name}</strong></td>
        <td>${a.role}</td>
        <td>${a.phone}</td>
        <td>${a.email}</td>
        <td class="actions">
          <button class="btn btn-sm btn-outline" onclick="editAgent('${a.id}')">Edit</button>
          <button class="btn btn-sm btn-danger" onclick="confirmDeleteAgent('${a.id}')">Delete</button>
        </td>
      </tr>`).join('');
}

async function renderInquiriesTable() {
  const all = await getInquiries();
  const inquiries = all.filter(i => !i.is_done);
  const completed = all.filter(i => i.is_done);
  document.getElementById('inquiriesTable').innerHTML = inquiries.length === 0
    ? '<tr><td colspan="6" class="empty-table">No inquiries received yet.</td></tr>'
    : inquiries.map(i => `
      <tr style="${!i.read ? 'font-weight:600' : ''}">
        <td>${escapeHtml(i.name)}</td>
        <td>${escapeHtml(i.email)}<br><small>${escapeHtml(i.phone)}</small></td>
        <td>${escapeHtml(i.propertyTitle || i.property_title || 'General')}</td>
        <td style="max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap">${escapeHtml(i.message)}</td>
        <td>${escapeHtml(new Date(i.date).toLocaleString())}</td>
        <td class="actions">
          ${!i.read ? `<button class="btn btn-sm btn-outline" onclick="markRead('${i.id}')">Mark Read</button>` : ''}
          <button class="btn btn-sm btn-primary" onclick="markDone('${i.id}')">Done</button>
        </td>
      </tr>`).join('');
  document.getElementById('completedInquiriesTable').innerHTML = completed.length === 0
    ? '<tr><td colspan="6" class="empty-table">No done inquiries yet.</td></tr>'
    : completed.map(i => `
      <tr>
        <td>${escapeHtml(i.name)}</td>
        <td>${escapeHtml(i.email)}<br><small>${escapeHtml(i.phone)}</small></td>
        <td>${escapeHtml(i.propertyTitle || i.property_title || 'General')}</td>
        <td style="max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap">${escapeHtml(i.message)}</td>
        <td>${escapeHtml(new Date(i.date).toLocaleString())}</td>
        <td class="actions">
          <button class="btn btn-sm btn-danger" onclick="confirmDeleteInquiry('${i.id}')">Delete</button>
        </td>
      </tr>`).join('');

  const unread = inquiries.filter(i => !i.read).length;
  const badge = document.getElementById('inquiryBadge');
  if (badge) { badge.textContent = unread; badge.style.display = unread > 0 ? 'inline' : 'none'; }
}

async function markDone(id) {
  await markInquiryDone(id);
  await Promise.all([renderInquiriesTable(), renderDashboard()]);
  showAlert('Inquiry marked as done!', 'success');
}

async function renderDoneTable() {
  try {
    renderPropertyRequestsTable(await getPropertyRequests());
  } catch (error) {
    console.error('Unable to load property requests:', error);
    document.getElementById('propertyRequestsTable').innerHTML =
      `<tr><td colspan="6" class="empty-table">Review Queue could not be loaded: ${escapeHtml(error.message)}</td></tr>`;
    showAlert('Property requests could not be loaded. Check the database schema and admin session.', 'error');
  }
}

function renderPropertyRequestsTable(requests) {
  const table = document.getElementById('propertyRequestsTable');
  table.innerHTML = requests.length === 0
    ? '<tr><td colspan="6" class="empty-table">No property requests are waiting for review.</td></tr>'
    : requests.map(request => `
      <tr>
        <td>
          <div class="request-property-cell">
            <img src="${escapeHtml(request.image)}" class="table-img" alt="">
            <div>
              <strong>${escapeHtml(request.title)}</strong>
              <small>${escapeHtml(getTypeLabel(request.type))} · ${escapeHtml(getStatusLabel(request.status))} · ${escapeHtml(request.bedrooms)} bd · ${escapeHtml(request.bathrooms)} ba · ${escapeHtml(request.area)} m²</small>
              <small class="request-description" title="${escapeHtml(request.description)}">${escapeHtml(request.description)}</small>
              <small>${escapeHtml((request.features || []).join(', '))}</small>
            </div>
          </div>
        </td>
        <td>${formatPrice(request.price, request.currency)}</td>
        <td>${escapeHtml(request.location)}, ${escapeHtml(request.district)}</td>
        <td>${escapeHtml(request.requesterName)}<br><small>${escapeHtml(request.requesterEmail)}</small><small>${escapeHtml(request.requesterPhone)}</small></td>
        <td>${escapeHtml(new Date(request.submittedAt).toLocaleString())}</td>
        <td class="actions">
          <button type="button" class="btn btn-sm btn-primary js-accept-property-request" data-request-id="${escapeHtml(request.id)}">Accept</button>
          <button type="button" class="btn btn-sm btn-danger js-cancel-property-request" data-request-id="${escapeHtml(request.id)}">Cancel</button>
        </td>
      </tr>`).join('');

  table.querySelectorAll('.js-accept-property-request').forEach(button => {
    button.addEventListener('click', () => reviewAcceptPropertyRequest(button.dataset.requestId));
  });
  table.querySelectorAll('.js-cancel-property-request').forEach(button => {
    button.addEventListener('click', () => reviewCancelPropertyRequest(button.dataset.requestId));
  });
}

async function reviewAcceptPropertyRequest(id) {
  try {
    await acceptPropertyRequest(id);
  } catch (error) {
    console.error('Unable to accept property request:', error);
    showAlert(error.message || 'The property request could not be accepted.', 'error');
    return;
  }
  showAlert('Property request accepted and published.', 'success');
  try {
    await Promise.all([renderDoneTable(), renderPropertiesTable(), renderDashboard()]);
  } catch (error) {
    console.error('Unable to refresh admin lists after publishing property:', error);
    showAlert('Property was published, but the admin lists could not be refreshed.', 'error');
  }
}

async function reviewCancelPropertyRequest(id) {
  propertyRequestToCancel = id;
  document.getElementById('cancelPropertyRequestReason').value = '';
  document.getElementById('cancelPropertyRequestError').textContent = '';
  openModal('cancelPropertyRequestModal');
  document.getElementById('cancelPropertyRequestReason').focus();
}

function closeCancelPropertyRequestModal() {
  closeModal('cancelPropertyRequestModal');
  propertyRequestToCancel = null;
}

async function submitCancelPropertyRequest(event) {
  event.preventDefault();
  const reasonInput = document.getElementById('cancelPropertyRequestReason');
  const reason = reasonInput.value.trim();
  const errorEl = document.getElementById('cancelPropertyRequestError');
  const submitButton = document.getElementById('confirmCancelPropertyRequest');
  if (!propertyRequestToCancel) return;
  if (reason.length < 3) {
    errorEl.textContent = 'Please provide a reason of at least 3 characters.';
    reasonInput.focus();
    return;
  }

  submitButton.disabled = true;
  try {
    await cancelPropertyRequest(propertyRequestToCancel, reason);
    closeCancelPropertyRequestModal();
    showAlert('Property request cancelled and the user has been notified.', 'success');
    await renderDoneTable();
  } catch (error) {
    console.error('Unable to cancel property request:', error);
    errorEl.textContent = error.message || 'The property request could not be cancelled.';
  } finally {
    submitButton.disabled = false;
  }
}

async function markRead(id) {
  await markInquiryRead(id);
  await Promise.all([renderInquiriesTable(), renderDashboard()]);
}

function openModal(modalId) { document.getElementById(modalId).classList.add('active'); }
function closeModal(modalId) { document.getElementById(modalId).classList.remove('active'); }

function previewPropImage(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX = 800;
      const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      const data = canvas.toDataURL('image/jpeg', 0.85);
      document.getElementById('propImage').value = data;
      document.getElementById('propImageThumb').src = data;
      document.getElementById('propImageThumb').style.display = 'block';
      document.getElementById('propImagePlaceholder').style.display = 'none';
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
}

function openPropertyModal(property) {
  currentFeatures = property ? [...property.features] : [];
  document.getElementById('propertyModalTitle').textContent = property ? 'Edit Property' : 'Add Property';
  document.getElementById('propId').value = property ? property.id : '';
  document.getElementById('propTitle').value = property ? property.title : '';
  document.getElementById('propType').value = property ? property.type : 'house';
  document.getElementById('propStatus').value = property ? property.status : 'sale';
  document.getElementById('propPrice').value = property ? property.price : '';
  document.getElementById('propLocation').value = property ? property.location : '';
  document.getElementById('propDistrict').value = property ? property.district : 'Gasabo';
  document.getElementById('propBedrooms').value = property ? property.bedrooms : 0;
  document.getElementById('propBathrooms').value = property ? property.bathrooms : 0;
  document.getElementById('propArea').value = property ? property.area : '';
  document.getElementById('propImage').value = property ? property.image : '';
  document.getElementById('propDescription').value = property ? property.description : '';
  document.getElementById('propFeatured').checked = property ? property.featured : false;
  document.getElementById('propImage').value = property ? property.image : '';
  // show thumb if editing
  const thumb = document.getElementById('propImageThumb');
  const placeholder = document.getElementById('propImagePlaceholder');
  if (property && property.image) {
    thumb.src = property.image;
    thumb.style.display = 'block';
    placeholder.style.display = 'none';
  } else {
    thumb.src = '';
    thumb.style.display = 'none';
    placeholder.style.display = '';
  }
  document.getElementById('propImageFile').value = '';
  renderFeaturesTags();
  openModal('propertyModal');
}

async function editProperty(id) {
  const property = await getProperty(id);
  if (property) openPropertyModal(property);
}

async function saveProperty(e) {
  e.preventDefault();
  const id = document.getElementById('propId').value;
  const data = {
    title: document.getElementById('propTitle').value,
    type: document.getElementById('propType').value,
    status: document.getElementById('propStatus').value,
    price: parseInt(document.getElementById('propPrice').value),
    currency: 'RWF',
    location: document.getElementById('propLocation').value,
    district: document.getElementById('propDistrict').value,
    bedrooms: parseInt(document.getElementById('propBedrooms').value) || 0,
    bathrooms: parseInt(document.getElementById('propBathrooms').value) || 0,
    area: parseInt(document.getElementById('propArea').value),
    image: document.getElementById('propImage').value || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80',
    description: document.getElementById('propDescription').value,
    features: [...currentFeatures],
    featured: document.getElementById('propFeatured').checked
  };
  if (id) { await updateProperty(id, data); } else { await addProperty(data); }
  closeModal('propertyModal');
  renderPropertiesTable();
  renderDashboard();
  showAlert('Property saved successfully!', 'success');
}

async function confirmDeleteProperty(id) {
  if (confirm('Are you sure you want to delete this property?')) {
    await deleteProperty(id);
    renderPropertiesTable();
    renderDashboard();
    showAlert('Property deleted.', 'success');
  }
}

function addFeatureTag() {
  const input = document.getElementById('featureInput');
  const val = input.value.trim();
  if (val && !currentFeatures.includes(val)) { currentFeatures.push(val); renderFeaturesTags(); }
  input.value = '';
}

function removeFeatureTag(index) { currentFeatures.splice(index, 1); renderFeaturesTags(); }

function renderFeaturesTags() {
  document.getElementById('featuresTags').innerHTML = currentFeatures.map((f, i) =>
    `<span class="feature-tag-removable">${f} <button type="button" onclick="removeFeatureTag(${i})">&times;</button></span>`
  ).join('');
}

function resizeAgentPhoto(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the selected photo.'));
    reader.onabort = () => reject(new Error('Photo reading was cancelled.'));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error('The selected file is not a valid image.'));
      image.onload = () => {
        const maxDimension = 500;
        const scale = Math.min(maxDimension / image.naturalWidth, maxDimension / image.naturalHeight, 1);
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const context = canvas.getContext('2d');
        if (!context) {
          reject(new Error('Could not prepare the selected photo.'));
          return;
        }
        try {
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.82));
        } catch (error) {
          reject(new Error('Could not prepare the selected photo.'));
        }
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function showAgentPhotoPreview(photo) {
  const image = document.getElementById('agentPhotoThumb');
  const placeholder = document.getElementById('agentPhotoPlaceholder');
  if (photo) {
    image.src = photo;
    image.hidden = false;
    placeholder.hidden = true;
  } else {
    image.removeAttribute('src');
    image.hidden = true;
    placeholder.hidden = false;
  }
}

async function previewAgentPhoto(event) {
  const input = event.target;
  const file = input.files[0];
  const errorEl = document.getElementById('agentPhotoError');
  errorEl.textContent = '';
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    errorEl.textContent = 'Choose an image file.';
    input.value = '';
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    errorEl.textContent = 'Choose an image smaller than 5 MB.';
    input.value = '';
    return;
  }
  try {
    currentAgentPhoto = await resizeAgentPhoto(file);
    showAgentPhotoPreview(currentAgentPhoto);
  } catch (error) {
    console.error('Unable to process agent photo:', error);
    errorEl.textContent = error.message;
    input.value = '';
  }
}

function openAgentModal(agent) {
  document.getElementById('agentModalTitle').textContent = agent ? 'Edit Agent' : 'Add Agent';
  document.getElementById('agentId').value = agent ? agent.id : '';
  document.getElementById('agentName').value = agent ? agent.name : '';
  document.getElementById('agentRole').value = agent ? agent.role : '';
  document.getElementById('agentPhone').value = agent ? agent.phone : '';
  document.getElementById('agentEmail').value = agent ? agent.email : '';
  document.getElementById('agentPhotoFile').value = '';
  document.getElementById('agentPhotoError').textContent = '';
  currentAgentPhoto = agent ? agent.photo || '' : '';
  showAgentPhotoPreview(currentAgentPhoto);
  openModal('agentModal');
}

async function editAgent(id) {
  const agents = await getAgents();
  const agent = agents.find(a => a.id === id);
  if (agent) openAgentModal(agent);
}

async function saveAgent(e) {
  e.preventDefault();
  const id = document.getElementById('agentId').value;
  const data = {
    name: document.getElementById('agentName').value,
    role: document.getElementById('agentRole').value,
    phone: document.getElementById('agentPhone').value,
    email: document.getElementById('agentEmail').value,
    photo: currentAgentPhoto
  };
  if (id) { await updateAgent(id, data); } else { await addAgent(data); }
  closeModal('agentModal');
  renderAgentsTable();
  renderDashboard();
  showAlert('Agent saved successfully!', 'success');
}

async function confirmDeleteAgent(id) {
  if (confirm('Are you sure you want to delete this agent?')) {
    await deleteAgent(id);
    renderAgentsTable();
    renderDashboard();
    showAlert('Agent deleted.', 'success');
  }
}

async function confirmDeleteInquiry(id) {
  if (confirm('Delete this inquiry?')) {
    await deleteInquiry(id);
    await Promise.all([renderInquiriesTable(), renderDashboard()]);
  }
}

async function renderUsersTable() {
  const users = await getUsers();
  document.getElementById('usersCount').textContent = `${users.length} total`;
  document.getElementById('usersTable').innerHTML = users.length === 0
    ? '<tr><td colspan="5" class="empty-table">No registered users yet.</td></tr>'
    : users.map((u, i) => `
      <tr>
        <td>${i + 1}</td>
        <td><strong>${u.name}</strong></td>
        <td>${u.email}</td>
        <td>${u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}</td>
        <td><button class="btn btn-sm btn-danger" onclick="confirmDeleteUser('${u.id}')">Remove</button></td>
      </tr>`).join('');
}

async function confirmDeleteUser(id) {
  if (confirm('Remove this user account?')) {
    await deleteUser(id);
    renderUsersTable();
    showAlert('User removed.', 'success');
  }
}

async function renderAnalytics() {
  const [properties, inquiries, users] = await Promise.all([
    getProperties(),
    getInquiries(),
    getUsers()
  ]);
  let requestStats = null;
  try {
    const data = await getPropertyRequestAnalytics();
    if (!data || !Number.isFinite(data.total) || !Array.isArray(data.byMonth)) {
      throw new Error('Invalid property request analytics response');
    }
    requestStats = data;
  } catch (error) {
    console.error('Unable to load property request analytics:', error);
    showAlert('Request analytics could not be loaded. Other analytics are still available.', 'error');
  }

  document.getElementById('analyticsCards').innerHTML = `
    <a href="#properties" class="dash-card primary analytics-card-link" aria-label="View properties" onclick="showSection('properties'); return false;">
      <div class="label">Total Properties</div><div class="value">${properties.length}</div>
    </a>
    <a href="#users" class="dash-card analytics-card-link" aria-label="View registered users" onclick="showSection('users'); return false;">
      <div class="label">Total Users</div><div class="value">${users.length}</div>
    </a>
    <a href="#done" class="dash-card accent analytics-card-link" aria-label="View property requests" onclick="showSection('done'); return false;">
      <div class="label">Total Requests</div><div class="value">${requestStats ? requestStats.total : '-'}</div>
    </a>
    <a href="#inquiries" class="dash-card analytics-card-link" aria-label="View inquiries" onclick="showSection('inquiries'); return false;">
      <div class="label">Total Inquiries</div><div class="value">${inquiries.length}</div>
    </a>`;

  // Properties by type
  const byType = {};
  properties.forEach(p => { byType[p.type] = (byType[p.type] || 0) + 1; });
  renderBarChart('chartByType', byType, properties.length);

  // Properties by status
  const byStatus = { 'For Sale': 0, 'For Rent': 0 };
  properties.forEach(p => { if (p.status === 'sale') byStatus['For Sale']++; else byStatus['For Rent']++; });
  renderBarChart('chartByStatus', byStatus, properties.length);

  // Inquiries by month
  const byMonth = {};
  inquiries.forEach(i => {
    const m = new Date(i.date).toLocaleString('default', { month: 'short', year: '2-digit' });
    byMonth[m] = (byMonth[m] || 0) + 1;
  });
  renderBarChart('chartInquiries', byMonth, Math.max(...Object.values(byMonth), 1));

  // Property requests by month
  if (requestStats) {
    const requestsByMonth = {};
    requestStats.byMonth.forEach(({ month, count }) => {
      const [year, monthNumber] = month.split('-').map(Number);
      const label = new Date(Date.UTC(year, monthNumber - 1, 1))
        .toLocaleString('default', { month: 'short', year: '2-digit' });
      requestsByMonth[label] = count;
    });
    renderBarChart('chartRequests', requestsByMonth, Math.max(...Object.values(requestsByMonth), 1));
  } else {
    document.getElementById('chartRequests').innerHTML =
      '<div style="color:#94a3b8;padding:20px;text-align:center">Request data could not be loaded</div>';
  }
}

function renderBarChart(containerId, data, total) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const entries = Object.entries(data);
  if (entries.length === 0) { el.innerHTML = '<div style="color:#94a3b8;padding:20px;text-align:center">No data yet</div>'; return; }
  el.innerHTML = entries.map(([label, val]) => {
    const pct = total > 0 ? Math.round((val / total) * 100) : 0;
    return `<div class="bar-row">
      <div class="bar-label">${label}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
      <div class="bar-val">${val} (${pct}%)</div>
    </div>`;
  }).join('');
}

let profilePhotoData = null;

async function loadProfileForm() {
  const admin = await getAdminProfile();
  document.getElementById('profileName').value = admin.name || '';
  document.getElementById('profileEmail').value = admin.username || '';
  document.getElementById('profileNameDisplay').textContent = admin.name || '';
  document.getElementById('profileEmailDisplay').textContent = admin.username || '';
  profilePhotoData = admin.photo || null;
  const avatar = document.getElementById('profileAvatarPreview');
  if (admin.photo) {
    avatar.style.backgroundImage = `url(${admin.photo})`;
    avatar.style.backgroundSize = 'cover';
    avatar.textContent = '';
  } else {
    avatar.style.backgroundImage = '';
    avatar.textContent = (admin.name || 'A').charAt(0).toUpperCase();
  }
  // also update top-bar avatar
  const topAvatar = document.getElementById('adminAvatar');
  if (topAvatar) {
    if (admin.photo) { topAvatar.style.backgroundImage = `url(${admin.photo})`; topAvatar.style.backgroundSize = 'cover'; topAvatar.textContent = ''; }
    else { topAvatar.style.backgroundImage = ''; topAvatar.textContent = (admin.name || 'A').charAt(0).toUpperCase(); }
  }
}

function previewProfilePhoto(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX = 200;
      const ratio = Math.min(MAX / img.width, MAX / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      profilePhotoData = canvas.toDataURL('image/jpeg', 0.8);
      const avatar = document.getElementById('profileAvatarPreview');
      avatar.style.backgroundImage = `url(${profilePhotoData})`;
      avatar.style.backgroundSize = 'cover';
      avatar.textContent = '';
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
}

async function saveProfileForm(e) {
  e.preventDefault();
  const data = {
    name: document.getElementById('profileName').value,
    username: document.getElementById('profileEmail').value,
    photo: profilePhotoData || ''
  };
  const pw = document.getElementById('profilePassword').value;
  if (pw) data.password = pw;
  await saveAdmin(data);
  document.getElementById('profilePassword').value = '';
  // update session name
  const session = getSession();
  if (session) { session.name = data.name; sessionStorage.setItem('ke_session', JSON.stringify(session)); }
  document.getElementById('adminUserName').textContent = data.name;
  showAlert('Profile updated successfully!', 'success');
  loadProfileForm();
}

async function loadSettingsForm() {
  const settings = await getSettings();
  document.getElementById('setCompanyName').value = settings.companyName;
  document.getElementById('setTagline').value = settings.tagline;
  document.getElementById('setPhone').value = settings.phone;
  document.getElementById('setEmail').value = settings.email;
  document.getElementById('setAddress').value = settings.address;
  document.getElementById('setWhatsapp').value = settings.whatsapp;
  document.getElementById('setAbout').value = settings.about;
}

async function saveSettingsForm(e) {
  e.preventDefault();
  await saveSettings({
    companyName: document.getElementById('setCompanyName').value,
    tagline: document.getElementById('setTagline').value,
    phone: document.getElementById('setPhone').value,
    email: document.getElementById('setEmail').value,
    address: document.getElementById('setAddress').value,
    whatsapp: document.getElementById('setWhatsapp').value,
    about: document.getElementById('setAbout').value
  });
  showAlert('Settings saved successfully!', 'success');
}

async function saveAdminCredentials(e) {
  e.preventDefault();
  const data = {
    username: document.getElementById('adminUsername').value,
    name: document.getElementById('adminName').value,
    password: document.getElementById('adminPassword').value || undefined
  };
  await saveAdmin(data);
  showAlert('Admin credentials updated!', 'success');
  document.getElementById('adminPassword').value = '';
}

function showAlert(message, type) {
  const alertEl = document.getElementById('adminAlert');
  if (alertEl) {
    alertEl.innerHTML = `<div class="alert alert-${escapeHtml(type)}">${escapeHtml(message)}</div>`;
    setTimeout(() => { alertEl.innerHTML = ''; }, 4000);
  }
}

function handleLogout() {
  logout();
  window.location.replace('admin-login.html');
}

async function initAdmin() {
  if (!checkAuth()) return;
  // re-check auth every time page becomes visible (back button)
  window.addEventListener('pageshow', function(e) {
    if (!isLoggedIn()) window.location.replace('admin-login.html');
  });
  const session = getSession();
  document.getElementById('adminUserName').textContent = session.name;
  document.getElementById('adminAvatar').textContent = session.name.charAt(0).toUpperCase();

  const districts = getDistricts();
  const districtSelect = document.getElementById('propDistrict');
  if (districtSelect) districtSelect.innerHTML = districts.map(d => `<option value="${d}">${d}</option>`).join('');

  showSection('dashboard');
}
