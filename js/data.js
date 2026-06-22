/* ==========================================================================
   SAVARA · Datos del catálogo + API
   --------------------------------------------------------------------------
   · PRODUCTOS y TIENDA se cargan desde la API en lugar de localStorage.
   · Las funciones CRUD se comunican con el backend Express.
   ========================================================================== */

/* --------------------------- Stock labels ----------------------------- */
const STOCK_INFO = {
  alta:  { badge: "DISPONIBLE",   mensaje: "Stock disponible en Tienda Central" },
  media: { badge: "POCAS UNIDADES", mensaje: "Pocas unidades disponibles en tienda" },
  baja:  { badge: "AGOTADO",      mensaje: "Agotado en tienda por ahora" }
};

/* --------------------- Etiquetas de categorías ------------------------ */
const ETIQUETAS = {
  mujer:      { sing: "Mujer",      eyebrown: "COLECCIÓN MUJER" },
  hombre:     { sing: "Hombre",     eyebrown: "COLECCIÓN HOMBRE" },
  infantil:   { sing: "Infantil",   eyebrown: "COLECCIÓN INFANTIL" },
  accesorios: { sing: "Accesorios", eyebrown: "ACCESORIOS" }
};

const CATEGORIAS = Object.keys(ETIQUETAS);

/* ====================================================================
   VARIABLES GLOBALES (se cargan con cargarDatos)
   ==================================================================== */
let PRODUCTOS = [];
let TIENDA = {};
let PAGINA = {};

/* ====================================================================
   API
   ==================================================================== */
async function cargarDatos() {
  const [productos, tienda, pagina] = await Promise.all([
    fetch('/api/productos').then(r => {
      if (!r.ok) throw new Error('Error al cargar productos');
      return r.json();
    }),
    fetch('/api/tienda').then(r => {
      if (!r.ok) throw new Error('Error al cargar tienda');
      return r.json();
    }),
    fetch('/api/pagina').then(r => {
      if (!r.ok) throw new Error('Error al cargar página');
      return r.json();
    })
  ]);
  PRODUCTOS = productos;
  TIENDA = tienda;
  PAGINA = pagina;
}

/* ---- Auth ---- */
function getToken() {
  return sessionStorage.getItem('savara_token');
}

function setToken(token) {
  sessionStorage.setItem('savara_token', token);
}

function clearToken() {
  sessionStorage.removeItem('savara_token');
}

async function loginAPI(username, password) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  if (!res.ok) return null;
  const data = await res.json();
  setToken(data.token);
  return data;
}

/* ---- Fetch con autenticación ---- */
async function apiFetch(url, options = {}) {
  const token = getToken();
  const headers = { ...options.headers };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || 'Error en la solicitud');
  }
  return res.json();
}

/* ---- Productos CRUD ---- */
async function crearProducto(producto) {
  const data = await apiFetch('/api/productos', {
    method: 'POST',
    body: producto
  });
  PRODUCTOS.push(data);
  return data;
}

async function actualizarProducto(id, producto) {
  const data = await apiFetch(`/api/productos/${id}`, {
    method: 'PUT',
    body: producto
  });
  const idx = PRODUCTOS.findIndex(p => p.id === id);
  if (idx !== -1) PRODUCTOS[idx] = data;
  return data;
}

async function eliminarProductoAPI(id) {
  await apiFetch(`/api/productos/${id}`, { method: 'DELETE' });
  PRODUCTOS = PRODUCTOS.filter(p => p.id !== id);
}

/* ---- Tienda ---- */
async function actualizarTienda(data) {
  const res = await apiFetch('/api/tienda', {
    method: 'PUT',
    body: data
  });
  TIENDA = res;
  return res;
}

/* ---- Subir imagen ---- */
async function subirImagen(file) {
  const formData = new FormData();
  formData.append('imagen', file);
  const data = await apiFetch('/api/upload', {
    method: 'POST',
    body: formData
  });
  return data.url;
}

/* ---- Página (contenido dinámico) ---- */
async function actualizarPagina(datos) {
  const res = await apiFetch('/api/pagina', {
    method: 'PUT',
    body: datos
  });
  PAGINA = res;
  return res;
}

/* ---- Exportar / Importar ---- */
async function exportarProductos() {
  return apiFetch('/api/productos/exportar');
}

async function importarProductos(lista) {
  return apiFetch('/api/productos/importar', {
    method: 'POST',
    body: lista
  });
}

/* ---- Duplicar ---- */
async function duplicarProducto(id) {
  const data = await apiFetch(`/api/productos/duplicar/${id}`, {
    method: 'POST'
  });
  PRODUCTOS.push(data);
  return data;
}

/* ---- Dashboard ---- */
async function cargarDashboard() {
  return apiFetch('/api/dashboard');
}

/* ---- Actividad ---- */
async function cargarActividad() {
  return apiFetch('/api/actividad');
}

/* ====================================================================
   HELPERS (sin cambios)
   ==================================================================== */
function escapeHTML(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function productoPorId(id) {
  return PRODUCTOS.find(p => p.id === id);
}

function formatearPrecio(valor) {
  return "$" + valor.toLocaleString("es-CL");
}

function claseFondo(producto) {
  if (!producto.imagen_id) return "";
  return "bg-" + producto.imagen_id;
}
