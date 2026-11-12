function showRequestHistoryMessage(message, type) {
  const notice = document.getElementById('request-history-message');
  notice.textContent = message;
  notice.className = 'alert alert-' + type;
  notice.hidden = false;
}

function formatRequestHistoryDate(value) {
  return value ? new Date(value).toLocaleDateString() : '-';
}

function renderRequestHistory(requests) {
  const rows = document.getElementById('request-history-rows');
  if (requests.length === 0) {
    rows.innerHTML = '<tr><td colspan="6" class="request-history-empty">You have not submitted any property requests yet.</td></tr>';
    return;
  }

  rows.innerHTML = requests.map(request => {
    const statusLabels = { pending: 'Pending', accepted: 'Accepted', cancelled: 'Cancelled' };
    const message = request.adminMessage || (request.requestStatus === 'pending' ? 'Waiting for admin review.' : '');
    return `
      <tr>
        <td>${escapeHtml(formatRequestHistoryDate(request.submittedAt))}</td>
        <td>
          <div class="request-history-property">
            <img src="${escapeHtml(request.image)}" alt="">
            <div>
              <strong>${escapeHtml(request.title)}</strong>
              <small>${escapeHtml(getTypeLabel(request.type))} &middot; ${escapeHtml(getStatusLabel(request.status))}</small>
              <small>${escapeHtml(formatPrice(request.price, request.currency))} &middot; ${escapeHtml(request.location)}, ${escapeHtml(request.district)}</small>
              <small>${escapeHtml(request.requesterPhone)}</small>
            </div>
          </div>
        </td>
        <td><span class="request-history-status status-${escapeHtml(request.requestStatus)}">${escapeHtml(statusLabels[request.requestStatus] || request.requestStatus)}</span></td>
        <td class="request-history-message">${escapeHtml(message)}</td>
        <td>${escapeHtml(formatRequestHistoryDate(request.acceptedAt))}</td>
        <td>${escapeHtml(formatRequestHistoryDate(request.cancelledAt))}</td>
      </tr>`;
  }).join('');
}

async function loadRequestHistory() {
  try {
    const requests = await getMyPropertyRequests();
    renderRequestHistory(requests);
    document.getElementById('request-history-content').hidden = false;
  } catch (error) {
    console.error('Unable to load property request history:', error);
    if (!getUser() || !getUser().token) {
      document.getElementById('request-history-signin').hidden = false;
      showRequestHistoryMessage('Your sign-in has expired. Sign in again to view your requests.', 'error');
      return;
    }
    showRequestHistoryMessage(error.message || 'Your property request history could not be loaded.', 'error');
  }
}

function initializePropertyNotificationsPage() {
  const user = getUser();
  document.getElementById('request-history-signin').hidden = Boolean(user && user.token);
  document.getElementById('request-history-content').hidden = !(user && user.token);
  initPage('property-notifications.html').catch(error => {
    console.error('Unable to load site settings:', error);
    const message = window.location.protocol === 'file:'
      ? 'This page is opened as a local file. Start the app and open it through http://localhost:3000 to access your notifications.'
      : 'Site settings could not be loaded from the server. Check that the app and its Supabase connection are available.';
    showRequestHistoryMessage(message, 'error');
  });
  if (user && user.token) loadRequestHistory();
}

initializePropertyNotificationsPage();
