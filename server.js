/* ==========================================================================
   SAVARA · Servidor Express + SQLite (sql.js) + JWT + Multer
   ========================================================================== */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const sharp = require('sharp');
const rateLimit = require('express-rate-limit');
const initSqlJs = require('sql.js');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'savara_dev_secret';
const DATA_DIR = process.env.DATA_DIR || __dirname;
const DB_PATH = path.join(DATA_DIR, 'savara.db');

/* --------------------------------------------------------------------------
   MIDDLEWARE
   -------------------------------------------------------------------------- */
app.use(cors({ origin: process.env.CORS_ORIGIN || false }));
app.use(express.json());
app.use('/uploads', express.static(path.join(DATA_DIR, 'uploads')));

/* --------------------------------------------------------------------------
   BASE DE DATOS (sql.js — puro JS, sin compilación nativa)
   -------------------------------------------------------------------------- */
let db;

function saveDB() {
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

function query(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length > 0) stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

function queryOne(sql, params = []) {
  const rows = query(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

function run(sql, params = []) {
  db.run(sql, params);
  saveDB();
}

async function initDB() {
  const SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS productos (
      id TEXT PRIMARY KEY,
      categoria TEXT NOT NULL,
      nombre TEXT NOT NULL,
      descripcion TEXT,
      precio INTEGER NOT NULL,
      stock TEXT DEFAULT 'alta',
      imagen_id TEXT DEFAULT '',
      imagen_url TEXT DEFAULT '',
      colores TEXT DEFAULT '[]',
      tallas TEXT DEFAULT '[]'
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS tienda (
      id INTEGER PRIMARY KEY DEFAULT 1,
      nombre TEXT DEFAULT '',
      direccion TEXT DEFAULT '',
      horario TEXT DEFAULT '',
      telefono TEXT DEFAULT ''
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS pagina (
      clave TEXT PRIMARY KEY,
      valor TEXT NOT NULL
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS actividad (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      accion TEXT NOT NULL,
      detalle TEXT DEFAULT '',
      fecha TEXT NOT NULL
    )
  `);
  saveDB();
}

function parseProducto(row) {
  if (!row) return null;
  return {
    ...row,
    colores: JSON.parse(row.colores),
    tallas: JSON.parse(row.tallas)
  };
}

/* ==========================================================================
   SEED DATA
   ========================================================================== */
function seedData() {
  const adminUser = queryOne('SELECT id FROM usuarios WHERE username = ?', ['admin']);
  if (!adminUser) {
    const hash = bcrypt.hashSync('savara2024', 10);
    run('INSERT INTO usuarios (username, password_hash) VALUES (?, ?)', ['admin', hash]);
  }

  const productCount = queryOne('SELECT COUNT(*) as c FROM productos');
  if (productCount.c === 0) {
    const defaults = [
      { id: "muj-01", categoria: "mujer", nombre: "Tacones Athenas", descripcion: "Tacón medio de estilo clásico, ideales para acompañar tanto una tenida de oficina como una salida de tarde. Piso antideslizante.", precio: 18990, stock: "alta", imagen_id: "mujer-tacones", imagen_url: "", colores: JSON.stringify([{ nombre: "Negro", hex: "#1a1a1a" }, { nombre: "Nude", hex: "#e8c9b0" }]), tallas: JSON.stringify(["35", "36", "37", "38", "39"]) },
      { id: "muj-02", categoria: "mujer", nombre: "Sandalias Riviera", descripcion: "Sandalias abiertas con tiras finas, perfectas para los días cálidos. Combinan comodidad y elegancia sin esfuerzo.", precio: 12990, stock: "media", imagen_id: "mujer-sandalias", imagen_url: "", colores: JSON.stringify([{ nombre: "Dorado", hex: "#D4AF37" }, { nombre: "Blanco", hex: "#f4f1ea" }]), tallas: JSON.stringify(["35", "36", "37", "38"]) },
      { id: "muj-03", categoria: "mujer", nombre: "Botines Milán", descripcion: "Botín de caña media con cierre lateral. Un básico atemporal que eleva cualquier conjunto de invierno.", precio: 22990, stock: "baja", imagen_id: "mujer-botines", imagen_url: "", colores: JSON.stringify([{ nombre: "Terracota", hex: "#a0522d" }, { nombre: "Negro", hex: "#1a1a1a" }]), tallas: JSON.stringify(["36", "37", "38", "39", "40"]) },
      { id: "muj-04", categoria: "mujer", nombre: "Zapatillas Aurora", descripcion: "Zapatilla urbana de corte limpio. Cómoda para todo el día, con detalle dorado en el talón.", precio: 15990, stock: "alta", imagen_id: "mujer-zapatillas", imagen_url: "", colores: JSON.stringify([{ nombre: "Marfil", hex: "#F5F4F0" }, { nombre: "Rosé", hex: "#d8a0a0" }]), tallas: JSON.stringify(["35", "36", "37", "38", "39", "40"]) },
      { id: "hom-01", categoria: "hombre", nombre: "Zapatos Oxford Classic", descripcion: "Zapato formal de cuero sintético con costuras finas. El aliado indispensable para eventos y vestir formal.", precio: 24990, stock: "alta", imagen_id: "hombre-oxford", imagen_url: "", colores: JSON.stringify([{ nombre: "Café", hex: "#4b3621" }, { nombre: "Negro", hex: "#1a1a1a" }]), tallas: JSON.stringify(["38", "39", "40", "41", "42", "43"]) },
      { id: "hom-02", categoria: "hombre", nombre: "Zapatillas Urban North", descripcion: "Zapatilla casual de suela gruesa, diseñada para la ciudad. Resistente al agua y de muy fácil limpieza.", precio: 19990, stock: "media", imagen_id: "hombre-zapatillas", imagen_url: "", colores: JSON.stringify([{ nombre: "Grafito", hex: "#3a3a3a" }, { nombre: "Hueso", hex: "#F5F4F0" }]), tallas: JSON.stringify(["39", "40", "41", "42", "43", "44"]) },
      { id: "hom-03", categoria: "hombre", nombre: "Mocasines Verona", descripcion: "Mocasín flexible sin cordones, cómodo y elegante. Ideal para un look smart-casual en cualquier estación.", precio: 17990, stock: "baja", imagen_id: "hombre-mocasines", imagen_url: "", colores: JSON.stringify([{ nombre: "Coñac", hex: "#8b4513" }, { nombre: "Negro", hex: "#1a1a1a" }]), tallas: JSON.stringify(["39", "40", "41", "42", "43"]) },
      { id: "inf-01", categoria: "infantil", nombre: "Zapatillas Estrellita", descripcion: "Zapatillas con cierre velcro y suela flexible. Diseño alegre y resistente para acompañar cada travesura.", precio: 9990, stock: "alta", imagen_id: "infantil-zapatillas", imagen_url: "", colores: JSON.stringify([{ nombre: "Celeste", hex: "#9ec5d8" }, { nombre: "Rosa", hex: "#f2b6b6" }]), tallas: JSON.stringify(["24", "25", "26", "27", "28"]) },
      { id: "inf-02", categoria: "infantil", nombre: "Sandalias Aventura", descripcion: "Sandalias todo terreno con ajuste seguro. Perfectas para el parque, la piscina y el verano sin límites.", precio: 7990, stock: "media", imagen_id: "infantil-sandalias", imagen_url: "", colores: JSON.stringify([{ nombre: "Amarillo", hex: "#e8c547" }, { nombre: "Verde", hex: "#7a9a76" }]), tallas: JSON.stringify(["24", "25", "26", "27", "28", "29", "30"]) },
      { id: "inf-03", categoria: "infantil", nombre: "Zapatos Colegial", descripcion: "Zapato escolar negro con suela reforzada. Cómodo para una jornada completa y con acabado impecable.", precio: 11990, stock: "alta", imagen_id: "infantil-colegial", imagen_url: "", colores: JSON.stringify([{ nombre: "Negro", hex: "#1a1a1a" }]), tallas: JSON.stringify(["28", "29", "30", "31", "32", "33", "34"]) },
      { id: "acc-01", categoria: "accesorios", nombre: "Cartera Lilah", descripcion: "Cartera de tamaño medio con compartimentos internos. Detalles en herrajes dorados mate.", precio: 8990, stock: "alta", imagen_id: "accesorios-cartera", imagen_url: "", colores: JSON.stringify([{ nombre: "Negro", hex: "#1a1a1a" }, { nombre: "Camel", hex: "#c19a6b" }, { nombre: "Vino", hex: "#5e2129" }]), tallas: JSON.stringify(["Único"]) },
      { id: "acc-02", categoria: "accesorios", nombre: "Bolsos Tote Lyon", descripcion: "Bolso tote amplio y ligero, perfecto para el día a día. Apto para llevar todo lo imprescindible con estilo.", precio: 13990, stock: "media", imagen_id: "accesorios-bolso", imagen_url: "", colores: JSON.stringify([{ nombre: "Hueso", hex: "#F5F4F0" }, { nombre: "Negro", hex: "#1a1a1a" }]), tallas: JSON.stringify(["Único"]) },
      { id: "acc-03", categoria: "accesorios", nombre: "Mascadas Cordoba", descripcion: "Mascada de textura suave y caída elegante. Un toque de color que completa cualquier look.", precio: 5990, stock: "baja", imagen_id: "accesorios-mascada", imagen_url: "", colores: JSON.stringify([{ nombre: "Mostaza", hex: "#D4AF37" }, { nombre: "Borgoña", hex: "#5e2129" }, { nombre: "Verde oliva", hex: "#556b2f" }]), tallas: JSON.stringify(["Único"]) }
    ];
    for (const p of defaults) {
      run('INSERT INTO productos (id, categoria, nombre, descripcion, precio, stock, imagen_id, imagen_url, colores, tallas) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [p.id, p.categoria, p.nombre, p.descripcion, p.precio, p.stock, p.imagen_id, p.imagen_url, p.colores, p.tallas]);
    }
  }

  const tienda = queryOne('SELECT id FROM tienda WHERE id = 1');
  if (!tienda) {
    run('INSERT INTO tienda (nombre, direccion, horario, telefono) VALUES (?, ?, ?, ?)',
      ['Tienda Central SAVARA', 'Av. Principal 123, Local 4', 'Lun a Sáb · 10:00 – 20:00', '+56 9 1234 5678']);
  }

  const paginaCount = queryOne('SELECT COUNT(*) as c FROM pagina');
  if (paginaCount.c === 0) {
    const defaults = [
      ['hero_titulo', 'Elegancia que cabe en tu presupuesto'],
      ['hero_subtitulo', 'Un mostrario digital para descubrir tu próximo par favorito. Explora la colección y reserva tu retiro en tienda.'],
      ['hero_eyebrow', 'Nueva Colección · 2026'],
      ['hero_cta', 'VER CATÁLOGO'],
      ['hero_nota', 'Mostrario digital · Las compras se realizan presencialmente en tienda'],
      ['footer_desc', 'Calzado y accesorios low-cost.'],
      ['footer_copyright', '© 2026 SAVARA · Mostrario digital'],
      ['color_dorado', '#D4AF37'],
      ['color_dorado_claro', '#e6d18a'],
      ['color_marfil', '#F5F4F0'],
      ['color_hueso', '#EAE7DF'],
      ['color_tinta', '#2b2b2b'],
      ['color_tinta_suave', '#6b6b66'],
      ['color_linea', '#d8d3c7'],
      ['seccion_about_titulo', 'Te esperamos en SAVARA'],
      ['seccion_about_texto', 'Todos los productos de este mostrario están disponibles para compra presencial. Reserva tu talla por mensaje y retírala cuando quieras.'],
      ['social_instagram', 'https://instagram.com/savara_oficial'],
      ['social_facebook', 'https://facebook.com/savara'],
      ['social_tiktok', 'https://tiktok.com/@savara'],
      ['social_whatsapp', 'https://wa.me/56912345678']
    ];
    for (const [clave, valor] of defaults) {
      run('INSERT INTO pagina (clave, valor) VALUES (?, ?)', [clave, valor]);
    }
  }
}

function logActividad(accion, detalle) {
  const fecha = new Date().toISOString();
  run('INSERT INTO actividad (accion, detalle, fecha) VALUES (?, ?, ?)', [accion, detalle || '', fecha]);
}

/* --------------------------------------------------------------------------
   AUTH MIDDLEWARE
   -------------------------------------------------------------------------- */
function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token requerido' });
  }
  try {
    req.user = jwt.verify(header.split(' ')[1], JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

/* --------------------------------------------------------------------------
   Rate limiter para login
   -------------------------------------------------------------------------- */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Demasiados intentos. Espera 15 minutos.' }
});

/* ==========================================================================
   RUTAS · AUTH
   ========================================================================== */
app.post('/api/auth/login', loginLimiter, (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
  }
  const user = queryOne('SELECT * FROM usuarios WHERE username = ?', [username]);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
  }
  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token, username: user.username });
});

app.put('/api/auth/password', authMiddleware, (req, res) => {
  const { current, newpass } = req.body;
  if (!current || !newpass) {
    return res.status(400).json({ error: 'Contraseña actual y nueva son requeridas' });
  }
  if (newpass.length < 6) {
    return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
  }
  const user = queryOne('SELECT * FROM usuarios WHERE id = ?', [req.user.id]);
  if (!user || !bcrypt.compareSync(current, user.password_hash)) {
    return res.status(401).json({ error: 'Contraseña actual incorrecta' });
  }
  const hash = bcrypt.hashSync(newpass, 10);
  run('UPDATE usuarios SET password_hash = ? WHERE id = ?', [hash, req.user.id]);
  logActividad('password_cambiado', `Usuario ${user.username}`);
  res.json({ ok: true });
});

/* ==========================================================================
   RUTAS · PRODUCTOS
   ========================================================================== */
app.get('/api/productos', (req, res) => {
  const rows = query('SELECT * FROM productos ORDER BY id');
  res.json(rows.map(parseProducto));
});

app.get('/api/productos/exportar', authMiddleware, (req, res) => {
  const rows = query('SELECT * FROM productos ORDER BY id');
  res.json(rows.map(parseProducto));
});

app.get('/api/productos/:id', (req, res) => {
  const row = queryOne('SELECT * FROM productos WHERE id = ?', [req.params.id]);
  if (!row) return res.status(404).json({ error: 'Producto no encontrado' });
  res.json(parseProducto(row));
});

app.post('/api/productos', authMiddleware, (req, res) => {
  const { id, categoria, nombre, descripcion, precio, stock, imagen_id, imagen_url, colores, tallas } = req.body;
  if (!id || !categoria || !nombre || precio == null) {
    return res.status(400).json({ error: 'Faltan campos requeridos (id, categoria, nombre, precio)' });
  }
  const existente = queryOne('SELECT id FROM productos WHERE id = ?', [id]);
  if (existente) {
    return res.status(409).json({ error: `Ya existe un producto con id "${id}"` });
  }
  run('INSERT INTO productos (id, categoria, nombre, descripcion, precio, stock, imagen_id, imagen_url, colores, tallas) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [id, categoria, nombre, descripcion || '', precio, stock || 'alta', imagen_id || '', imagen_url || '', JSON.stringify(colores || []), JSON.stringify(tallas || [])]);
  logActividad('producto_creado', `${nombre} (${id})`);
  res.status(201).json(parseProducto(queryOne('SELECT * FROM productos WHERE id = ?', [id])));
});

app.put('/api/productos/:id', authMiddleware, (req, res) => {
  const existente = queryOne('SELECT id FROM productos WHERE id = ?', [req.params.id]);
  if (!existente) return res.status(404).json({ error: 'Producto no encontrado' });
  const { nombre, categoria, descripcion, precio, stock, imagen_id, imagen_url, colores, tallas } = req.body;
  run('UPDATE productos SET nombre=?, categoria=?, descripcion=?, precio=?, stock=?, imagen_id=?, imagen_url=?, colores=?, tallas=? WHERE id=?',
    [nombre, categoria, descripcion || '', precio, stock || 'alta', imagen_id || '', imagen_url || '', JSON.stringify(colores || []), JSON.stringify(tallas || []), req.params.id]);
  logActividad('producto_editado', `${nombre} (${req.params.id})`);
  res.json(parseProducto(queryOne('SELECT * FROM productos WHERE id = ?', [req.params.id])));
});

app.delete('/api/productos/:id', authMiddleware, (req, res) => {
  const p = queryOne('SELECT nombre FROM productos WHERE id = ?', [req.params.id]);
  if (!p) return res.status(404).json({ error: 'Producto no encontrado' });
  run('DELETE FROM productos WHERE id = ?', [req.params.id]);
  logActividad('producto_eliminado', `${p.nombre} (${req.params.id})`);
  res.json({ ok: true });
});

/* ---------- DUPLICAR ---------- */
app.post('/api/productos/duplicar/:id', authMiddleware, (req, res) => {
  const original = queryOne('SELECT * FROM productos WHERE id = ?', [req.params.id]);
  if (!original) return res.status(404).json({ error: 'Producto no encontrado' });
  const prefix = original.categoria.substring(0, 3);
  const nums = query('SELECT id FROM productos WHERE id LIKE ?', [`${prefix}-%`])
    .map(r => { const n = parseInt(r.id.split('-')[1], 10); return isNaN(n) ? 0 : n; });
  const newNum = String((nums.length > 0 ? Math.max(...nums) : 0) + 1).padStart(2, '0');
  const newId = `${prefix}-${newNum}`;
  run('INSERT INTO productos (id, categoria, nombre, descripcion, precio, stock, imagen_id, imagen_url, colores, tallas) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [newId, original.categoria, `${original.nombre} (copia)`, original.descripcion, original.precio, original.stock, original.imagen_id, original.imagen_url, original.colores, original.tallas]);
  logActividad('producto_duplicado', `${original.nombre} → ${newId}`);
  res.status(201).json(parseProducto(queryOne('SELECT * FROM productos WHERE id = ?', [newId])));
});

/* ---------- IMPORTAR ---------- */
app.post('/api/productos/importar', authMiddleware, (req, res) => {
  const lista = req.body;
  if (!Array.isArray(lista) || lista.length === 0) {
    return res.status(400).json({ error: 'Debe enviar un array de productos' });
  }
  const insert = db.prepare('INSERT OR REPLACE INTO productos (id, categoria, nombre, descripcion, precio, stock, imagen_id, imagen_url, colores, tallas) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  let count = 0;
  for (const p of lista) {
    if (!p.id || !p.categoria || !p.nombre || p.precio == null) continue;
    insert.bind([p.id, p.categoria, p.nombre, p.descripcion || '', p.precio, p.stock || 'alta', p.imagen_id || '', p.imagen_url || '', JSON.stringify(p.colores || []), JSON.stringify(p.tallas || [])]);
    insert.step();
    insert.reset();
    count++;
  }
  saveDB();
  logActividad('productos_importados', `${count} productos`);
  res.json({ ok: true, count });
});

/* ==========================================================================
   RUTAS · TIENDA
   ========================================================================== */
app.get('/api/tienda', (req, res) => {
  const row = queryOne('SELECT * FROM tienda WHERE id = 1');
  if (!row) return res.json({ nombre: '', direccion: '', horario: '', telefono: '' });
  const { id, ...data } = row;
  res.json(data);
});

app.put('/api/tienda', authMiddleware, (req, res) => {
  const { nombre, direccion, horario, telefono } = req.body;
  run('UPDATE tienda SET nombre=?, direccion=?, horario=?, telefono=? WHERE id=1',
    [nombre || '', direccion || '', horario || '', telefono || '']);
  const row = queryOne('SELECT * FROM tienda WHERE id = 1');
  const { id, ...data } = row;
  res.json(data);
});

/* ==========================================================================
   RUTAS · SUBIDA DE IMÁGENES
   ========================================================================== */
const storage = multer.diskStorage({
  destination: path.join(DATA_DIR, 'uploads'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = crypto.randomBytes(16).toString('hex');
    cb(null, name + ext);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(path.extname(file.originalname).toLowerCase());
    cb(ok ? null : new Error('Formato no permitido. Usa: jpg, png, webp o gif'), ok);
  }
});

app.post('/api/upload', authMiddleware, async (req, res) => {
  upload.single('imagen')(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError) return res.status(400).json({ error: err.message });
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) return res.status(400).json({ error: 'No se envió ningún archivo' });
    try {
      const ext = path.extname(req.file.filename);
      const webpName = req.file.filename.replace(ext, '.webp');
      const webpPath = path.join(DATA_DIR, 'uploads', webpName);
      await sharp(req.file.path)
        .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(webpPath);
      fs.unlinkSync(req.file.path);
      res.json({ url: `/uploads/${webpName}` });
    } catch (e) {
      res.status(500).json({ error: 'Error al procesar imagen: ' + e.message });
    }
  });
});

/* ==========================================================================
   RUTAS · PÁGINA (contenido dinámico de la página principal)
   ========================================================================== */
app.get('/api/pagina', (req, res) => {
  const rows = query('SELECT * FROM pagina');
  const obj = {};
  for (const r of rows) obj[r.clave] = r.valor;
  res.json(obj);
});

app.put('/api/pagina', authMiddleware, (req, res) => {
  const data = req.body;
  const upsert = db.prepare('INSERT OR REPLACE INTO pagina (clave, valor) VALUES (?, ?)');
  for (const [clave, valor] of Object.entries(data)) {
    upsert.bind([clave, String(valor)]);
    upsert.step();
    upsert.reset();
  }
  saveDB();
  logActividad('pagina_actualizada', `${Object.keys(data).length} campos`);
  const rows = query('SELECT * FROM pagina');
  const obj = {};
  for (const r of rows) obj[r.clave] = r.valor;
  res.json(obj);
});

/* ==========================================================================
   RUTAS · DASHBOARD
   ========================================================================== */
app.get('/api/dashboard', authMiddleware, (req, res) => {
  const total = queryOne('SELECT COUNT(*) as c FROM productos');
  const stockBajo = queryOne("SELECT COUNT(*) as c FROM productos WHERE stock = 'media'");
  const stockAgotado = queryOne("SELECT COUNT(*) as c FROM productos WHERE stock = 'baja'");
  const categorias = query('SELECT categoria, COUNT(*) as c FROM productos GROUP BY categoria');
  res.json({
    total: total.c,
    stockBajo: stockBajo.c,
    stockAgotado: stockAgotado.c,
    categorias
  });
});

/* ==========================================================================
   RUTAS · ACTIVIDAD
   ========================================================================== */
app.get('/api/actividad', authMiddleware, (req, res) => {
  const rows = query('SELECT * FROM actividad ORDER BY fecha DESC LIMIT 30');
  res.json(rows);
});

/* ==========================================================================
   RUTAS · HEALTH
   ========================================================================== */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

/* ==========================================================================
   SEGURIDAD: bloquear acceso a archivos sensibles
   ========================================================================== */
const SENSITIVE_PATTERNS = ['node_modules', '.env', 'savara.db', 'server.js', 'package.json', 'package-lock.json'];

app.use((req, res, next) => {
  const p = req.path.toLowerCase();
  if (SENSITIVE_PATTERNS.some(sp => p.includes(sp))) {
    return res.status(404).send('Not found');
  }
  next();
});

/* ==========================================================================
   SERVIDOR ESTÁTICO
   --------------------------------------------------------------------------
   Sirve index.html, admin.html, css/, js/ directamente.
   ========================================================================== */
app.use(express.static(__dirname));

/* ==========================================================================
   404 catch-all: devolver el HTML correspondiente para SPA-like routing
   ========================================================================== */
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Ruta no encontrada' });
  }
  res.status(404).sendFile(path.join(__dirname, 'index.html'));
});

/* ==========================================================================
   INICIO
   ========================================================================== */
async function start() {
  await initDB();
  seedData();
  const uploadsDir = path.join(DATA_DIR, 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app.listen(PORT, () => {
    console.log(`SAVARA corriendo en http://localhost:${PORT}`);
  });
}

start();
