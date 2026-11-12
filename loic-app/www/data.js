/* Loïc App — données initiales (modifiables ensuite depuis l'espace Gestion) */
window.LOIC_COMPANY = {
  name: 'Loïc App',
  tagline: 'Matériel topographique — Vente • Location • Prestations',
  city: 'Mbalgong, Cameroun',
  phones: ['+237 676 173 003', '690 583 91'],
  whatsapp: '237676173003',
  email: 'tassialoic9@gmail.com',
  hours: 'Lun – Sam : 7h30 – 18h30'
};

window.LOIC_DEFAULT = {
  version: 1,
  products: [
    // ---------- VENTE ----------
    { id: 'v-gnss-ht',   mode: 'vente', cat: 'gnss',    name: 'Récepteur GNSS Hi-Target',      brand: 'Hi-Target', stock: 10, price: null,
      desc: 'Récepteur GNSS RTK multi-constellation (GPS, GLONASS, Galileo, BeiDou). Précision centimétrique, idéal levés et implantations.' },
    { id: 'v-q600',      mode: 'vente', cat: 'gnss',    name: 'Récepteur GNSS Qianxun Q600',   brand: 'Qianxun',   stock: 3,  price: null,
      desc: 'Récepteur GNSS compact haute précision avec compensation d\'inclinaison et connexion réseau RTK.' },
    { id: 'v-sunway',    mode: 'vente', cat: 'station', name: 'Station totale Sunway',         brand: 'Sunway',    stock: 15, price: null,
      desc: 'Station totale électronique : mesure d\'angles et de distances, mémoire interne, idéale chantiers et cadastre.' },
    { id: 'v-drone-rtk', mode: 'vente', cat: 'drone',   name: 'Drone RTK de cartographie',     brand: 'RTK',       stock: 15, price: null,
      desc: 'Drone équipé RTK pour photogrammétrie, orthophotos et modèles numériques de terrain sans points d\'appui massifs.' },
    { id: 'v-bipode',    mode: 'vente', cat: 'bipod',   name: 'Bipode pour canne',             brand: '',          stock: 10, price: null,
      desc: 'Bipode télescopique pour stabiliser la canne GNSS / prisme lors des mesures.' },
    { id: 'v-tripode',   mode: 'vente', cat: 'bipod',   name: 'Tripode pour canne',            brand: '',          stock: 10, price: null,
      desc: 'Tripode léger à pinces rapides pour maintenir la canne parfaitement verticale.' },
    { id: 'v-embase',    mode: 'vente', cat: 'base',    name: 'Embase avec plomb optique',     brand: '',          stock: 20, price: null,
      desc: 'Embase de centrage avec nivelle et plomb optique, filetage standard 5/8".' },
    { id: 'v-trep-st',   mode: 'vente', cat: 'tripod',  name: 'Trépied ST (station totale)',   brand: '',          stock: 30, price: null,
      desc: 'Trépied robuste en aluminium/bois pour station totale et GNSS, tête plate 5/8".' },
    { id: 'v-trep-niv',  mode: 'vente', cat: 'tripod',  name: 'Trépied pour niveau',           brand: '',          stock: 20, price: null,
      desc: 'Trépied à tête bombée adapté aux niveaux optiques et automatiques.' },
    { id: 'v-traceur',   mode: 'vente', cat: 'marker',  name: 'Traceur de chantier',           brand: '',          stock: 60, price: null,
      desc: 'Traceur pour marquage au sol : implantation, piquetage et repérage des points.' },
    { id: 'v-canne',     mode: 'vente', cat: 'pole',    name: 'Canne ST & GNSS',               brand: '',          stock: 50, price: null,
      desc: 'Canne télescopique graduée avec nivelle, compatible prisme et récepteur GNSS.' },

    // ---------- LOCATION (prix par jour) ----------
    { id: 'l-station',   mode: 'location', cat: 'station', name: 'Station totale',             brand: '',          stock: 8,  rent: 10000,
      desc: 'Station totale prête à l\'emploi, batterie chargée, avec prisme sur demande.' },
    { id: 'l-v300',      mode: 'location', cat: 'gnss',    name: 'Récepteur Hi-Target V300',   brand: 'Hi-Target', stock: 10, rent: 20000,
      desc: 'Récepteur GNSS RTK Hi-Target avec contrôleur de terrain.' },
    { id: 'l-mavic',     mode: 'location', cat: 'drone',   name: 'Drone Mavic 2 Pro + opérateur', brand: 'DJI',    stock: 15, rent: 100000, operator: true,
      desc: 'Drone DJI Mavic 2 Pro, livré avec un opérateur qualifié pour vos prises de vue et levés aériens.' },
    { id: 'l-niveau',    mode: 'location', cat: 'level',   name: 'Niveau optique',             brand: '',          stock: 5,  rent: 10000,
      desc: 'Niveau optique automatique pour nivellement et contrôle d\'altimétrie.' },
    { id: 'l-trepied',   mode: 'location', cat: 'tripod',  name: 'Trépied',                    brand: '',          stock: 10, rent: 5000,
      desc: 'Trépied pour station totale, GNSS ou niveau.' },
    { id: 'l-canne',     mode: 'location', cat: 'pole',    name: 'Canne',                      brand: '',          stock: 10, rent: 2000,
      desc: 'Canne télescopique avec nivelle, pour prisme ou GNSS.' }
  ],
  services: [
    { id: 's-leve',   icon: 'map',    name: 'Levé topographique',            desc: 'Levés planimétriques et altimétriques, plans côtés et topographiques de vos terrains.' },
    { id: 's-impl',   icon: 'pin',    name: 'Implantation d\'ouvrages',      desc: 'Implantation de bâtiments, routes, réseaux et piquetage précis sur chantier.' },
    { id: 's-borne',  icon: 'flag',   name: 'Bornage & morcellement',        desc: 'Délimitation de parcelles, bornage contradictoire et dossiers de morcellement.' },
    { id: 's-nivel',  icon: 'level',  name: 'Nivellement',                   desc: 'Nivellement direct, profils en long et en travers, calcul des cubatures.' },
    { id: 's-drone',  icon: 'drone',  name: 'Cartographie par drone',        desc: 'Orthophotos, MNT, modèles 3D et suivi de chantier par drone RTK.' },
    { id: 's-form',   icon: 'school', name: 'Formation',                     desc: 'Formation à l\'utilisation des stations totales, GNSS RTK, drones et logiciels.' },
    { id: 's-maint',  icon: 'tool',   name: 'Maintenance & calibration',     desc: 'Contrôle, réglage, calibration et réparation de vos appareils topographiques.' },
    { id: 's-assist', icon: 'signal', name: 'Assistance GNSS / RTK',         desc: 'Paramétrage des récepteurs, base RTK, contrôleurs et transfert des données.' }
  ],
  movements: [],
  reservations: [],
  orders: [],
  quotes: [],
  settings: { pin: '1234' }
};
