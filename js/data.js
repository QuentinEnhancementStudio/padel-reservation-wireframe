/* ============================================================
   DONNÉES FICTIVES — Wireframe réservation Padel
   (frontend uniquement, aucune persistance réelle)
   ============================================================ */

const CLUB = {
  name: "Padel Club Rivière",
  membershipPriceYear: 120, // € / an, saison sept → août
  season: "Saison 2025–2026",
  seasonEnd: "31 août 2026",
};

/* Tarifs par personne et par créneau (1h30) */
const PRICING = {
  nonAdherent: 18,       // tarif plein
  adherentJournee: 10,   // adhérent, lun → ven
  adherentWeekend: 12,   // adhérent, sam / dim
};

const LEVELS = ["Débutant", "Intermédiaire", "Confirmé", "Avancé"];

/* 8 terrains, capacité 4 joueurs. Prix identique partout. */
const COURTS = [
  { id: 1, name: "Terrain 1", kind: "Couvert" },
  { id: 2, name: "Terrain 2", kind: "Couvert" },
  { id: 3, name: "Terrain 3", kind: "Couvert" },
  { id: 4, name: "Terrain 4", kind: "Couvert" },
  { id: 5, name: "Terrain 5", kind: "Extérieur" },
  { id: 6, name: "Terrain 6", kind: "Extérieur" },
  { id: 7, name: "Terrain 7", kind: "Extérieur" },
  { id: 8, name: "Terrain 8", kind: "Extérieur" },
];

/* Créneaux fixes de 1h30, identiques chaque jour (définis dans Wix Bookings) */
const TIME_SLOTS = [
  { start: "09:00", end: "10:30" },
  { start: "10:30", end: "12:00" },
  { start: "12:00", end: "13:30" },
  { start: "13:30", end: "15:00" },
  { start: "15:00", end: "16:30" },
  { start: "16:30", end: "18:00" },
  { start: "18:00", end: "19:30" },
  { start: "19:30", end: "21:00" },
  { start: "21:00", end: "22:30" },
];

/* Utilisateur connecté (adhérent) */
const CURRENT_USER = {
  id: "u0",
  firstName: "Julien",
  lastName: "Mercier",
  level: "Confirmé",
  adherent: true,
  email: "julien.mercier@email.fr",
  phone: "06 12 34 56 78",
};

/* Annuaire des adhérents du club */
const MEMBERS = [
  { id: "m1", firstName: "Camille", lastName: "Rousseau", level: "Avancé", adherent: true },
  { id: "m2", firstName: "Thomas", lastName: "Lefèvre", level: "Intermédiaire", adherent: true },
  { id: "m3", firstName: "Sophie", lastName: "Garnier", level: "Confirmé", adherent: true },
  { id: "m4", firstName: "Antoine", lastName: "Moreau", level: "Débutant", adherent: true },
  { id: "m5", firstName: "Léa", lastName: "Bonnet", level: "Intermédiaire", adherent: true },
  { id: "m6", firstName: "Maxime", lastName: "Girard", level: "Avancé", adherent: true },
  { id: "m7", firstName: "Nicolas", lastName: "Faure", level: "Confirmé", adherent: true },
  { id: "m8", firstName: "Inès", lastName: "Lambert", level: "Intermédiaire", adherent: true },
  { id: "m9", firstName: "Hugo", lastName: "Renaud", level: "Débutant", adherent: true },
  { id: "m10", firstName: "Chloé", lastName: "Petit", level: "Avancé", adherent: true },
];

/* ---------- Dates ---------- */
const TODAY = new Date(2026, 5, 16); // mardi 16 juin 2026
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

