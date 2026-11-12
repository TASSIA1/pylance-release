/* =========================================================
   Loïc App — Vente, location & gestion de matériel topographique
   Application web progressive (PWA) hors-ligne, prête pour Android
   ========================================================= */
(() => {
'use strict';

const C = window.LOIC_COMPANY;
const KEY = 'loicapp.data.v1';
const CART_KEY = 'loicapp.cart.v1';
const MINE_KEY = 'loicapp.mine.v1';

/* ---------------- Stockage ---------------- */
const clone = o => JSON.parse(JSON.stringify(o));
function load(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : clone(fallback); }
  catch { return clone(fallback); }
}
function persist(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} }

let db = load(KEY, window.LOIC_DEFAULT);
// Fusionne les nouveaux produits par défaut si la base existe déjà
for (const p of window.LOIC_DEFAULT.products) if (!db.products.find(x => x.id === p.id) && !(db.deleted || []).includes(p.id)) db.products.push(clone(p));
for (const k of ['movements', 'reservations', 'orders', 'quotes']) db[k] = db[k] || [];
db.services = db.services || clone(window.LOIC_DEFAULT.services);
db.settings = Object.assign({ pin: '1234' }, db.settings);
let cart = load(CART_KEY, []);
let mine = load(MINE_KEY, { reservations: [], orders: [], quotes: [] });
const save = () => { persist(KEY, db); persist(CART_KEY, cart); persist(MINE_KEY, mine); updateBadge(); };

