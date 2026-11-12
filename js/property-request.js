let requestImageData = '';
let requestImageProcessing = false;
let requestFeatureList = [];

function showPropertyRequestMessage(message, type) {
  const notice = document.getElementById('property-request-message');
  notice.textContent = message;
  notice.className = 'alert alert-' + type;
  notice.hidden = false;
}

function setRequestFormAccess() {
  const user = getUser();
  const isSignedIn = Boolean(user && user.token);
  document.getElementById('property-request-auth').hidden = isSignedIn;
  document.getElementById('property-request-form').hidden = !isSignedIn;
}

function clearRequestImage() {
  requestImageData = '';
  const preview = document.getElementById('request-image-preview');
  preview.removeAttribute('src');
  preview.hidden = true;
  document.getElementById('request-image-placeholder').hidden = false;
}

function resizeRequestPhoto(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the selected photo.'));
    reader.onabort = () => reject(new Error('Photo reading was cancelled.'));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error('The selected file is not a valid image.'));
      image.onload = () => {
        const maxDimension = 1200;
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

async function previewRequestImage(event) {
  const input = event.target;
  const file = input.files[0];
  if (!file) return;
  clearRequestImage();
  if (!file.type.startsWith('image/')) {
    showPropertyRequestMessage('Choose an image file for the property photo.', 'error');
    input.value = '';
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    showPropertyRequestMessage('Choose a photo smaller than 5 MB.', 'error');
    input.value = '';
    return;
  }

  requestImageProcessing = true;
  try {
    requestImageData = await resizeRequestPhoto(file);
    const preview = document.getElementById('request-image-preview');
    preview.src = requestImageData;
    preview.hidden = false;
    document.getElementById('request-image-placeholder').hidden = true;
    document.getElementById('property-request-message').hidden = true;
  } catch (error) {
    console.error('Unable to process property photo:', error);
    clearRequestImage();
    input.value = '';
    showPropertyRequestMessage(error.message, 'error');
  } finally {
    requestImageProcessing = false;
  }
}

function renderRequestFeatures() {
  const container = document.getElementById('request-features');
  container.replaceChildren();
  requestFeatureList.forEach((feature, index) => {
    const tag = document.createElement('span');
    tag.className = 'request-feature-tag';
    tag.appendChild(document.createTextNode(feature + ' '));
    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.setAttribute('aria-label', 'Remove ' + feature);
    removeButton.textContent = '\u00d7';
    removeButton.addEventListener('click', () => {
      requestFeatureList.splice(index, 1);
      renderRequestFeatures();
    });
    tag.appendChild(removeButton);
    container.appendChild(tag);
  });
}

function addRequestFeature() {
  const input = document.getElementById('request-feature-input');
  const feature = input.value.trim();
  if (!feature || requestFeatureList.length >= 30 || requestFeatureList.includes(feature)) return;
  requestFeatureList.push(feature);
  input.value = '';
  renderRequestFeatures();
}

function cancelPropertyRequestForm() {
  const form = document.getElementById('property-request-form');
  const hasText = ['title', 'price', 'area', 'location', 'phone', 'description']
    .some(name => form.elements[name].value.trim());
  const hasCounts = form.elements.bedrooms.value !== '0' || form.elements.bathrooms.value !== '0';
  const hasInput = hasText || hasCounts || requestFeatureList.length > 0 ||
    document.getElementById('request-image-file').files.length > 0 || requestImageData;
  if (hasInput && !window.confirm('Discard this property request?')) return;
  window.location.href = 'properties.html';
}

async function submitPropertyRequestForm(event) {
  event.preventDefault();
  const form = event.target;
  const submitButton = document.getElementById('request-submit-button');

  if (requestImageProcessing) {
    showPropertyRequestMessage('Please wait for the property photo to finish processing.', 'error');
    return;
  }
  if (!requestImageData) {
    showPropertyRequestMessage('Please upload a property photo before submitting.', 'error');
    return;
  }

  const formData = new FormData(form);
  const request = {
    title: formData.get('title').trim(),
    type: formData.get('type'),
    status: formData.get('status'),
    price: Number(formData.get('price')),
    area: Number(formData.get('area')),
    location: formData.get('location').trim(),
    phone: formData.get('phone').trim(),
    district: formData.get('district'),
    bedrooms: Number(formData.get('bedrooms') || 0),
    bathrooms: Number(formData.get('bathrooms') || 0),
    description: formData.get('description').trim(),
    features: requestFeatureList,
    image: requestImageData
  };

  submitButton.disabled = true;
  try {
    await submitPropertyRequest(request);
    form.reset();
    clearRequestImage();
    requestFeatureList = [];
    renderRequestFeatures();
    showPropertyRequestMessage('Your property request has been submitted for review.', 'success');
  } catch (error) {
    console.error('Unable to submit property request:', error);
    if (!getUser() || !getUser().token) {
      setRequestFormAccess();
      showPropertyRequestMessage('Your sign-in has expired. Sign in again to submit your property.', 'error');
      return;
    }
    showPropertyRequestMessage(error.message || 'The property request could not be submitted. Please try again.', 'error');
  } finally {
    submitButton.disabled = false;
  }
}

function initializePropertyRequestPage() {
  const districtSelect = document.getElementById('request-district');
  districtSelect.innerHTML = getDistricts()
    .map(district => `<option value="${district}">${district}</option>`)
    .join('');
  setRequestFormAccess();
  initPage('property-request.html').catch(error => {
    console.error('Unable to load site settings:', error);
    const message = window.location.protocol === 'file:'
      ? 'This page is opened as a local file. Start the app and open http://localhost:3000/property-request.html to sign in or submit a request.'
      : 'Site settings could not be loaded from the server. Check that the app is running and its Supabase connection is configured; submitting may also fail.';
    showPropertyRequestMessage(message, 'error');
  });
}

initializePropertyRequestPage();
