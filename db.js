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