/* ---------------- Utilitaires ---------------- */
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = n => new Intl.NumberFormat('fr-FR').format(Math.round(n || 0)).replace(/ | /g, ' ') + ' FCFA';
const pad = n => String(n).padStart(2, '0');
const todayISO = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const nowLocal = (d = new Date()) => `${todayISO(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
const dt = iso => { if (!iso) return '—'; const d = new Date(iso); return d.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }) + ' à ' + pad(d.getHours()) + 'h' + pad(d.getMinutes()); };
const dOnly = iso => iso ? new Date(iso + (iso.length === 10 ? 'T00:00' : '')).toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const days = (s, e) => Math.max(1, Math.round((new Date(e + 'T00:00') - new Date(s + 'T00:00')) / 864e5) + 1);
const ref = p => { const d = new Date(); return `${p}-${String(d.getFullYear()).slice(2)}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`; };
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const prod = id => db.products.find(p => p.id === id);
const priceOf = p => p.mode === 'vente' ? p.price : p.rent;
const priceLabel = p => p.mode === 'vente' ? (p.price ? fmt(p.price) : 'Prix sur devis') : `${fmt(p.rent)} <small>/ jour</small>`;
const waLink = text => `https://wa.me/${C.whatsapp}?text=${encodeURIComponent(text)}`;
const mailLink = (subject, body) => `mailto:${C.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
const isAdmin = () => { try { return sessionStorage.getItem('loicapp.admin') === '1'; } catch { return false; } };

/* ---------------- Icônes ---------------- */
const I = {
  gnss: '<svg viewBox="0 0 24 24"><ellipse cx="12" cy="8" rx="7" ry="3.2"/><path d="M5 8v2c0 1.8 3.1 3.2 7 3.2s7-1.4 7-3.2V8M12 13.2V21M9 21h6M12 2v2.8"/></svg>',
  station: '<svg viewBox="0 0 24 24"><rect x="7" y="3" width="10" height="9" rx="2"/><circle cx="12" cy="7.5" r="2.2"/><path d="M5 12h14M12 12v3M12 15 6 22M12 15l6 7M12 15v7"/></svg>',
  drone: '<svg viewBox="0 0 24 24"><rect x="9" y="10" width="6" height="4" rx="1.2"/><path d="M9 11 5.5 7.5M15 11l3.5-3.5M9 13l-3.5 3.5M15 13l3.5 3.5"/><circle cx="5" cy="7" r="2.5"/><circle cx="19" cy="7" r="2.5"/><circle cx="5" cy="17" r="2.5"/><circle cx="19" cy="17" r="2.5"/></svg>',
  tripod: '<svg viewBox="0 0 24 24"><path d="M8 3h8M12 3v5M12 8 5 21M12 8l7 13M12 8v13"/></svg>',
  level: '<svg viewBox="0 0 24 24"><rect x="3" y="6" width="15" height="6" rx="2"/><path d="M18 9h3M6 9h1M11 12v3M8 15h7M11 15l-4 6M11 15l4 6"/><circle cx="12" cy="9" r="1.2"/></svg>',
  pole: '<svg viewBox="0 0 24 24"><path d="M12 6v16M10 22h4"/><circle cx="12" cy="4" r="2"/><path d="M10 10h4M10 14h4M10 18h4"/></svg>',
  base: '<svg viewBox="0 0 24 24"><path d="M5 15h14l-2 4H7zM8 15l1-5h6l1 5M12 10V5"/><circle cx="12" cy="4" r="1.3"/></svg>',
  marker: '<svg viewBox="0 0 24 24"><path d="M9 3h6v5l2 2v11H7V10l2-2z"/><path d="M7 14h10M12 3V1"/></svg>',
  bipod: '<svg viewBox="0 0 24 24"><path d="M12 2v20M12 7l-7 14M12 7l7 14"/></svg>',
  map: '<svg viewBox="0 0 24 24"><path d="M9 20 3 17V4l6 3 6-3 6 3v13l-6-3-6 3zM9 7v13M15 4v13"/></svg>',
  pin: '<svg viewBox="0 0 24 24"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
  flag: '<svg viewBox="0 0 24 24"><path d="M5 21V4M5 4h11l-2 4 2 4H5"/></svg>',
  school: '<svg viewBox="0 0 24 24"><path d="m2 9 10-5 10 5-10 5z"/><path d="M6 11v5c3 2.5 9 2.5 12 0v-5M22 9v6"/></svg>',
  tool: '<svg viewBox="0 0 24 24"><path d="M14.7 6.3a4 4 0 0 0 5 5L21 13l-8 8-3-3 8-8M14.7 6.3 9 12M3 21l6-6"/><path d="M14.7 6.3 13 4.6A4 4 0 0 1 18.4 3"/></svg>',
  signal: '<svg viewBox="0 0 24 24"><path d="M5 12a7 7 0 0 1 14 0M8 12a4 4 0 0 1 8 0"/><circle cx="12" cy="12" r="1.2"/><path d="M12 13v8M9 21h6"/></svg>',
  wa: '<svg viewBox="0 0 24 24"><path d="M4 20l1.3-4A8 8 0 1 1 8 19z"/><path d="M9 9.5c.3 2 2.5 4.2 4.5 4.5l1.2-1.2 2 1-.4 1.5c-3.6.4-8.3-4.3-7.9-7.9L10 7l1 2z"/></svg>',
  phone: '<svg viewBox="0 0 24 24"><path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z"/></svg>',
  mail: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m3.5 6.5 8.5 7 8.5-7"/></svg>',
  check: '<svg viewBox="0 0 24 24"><path d="M5 12.5 10 17l9-10"/></svg>',
  plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  trash: '<svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
  edit: '<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg>',
  download: '<svg viewBox="0 0 24 24"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>',
  upload: '<svg viewBox="0 0 24 24"><path d="M12 15V4M7 9l5-5 5 5M5 20h14"/></svg>',
  clock: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  alert: '<svg viewBox="0 0 24 24"><path d="M12 3 2 20h20zM12 10v4M12 17v.5"/></svg>',
  info: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v.5"/></svg>',
  search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>',
  box: '<svg viewBox="0 0 24 24"><path d="m3 7 9-4 9 4-9 4zM3 7v10l9 4 9-4V7M12 11v10"/></svg>',
  out: '<svg viewBox="0 0 24 24"><path d="M14 4h5a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-5M10 16l4-4-4-4M14 12H3"/></svg>',
  in: '<svg viewBox="0 0 24 24"><path d="M10 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h5M14 8l-4 4 4 4M10 12h11"/></svg>',
  cal: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
  cart: '<svg viewBox="0 0 24 24"><path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6.2"/><circle cx="10" cy="20.5" r="1.3"/><circle cx="17" cy="20.5" r="1.3"/></svg>',
  logout: '<svg viewBox="0 0 24 24"><path d="M10 4H5v16h5M15 8l4 4-4 4M19 12H9"/></svg>',
  doc: '<svg viewBox="0 0 24 24"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/></svg>',
  back: '<svg viewBox="0 0 24 24"><path d="m15 5-7 7 7 7"/></svg>',
  star: '<svg viewBox="0 0 24 24"><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/></svg>',
  shield: '<svg viewBox="0 0 24 24"><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/></svg>',
  truck: '<svg viewBox="0 0 24 24"><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>'
};
const CATS = { gnss: 'GNSS', station: 'Stations totales', drone: 'Drones', level: 'Niveaux', tripod: 'Trépieds', pole: 'Cannes', bipod: 'Bipodes / Tripodes', base: 'Embases', marker: 'Traceurs' };

/* ---------------- Logique métier ---------------- */
const ACTIVE = ['attente', 'confirmee', 'sortie'];
const RES_LABEL = { attente: 'En attente', confirmee: 'Confirmée', sortie: 'Sortie', retournee: 'Retournée', annulee: 'Annulée', retard: 'En retard' };
const ORD_LABEL = { attente: 'En attente', confirmee: 'Confirmée', livree: 'Livrée', annulee: 'Annulée' };
const QUO_LABEL = { attente: 'Nouvelle', confirmee: 'Traitée', annulee: 'Classée' };

const overlap = (a1, a2, b1, b2) => a1 <= b2 && b1 <= a2;
function booked(productId, s, e, exceptId) {
  return db.reservations.filter(r => r.productId === productId && r.id !== exceptId && ACTIVE.includes(r.status) && overlap(s, e, r.start, r.end))
    .reduce((n, r) => n + r.qty, 0);
}
function availableFor(p, s, e, exceptId) {
  return Math.max(0, p.stock - (p.manualOut || 0) - booked(p.id, s, e, exceptId));
}
function outNow(p) {
  return (p.manualOut || 0) + db.reservations.filter(r => r.productId === p.id && r.status === 'sortie').reduce((n, r) => n + r.qty, 0);
}
function availableNow(p) {
  if (p.mode === 'vente') return p.stock;
  const t = todayISO();
  return availableFor(p, t, t);
}
function resStatus(r) {
  if (r.status === 'sortie' && todayISO() > r.end) return 'retard';
  return r.status;
}
function logMove(m) {
  db.movements.unshift(Object.assign({ id: uid(), at: new Date().toISOString() }, m));
}
function stockPill(p) {
  const n = availableNow(p);
  if (n <= 0) return `<span class="stockpill out">${p.mode === 'vente' ? 'Rupture' : 'Indisponible'}</span>`;
  if (n <= Math.max(2, Math.ceil(p.stock * .2))) return `<span class="stockpill low">${n} ${p.mode === 'vente' ? 'en stock' : 'dispo.'}</span>`;
  return `<span class="stockpill">${n} ${p.mode === 'vente' ? 'en stock' : 'disponibles'}</span>`;
}

/* ---------------- Interface : toast, sheet ---------------- */
let toastT;
function toast(msg, ok = true) {
  const t = $('#toast'); t.textContent = msg; t.className = 'toast' + (ok ? ' ok' : ''); t.hidden = false;
  clearTimeout(toastT); toastT = setTimeout(() => t.hidden = true, 2600);
}
function openSheet(html) { $('#sheetPanel').innerHTML = html; $('#sheet').hidden = false; }
function closeSheet() { $('#sheet').hidden = true; $('#sheetPanel').innerHTML = ''; }
function updateBadge() {
  const n = cart.reduce((a, c) => a + c.qty, 0), b = $('#cartBadge');
  if (!b) return; b.hidden = !n; b.textContent = n;
}

/* ---------------- Composants ---------------- */
function productCard(p) {
  return `<a class="card pcard ${p.mode === 'location' ? 'loc' : ''}" href="#/p/${p.id}">
    <div class="visual">${I[p.cat] || I.box}<span class="tag">${p.mode === 'vente' ? 'Vente' : 'Location'}</span></div>
    <div class="body">
      <h3>${esc(p.name)}</h3>
      <span class="brandline">${esc(CATS[p.cat] || '')}${p.brand ? ' • ' + esc(p.brand) : ''}</span>
      ${stockPill(p)}
      <div class="price">${priceLabel(p)}</div>
    </div></a>`;
}
const empty = (txt, icon = I.box) => `<div class="empty">${icon}<div>${txt}</div></div>`;
const contactCard = () => `
  <div class="contact-card">
    <div class="row" style="margin-bottom:6px"><img src="icons/logo.svg" style="width:42px;height:42px;border-radius:12px" alt=""><div><b style="font-size:17px">${esc(C.name)}</b><div class="small" style="opacity:.7">${esc(C.hours)}</div></div></div>
    <a class="line" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('Mbalgong Cameroun')}" target="_blank" rel="noopener"><span class="ci">${I.pin}</span><span>${esc(C.city)}</span></a>
    ${C.phones.map(ph => `<a class="line" href="tel:${ph.replace(/[^+\d]/g, '')}"><span class="ci">${I.phone}</span><span>${esc(ph)}</span></a>`).join('')}
    <a class="line" href="${waLink('Bonjour Loïc App, je souhaite avoir des informations.')}" target="_blank" rel="noopener"><span class="ci">${I.wa}</span><span>Écrire sur WhatsApp</span></a>
    <a class="line" href="mailto:${C.email}"><span class="ci">${I.mail}</span><span>${esc(C.email)}</span></a>
  </div>`;

/* ---------------- Pages client ---------------- */
const views = {};

views.home = () => {
  const sale = db.products.filter(p => p.mode === 'vente'), loc = db.products.filter(p => p.mode === 'location');
  const units = sale.reduce((a, p) => a + p.stock, 0);
  return `
  <section class="hero">
    <span class="kicker">${I.star} Matériel topographique premium</span>
    <h1>Mesurez juste, <em>livrez à temps.</em></h1>
    <p>Achetez, louez et réservez vos stations totales, récepteurs GNSS, drones et accessoires à Mbalgong.</p>
    <div class="hero-cta">
      <a href="#/location" class="btn green">${I.cal} Réserver un appareil</a>
      <a href="#/vente" class="btn ghost">${I.cart} Acheter</a>
    </div>
    <div class="hero-stats">
      <div><b>${units}</b><span>articles en vente</span></div>
      <div><b>${loc.reduce((a, p) => a + p.stock, 0)}</b><span>appareils en location</span></div>
      <div><b>7j/7</b><span>assistance WhatsApp</span></div>
    </div>
  </section>
  <div class="section"><div class="tiles">
    <a class="tile" href="#/location?c=station"><div class="ic">${I.station}</div>Stations</a>
    <a class="tile" href="#/location?c=gnss"><div class="ic">${I.gnss}</div>GNSS</a>
    <a class="tile" href="#/location?c=drone"><div class="ic">${I.drone}</div>Drones</a>
    <a class="tile" href="#/prestations"><div class="ic">${I.map}</div>Services</a>
  </div></div>
  <div class="section"><div class="section-h"><h2>À louer maintenant</h2><a href="#/location">Tout voir</a></div>
    <div class="grid">${loc.slice(0, 4).map(productCard).join('')}</div></div>
  <div class="section"><div class="section-h"><h2>En vente</h2><a href="#/vente">Tout voir</a></div>
    <div class="grid">${sale.slice(0, 4).map(productCard).join('')}</div></div>
  <div class="section"><div class="stack">
    <div class="svc"><div class="ic">${I.shield}</div><div><h3>Matériel contrôlé</h3><p style="margin-bottom:0">Chaque appareil est vérifié, calibré et chargé avant chaque sortie.</p></div></div>
    <div class="svc"><div class="ic">${I.truck}</div><div><h3>Retrait ou livraison</h3><p style="margin-bottom:0">Retrait à Mbalgong ou livraison sur votre chantier, sur demande.</p></div></div>
  </div></div>
  <div class="section-h pad" style="margin-top:18px"><h2>Nous contacter</h2></div>
  ${contactCard()}`;
};

function catalog(mode, q) {
  const all = db.products.filter(p => p.mode === mode);
  const cats = [...new Set(all.map(p => p.cat))];
  const c = q.get('c') || '', s = (q.get('s') || '').toLowerCase();
  const list = all.filter(p => (!c || p.cat === c) && (!s || (p.name + ' ' + p.brand + ' ' + p.desc).toLowerCase().includes(s)));
  return `
  <div class="page-head"><h1>${mode === 'vente' ? 'Appareils & accessoires en vente' : 'Location d\'appareils'}</h1>
    <p>${mode === 'vente' ? 'Ajoutez au panier et passez commande en ligne.' : 'Tarifs à la journée. Réservez vos dates en quelques secondes.'}</p></div>
  <label class="searchbar">${I.search}<input type="search" placeholder="Rechercher un appareil…" value="${esc(q.get('s') || '')}" data-search="${mode}"></label>
  <div class="chips">
    <a class="chip ${!c ? 'on' : ''}" href="#/${mode}">Tout</a>
    ${cats.map(k => `<a class="chip ${c === k ? 'on' : ''}" href="#/${mode}?c=${k}">${CATS[k] || k}</a>`).join('')}
  </div>
  ${mode === 'location' ? `<div class="pad" style="margin:6px 0 12px"><div class="notice info">${I.info}<span>Drone loué <b>avec opérateur</b>. Caution et pièce d'identité demandées au retrait.</span></div></div>` : ''}
  <div class="pad"><div class="grid">${list.map(productCard).join('') || ''}</div>${list.length ? '' : empty('Aucun appareil trouvé.')}</div>`;
}
views.vente = q => catalog('vente', q);
views.location = q => catalog('location', q);

views.p = (q, id) => {
  const p = prod(id); if (!p) return empty('Appareil introuvable.');
  const avail = availableNow(p);
  const upcoming = p.mode === 'location' ? db.reservations.filter(r => r.productId === p.id && ACTIVE.includes(r.status) && r.end >= todayISO()).sort((a, b) => a.start.localeCompare(b.start)).slice(0, 4) : [];
  return `
  <div class="detail-visual ${p.mode === 'location' ? 'loc' : ''}">${I[p.cat] || I.box}</div>
  <div class="card detail">
    <span class="status ${p.mode === 'vente' ? 'st-confirmee' : 'st-livree'}">${p.mode === 'vente' ? 'Vente' : 'Location'}</span>
    <h1 style="margin-top:8px">${esc(p.name)}</h1>
    <div class="muted small">${esc(CATS[p.cat] || '')}${p.brand ? ' • ' + esc(p.brand) : ''}</div>
    <div class="bigprice">${priceLabel(p)}</div>
    ${p.operator ? '<div class="small" style="color:var(--green);font-weight:700">Opérateur qualifié inclus</div>' : ''}
    <p class="muted">${esc(p.desc)}</p>
    <div class="kv">
      <div><span>${p.mode === 'vente' ? 'En stock' : 'Disponibles aujourd\'hui'}</span><b>${avail} / ${p.stock}</b></div>
      <div><span>Retrait</span><b>Mbalgong</b></div>
    </div>
    ${p.mode === 'vente' ? `
      <div class="row between" style="margin-bottom:12px"><b>Quantité</b>
        <div class="qty"><button data-act="qty" data-d="-1">−</button><input id="qtyIn" type="number" min="1" max="${Math.max(1, avail)}" value="1" inputmode="numeric"><button data-act="qty" data-d="1">+</button></div></div>
      <button class="btn green block" data-act="addCart" data-id="${p.id}" ${avail <= 0 ? 'disabled' : ''}>${I.cart} Ajouter au panier</button>
      <a class="btn outline block" style="margin-top:8px" href="${waLink(`Bonjour, je souhaite un devis pour : ${p.name}.`)}" target="_blank" rel="noopener">${I.wa} Demander le prix sur WhatsApp</a>
    ` : `
      <a class="btn green block" href="#/reserver/${p.id}">${I.cal} Réserver cet appareil</a>
      ${upcoming.length ? `<div style="margin-top:16px"><b class="small">Périodes déjà réservées</b><div class="list" style="margin-top:8px">${upcoming.map(r => `<div class="mini">${dOnly(r.start)} → ${dOnly(r.end)} • <b>${r.qty}</b> unité(s)</div>`).join('')}</div></div>` : ''}
    `}
  </div>`;
};

views.reserver = (q, id) => {
  const p = prod(id); if (!p || p.mode !== 'location') return empty('Appareil introuvable.');
  const t = todayISO(), t2 = todayISO(new Date(Date.now() + 864e5));
  return `
  <div class="page-head"><a href="#/p/${p.id}" class="row small muted">${I.back} Retour</a><h1 style="margin-top:8px">Réserver : ${esc(p.name)}</h1><p>${fmt(p.rent)} par jour et par unité${p.operator ? ' — opérateur inclus' : ''}</p></div>
  <form class="pad stack" data-form="reservation" data-id="${p.id}" style="margin-top:12px">
    <div class="two">
      <div class="field"><label>Date de sortie</label><input type="date" name="start" min="${t}" value="${t}" required></div>
      <div class="field"><label>Date de retour</label><input type="date" name="end" min="${t}" value="${t2}" required></div>
    </div>
    <div class="two">
      <div class="field"><label>Heure de retrait</label><input type="time" name="time" value="08:00" required></div>
      <div class="field"><label>Quantité</label><input type="number" name="qty" min="1" value="1" required inputmode="numeric"></div>
    </div>
    <div class="field"><label>Nom complet / Entreprise</label><input name="name" required placeholder="Ex : Cabinet Géo Plus"></div>
    <div class="field"><label>Téléphone (WhatsApp)</label><input name="phone" type="tel" required placeholder="6XX XX XX XX" inputmode="tel"></div>
    <div class="field"><label>Lieu du chantier</label><input name="site" placeholder="Ex : Yaoundé, Nkolbisson"></div>
    <div class="field"><label>Remarque</label><textarea name="note" rows="2" placeholder="Accessoires souhaités, livraison…"></textarea></div>
    <div id="resCalc"></div>
    <button class="btn green block" type="submit">${I.check} Confirmer la réservation</button>
  </form>`;
};
function calcReservation(form) {
  const p = prod(form.dataset.id), f = new FormData(form);
  const s = f.get('start'), e = f.get('end'), qty = Math.max(1, +f.get('qty') || 1);
  const box = $('#resCalc'); if (!box) return {};
  if (!s || !e || e < s) { box.innerHTML = `<div class="notice err">${I.alert}<span>La date de retour doit être après la date de sortie.</span></div>`; return { ok: false }; }
  const n = days(s, e), avail = availableFor(p, s, e), total = n * qty * p.rent;
  box.innerHTML = `
    <div class="notice ${avail >= qty ? 'ok' : 'err'}">${avail >= qty ? I.check : I.alert}<span>${avail >= qty ? `${avail} unité(s) disponible(s) sur cette période.` : `Seulement ${avail} unité(s) disponible(s) sur cette période.`}</span></div>
    <div class="summary" style="margin-top:10px">
      <div class="row"><span>Durée</span><span>${n} jour(s)</span></div>
      <div class="row"><span>Tarif</span><span>${fmt(p.rent)} × ${qty}</span></div>
      <div class="row total"><span>Total estimé</span><b>${fmt(total)}</b></div>
    </div>`;
  return { ok: avail >= qty && qty > 0, s, e, qty, n, total };
}

views.prestations = () => `
  <div class="page-head"><h1>Nos prestations</h1><p>Une équipe de topographes et de télépilotes à votre service.</p></div>
  <div class="pad stack" style="margin-top:12px">
    ${db.services.map(s => `<div class="svc"><div class="ic">${I[s.icon] || I.map}</div><div style="flex:1"><h3>${esc(s.name)}</h3><p>${esc(s.desc)}</p>
      <button class="btn sm light" data-act="quote" data-id="${s.id}">${I.doc} Demander un devis</button></div></div>`).join('')}
  </div>
  ${contactCard()}`;

views.panier = () => {
  if (!cart.length) return `<div class="page-head"><h1>Mon panier</h1></div>${empty('Votre panier est vide.<br><br><a class="btn green" href="#/vente">Voir les appareils en vente</a>', I.cart)}`;
  const lines = cart.map(c => ({ ...c, p: prod(c.id) })).filter(c => c.p);
  const priced = lines.filter(l => l.p.price), total = priced.reduce((a, l) => a + l.p.price * l.qty, 0), onQuote = lines.length - priced.length;
  return `
  <div class="page-head"><h1>Mon panier</h1><p>${lines.reduce((a, l) => a + l.qty, 0)} article(s)</p></div>
  <div class="pad list" style="margin-top:12px">
    ${lines.map(l => `<div class="item"><div class="av">${I[l.p.cat] || I.box}</div><div class="grow"><h4>${esc(l.p.name)}</h4><p>${l.p.price ? fmt(l.p.price) + ' / unité' : 'Prix sur devis'}</p></div>
      <div class="qty"><button data-act="cartQty" data-id="${l.id}" data-d="-1">−</button><input value="${l.qty}" readonly><button data-act="cartQty" data-id="${l.id}" data-d="1">+</button></div></div>`).join('')}
  </div>
  <form class="pad stack" data-form="order" style="margin-top:16px">
    <div class="summary">
      <div class="row"><span>Articles avec prix</span><span>${fmt(total)}</span></div>
      ${onQuote ? `<div class="row"><span>Articles sur devis</span><span>${onQuote}</span></div>` : ''}
      <div class="row total"><span>Total ${onQuote ? 'provisoire' : ''}</span><b>${fmt(total)}</b></div>
    </div>
    ${onQuote ? `<div class="notice info">${I.info}<span>Le prix final des articles « sur devis » vous sera communiqué par notre équipe.</span></div>` : ''}
    <h2 style="font-size:17px;margin-top:6px">Vos coordonnées</h2>
    <div class="field"><label>Nom complet / Entreprise</label><input name="name" required></div>
    <div class="field"><label>Téléphone (WhatsApp)</label><input name="phone" type="tel" required inputmode="tel"></div>
    <div class="field"><label>Mode de réception</label><select name="delivery"><option>Retrait à Mbalgong</option><option>Livraison (frais à convenir)</option></select></div>
    <div class="field"><label>Adresse / Remarque</label><textarea name="note" rows="2"></textarea></div>
    <button class="btn green block" type="submit">${I.check} Valider la commande</button>
  </form>`;
};

views.compte = () => {
  const rs = db.reservations.filter(r => mine.reservations.includes(r.id));
  const os = db.orders.filter(o => mine.orders.includes(o.id));
  const qs = db.quotes.filter(o => mine.quotes.includes(o.id));
  return `
  <div class="page-head"><h1>Mes suivis</h1><p>Vos réservations, commandes et demandes de devis.</p></div>
  <div class="section"><div class="section-h"><h2>Réservations</h2></div><div class="list">
    ${rs.map(r => { const p = prod(r.productId) || {}; const st = resStatus(r); return `<div class="item"><div class="av g">${I[p.cat] || I.cal}</div><div class="grow"><h4>${esc(p.name)} × ${r.qty}</h4><p>${r.ref} • ${dOnly(r.start)} → ${dOnly(r.end)}</p><p><b>${fmt(r.total)}</b></p></div><span class="status st-${st}">${RES_LABEL[st]}</span></div>`; }).join('') || empty('Aucune réservation.', I.cal)}
  </div></div>
  <div class="section"><div class="section-h"><h2>Commandes</h2></div><div class="list">
    ${os.map(o => `<div class="item"><div class="av">${I.cart}</div><div class="grow"><h4>${o.ref}</h4><p>${o.items.length} article(s) • ${dt(o.createdAt)}</p><p><b>${fmt(o.total)}</b></p></div><span class="status st-${o.status}">${ORD_LABEL[o.status]}</span></div>`).join('') || empty('Aucune commande.', I.cart)}
  </div></div>
  ${qs.length ? `<div class="section"><div class="section-h"><h2>Devis</h2></div><div class="list">${qs.map(o => `<div class="item"><div class="av g">${I.doc}</div><div class="grow"><h4>${esc(o.service)}</h4><p>${o.ref} • ${dt(o.createdAt)}</p></div><span class="status st-${o.status}">${QUO_LABEL[o.status]}</span></div>`).join('')}</div></div>` : ''}
  ${contactCard()}`;
};

/* ---------------- Espace gestion (administrateur) ---------------- */
function adminShell(tab, body) {
  const pendingR = db.reservations.filter(r => r.status === 'attente').length;
  const late = db.reservations.filter(r => resStatus(r) === 'retard').length;
  const out = db.products.filter(p => p.mode === 'location').reduce((a, p) => a + outNow(p), 0);
  const saleUnits = db.products.filter(p => p.mode === 'vente').reduce((a, p) => a + p.stock, 0);
  const tabs = [['dash', 'Tableau de bord'], ['stock', 'Stock'], ['mouv', 'Sorties / Retours'], ['res', `Réservations${pendingR ? ' (' + pendingR + ')' : ''}`], ['cmd', 'Commandes'], ['devis', 'Devis'], ['reglages', 'Réglages']];
  return `
  <section class="admin-hero"><div class="row between"><div><h1>Espace gestion</h1><p>${new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p></div>
    <button class="btn sm ghost" data-act="logout">${I.logout} Quitter</button></div></section>
  <div class="kpis">
    <div class="kpi"><span>Stock vente</span><b>${saleUnits}</b></div>
    <div class="kpi"><span>Appareils sortis</span><b class="a">${out}</b></div>
    <div class="kpi"><span>À valider</span><b class="g">${pendingR + db.orders.filter(o => o.status === 'attente').length}</b></div>
    <div class="kpi"><span>Retours en retard</span><b class="${late ? 'r' : ''}">${late}</b></div>
  </div>
  <nav class="seg">${tabs.map(([k, l]) => `<a href="#/admin/${k}" class="${tab === k ? 'on' : ''}">${l}</a>`).join('')}</nav>
  <div class="pad" style="margin-top:10px">${body}</div>`;
}

views.admin = (q, tab = 'dash') => {
  if (!isAdmin()) return `
    <div class="page-head" style="text-align:center;padding-top:40px"><img src="icons/logo.svg" style="width:72px;height:72px;border-radius:20px" alt=""><h1 style="margin-top:14px">Espace gestion</h1><p>Entrez votre code PIN pour gérer le stock, les sorties et les commandes.</p></div>
    <form class="pad stack" data-form="login" style="max-width:360px;margin:20px auto">
      <div class="field"><label>Code PIN</label><input name="pin" type="password" inputmode="numeric" autocomplete="current-password" required style="text-align:center;font-size:22px;letter-spacing:8px"></div>
      <button class="btn green block">Se connecter</button>
      <p class="small muted" style="text-align:center">Code initial : 1234 — à changer dans Réglages.</p>
    </form>`;
  return adminShell(tab, (adminTabs[tab] || adminTabs.dash)(q));
};

const resItem = r => {
  const p = prod(r.productId) || {}, st = resStatus(r);
  return `<div class="item" data-act="resSheet" data-id="${r.id}" style="cursor:pointer"><div class="av g">${I[p.cat] || I.cal}</div><div class="grow"><h4>${esc(r.client.name)} — ${esc(p.name)} × ${r.qty}</h4><p>${dOnly(r.start)} ${r.time || ''} → ${dOnly(r.end)}</p><p>${r.ref} • <b>${fmt(r.total)}</b></p></div><span class="status st-${st}">${RES_LABEL[st]}</span></div>`;
};
const moveLabel = { sortie: 'Sortie', retour: 'Retour', entree: 'Entrée stock', vente: 'Vente', ajustement: 'Ajustement', annulation: 'Annulation vente' };
const moveRow = m => { const p = prod(m.productId) || { name: '(supprimé)' }; return `<tr><td>${dt(m.at)}</td><td><span class="status ${m.type === 'retour' || m.type === 'entree' ? 'st-retournee' : m.type === 'sortie' ? 'st-sortie' : 'st-confirmee'}">${moveLabel[m.type] || m.type}</span></td><td>${esc(p.name)}</td><td><b>${m.qty > 0 && m.type === 'ajustement' ? '+' : ''}${m.qty}</b></td><td>${esc(m.who || '')}</td><td>${esc(m.ref || m.note || '')}</td></tr>`; };
const moveTable = list => list.length ? `<div class="table-wrap"><table><thead><tr><th>Date & heure</th><th>Type</th><th>Appareil</th><th>Qté</th><th>Client</th><th>Réf / note</th></tr></thead><tbody>${list.map(moveRow).join('')}</tbody></table></div>` : empty('Aucun mouvement enregistré.', I.clock);

const adminTabs = {
  dash() {
    const t = todayISO();
    const late = db.reservations.filter(r => resStatus(r) === 'retard');
    const todayOut = db.reservations.filter(r => r.start === t && ['attente', 'confirmee'].includes(r.status));
    const todayBack = db.reservations.filter(r => r.end === t && r.status === 'sortie');
    const lowStock = db.products.filter(p => p.mode === 'vente' && p.stock <= 2);
    const revenue = db.orders.filter(o => ['confirmee', 'livree'].includes(o.status)).reduce((a, o) => a + o.total, 0) + db.reservations.filter(r => ['sortie', 'retournee'].includes(r.status)).reduce((a, r) => a + r.total, 0);
    return `<div class="stack">
      <div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn green sm" data-act="moveSheet" data-type="sortie">${I.out} Enregistrer une sortie</button><button class="btn sm" data-act="moveSheet" data-type="retour">${I.in} Enregistrer un retour</button></div>
      <div class="kpi"><span>Chiffre d'affaires enregistré (ventes confirmées + locations)</span><b class="g">${fmt(revenue)}</b></div>
      ${late.length ? `<div class="notice err">${I.alert}<span><b>${late.length} retour(s) en retard.</b> Contactez les clients concernés.</span></div><div class="list">${late.map(resItem).join('')}</div>` : ''}
      <h2 style="font-size:16px">Sorties prévues aujourd'hui</h2><div class="list">${todayOut.map(resItem).join('') || '<p class="muted small">Aucune sortie prévue.</p>'}</div>
      <h2 style="font-size:16px">Retours attendus aujourd'hui</h2><div class="list">${todayBack.map(resItem).join('') || '<p class="muted small">Aucun retour attendu.</p>'}</div>
      ${lowStock.length ? `<div class="notice warn">${I.alert}<span>Stock faible : ${lowStock.map(p => esc(p.name) + ' (' + p.stock + ')').join(', ')}</span></div>` : ''}
      <h2 style="font-size:16px">Derniers mouvements</h2>${moveTable(db.movements.slice(0, 8))}
    </div>`;
  },
  stock(q) {
    const mode = q.get('m') || 'vente';
    const list = db.products.filter(p => p.mode === mode);
    return `<div class="chips" style="padding:0 0 10px"><a class="chip ${mode === 'vente' ? 'on' : ''}" href="#/admin/stock?m=vente">Vente</a><a class="chip ${mode === 'location' ? 'on' : ''}" href="#/admin/stock?m=location">Location</a></div>
      <div class="row between" style="margin-bottom:10px"><b>${list.length} références • ${list.reduce((a, p) => a + p.stock, 0)} unités</b><button class="btn sm green" data-act="editProduct" data-mode="${mode}">${I.plus} Ajouter</button></div>
      <div class="list">${list.map(p => {
        const o = mode === 'location' ? outNow(p) : 0, a = availableNow(p);
        return `<div class="stock-row"><div class="row between"><div class="row"><div class="av" style="width:40px;height:40px;border-radius:12px;display:grid;place-items:center;background:var(--blue-soft)">${I[p.cat] || I.box}</div><div><b>${esc(p.name)}</b><div class="small muted">${priceLabel(p)}</div></div></div>
          <button class="btn sm outline" data-act="editProduct" data-id="${p.id}">${I.edit}</button></div>
          <div class="meta"><span class="mini">Parc : <b>${p.stock}</b></span>${mode === 'location' ? `<span class="mini">Sortis : <b>${o}</b></span><span class="mini">Disponibles : <b>${a}</b></span>` : ''}</div>
          ${mode === 'location' ? `<div class="bar"><i style="width:${p.stock ? (a / p.stock * 100) : 0}%"></i></div>` : ''}
          <div class="row" style="margin-top:10px;gap:6px"><button class="btn sm light" data-act="adjust" data-id="${p.id}" data-d="-1">− 1</button><button class="btn sm light" data-act="adjust" data-id="${p.id}" data-d="1">+ 1</button><button class="btn sm light" data-act="adjustSheet" data-id="${p.id}">Entrée / ajustement</button></div>
        </div>`; }).join('')}</div>`;
  },
  mouv(q) {
    const f = q.get('f') || '';
    const list = db.movements.filter(m => !f || m.type === f);
    return `<div class="stack">
      <div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn green sm" data-act="moveSheet" data-type="sortie">${I.out} Nouvelle sortie</button><button class="btn sm" data-act="moveSheet" data-type="retour">${I.in} Nouveau retour</button><button class="btn sm outline" data-act="csv" data-what="movements">${I.download} Export CSV</button></div>
      <div class="chips" style="padding:0"><a class="chip ${!f ? 'on' : ''}" href="#/admin/mouv">Tous</a>${Object.keys(moveLabel).map(k => `<a class="chip ${f === k ? 'on' : ''}" href="#/admin/mouv?f=${k}">${moveLabel[k]}</a>`).join('')}</div>
      <h2 style="font-size:16px">Appareils actuellement sortis</h2>
      <div class="list">${db.products.filter(p => p.mode === 'location' && outNow(p) > 0).map(p => `<div class="item"><div class="av">${I[p.cat]}</div><div class="grow"><h4>${esc(p.name)}</h4><p>${outNow(p)} sortis / ${p.stock}${p.manualOut ? ` (dont ${p.manualOut} hors réservation)` : ''}</p></div></div>`).join('') || '<p class="small muted">Aucun appareil dehors.</p>'}</div>
      <h2 style="font-size:16px">Journal (date, heure et jour)</h2>${moveTable(list)}
    </div>`;
  },
  res(q) {
    const f = q.get('f') || '';
    const list = db.reservations.filter(r => !f || resStatus(r) === f).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return `<div class="stack">
      <div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn green sm" data-act="newResAdmin">${I.plus} Nouvelle réservation</button><button class="btn sm outline" data-act="csv" data-what="reservations">${I.download} Export CSV</button></div>
      <div class="chips" style="padding:0"><a class="chip ${!f ? 'on' : ''}" href="#/admin/res">Toutes</a>${Object.keys(RES_LABEL).map(k => `<a class="chip ${f === k ? 'on' : ''}" href="#/admin/res?f=${k}">${RES_LABEL[k]}</a>`).join('')}</div>
      <div class="list">${list.map(resItem).join('') || empty('Aucune réservation.', I.cal)}</div></div>`;
  },
  cmd() {
    const list = [...db.orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return `<div class="stack"><div class="row"><button class="btn sm outline" data-act="csv" data-what="orders">${I.download} Export CSV</button></div>
      <div class="list">${list.map(o => `<div class="item" data-act="orderSheet" data-id="${o.id}" style="cursor:pointer"><div class="av">${I.cart}</div><div class="grow"><h4>${esc(o.client.name)} — ${o.ref}</h4><p>${o.items.map(i => (prod(i.id) || {}).name + ' × ' + i.qty).join(', ')}</p><p>${dt(o.createdAt)} • <b>${fmt(o.total)}</b></p></div><span class="status st-${o.status}">${ORD_LABEL[o.status]}</span></div>`).join('') || empty('Aucune commande.', I.cart)}</div></div>`;
  },
  devis() {
    return `<div class="list">${db.quotes.map(o => `<div class="item"><div class="av g">${I.doc}</div><div class="grow"><h4>${esc(o.service)} — ${esc(o.client.name)}</h4><p>${esc(o.client.phone)} • ${esc(o.site || '')}</p><p>${esc(o.note || '')}</p><p class="small">${o.ref} • ${dt(o.createdAt)}</p></div>
      <div class="stack" style="gap:6px"><a class="btn sm wa" target="_blank" rel="noopener" href="https://wa.me/${o.client.phone.replace(/\D/g, '').replace(/^(?!237)/, '237')}">${I.wa}</a><button class="btn sm light" data-act="quoteStatus" data-id="${o.id}">${QUO_LABEL[o.status]}</button></div></div>`).join('') || empty('Aucune demande de devis.', I.doc)}</div>`;
  },
  reglages() {
    return `<div class="stack">
      <div class="card" style="padding:16px"><h2 style="font-size:16px;margin-bottom:10px">Changer le code PIN</h2>
        <form class="stack" data-form="pin"><div class="field"><label>Nouveau code (4 à 8 chiffres)</label><input name="pin" inputmode="numeric" pattern="\\d{4,8}" required></div><button class="btn green">Enregistrer</button></form></div>
      <div class="card" style="padding:16px"><h2 style="font-size:16px;margin-bottom:6px">Sauvegarde des données</h2><p class="small muted" style="margin-top:0">Exportez régulièrement une sauvegarde (stock, mouvements, réservations, commandes).</p>
        <div class="row" style="flex-wrap:wrap;gap:8px"><button class="btn sm" data-act="backup">${I.download} Sauvegarder (.json)</button><label class="btn sm outline">${I.upload} Restaurer<input type="file" accept="application/json" data-restore hidden></label></div></div>
      <div class="card" style="padding:16px"><h2 style="font-size:16px;margin-bottom:6px">Exports Excel (CSV)</h2>
        <div class="row" style="flex-wrap:wrap;gap:8px"><button class="btn sm light" data-act="csv" data-what="stock">Stock</button><button class="btn sm light" data-act="csv" data-what="movements">Mouvements</button><button class="btn sm light" data-act="csv" data-what="reservations">Réservations</button><button class="btn sm light" data-act="csv" data-what="orders">Commandes</button></div></div>
      <div class="card" style="padding:16px"><h2 style="font-size:16px;margin-bottom:6px">Réinitialiser</h2><p class="small muted" style="margin-top:0">Remet le catalogue d'origine et efface l'historique. Irréversible.</p><button class="btn sm danger" data-act="reset">${I.trash} Tout réinitialiser</button></div>
    </div>`;
  }
};

/* ---------------- Fiches (sheets) admin ---------------- */
function productSheet(p, mode) {
  const isNew = !p; p = p || { mode, cat: 'gnss', name: '', brand: '', stock: 0, desc: '' };
  return `<h2>${isNew ? 'Nouvel appareil' : 'Modifier l\'appareil'}</h2>
  <form class="stack" data-form="product" data-id="${p.id || ''}" data-mode="${p.mode}">
    <div class="field"><label>Nom</label><input name="name" value="${esc(p.name)}" required></div>
    <div class="two"><div class="field"><label>Catégorie</label><select name="cat">${Object.entries(CATS).map(([k, v]) => `<option value="${k}" ${p.cat === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
      <div class="field"><label>Marque</label><input name="brand" value="${esc(p.brand)}"></div></div>
    <div class="two"><div class="field"><label>${p.mode === 'vente' ? 'Quantité en stock' : 'Nombre d\'appareils (parc)'}</label><input name="stock" type="number" min="0" value="${p.stock}" required></div>
      <div class="field"><label>${p.mode === 'vente' ? 'Prix de vente (FCFA)' : 'Prix / jour (FCFA)'}</label><input name="price" type="number" min="0" value="${(p.mode === 'vente' ? p.price : p.rent) || ''}" placeholder="${p.mode === 'vente' ? 'Vide = sur devis' : ''}" ${p.mode === 'location' ? 'required' : ''}></div></div>
    <div class="field"><label>Description</label><textarea name="desc" rows="3">${esc(p.desc)}</textarea></div>
    <button class="btn green block">${I.check} Enregistrer</button>
    ${isNew ? '' : `<button type="button" class="btn danger block" data-act="delProduct" data-id="${p.id}">${I.trash} Supprimer</button>`}
  </form>`;
}
function moveSheet(type, presetId) {
  const list = db.products.filter(p => type === 'sortie' || type === 'retour' ? p.mode === 'location' : true);
  return `<h2>${type === 'sortie' ? 'Enregistrer une sortie' : 'Enregistrer un retour'}</h2>
  <form class="stack" data-form="move" data-type="${type}">
    <div class="field"><label>Appareil</label><select name="productId">${list.map(p => `<option value="${p.id}" ${p.id === presetId ? 'selected' : ''}>${esc(p.name)} — ${type === 'sortie' ? availableNow(p) + ' dispo.' : (p.manualOut || 0) + ' sortis (hors réservation)'}</option>`).join('')}</select></div>
    <div class="two"><div class="field"><label>Quantité</label><input name="qty" type="number" min="1" value="1" required></div>
      <div class="field"><label>Date & heure</label><input name="at" type="datetime-local" value="${nowLocal()}" required></div></div>
    <div class="field"><label>Client / Responsable</label><input name="who" required></div>
    <div class="field"><label>Note</label><input name="note" placeholder="Chantier, état de l'appareil…"></div>
    <div class="notice info">${I.info}<span>Pour une réservation existante, utilisez plutôt les boutons « Sortie » / « Retour » dans la fiche de la réservation.</span></div>
    <button class="btn green block">${I.check} Valider</button>
  </form>`;
}
function resSheet(r) {
  const p = prod(r.productId) || {}, st = resStatus(r);
  const msg = `Bonjour ${r.client.name}, votre réservation ${r.ref} (${p.name} × ${r.qty}, du ${dOnly(r.start)} au ${dOnly(r.end)}) est ${RES_LABEL[st].toLowerCase()}. Montant : ${fmt(r.total)}. — ${C.name}`;
  const phone = r.client.phone.replace(/\D/g, '').replace(/^(?!237)/, '237');
  return `<h2>Réservation ${r.ref}</h2>
    <div class="stack">
      <div class="row between"><b>${esc(p.name)} × ${r.qty}</b><span class="status st-${st}">${RES_LABEL[st]}</span></div>
      <div class="kv" style="margin:0"><div><span>Sortie prévue</span><b>${dOnly(r.start)} ${r.time || ''}</b></div><div><span>Retour prévu</span><b>${dOnly(r.end)}</b></div>
        <div><span>Sortie effective</span><b>${r.outAt ? dt(r.outAt) : '—'}</b></div><div><span>Retour effectif</span><b>${r.backAt ? dt(r.backAt) : '—'}</b></div>
        <div><span>Client</span><b>${esc(r.client.name)}</b></div><div><span>Téléphone</span><b>${esc(r.client.phone)}</b></div></div>
      ${r.site ? `<div class="small"><b>Chantier :</b> ${esc(r.site)}</div>` : ''}${r.note ? `<div class="small"><b>Note :</b> ${esc(r.note)}</div>` : ''}
      <div class="summary"><div class="row total" style="border:0;margin:0;padding:0"><span>${r.days} jour(s)</span><b>${fmt(r.total)}</b></div></div>
      <div class="row" style="flex-wrap:wrap;gap:8px">
        ${r.status === 'attente' ? `<button class="btn sm green" data-act="resSet" data-id="${r.id}" data-s="confirmee">${I.check} Confirmer</button>` : ''}
        ${['attente', 'confirmee'].includes(r.status) ? `<button class="btn sm" data-act="resSet" data-id="${r.id}" data-s="sortie">${I.out} Marquer sortie</button>` : ''}
        ${r.status === 'sortie' ? `<button class="btn sm green" data-act="resSet" data-id="${r.id}" data-s="retournee">${I.in} Marquer retour</button>` : ''}
        ${['attente', 'confirmee'].includes(r.status) ? `<button class="btn sm danger" data-act="resSet" data-id="${r.id}" data-s="annulee">Annuler</button>` : ''}
      </div>
      <a class="btn wa block" target="_blank" rel="noopener" href="https://wa.me/${phone}?text=${encodeURIComponent(msg)}">${I.wa} Notifier le client</a>
      <button class="btn outline block" data-act="delRes" data-id="${r.id}">${I.trash} Supprimer</button>
    </div>`;
}
function orderSheet(o) {
  const phone = o.client.phone.replace(/\D/g, '').replace(/^(?!237)/, '237');
  return `<h2>Commande ${o.ref}</h2><div class="stack">
    <div class="row between"><b>${esc(o.client.name)}</b><span class="status st-${o.status}">${ORD_LABEL[o.status]}</span></div>
    <div class="small muted">${esc(o.client.phone)} • ${esc(o.delivery)} • ${dt(o.createdAt)}</div>
    ${o.note ? `<div class="small">${esc(o.note)}</div>` : ''}
    <form class="stack" data-form="orderPrices" data-id="${o.id}">
      ${o.items.map((i, k) => { const p = prod(i.id) || { name: '(supprimé)' }; return `<div class="row between"><span>${esc(p.name)} × ${i.qty}</span><input name="p${k}" type="number" min="0" value="${i.price || ''}" placeholder="Prix unitaire" style="width:130px;border:1.5px solid var(--line);border-radius:10px;padding:8px" ${o.status !== 'attente' ? 'disabled' : ''}></div>`; }).join('')}
      <div class="summary"><div class="row total" style="border:0;margin:0;padding:0"><span>Total</span><b>${fmt(o.total)}</b></div></div>
      ${o.status === 'attente' ? `<button class="btn sm light">Mettre à jour les prix</button>` : ''}
    </form>
    <div class="row" style="flex-wrap:wrap;gap:8px">
      ${o.status === 'attente' ? `<button class="btn sm green" data-act="ordSet" data-id="${o.id}" data-s="confirmee">${I.check} Confirmer (déduit le stock)</button>` : ''}
      ${o.status === 'confirmee' ? `<button class="btn sm green" data-act="ordSet" data-id="${o.id}" data-s="livree">${I.truck} Marquer livrée</button>` : ''}
      ${['attente', 'confirmee'].includes(o.status) ? `<button class="btn sm danger" data-act="ordSet" data-id="${o.id}" data-s="annulee">Annuler</button>` : ''}
    </div>
    <a class="btn wa block" target="_blank" rel="noopener" href="https://wa.me/${phone}?text=${encodeURIComponent(`Bonjour ${o.client.name}, votre commande ${o.ref} est ${ORD_LABEL[o.status].toLowerCase()}. Total : ${fmt(o.total)}. — ${C.name}`)}">${I.wa} Notifier le client</a>
  </div>`;
}

/* ---------------- Exports ---------------- */
function download(name, content, type) {
  const blob = new Blob([content], { type }), a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
function toCSV(rows) { return '﻿' + rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';')).join('\n'); }
function exportCSV(what) {
  const n = p => (prod(p) || {}).name || '';
  const sets = {
    stock: [['Mode', 'Appareil', 'Catégorie', 'Marque', 'Parc/Stock', 'Sortis', 'Disponibles', 'Prix (FCFA)'], ...db.products.map(p => [p.mode, p.name, CATS[p.cat], p.brand, p.stock, p.mode === 'location' ? outNow(p) : '', availableNow(p), priceOf(p) || 'Sur devis'])],
    movements: [['Date', 'Heure', 'Jour', 'Type', 'Appareil', 'Quantité', 'Client', 'Référence', 'Note'], ...db.movements.map(m => { const d = new Date(m.at); return [todayISO(d), pad(d.getHours()) + ':' + pad(d.getMinutes()), d.toLocaleDateString('fr-FR', { weekday: 'long' }), moveLabel[m.type], n(m.productId), m.qty, m.who, m.ref, m.note]; })],
    reservations: [['Référence', 'Client', 'Téléphone', 'Appareil', 'Qté', 'Début', 'Heure', 'Fin', 'Jours', 'Total', 'Statut', 'Sortie effective', 'Retour effectif', 'Chantier'], ...db.reservations.map(r => [r.ref, r.client.name, r.client.phone, n(r.productId), r.qty, r.start, r.time, r.end, r.days, r.total, RES_LABEL[resStatus(r)], r.outAt ? dt(r.outAt) : '', r.backAt ? dt(r.backAt) : '', r.site])],
    orders: [['Référence', 'Date', 'Client', 'Téléphone', 'Articles', 'Total', 'Réception', 'Statut'], ...db.orders.map(o => [o.ref, dt(o.createdAt), o.client.name, o.client.phone, o.items.map(i => n(i.id) + ' x' + i.qty).join(' | '), o.total, o.delivery, ORD_LABEL[o.status]])]
  };
  download(`loicapp-${what}-${todayISO()}.csv`, toCSV(sets[what]), 'text/csv;charset=utf-8');
}

/* ---------------- Actions (clics) ---------------- */
const actions = {
  closeSheet,
  qty(d) { const i = $('#qtyIn'); i.value = Math.min(+i.max || 999, Math.max(1, (+i.value || 1) + +d.d)); },
  addCart(d) {
    const p = prod(d.id), q = Math.max(1, +$('#qtyIn').value || 1), line = cart.find(c => c.id === d.id);
    const total = (line ? line.qty : 0) + q;
    if (total > p.stock) return toast(`Stock insuffisant (${p.stock} disponible(s)).`, false);
    line ? line.qty = total : cart.push({ id: d.id, qty: q }); save(); toast('Ajouté au panier ✓');
  },
  cartQty(d) {
    const l = cart.find(c => c.id === d.id), p = prod(d.id); if (!l) return;
    l.qty += +d.d; if (p && l.qty > p.stock) { l.qty = p.stock; toast('Stock maximum atteint', false); }
    if (l.qty <= 0) cart = cart.filter(c => c !== l); save(); render();
  },
  quote(d) {
    const s = db.services.find(x => x.id === d.id);
    openSheet(`<h2>Devis : ${esc(s.name)}</h2><form class="stack" data-form="quote" data-id="${s.id}">
      <div class="field"><label>Nom complet / Entreprise</label><input name="name" required></div>
      <div class="field"><label>Téléphone (WhatsApp)</label><input name="phone" type="tel" required inputmode="tel"></div>
      <div class="field"><label>Lieu de la mission</label><input name="site"></div>
      <div class="field"><label>Date souhaitée</label><input name="date" type="date" min="${todayISO()}"></div>
      <div class="field"><label>Description du besoin</label><textarea name="note" rows="3" placeholder="Surface, type de travaux, délais…"></textarea></div>
      <button class="btn green block">${I.check} Envoyer la demande</button></form>`);
  },
  logout() { try { sessionStorage.removeItem('loicapp.admin'); } catch {} location.hash = '#/'; },
  editProduct(d) { openSheet(productSheet(d.id ? prod(d.id) : null, d.mode)); },
  delProduct(d) {
    if (!confirm('Supprimer définitivement cet appareil ?')) return;
    db.products = db.products.filter(p => p.id !== d.id); db.deleted = [...(db.deleted || []), d.id]; save(); closeSheet(); render(); toast('Appareil supprimé');
  },
  adjust(d) {
    const p = prod(d.id), delta = +d.d; if (p.stock + delta < 0) return;
    p.stock += delta; logMove({ type: delta > 0 ? 'entree' : 'ajustement', productId: p.id, qty: delta, who: 'Gestion', note: 'Ajustement rapide' }); save(); render();
  },
  adjustSheet(d) {
    const p = prod(d.id);
    openSheet(`<h2>Mouvement de stock</h2><p class="muted" style="margin-top:-6px">${esc(p.name)} — actuel : <b>${p.stock}</b></p>
      <form class="stack" data-form="adjust" data-id="${p.id}">
        <div class="field"><label>Type</label><select name="type"><option value="entree">Entrée (réception, achat fournisseur)</option><option value="ajustement">Ajustement (inventaire, perte, casse)</option></select></div>
        <div class="two"><div class="field"><label>Quantité (+ ou −)</label><input name="qty" type="number" required value="1"></div><div class="field"><label>Date & heure</label><input name="at" type="datetime-local" value="${nowLocal()}"></div></div>
        <div class="field"><label>Note</label><input name="note" placeholder="Fournisseur, motif…"></div>
        <button class="btn green block">${I.check} Valider</button></form>`);
  },
  moveSheet(d) { openSheet(moveSheet(d.type, d.id)); },
  resSheet(d) { const r = db.reservations.find(x => x.id === d.id); if (r) openSheet(resSheet(r)); },
  resSet(d) {
    const r = db.reservations.find(x => x.id === d.id); if (!r) return;
    if (d.s === 'sortie') {
      const p = prod(r.productId);
      if (availableFor(p, todayISO(), r.end, r.id) < r.qty && !confirm('Stock disponible insuffisant pour cette période. Forcer la sortie ?')) return;
      r.outAt = new Date().toISOString(); logMove({ type: 'sortie', productId: r.productId, qty: r.qty, who: r.client.name, ref: r.ref });
    }
    if (d.s === 'retournee') { r.backAt = new Date().toISOString(); logMove({ type: 'retour', productId: r.productId, qty: r.qty, who: r.client.name, ref: r.ref }); }
    r.status = d.s; save(); openSheet(resSheet(r)); render(); toast('Réservation : ' + RES_LABEL[d.s]);
  },
  delRes(d) { if (!confirm('Supprimer cette réservation ?')) return; db.reservations = db.reservations.filter(r => r.id !== d.id); save(); closeSheet(); render(); },
  newResAdmin() {
    const list = db.products.filter(p => p.mode === 'location');
    openSheet(`<h2>Choisir l'appareil</h2><div class="list">${list.map(p => `<a class="item" href="#/reserver/${p.id}" data-act="closeSheet"><div class="av g">${I[p.cat]}</div><div class="grow"><h4>${esc(p.name)}</h4><p>${availableNow(p)} dispo. • ${fmt(p.rent)}/jour</p></div></a>`).join('')}</div>`);
  },
  orderSheet(d) { const o = db.orders.find(x => x.id === d.id); if (o) openSheet(orderSheet(o)); },
  ordSet(d) {
    const o = db.orders.find(x => x.id === d.id); if (!o) return;
    if (d.s === 'confirmee') {
      const short = o.items.find(i => { const p = prod(i.id); return !p || p.stock < i.qty; });
      if (short) return toast('Stock insuffisant pour ' + ((prod(short.id) || {}).name || 'un article'), false);
      o.items.forEach(i => { prod(i.id).stock -= i.qty; logMove({ type: 'vente', productId: i.id, qty: i.qty, who: o.client.name, ref: o.ref }); });
    }
    if (d.s === 'annulee' && o.status === 'confirmee') o.items.forEach(i => { const p = prod(i.id); if (p) { p.stock += i.qty; logMove({ type: 'annulation', productId: i.id, qty: i.qty, who: o.client.name, ref: o.ref }); } });
    o.status = d.s; save(); openSheet(orderSheet(o)); render(); toast('Commande : ' + ORD_LABEL[d.s]);
  },
  quoteStatus(d) { const o = db.quotes.find(x => x.id === d.id); const order = ['attente', 'confirmee', 'annulee']; o.status = order[(order.indexOf(o.status) + 1) % 3]; save(); render(); },
  csv(d) { exportCSV(d.what); toast('Export téléchargé'); },
  backup() { download(`loicapp-sauvegarde-${todayISO()}.json`, JSON.stringify(db, null, 2), 'application/json'); toast('Sauvegarde téléchargée'); },
  reset() { if (!confirm('Tout effacer et revenir au catalogue initial ?')) return; db = clone(window.LOIC_DEFAULT); save(); render(); toast('Données réinitialisées'); }
};

/* ---------------- Formulaires ---------------- */
function confirmation(title, refNo, text, subject) {
  openSheet(`<div style="text-align:center"><div style="width:64px;height:64px;margin:4px auto 12px;border-radius:50%;display:grid;place-items:center;background:var(--green-soft);color:var(--green)">${I.check.replace('<svg', '<svg style="width:34px;height:34px"')}</div>
    <h2>${title}</h2><p class="muted">Référence <b>${refNo}</b>. Envoyez-la-nous pour une confirmation rapide.</p></div>
    <div class="stack"><a class="btn wa block" target="_blank" rel="noopener" href="${waLink(text)}">${I.wa} Envoyer sur WhatsApp</a>
    <a class="btn outline block" href="${mailLink(subject, text)}">${I.mail} Envoyer par e-mail</a>
    <a class="btn light block" href="#/compte" data-act="closeSheet">Voir mes suivis</a></div>`);
}
const forms = {
  login(f) {
    if (f.get('pin') === db.settings.pin) { try { sessionStorage.setItem('loicapp.admin', '1'); } catch {} render(); toast('Bienvenue dans l\'espace gestion'); }
    else toast('Code PIN incorrect', false);
  },
  reservation(f, el) {
    const c = calcReservation(el); if (!c.ok) return toast('Quantité indisponible sur ces dates', false);
    const p = prod(el.dataset.id);
    const r = { id: uid(), ref: ref('RES'), productId: p.id, qty: c.qty, start: c.s, end: c.e, time: f.get('time'), days: c.n, total: c.total, status: isAdmin() ? 'confirmee' : 'attente',
      client: { name: f.get('name').trim(), phone: f.get('phone').trim() }, site: f.get('site'), note: f.get('note'), createdAt: new Date().toISOString() };
    db.reservations.push(r); mine.reservations.push(r.id); save();
    const txt = `*Nouvelle réservation ${r.ref}*\nAppareil : ${p.name} × ${r.qty}\nDu ${dOnly(r.start)} (${r.time}) au ${dOnly(r.end)} — ${r.days} jour(s)\nTotal estimé : ${fmt(r.total)}\nClient : ${r.client.name} (${r.client.phone})${r.site ? '\nChantier : ' + r.site : ''}${r.note ? '\nNote : ' + r.note : ''}`;
    location.hash = isAdmin() ? '#/admin/res' : '#/compte';
    setTimeout(() => confirmation('Réservation enregistrée !', r.ref, txt, 'Réservation ' + r.ref), 60);
  },
  order(f) {
    const items = cart.map(c => ({ id: c.id, qty: c.qty, price: (prod(c.id) || {}).price || null }));
    const o = { id: uid(), ref: ref('CMD'), items, total: items.reduce((a, i) => a + (i.price || 0) * i.qty, 0), status: 'attente',
      client: { name: f.get('name').trim(), phone: f.get('phone').trim() }, delivery: f.get('delivery'), note: f.get('note'), createdAt: new Date().toISOString() };
    db.orders.push(o); mine.orders.push(o.id); cart = []; save();
    const txt = `*Nouvelle commande ${o.ref}*\n${items.map(i => `• ${prod(i.id).name} × ${i.qty}${i.price ? ' — ' + fmt(i.price * i.qty) : ' — sur devis'}`).join('\n')}\nTotal : ${fmt(o.total)}\nClient : ${o.client.name} (${o.client.phone})\nRéception : ${o.delivery}${o.note ? '\nNote : ' + o.note : ''}`;
    location.hash = '#/compte'; setTimeout(() => confirmation('Commande enregistrée !', o.ref, txt, 'Commande ' + o.ref), 60);
  },
  quote(f, el) {
    const s = db.services.find(x => x.id === el.dataset.id);
    const o = { id: uid(), ref: ref('DEV'), service: s.name, client: { name: f.get('name').trim(), phone: f.get('phone').trim() }, site: f.get('site'), date: f.get('date'), note: f.get('note'), status: 'attente', createdAt: new Date().toISOString() };
    db.quotes.unshift(o); mine.quotes.push(o.id); save();
    const txt = `*Demande de devis ${o.ref}*\nPrestation : ${s.name}\nClient : ${o.client.name} (${o.client.phone})${o.site ? '\nLieu : ' + o.site : ''}${o.date ? '\nDate souhaitée : ' + dOnly(o.date) : ''}${o.note ? '\nBesoin : ' + o.note : ''}`;
    confirmation('Demande envoyée !', o.ref, txt, 'Devis ' + o.ref);
  },
  product(f, el) {
    const data = { name: f.get('name').trim(), cat: f.get('cat'), brand: f.get('brand').trim(), stock: Math.max(0, +f.get('stock') || 0), desc: f.get('desc').trim() };
    const price = f.get('price') ? +f.get('price') : null;
    let p = el.dataset.id && prod(el.dataset.id);
    if (p) { if (data.stock !== p.stock) logMove({ type: 'ajustement', productId: p.id, qty: data.stock - p.stock, who: 'Gestion', note: 'Modification fiche' }); Object.assign(p, data); }
    else { p = Object.assign({ id: (el.dataset.mode === 'vente' ? 'v-' : 'l-') + uid(), mode: el.dataset.mode }, data); db.products.push(p); if (p.stock) logMove({ type: 'entree', productId: p.id, qty: p.stock, who: 'Gestion', note: 'Création' }); }
    if (p.mode === 'vente') p.price = price; else p.rent = price || 0;
    save(); closeSheet(); render(); toast('Appareil enregistré');
  },
  adjust(f, el) {
    const p = prod(el.dataset.id), q = +f.get('qty') || 0;
    if (p.stock + q < 0) return toast('Le stock ne peut pas être négatif', false);
    p.stock += q; logMove({ type: f.get('type'), productId: p.id, qty: q, who: 'Gestion', note: f.get('note'), at: new Date(f.get('at') || Date.now()).toISOString() });
    save(); closeSheet(); render(); toast('Stock mis à jour');
  },
  move(f, el) {
    const type = el.dataset.type, p = prod(f.get('productId')), q = Math.max(1, +f.get('qty') || 1);
    if (type === 'sortie' && availableNow(p) < q) return toast(`Seulement ${availableNow(p)} disponible(s)`, false);
    if (type === 'retour' && (p.manualOut || 0) < q) return toast(`Seulement ${p.manualOut || 0} sorti(s) hors réservation`, false);
    p.manualOut = (p.manualOut || 0) + (type === 'sortie' ? q : -q);
    logMove({ type, productId: p.id, qty: q, who: f.get('who'), note: f.get('note'), at: new Date(f.get('at')).toISOString() });
    db.movements.sort((a, b) => b.at.localeCompare(a.at));
    save(); closeSheet(); render(); toast(type === 'sortie' ? 'Sortie enregistrée' : 'Retour enregistré');
  },
  orderPrices(f, el) {
    const o = db.orders.find(x => x.id === el.dataset.id);
    o.items.forEach((i, k) => { const v = f.get('p' + k); i.price = v ? +v : null; });
    o.total = o.items.reduce((a, i) => a + (i.price || 0) * i.qty, 0); save(); openSheet(orderSheet(o)); render(); toast('Prix mis à jour');
  },
  pin(f) { db.settings.pin = f.get('pin'); save(); toast('Code PIN modifié'); }
};

/* ---------------- Routeur ---------------- */
function parse() {
  const h = location.hash.replace(/^#\/?/, '');
  const [path, qs] = h.split('?');
  const parts = path.split('/').filter(Boolean);
  return { name: parts[0] || 'home', arg: parts[1], q: new URLSearchParams(qs || '') };
}
function render() {
  const { name, arg, q } = parse();
  const v = views[name] || views.home;
  $('#view').innerHTML = v(q, arg);
  const tabMap = { home: 'home', vente: 'vente', location: 'location', reserver: 'location', prestations: 'prestations', compte: 'compte' };
  let tab = tabMap[name]; if (name === 'p') tab = (prod(arg) || {}).mode;
  document.querySelectorAll('#tabbar a').forEach(a => a.classList.toggle('on', a.dataset.tab === tab));
  const rf = document.querySelector('[data-form="reservation"]'); if (rf) calcReservation(rf);
  updateBadge();
}
let lastRoute = '';
window.addEventListener('hashchange', () => { closeSheet(); render(); const r = parse().name + parse().arg; if (r !== lastRoute) window.scrollTo(0, 0); lastRoute = r; });

document.addEventListener('click', e => {
  const a = e.target.closest('[data-act]'); if (!a) return;
  const fn = actions[a.dataset.act]; if (!fn) return;
  if (a.tagName !== 'A') e.preventDefault();
  fn(a.dataset, a);
});
document.addEventListener('submit', e => {
  const el = e.target.closest('[data-form]'); if (!el) return;
  e.preventDefault(); forms[el.dataset.form]?.(new FormData(el), el);
});
document.addEventListener('input', e => {
  const rf = e.target.closest('[data-form="reservation"]'); if (rf) calcReservation(rf);
});
let searchT;
document.addEventListener('input', e => {
  const s = e.target.closest('[data-search]'); if (!s) return;
  clearTimeout(searchT); searchT = setTimeout(() => {
    const q = parse().q; s.value ? q.set('s', s.value) : q.delete('s');
    history.replaceState(null, '', `#/${s.dataset.search}?${q}`); const pos = s.selectionStart; render();
    const n = document.querySelector('[data-search]'); n.focus(); n.setSelectionRange(pos, pos);
  }, 250);
});
document.addEventListener('change', e => {
  if (!e.target.matches('[data-restore]')) return;
  const file = e.target.files[0]; if (!file) return;
  file.text().then(t => { const d = JSON.parse(t); if (!d.products) throw 0; db = d; save(); render(); toast('Données restaurées'); }).catch(() => toast('Fichier invalide', false));
});

/* ---------------- Démarrage ---------------- */
render();
setTimeout(() => $('#splash').classList.add('out'), 700);
setTimeout(() => $('#splash').remove(), 1300);
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
