const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured');
}

const db = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

async function query(request) {
  const { data, error } = await request;
  if (error) throw error;
  return data;
}

async function getAll(table, orderBy) {
  let request = db.from(table).select('*');
  if (orderBy) request = request.order(orderBy, { ascending: false });
  return query(request);
}

async function getById(table, id) {
  return query(db.from(table).select('*').eq('id', id).maybeSingle());
}

async function insert(table, record) {
  return query(db.from(table).insert(record).select('*').single());
}

async function update(table, id, changes) {
  return query(db.from(table).update(changes).eq('id', id).select('*').maybeSingle());
}

async function remove(table, id) {
  await query(db.from(table).delete().eq('id', id));
}

async function seed() {
  const properties = [
    { id: 'p1', title: 'Modern Villa in Kacyiru', type: 'house', status: 'sale', price: 850000000, currency: 'RWF', location: 'Kacyiru, Kigali', district: 'Gasabo', bedrooms: 4, bathrooms: 3, area: 350, description: 'Stunning modern villa with panoramic views of Kigali.', features: ['Garden', 'Parking', 'Security', 'Modern Kitchen', 'Backup Generator'], image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80', featured: true, created_at: '2026-01-15' },
    { id: 'p2', title: 'Luxury Apartment in Nyarutarama', type: 'apartment', status: 'rent', price: 2500000, currency: 'RWF', location: 'Nyarutarama, Kigali', district: 'Gasabo', bedrooms: 3, bathrooms: 2, area: 180, description: 'Elegant apartment in the heart of Nyarutarama.', features: ['Furnished', 'Balcony', 'Gym Access', 'Pool', '24/7 Security'], image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80', featured: true, created_at: '2026-02-01' },
    { id: 'p3', title: 'Commercial Plot in Remera', type: 'land', status: 'sale', price: 450000000, currency: 'RWF', location: 'Remera, Kigali', district: 'Gasabo', bedrooms: 0, bathrooms: 0, area: 1200, description: 'Prime commercial plot on main road in Remera.', features: ['Main Road Access', 'Utilities Ready', 'Commercial Zoning', 'Flat Terrain'], image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80', featured: true, created_at: '2026-02-10' },
    { id: 'p4', title: 'Family Home in Kimihurura', type: 'house', status: 'sale', price: 620000000, currency: 'RWF', location: 'Kimihurura, Kigali', district: 'Gasabo', bedrooms: 5, bathrooms: 4, area: 420, description: 'Spacious family home in quiet Kimihurura neighborhood.', features: ['Large Compound', 'Servant Quarters', 'Borehole', 'Solar Panels', 'Garage'], image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80', featured: false, created_at: '2026-02-20' },
    { id: 'p5', title: 'Office Space in CBD', type: 'commercial', status: 'rent', price: 1800000, currency: 'RWF', location: 'City Center, Kigali', district: 'Nyarugenge', bedrooms: 0, bathrooms: 2, area: 200, description: 'Professional office space in Kigali CBD.', features: ['Open Plan', 'Meeting Rooms', 'Elevator', 'Reception Area', 'Parking'], image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80', featured: false, created_at: '2026-03-01' },
    { id: 'p6', title: 'Affordable Apartment in Gikondo', type: 'apartment', status: 'rent', price: 450000, currency: 'RWF', location: 'Gikondo, Kigali', district: 'Kicukiro', bedrooms: 2, bathrooms: 1, area: 75, description: 'Clean and affordable 2-bedroom apartment in Gikondo.', features: ['Water Tank', 'Security Guard', 'Tiled Floors', 'Balcony'], image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80', featured: false, created_at: '2026-03-05' }
  ];
  const agents = [
    { id: 'a1', name: 'Jean Baptiste N.', role: 'Senior Agent', phone: '+250 788 111 222', email: 'jean@ekestates.rw', photo: '' },
    { id: 'a2', name: 'Marie Claire U.', role: 'Property Consultant', phone: '+250 789 333 444', email: 'marie@ekestates.rw', photo: '' },
    { id: 'a3', name: 'Patrick H.', role: 'Land Specialist', phone: '+250 787 555 666', email: 'patrick@ekestates.rw', photo: '' }
  ];
  const settings = {
    id: 'main',
    company_name: 'ek estates',
    tagline: '',
    phone: '+250 788 123 456',
    email: 'info@ekestates.rw',
    address: 'KG 7 Ave, Kigali, Rwanda',
    whatsapp: '+250788123456',
    about: 'ek estates is a trusted property agency operating across Rwanda.'
  };

  for (const [table, records] of [['properties', properties], ['agents', agents], ['settings', [settings]]]) {
    const { error } = await db.from(table).upsert(records, { onConflict: 'id', ignoreDuplicates: true });
    if (error) throw error;
  }

  const savedSettings = await getById('settings', 'main');
  if (savedSettings) {
    const changes = {};
    if (savedSettings.company_name === 'Kigali Estates' || savedSettings.company_name === 'EK Estates') {
      changes.company_name = 'ek estates';
    }
    if (
      savedSettings.tagline === 'Your Trusted Real Estate Partner in Rwanda' ||
      savedSettings.tagline === 'Your Trusted Property Partner'
    ) {
      changes.tagline = '';
    }
    if (
      savedSettings.about === 'Kigali Estates is a leading real estate agency operating across Rwanda.' ||
      savedSettings.about === 'EK Estates is a trusted property agency operating across Rwanda.'
    ) {
      changes.about = 'ek estates is a trusted property agency operating across Rwanda.';
    }
    if (savedSettings.email === 'info@kigaliestates.rw') changes.email = 'info@ekestates.rw';
    if (Object.keys(changes).length > 0) {
      const { error } = await db.from('settings').update(changes).eq('id', 'main');
      if (error) throw error;
    }
  }

  const existingAdmin = await query(db.from('admins').select('id').limit(1).maybeSingle());
  if (!existingAdmin) {
    const username = process.env.ADMIN_USERNAME;
    const password = process.env.ADMIN_PASSWORD;
    if (!username || !password) {
      throw new Error('Set ADMIN_USERNAME and ADMIN_PASSWORD to create the initial admin account');
    }
    await insert('admins', {
      id: 'admin1',
      username: username.trim().toLowerCase(),
      password: await bcrypt.hash(password, 10),
      name: 'Administrator'
    });
  }
}

module.exports = { db, getAll, getById, insert, update, remove, query, seed };
