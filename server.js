require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db, getAll, getById, insert, update, remove, query, seed } = require('./db');

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret || sessionSecret.length < 32) {
  throw new Error('SESSION_SECRET must be set to a random value of at least 32 characters');
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use((req, res, next) => {
  if (req.path === '/admin.html') {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
  }
  next();
});
app.use(express.static(__dirname));

function genId(prefix) {
  return `${prefix}_${crypto.randomUUID()}`;
}

function requireAdmin(req, res, next) {
  const token = (req.get('authorization') || '').replace(/^Bearer\s+/i, '');
  try {
    const session = jwt.verify(token, sessionSecret, { algorithms: ['HS256'] });
    if (session.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    req.admin = session;
    next();
  } catch {
    res.status(401).json({ error: 'Admin login required' });
  }
}

function requireUser(req, res, next) {
  const token = (req.get('authorization') || '').replace(/^Bearer\s+/i, '');
  try {
    const session = jwt.verify(token, sessionSecret, { algorithms: ['HS256'] });
    if (session.role !== 'user') return res.status(403).json({ error: 'Registered user access required' });
    req.user = { id: session.sub };
    next();
  } catch {
    res.status(401).json({ error: 'Please sign in to submit a property request' });
  }
}

function toProperty(row) {
  if (!row) return null;
  const { created_at, ...property } = row;
  return { ...property, createdAt: created_at };
}

function toPropertyRequest(row) {
  const {
    user_id,
    requester_name,
    requester_email,
    requester_phone,
    request_status,
    accepted_property_id,
    admin_message,
    submitted_at,
    reviewed_at,
    accepted_at,
    cancelled_at,
    ...property
  } = row;
  return {
    ...property,
    requesterName: requester_name,
    requesterEmail: requester_email,
    requesterPhone: requester_phone,
    requestStatus: request_status,
    acceptedPropertyId: accepted_property_id,
    adminMessage: admin_message,
    submittedAt: submitted_at,
    reviewedAt: reviewed_at,
    acceptedAt: accepted_at,
    cancelledAt: cancelled_at
  };
}

function toOrder(row) {
  if (!row) return null;
  const { created_at, ...order } = row;
  return { ...order, createdAt: created_at };
}

function toSettings(row) {
  if (!row) {
    return {
      id: 'main',
      companyName: 'ek estates',
      tagline: '',
      phone: '',
      email: '',
      address: '',
      whatsapp: '',
      about: ''
    };
  }
  const { id, company_name, tagline, phone, email, address, whatsapp, about } = row;
  return { id, companyName: company_name, tagline, phone, email, address, whatsapp, about };
}

function asyncRoute(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

app.get('/api/properties', asyncRoute(async (req, res) => {
  const rows = await getAll('properties', 'created_at');
  res.json(rows.map(toProperty));
}));

app.get('/api/properties/:id', asyncRoute(async (req, res) => {
  const property = toProperty(await getById('properties', req.params.id));
  if (!property) return res.status(404).json({ error: 'Not found' });
  res.json(property);
}));

app.post('/api/properties', requireAdmin, asyncRoute(async (req, res) => {
  const { createdAt, ...fields } = req.body;
  const row = await insert('properties', {
    ...fields,
    id: genId('p'),
    created_at: new Date().toISOString().slice(0, 10)
  });
  res.json(toProperty(row));
}));

app.put('/api/properties/:id', requireAdmin, asyncRoute(async (req, res) => {
  const { id, createdAt, created_at, ...fields } = req.body;
  const property = toProperty(await update('properties', req.params.id, fields));
  if (!property) return res.status(404).json({ error: 'Not found' });
  res.json(property);
}));

app.delete('/api/properties/:id', requireAdmin, asyncRoute(async (req, res) => {
  await remove('properties', req.params.id);
  res.json({ success: true });
}));

app.post('/api/property-requests', requireUser, asyncRoute(async (req, res) => {
  const body = req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return res.status(400).json({ error: 'Invalid property request' });
  }

  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const type = body.type;
  const status = body.status;
  const location = typeof body.location === 'string' ? body.location.trim() : '';
  const district = typeof body.district === 'string' ? body.district.trim() : '';
  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const price = body.price;
  const area = body.area;
  const bedrooms = body.bedrooms === undefined ? 0 : body.bedrooms;
  const bathrooms = body.bathrooms === undefined ? 0 : body.bathrooms;
  const image = typeof body.image === 'string' ? body.image : '';
  const features = body.features === undefined ? [] : body.features;

  if (
    !title || title.length > 120 ||
    !['house', 'apartment', 'land', 'commercial'].includes(type) ||
    !['sale', 'rent'].includes(status) ||
    typeof price !== 'number' || !Number.isFinite(price) || price < 0 ||
    typeof area !== 'number' || !Number.isFinite(area) || area < 0 ||
    typeof bedrooms !== 'number' ||
    !Number.isInteger(bedrooms) || bedrooms < 0 ||
    typeof bathrooms !== 'number' ||
    !Number.isInteger(bathrooms) || bathrooms < 0 ||
    !location || location.length > 160 ||
    !district || district.length > 80 ||
    !phone || phone.length > 40 ||
    !description || description.length > 5000 ||
    !Array.isArray(features) || features.length > 30 ||
    features.some(feature => typeof feature !== 'string' || feature.trim().length > 80) ||
    !/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(image) ||
    image.length > 4700000
  ) {
    return res.status(400).json({ error: 'Check the property details and upload a valid photo under 5 MB.' });
  }

  const user = await getById('users', req.user.id);
  if (!user) return res.status(401).json({ error: 'Please sign in again to submit a property request' });

  const request = await insert('property_requests', {
    id: genId('pr'),
    user_id: user.id,
    requester_name: user.name,
    requester_email: user.email,
    requester_phone: phone,
    title,
    type,
    status,
    price,
    currency: 'RWF',
    location,
    district,
    bedrooms,
    bathrooms,
    area,
    description,
    features: features.map(feature => feature.trim()).filter(Boolean),
    image,
    request_status: 'pending',
    submitted_at: new Date().toISOString()
  });
  res.status(201).json({ success: true, id: request.id });
}));

app.get('/api/my/property-requests', requireUser, asyncRoute(async (req, res) => {
  const { data, error } = await db.from('property_requests')
    .select('*')
    .eq('user_id', req.user.id)
    .order('submitted_at', { ascending: false });
  if (error) throw error;
  res.json(data.map(toPropertyRequest));
}));

app.get('/api/property-requests', requireAdmin, asyncRoute(async (req, res) => {
  const { data, error } = await db.from('property_requests')
    .select('*')
    .eq('request_status', 'pending')
    .order('submitted_at', { ascending: false });
  if (error) throw error;
  res.json(data.map(toPropertyRequest));
}));

app.get('/api/property-requests/analytics', requireAdmin, asyncRoute(async (req, res) => {
  const { data, error } = await db.from('property_requests').select('submitted_at');
  if (error) throw error;
  const requests = data || [];
  const countsByMonth = {};
  requests.forEach(request => {
    const month = String(request.submitted_at).slice(0, 7);
    if (!/^\d{4}-\d{2}$/.test(month)) return;
    countsByMonth[month] = (countsByMonth[month] || 0) + 1;
  });
  const byMonth = Object.entries(countsByMonth)
    .sort(([first], [second]) => first.localeCompare(second))
    .map(([month, count]) => ({ month, count }));
  res.json({ total: requests.length, byMonth });
}));

app.post('/api/property-requests/:id/accept', requireAdmin, asyncRoute(async (req, res) => {
  const request = await getById('property_requests', req.params.id);
  if (!request) return res.status(404).json({ error: 'Property request not found' });
  if (request.request_status === 'accepted' && request.accepted_property_id) {
    const property = await getById('properties', request.accepted_property_id);
    return res.json({ success: true, property: toProperty(property) });
  }
  if (request.request_status !== 'pending') {
    return res.status(409).json({ error: 'This property request is no longer pending' });
  }

  const property = await insert('properties', {
    id: genId('p'),
    title: request.title,
    type: request.type,
    status: request.status,
    price: request.price,
    currency: request.currency,
    location: request.location,
    district: request.district,
    bedrooms: request.bedrooms,
    bathrooms: request.bathrooms,
    area: request.area,
    description: request.description,
    features: request.features,
    image: request.image,
    featured: false,
    created_at: new Date().toISOString().slice(0, 10)
  });

  const acceptedAt = new Date().toISOString();
  const { data: acceptedRequest, error } = await db.from('property_requests')
    .update({
      request_status: 'accepted',
      accepted_property_id: property.id,
      admin_message: 'Your property request was accepted and is now listed on EK Estates.',
      reviewed_at: acceptedAt,
      accepted_at: acceptedAt
    })
    .eq('id', request.id)
    .eq('request_status', 'pending')
    .select('id')
    .maybeSingle();

  if (error || !acceptedRequest) {
    await remove('properties', property.id);
    if (error) throw error;
    return res.status(409).json({ error: 'This property request has already been reviewed' });
  }

  res.json({ success: true, property: toProperty(property) });
}));

app.post('/api/property-requests/:id/cancel', requireAdmin, asyncRoute(async (req, res) => {
  const reason = req.body && typeof req.body.reason === 'string' ? req.body.reason.trim() : '';
  if (reason.length < 3 || reason.length > 1000) {
    return res.status(400).json({ error: 'Enter a cancellation reason between 3 and 1000 characters.' });
  }
  const now = new Date().toISOString();
  const { data, error } = await db.from('property_requests')
    .update({
      request_status: 'cancelled',
      admin_message: reason,
      reviewed_at: now,
      cancelled_at: now
    })
    .eq('id', req.params.id)
    .eq('request_status', 'pending')
    .select('id')
    .maybeSingle();
  if (error) throw error;
  if (!data) return res.status(409).json({ error: 'This property request has already been reviewed' });
  res.json({ success: true });
}));

app.get('/api/agents', asyncRoute(async (req, res) => {
  res.json(await getAll('agents'));
}));

app.get('/api/stats', asyncRoute(async (req, res) => {
  const tables = ['properties', 'agents', 'users', 'orders'];
  const counts = await Promise.all(tables.map(async table => {
    const { count, error } = await db.from(table).select('id', { count: 'exact', head: true });
    if (error) throw error;
    return count || 0;
  }));
  res.json({ properties: counts[0], agents: counts[1], users: counts[2], orders: counts[3] });
}));

app.post('/api/agents', requireAdmin, asyncRoute(async (req, res) => {
  const row = await insert('agents', { ...req.body, id: genId('a') });
  res.json(row);
}));

app.put('/api/agents/:id', requireAdmin, asyncRoute(async (req, res) => {
  const { id, ...fields } = req.body;
  const agent = await update('agents', req.params.id, fields);
  if (!agent) return res.status(404).json({ error: 'Not found' });
  res.json(agent);
}));

app.delete('/api/agents/:id', requireAdmin, asyncRoute(async (req, res) => {
  await remove('agents', req.params.id);
  res.json({ success: true });
}));

app.get('/api/inquiries', requireAdmin, asyncRoute(async (req, res) => {
  const rows = await getAll('inquiries', 'date');
  res.json(rows.map(row => {
    const isRead = row.is_read || row.is_done;
    return {
      ...row,
      is_read: isRead,
      propertyTitle: row.property_title || 'General Inquiry',
      read: isRead
    };
  }));
}));

app.post('/api/inquiries', asyncRoute(async (req, res) => {
  const { propertyTitle, property_title, ...fields } = req.body;
  const row = await insert('inquiries', {
    ...fields,
    id: genId('i'),
    property_title: propertyTitle || property_title || 'General Inquiry',
    is_read: false,
    is_done: false,
    date: new Date().toISOString()
  });
  res.json({ success: true, id: row.id });
}));

app.put('/api/inquiries/:id/read', requireAdmin, asyncRoute(async (req, res) => {
  const row = await update('inquiries', req.params.id, { is_read: true, is_done: true });
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
}));

app.put('/api/inquiries/:id/done', requireAdmin, asyncRoute(async (req, res) => {
  const row = await update('inquiries', req.params.id, { is_read: true, is_done: true });
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
}));

app.delete('/api/inquiries/:id', requireAdmin, asyncRoute(async (req, res) => {
  await remove('inquiries', req.params.id);
  res.json({ success: true });
}));

app.get('/api/settings', asyncRoute(async (req, res) => {
  const { data, error } = await db.from('settings').select('*').eq('id', 'main').maybeSingle();
  if (error) throw error;
  res.json(toSettings(data));
}));

app.put('/api/settings', requireAdmin, asyncRoute(async (req, res) => {
  const { companyName, ...fields } = req.body;
  const row = {
    ...fields,
    id: 'main',
    ...(companyName !== undefined ? { company_name: companyName } : {})
  };
  const { error } = await db.from('settings').upsert(row, { onConflict: 'id' });
  if (error) throw error;
  res.json({ success: true });
}));

app.post('/api/orders', asyncRoute(async (req, res) => {
  const d = req.body;
  const orderId = genId('ord');
  const order = await insert('orders', {
    id: orderId,
    customer: d.customer || {},
    items: d.items || [],
    total: d.total || 0,
    payment_method: d.paymentMethod || '',
    notes: d.notes || '',
    status: 'pending',
    created_at: new Date().toISOString()
  });
  const customer = d.customer || {};
  const fullName = `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Unknown';
  const propertyNames = d.items && d.items.length ? d.items.map(item => item.title).join(', ') : 'Order';
  await insert('inquiries', {
    id: genId('i'),
    name: fullName,
    email: customer.email || '',
    phone: customer.phone || '',
    message: `ORDER #${orderId} — Payment: ${d.paymentMethod || '-'}. Address: ${customer.address || ''}, ${customer.district || ''}.${d.notes ? ' Notes: ' + d.notes : ''}`,
    property_title: propertyNames,
    is_read: false,
    is_done: false,
    date: new Date().toISOString()
  });
  res.json({ success: true, id: order.id });
}));