function buildDates(n) {
  const arr = [];
  for (let i = 0; i < n; i++) {
    const d = new Date(TODAY);
    d.setDate(TODAY.getDate() + i);
    const dow = d.getDay();
    arr.push({
      index: i,
      weekday: cap(d.toLocaleDateString("fr-FR", { weekday: "short" }).replace(".", "")),
      day: d.getDate(),
      month: cap(d.toLocaleDateString("fr-FR", { month: "short" }).replace(".", "")),
      weekend: dow === 0 || dow === 6,
      isToday: i === 0,
      full: cap(d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })),
    });
  }
  return arr;
}
const DATES = buildDates(21); // réservations ouvertes longtemps à l'avance

/* ---------- Générateur d'occupation déterministe ---------- */
/* Permet d'avoir un planning stable et réaliste sans backend.   */
function hash(n) {
  let t = (n + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function pickPlayers(seed, count) {
  const out = [];
  const used = new Set();
  let s = seed;
  while (out.length < count && used.size < MEMBERS.length) {
    s = (Math.imul(s, 1103515245) + 12345) & 0x7fffffff;
    const idx = s % MEMBERS.length;
    if (used.has(idx)) { s += 7; continue; }
    used.add(idx);
    out.push(MEMBERS[idx]);
  }
  return out;
}

/* Retourne l'état des 8 terrains pour un (jour, créneau) donné. */
function getCourtsForSlot(dateIndex, slotIndex) {
  return COURTS.map((court, c) => {
    const seed = dateIndex * 911 + slotIndex * 53 + court.id * 7 + 17;
    const r = hash(seed);

    // ~4% des terrains bloqués par l'admin (entretien)
    if (hash(seed + 999) < 0.04) {
      return { court, state: "occupe", blocked: true, players: [], freeSpots: 0 };
    }

    // Les soirées et week-ends sont plus chargés
    const evening = slotIndex >= 6 ? 0.34 : slotIndex >= 4 ? 0.16 : -0.04;
    const x = r + evening + (DATES[dateIndex] && DATES[dateIndex].weekend ? 0.1 : 0);

    let occupied;
    if (x < 0.34) occupied = 0;
    else if (x < 0.55) occupied = 2;
    else if (x < 0.66) occupied = 1;
    else if (x < 0.8) occupied = 3;
    else occupied = 4;

    const players = pickPlayers(seed + 1, occupied);
    const state = occupied === 0 ? "libre" : occupied >= 4 ? "occupe" : "partiel";
    return { court, state, blocked: false, players, freeSpots: 4 - occupied };
  });
}

/* Réservations existantes de l'utilisateur (Mes réservations) */
const INITIAL_BOOKINGS = [
  {
    ref: "PAD-2026-0588",
    dateIndex: 2, // jeu 18 juin
    slotIndex: 6, // 18:00
    courtId: 3,
    players: [
      { name: "Julien Mercier", level: "Confirmé", tag: "Adhérent", payer: true },
      { name: "Camille Rousseau", level: "Avancé", tag: "Adhérent" },
      { name: "Lucas Petit", level: "Intermédiaire", tag: "Invité" },
      { name: "Place libre", level: "", tag: "Libre", free: true },
    ],
    total: 38,
    status: "À venir",
  },
  {
    ref: "PAD-2026-0601",
    dateIndex: 4, // sam 20 juin
    slotIndex: 1, // 10:30
    courtId: 6,
    players: [
      { name: "Julien Mercier", level: "Confirmé", tag: "Adhérent", payer: true },
      { name: "Sophie Garnier", level: "Confirmé", tag: "Adhérent" },
    ],
    total: 24,
    status: "À venir",
  },
];

const PAST_BOOKINGS = [
  { ref: "PAD-2026-0490", label: "Sam 7 juin · 11:00 · Terrain 2", players: 4, total: 48, status: "Terminée" },
  { ref: "PAD-2026-0455", label: "Mer 4 juin · 19:30 · Terrain 5", players: 4, total: 40, status: "Terminée" },
  { ref: "PAD-2026-0398", label: "Lun 26 mai · 12:00 · Terrain 1", players: 2, total: 20, status: "Terminée" },
];