app.get('/api/orders/:id', asyncRoute(async (req, res) => {
  const order = toOrder(await getById('orders', req.params.id));
  if (!order) return res.status(404).json({ error: 'Not found' });
  const { payment_method, ...fields } = order;
  res.json({ ...fields, paymentMethod: payment_method });
}));

app.get('/api/orders', requireAdmin, asyncRoute(async (req, res) => {
  const rows = await getAll('orders', 'created_at');
  res.json(rows.map(row => {
    const { payment_method, ...fields } = toOrder(row);
    return { ...fields, paymentMethod: payment_method };
  }));
}));

app.put('/api/orders/:id/status', requireAdmin, asyncRoute(async (req, res) => {
  const order = await update('orders', req.params.id, { status: req.body.status });
  if (!order) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
}));

app.delete('/api/orders/:id', requireAdmin, asyncRoute(async (req, res) => {
  await remove('orders', req.params.id);
  res.json({ success: true });
}));

app.post('/api/register', asyncRoute(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });
  const normalizedEmail = email.trim().toLowerCase();
  const existing = await query(db.from('users').select('id').eq('email', normalizedEmail).maybeSingle());
  if (existing) return res.status(409).json({ error: 'Email already registered' });
  const hashed = await bcrypt.hash(password, 10);
  const row = await insert('users', {
    id: genId('u'),
    name,
    email: normalizedEmail,
    password: hashed,
    created_at: new Date().toISOString()
  });
  res.json({ success: true, id: row.id, name: row.name, email: row.email });
}));

app.post('/api/login', asyncRoute(async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = (email || '').trim().toLowerCase();
  const admin = await query(db.from('admins').select('*').eq('username', normalizedEmail).maybeSingle());
  if (admin && await bcrypt.compare(password || '', admin.password)) {
    const token = jwt.sign(
      { role: 'admin', name: admin.name },
      sessionSecret,
      { algorithm: 'HS256', subject: admin.id, expiresIn: '12h' }
    );
    return res.json({ success: true, role: 'admin', name: admin.name, username: admin.username, token });
  }
  const user = await query(db.from('users').select('*').eq('email', normalizedEmail).maybeSingle());
  if (user && await bcrypt.compare(password || '', user.password)) {
    const token = jwt.sign(
      { role: 'user' },
      sessionSecret,
      { algorithm: 'HS256', subject: user.id, expiresIn: '12h' }
    );
    return res.json({ success: true, role: 'user', id: user.id, name: user.name, email: user.email, token });
  }
  res.status(401).json({ error: 'Invalid email or password' });
}));

app.put('/api/admin', requireAdmin, asyncRoute(async (req, res) => {
  const { username, name, password, photo } = req.body;
  const changes = {};
  if (username !== undefined) changes.username = username.trim().toLowerCase();
  if (name !== undefined) changes.name = name;
  if (photo !== undefined) changes.photo = photo;
  if (password) changes.password = await bcrypt.hash(password, 10);
  const { error } = await db.from('admins').update(changes).eq('id', 'admin1');
  if (error) throw error;
  res.json({ success: true });
}));

app.get('/api/admin', requireAdmin, asyncRoute(async (req, res) => {
  const admin = await query(db.from('admins').select('id,username,name,photo').eq('id', 'admin1').maybeSingle());
  if (!admin) return res.status(404).json({ error: 'Not found' });
  res.json(admin);
}));

app.get('/api/users', requireAdmin, asyncRoute(async (req, res) => {
  const users = await query(db.from('users').select('id,name,email,created_at').order('created_at', { ascending: false }));
  res.json(users.map(({ created_at, ...user }) => ({ ...user, createdAt: created_at })));
}));

app.delete('/api/users/:id', requireAdmin, asyncRoute(async (req, res) => {
  await remove('users', req.params.id);
  res.json({ success: true });
}));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: 'A server error occurred' });
});

seed()
  .then(() => app.listen(PORT, () => console.log(`ek estates running on http://localhost:${PORT}`)))
  .catch(error => {
    console.error('Failed to initialize Supabase data:', error);
    process.exit(1);
  });
