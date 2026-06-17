/* ============================================================
   Wireframe Padel — logique d'interface (prototype, sans backend)
   ============================================================ */

const state = {
  screen: "login",        // écran courant
  tab: "reserver",        // onglet actif
  flow: null,             // état du tunnel de réservation
  bookings: INITIAL_BOOKINGS.map((b) => ({ ...b })),
  resaTab: "avenir",      // sous-onglet Mes réservations
  modal: null,            // overlay actif
  showNotes: true,        // annotations wireframe visibles (panneau)
  view: "mobile",         // vue simulée : mobile | desktop
  lastBooking: null,      // pour l'écran de confirmation
};

const app = document.getElementById("app");
const notesEl = document.getElementById("notes");
const toolbar = document.getElementById("toolbar");
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const initials = (full) => full.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
const courtById = (id) => COURTS.find((c) => c.id === id);
const slotLabel = (i) => `${TIME_SLOTS[i].start} – ${TIME_SLOTS[i].end}`;

/* Icônes SVG (barre d'outils) */
const ICONS = {
  wire: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2.5"/><path d="M3 9h18M9 9v12"/></svg>',
  screens: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5"/></svg>',
  mobile: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M11 18h2"/></svg>',
  desktop: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="4" width="19" height="12" rx="2"/><path d="M8.5 20h7M12 16v4"/></svg>',
  note: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16v10H9l-4 4V5z"/><path d="M8 9.5h8M8 12.5h5"/></svg>',
  edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>',
};

/* Tarif par personne selon statut + jour */
function priceFor(adherent, dateIndex) {
  if (!adherent) return PRICING.nonAdherent;
  return DATES[dateIndex].weekend ? PRICING.adherentWeekend : PRICING.adherentJournee;
}

/* ---------- Rendu principal ---------- */
function render() {
  let html = "";
  switch (state.screen) {
    case "login": html = viewLogin(); break;
    case "planning": html = shell(viewPlanning(), { tabs: true, bar: barPlanning() }); break;
    case "slot": html = shell(viewSlot(), { back: "planning", steps: 2, title: "Choix du terrain" }); break;
    case "booking": html = shell(viewBooking(), { back: "slot", steps: 3, title: "Joueurs", bar: barBooking() }); break;
    case "payment": html = shell(viewPayment(), { back: "booking", steps: 4, title: "Paiement", bar: barPayment(), wide: true }); break;
    case "confirmation": html = shell(viewConfirmation(), { title: "Confirmation" }); break;
    case "reservations": html = shell(viewReservations(), { tabs: true, title: "Mes réservations" }); break;
    case "adhesion": html = shell(viewAdhesion(), { tabs: true, title: "Adhésion" }); break;
    case "compte": html = shell(viewCompte(), { tabs: true, title: "Compte" }); break;
    case "admin": html = shell(viewAdmin(), { back: "compte", title: "Espace club" }); break;
    default: html = viewLogin();
  }
  app.className = "device view-" + state.view;
  const chrome = state.view === "desktop" ? browserChrome() : "";
  const modal = state.modal ? viewModal() : "";
  app.innerHTML = chrome + `<div class="app-col">${html}${modal}</div>`;

  renderToolbar();
  notesEl.style.display = state.showNotes ? "" : "none";
  renderNotes();
}

/* Barre de navigateur factice (vue desktop) */
function browserChrome() {
  return `<div class="chrome">
    <span class="dots"><i></i><i></i><i></i></span>
    <span class="urlbar">padelclubriviere.fr/reservation</span>
    <span style="width:44px;flex:0 0 auto;"></span>
  </div>`;
}

/* ============================================================
   BARRE D'OUTILS DU PROTOTYPE (sélecteur d'écran, vue, annotations)
   ============================================================ */
/* Identifiant unique + titre par vue (source unique pour la navigation
   et les annotations). Numérotation hiérarchique : les variations d'un
   même écran partagent le numéro parent (ex. 4.1 / 4.2). */
const VIEW_INFO = {
  login:          { num: "1",   title: "Identifiants" },
  planning:       { num: "2",   title: "Planning" },
  slot:           { num: "3",   title: "Choix du terrain" },
  "booking-new":  { num: "4.1", title: "Joueurs · nouvelle partie" },
  "booking-join": { num: "4.2", title: "Joueurs · rejoindre une partie" },
  payment:        { num: "5",   title: "Paiement" },
  confirmation:   { num: "6",   title: "Confirmation" },
  reservations:   { num: "7",   title: "Mes réservations" },
  adhesion:       { num: "8",   title: "Adhésion" },
  compte:         { num: "9",   title: "Compte" },
  admin:          { num: "10",  title: "Espace club" },
};
const viewLabel = (key) => (VIEW_INFO[key] ? `${VIEW_INFO[key].num} · ${VIEW_INFO[key].title}` : "");

const JUMP_GROUPS = [
  { label: "Réservation", items: ["login", "planning", "slot", "booking-new", "booking-join", "payment", "confirmation"] },
  { label: "Espace membre", items: ["reservations", "adhesion", "compte"] },
  { label: "Club", items: ["admin"] },
];

/* Clé de l'option sélectionnée à partir de l'état courant */
function currentJumpKey() {
  if (state.screen === "booking") return state.flow && state.flow.joining ? "booking-join" : "booking-new";
  return state.screen;
}

function renderToolbar() {
  const cur = currentJumpKey();
  const options = JUMP_GROUPS.map((g) =>
    `<optgroup label="${g.label}">` +
    g.items.map((v) => `<option value="${v}" ${v === cur ? "selected" : ""}>${viewLabel(v)}</option>`).join("") +
    `</optgroup>`).join("");

  toolbar.innerHTML = `
    <div class="tb-controls">
      <div class="tb-group">
        <span class="tb-ico" aria-hidden="true">${ICONS.screens}</span>
        <select id="jump" class="tb-select" aria-label="Aller à l'écran">${options}</select>
      </div>
      <div class="seg" role="group" aria-label="Vue">
        <button data-action="set-view" data-view="mobile" class="${state.view === "mobile" ? "on" : ""}" title="Vue mobile" aria-label="Vue mobile">${ICONS.mobile}</button>
        <button data-action="set-view" data-view="desktop" class="${state.view === "desktop" ? "on" : ""}" title="Vue bureau" aria-label="Vue bureau">${ICONS.desktop}</button>
      </div>
      <button class="tb-iconbtn ${state.showNotes ? "on" : ""}" data-action="toggle-notes"
        title="${state.showNotes ? "Masquer les annotations" : "Afficher les annotations"}"
        aria-pressed="${state.showNotes}" aria-label="Annotations">${ICONS.note}</button>
    </div>`;
}

/* ---------- Navigation directe vers un écran / état ---------- */
function ensureFlow() {
  if (!state.flow) state.flow = { dateIndex: 0, slotIndex: null, courtId: null };
}

function setupBooking(kind) {
  state.flow = { dateIndex: 0, slotIndex: 0, courtId: null };
  const courts = getCourtsForSlot(0, 0);
  let target = kind === "join" ? courts.find((c) => c.state === "partiel") : courts.find((c) => c.state === "libre");
  if (!target) target = courts.find((c) => c.state !== "occupe") || courts[0];
  startBooking(target.court.id);
}

function spotsToPlayers(f) {
  return f.spots.map((s) => {
    if (s.kind === "me") return { name: `${CURRENT_USER.firstName} ${CURRENT_USER.lastName}`, tag: "Adhérent", payer: true };
    if (s.kind === "member") return { name: `${s.member.firstName} ${s.member.lastName}`, tag: "Adhérent" };
    return { name: `${s.firstName} ${s.lastName}`, tag: "Non-adhérent" };
  });
}

/* Pré-remplit une partie de démonstration (vous + un partenaire) si vide,
   pour que les écrans atteints via le sélecteur ne soient pas vides. */
function seedSampleParty() {
  const f = state.flow;
  if (f.spots.length > 0) return;
  f.spots.push({ kind: "me" });
  if (f.spots.length < f.capacity) f.spots.push({ kind: "member", member: MEMBERS[0] });
}

function ensureConfirmation() {
  if (state.lastBooking) return;
  setupBooking("new");
  seedSampleParty();
  const f = state.flow;
  state.lastBooking = {
    ref: "PAD-2026-0612", dateIndex: f.dateIndex, slotIndex: f.slotIndex, courtId: f.courtId,
    players: spotsToPlayers(f), total: bookingTotal(), status: "À venir",
  };
}

function jumpTo(v) {
  state.modal = null;
  switch (v) {
    case "login": state.screen = "login"; break;
    case "planning": ensureFlow(); state.screen = "planning"; state.tab = "reserver"; break;
    case "slot": ensureFlow(); if (state.flow.slotIndex == null) state.flow.slotIndex = 0; state.screen = "slot"; break;
    case "booking-new": setupBooking("new"); state.screen = "booking"; break;
    case "booking-join": setupBooking("join"); state.screen = "booking"; break;
    case "payment": if (!state.flow || !state.flow.courtId) setupBooking("new"); seedSampleParty(); state.screen = "payment"; break;
    case "confirmation": ensureConfirmation(); state.screen = "confirmation"; break;
    case "reservations": state.screen = "reservations"; state.tab = "resa"; break;
    case "adhesion": state.screen = "adhesion"; state.tab = "adhesion"; break;
    case "compte": state.screen = "compte"; state.tab = "compte"; break;
    case "admin": state.screen = "admin"; state.tab = "compte"; break;
  }
  render();
}

function applyNotesVisibility() {
  notesEl.style.display = state.showNotes ? "" : "none";
  renderToolbar();
  renderNotes();
}

toolbar.addEventListener("click", (e) => {
  const t = e.target.closest("[data-action]");
  if (!t) return;
  const a = t.dataset.action;
  if (a === "set-view") { state.view = t.dataset.view; render(); }
  else if (a === "toggle-notes") { state.showNotes = !state.showNotes; applyNotesVisibility(); }
});

toolbar.addEventListener("change", (e) => {
  if (e.target.id === "jump") jumpTo(e.target.value);
});

/* ---------- Coquille (appbar + screen + nav/bar) ---------- */
function shell(content, opt = {}) {
  const desktop = state.view === "desktop";
  const flush = state.screen === "planning";
  const bar = opt.bar || "";
  const steps = opt.steps ? stepBar(opt.steps) : "";

  // En-tête : barre supérieure avec navigation sur desktop, sinon appbar standard
  let appbar;
  if (desktop && opt.tabs) {
    appbar = `
      <header class="appbar desktop">
        <div class="brand"><div class="logo">PR</div><div><div class="title">${CLUB.name}</div></div></div>
        <nav class="topnav">${navItems()}</nav>
      </header>`;
  } else {
    appbar = `
      <header class="appbar">
        ${opt.back ? `<button class="back" data-action="goto" data-screen="${opt.back}" aria-label="Retour">‹</button>` : `
          <div class="brand"><div class="logo">PR</div>
            <div><div class="title">${CLUB.name}</div></div>
          </div>`}
        ${opt.title && opt.back ? `<div><div class="title">${esc(opt.title)}</div></div>` : ""}
        <div class="spacer"></div>
        ${!opt.back ? `<button class="icon-btn" data-action="goto" data-screen="compte" aria-label="Compte">${initials(CURRENT_USER.firstName + " " + CURRENT_USER.lastName)}</button>` : ""}
      </header>`;
  }

  // Onglets en bas uniquement sur mobile (sur desktop ils sont dans l'en-tête)
  const bottomNav = (!desktop && opt.tabs) ? tabBar() : "";
  const inner = flush ? content : `<div class="screen-inner${opt.wide ? " wide" : ""}">${content}</div>`;

  return appbar + steps +
    `<main class="screen${flush ? " flush" : ""}">${inner}</main>` +
    bottomNav + bar;
}

function stepBar(current) {
  const labels = ["Planning", "Créneau", "Joueurs", "Paiement"];
  return `<div class="steps">${labels.map((l, i) => {
    const n = i + 1;
    const cls = n < current ? "done" : n === current ? "current" : "";
    return `<div class="step ${cls}"><span class="dot">${n < current ? "✓" : n}</span>${n === current ? `<span>${l}</span>` : ""}</div>${i < 3 ? '<span class="bar"></span>' : ""}`;
  }).join("")}</div>`;
}

const NAV_TABS = [
  { id: "reserver", ico: "▦", label: "Réserver", screen: "planning" },
  { id: "resa", ico: "◷", label: "Mes réservations", screen: "reservations" },
  { id: "adhesion", ico: "✦", label: "Adhésion", screen: "adhesion" },
  { id: "compte", ico: "◍", label: "Compte", screen: "compte" },
];

function navItems(short) {
  return NAV_TABS.map((t) =>
    `<button class="${state.tab === t.id ? "active" : ""}" data-action="tab" data-tab="${t.id}" data-screen="${t.screen}">
      <span class="ico">${t.ico}</span>${short ? t.label.replace("Mes réservations", "Mes résa.") : t.label}</button>`).join("");
}

function tabBar() {
  return `<nav class="tabbar">${navItems(true)}</nav>`;
}

/* ============================================================
   PANNEAU D'ANNOTATIONS (hors device)
   Les repères de validation et les questions client vivent ici,
   pour ne pas être confondus avec l'interface réelle.
   ============================================================ */
/* Le libellé d'écran du panneau reprend l'identifiant unique de la vue
   (même source que la navigation), variation comprise (4.1 / 4.2). */

/* Renvoie les annotations de l'écran courant : { tag, html, q } */
function notesFor() {
  const f = state.flow;
  const N = [];
  const push = (tag, html, q = false) => N.push({ tag, html, q });

  switch (state.screen) {
    case "login":
      push("Étape 1", "<b>Identifiants.</b> Connexion via le compte Wix existant. Les non-adhérents peuvent réserver au tarif plein sans adhésion.");
      break;
    case "planning":
      push("Étape 2", "<b>Planning journalier.</b> Défilement horizontal des jours, vue verticale des créneaux fixes (1h30). Chaque pastille = 1 terrain, avec son état. Réservations ouvertes plusieurs semaines à l'avance.");
      break;
    case "slot":
      push("Étape 3", "<b>Terrains par créneau.</b> Un terrain « libre » démarre une nouvelle partie (1 à 4 joueurs). Un terrain « partiellement libre » permet de rejoindre une partie et de payer les places restantes.");
      break;
    case "booking":
      push("Étape 4", "<b>Type de réservation.</b> Sélection d'un adhérent existant (annuaire) ou ajout d'un participant (nom, prénom, niveau). Le statut adhérent / non-adhérent détermine le tarif. Le niveau est défini par le club.");
      if (f) {
        const remaining = f.capacity - f.spots.length;
        if (remaining > 0)
          push("Places libres", `Vous pouvez laisser <b>${remaining} place${remaining > 1 ? "s" : ""}</b> ouverte${remaining > 1 ? "s" : ""}. D'autres joueurs pourront rejoindre la partie et payer leur part.`);
      }
      break;
    case "payment":
      push("Étape 5", "<b>Validation & paiement.</b> Récapitulatif de la transaction, puis redirection vers le <b>paiement Wix Checkout</b> — le règlement n'est pas géré dans l'app. Le payeur reçoit la confirmation par e-mail (lui uniquement).");
      push("Question client", "Annulation en ligne autorisée jusqu'à 24h avant le créneau = remboursement intégral. <b>À confirmer&nbsp;:</b> remboursement partiel / avoir si &lt; 24h ?", true);
      break;
    case "confirmation":
      push("Hors scope", "Déverrouillage par code SMS hors périmètre pour ce lot — l'interface est anticipée ici pour préparer l'intégration future.");
      break;
    case "reservations":
      push("Règle", "Annulation gratuite jusqu'à 24h avant le créneau = remboursement intégral. Au-delà du délai, le bouton est désactivé.");
      break;
    case "adhesion":
      push("Info", "Écran informatif : statut et tarifs. La <b>souscription / renouvellement se fait sur le site principal</b> (hors périmètre de cette app) ou au club. La fiche adhérent et le niveau sont gérés par le club.");
      push("Question client", "Modalités exactes du prorata 1ʳᵉ année (mensuel ? date de bascule ?) à préciser.", true);
      break;
    case "compte":
      push("Info", "Le membre consulte son profil ici. La <b>modification des coordonnées se fait dans l'espace membre natif Wix</b> (redirection). Le niveau et l'adhésion restent gérés par le club.");
      break;
    case "admin":
      push("Scope", "Gestion des adhérents via les <b>tables natives Wix</b> dans un premier temps (tableau de bord dédié prévu pour un lot ultérieur). Le club gère la fiche adhérent et définit le niveau de chaque joueur.");
      break;
    default:
      break;
  }
  return N;
}

function renderNotes() {
  if (!state.showNotes) { notesEl.innerHTML = ""; return; }
  const items = notesFor();
  const head = `
    <div class="np-head">
      <div class="np-mark">✎</div>
      <div>
        <div class="np-title">Annotations du wireframe</div>
        <div class="np-sub">Repères de validation · invisibles pour l'utilisateur final</div>
      </div>
      <button class="np-close" data-action="toggle-notes" aria-label="Masquer les annotations" title="Masquer les annotations">✕</button>
    </div>`;

  const list = items.length
    ? items.map((n) => `<div class="note ${n.q ? "q" : ""}"><span class="tag">${n.tag}</span><div>${n.html}</div></div>`).join("")
    : `<p class="np-empty">Aucune annotation pour cet écran.</p>`;
  const body = `<div class="np-body">
      <p class="np-screen-label">${viewLabel(currentJumpKey())}</p>
      ${list}
    </div>`;
  notesEl.innerHTML = head + body;
}

/* Bouton « fermer » du panneau (hors #app) : replie les annotations. */
notesEl.addEventListener("click", (e) => {
  if (e.target.closest('[data-action="toggle-notes"]')) {
    state.showNotes = false;
    applyNotesVisibility();
  }
});

/* ============================================================
   ÉCRAN 1 — Identifiants
   ============================================================ */
function viewLogin() {
  return `
  <div class="device-inner" style="display:flex;flex-direction:column;min-height:100%;">
    <main class="screen" style="display:flex;flex-direction:column;justify-content:center;">
      <div class="center" style="margin-bottom:26px;">
        <div class="logo" style="width:56px;height:56px;border-radius:16px;margin:0 auto 14px;font-size:20px;">PR</div>
        <h1 class="page">${CLUB.name}</h1>
        <p class="page-sub">Réservation de terrains de padel</p>
      </div>

      <div class="card">
        <div class="field">
          <label>E-mail</label>
          <input type="email" value="julien.mercier@email.fr" inputmode="email">
        </div>
        <div class="field">
          <label>Mot de passe</label>
          <input type="password" value="••••••••">
        </div>
        <button class="btn" data-action="login">Se connecter</button>
        <button class="btn ghost" data-action="login" style="margin-top:6px;">Mot de passe oublié ?</button>
      </div>

      <div class="center muted" style="font-size:12px;margin:6px 0;">ou</div>
      <button class="btn secondary" data-action="login">Réserver sans compte (non-adhérent)</button>
    </main>
  </div>`;
}

/* ============================================================
   ÉCRAN 2 — Planning journalier
   ============================================================ */
function barPlanning() { return ""; }

function planningDayStrip(di) {
  return `<div class="daystrip">${DATES.map((d) =>
    `<button class="day ${d.index === di ? "active" : ""}" data-action="pick-date" data-i="${d.index}">
      <div class="dow">${d.weekday}</div>
      <div class="num">${d.day}</div>
      <div class="mon">${d.month}</div>
    </button>`).join("")}</div>`;
}

const PLANNING_LEGEND = `
  <div class="legend">
    <div class="item"><span class="swatch libre"></span>Libre</div>
    <div class="item"><span class="swatch partiel"></span>Partiellement libre</div>
    <div class="item"><span class="swatch occupe"></span>Occupé / bloqué</div>
  </div>`;

function viewPlanning() {
  return state.view === "desktop" ? planningDesktop() : planningMobile();
}

/* --- Planning mobile : liste verticale de créneaux --- */
function planningMobile() {
  const di = state.flow ? state.flow.dateIndex : 0;

  const slots = TIME_SLOTS.map((s, si) => {
    const courts = getCourtsForSlot(di, si);
    const freeCourts = courts.filter((c) => c.state !== "occupe").length;
    const tiles = courts.map((c) =>
      `<span class="tile ${c.state === "libre" ? "" : c.state}">${c.court.id}</span>`).join("");
    const full = freeCourts === 0;
    return `
      <button class="slot ${full ? "full" : ""}" data-action="pick-slot" data-i="${si}" ${full ? "disabled" : ""}>
        <div class="time">${s.start}<span class="dur">1h30</span></div>
        <div class="courts">${tiles}</div>
        <div class="meta"><div class="free">${full ? "—" : freeCourts}</div><div class="lbl">${full ? "complet" : "terrains"}</div></div>
      </button>`;
  }).join("");

  return `
    <div style="padding:16px 16px 4px;">
      <h1 class="page" style="padding:0 0 2px;">Planning</h1>
      <p class="page-sub" style="margin-bottom:0;">${DATES[di].full} · 8 terrains</p>
    </div>
    ${planningDayStrip(di)}
    ${PLANNING_LEGEND}
    <div style="padding-top:6px;">${slots}</div>`;
}

/* --- Planning desktop : grille terrains × créneaux --- */
function planningDesktop() {
  const di = state.flow ? state.flow.dateIndex : 0;

  const header = `<div class="gh corner"></div>` + COURTS.map((c) =>
    `<div class="gh">T${c.id}<small>${c.kind}</small></div>`).join("");

  const rows = TIME_SLOTS.map((s, si) => {
    const courts = getCourtsForSlot(di, si);
    const cells = courts.map((c) => {
      const occupe = c.state === "occupe";
      let label;
      if (c.blocked) label = "Bloqué";
      else if (c.state === "libre") label = "Libre";
      else if (occupe) label = "Complet";
      else label = `<small>${c.freeSpots} place${c.freeSpots > 1 ? "s" : ""}</small>`;
      return `<button class="gcell ${c.state === "libre" ? "" : c.state}" ${occupe ? "disabled" : ""}
        data-action="pick-cell" data-slot="${si}" data-court="${c.court.id}"
        title="T${c.court.id} · ${s.start}–${s.end}">${label}</button>`;
    }).join("");
    return `<div class="gt">${s.start}<small>${s.end}</small></div>${cells}`;
  }).join("");

  return `
    <div style="display:flex;align-items:baseline;justify-content:space-between;gap:12px;padding:18px 24px 6px;">
      <h1 class="page" style="padding:0;">Planning</h1>
      <span class="muted" style="font-size:13px;">${DATES[di].full} · 8 terrains</span>
    </div>
    ${planningDayStrip(di)}
    ${PLANNING_LEGEND}
    <div class="pgrid">
      <div class="pgrid-scroll">
        <div class="pgrid-table">${header}${rows}</div>
      </div>
    </div>`;
}

/* ============================================================
   ÉCRAN 3 — Choix du terrain pour un créneau
   ============================================================ */
function viewSlot() {
  const f = state.flow;
  const courts = getCourtsForSlot(f.dateIndex, f.slotIndex);

  const list = courts.map((c) => {
    const selectable = c.state !== "occupe";
    let desc;
    if (c.blocked) desc = "Bloqué par le club (entretien)";
    else if (c.state === "libre") desc = "Terrain libre · 4 places";
    else if (c.state === "occupe") desc = "Complet · 4 / 4 joueurs";
    else desc = `Partie en cours · ${c.freeSpots} place${c.freeSpots > 1 ? "s" : ""} libre${c.freeSpots > 1 ? "s" : ""}`;

    const badge = c.state === "libre"
      ? `<span class="badge">Libre</span>`
      : c.state === "partiel"
        ? `<span class="badge">Rejoindre</span>`
        : `<span class="badge">Complet</span>`;

    return `
      <button class="court" data-action="pick-court" data-id="${c.court.id}" ${selectable ? "" : "disabled"}>
        <div class="ix ${c.state === "libre" ? "" : c.state}">${c.court.id}</div>
        <div class="info">
          <div class="name">${c.court.name} <span class="muted" style="font-weight:400;font-size:12px;">· ${c.court.kind}</span></div>
          <div class="desc">${desc}</div>
        </div>
        ${selectable ? badge : `<span class="chev" style="opacity:.4;">🔒</span>`}
      </button>`;
  }).join("");

  return `
    <h1 class="page">${DATES[f.dateIndex].weekday}. ${DATES[f.dateIndex].day} ${DATES[f.dateIndex].month}</h1>
    <p class="page-sub">Créneau ${slotLabel(f.slotIndex)} · choisissez un terrain</p>
    <div class="legend" style="padding-left:0;padding-right:0;">
      <div class="item"><span class="swatch libre"></span>Libre</div>
      <div class="item"><span class="swatch partiel"></span>Places libres</div>
      <div class="item"><span class="swatch occupe"></span>Complet</div>
    </div>
    ${list}`;
}

/* ============================================================
   ÉCRAN 4 — Type de réservation / joueurs
   ============================================================ */
function startBooking(courtId) {
  const f = state.flow;
  const courts = getCourtsForSlot(f.dateIndex, f.slotIndex);
  const target = courts.find((c) => c.court.id === courtId);
  f.courtId = courtId;
  f.joining = target.state === "partiel";
  f.existing = target.players.map((p) => ({
    name: `${p.firstName} ${p.lastName}`, level: p.level, tag: "Adhérent",
  }));
  f.capacity = 4 - f.existing.length; // places que l'utilisateur peut occuper
  // Nouvelle partie : aucun joueur pré-sélectionné (on peut réserver pour des tiers).
  // En rejoignant une partie : l'utilisateur s'ajoute par défaut.
  f.spots = f.joining ? [{ kind: "me" }] : [];
}

function viewBooking() {
  const f = state.flow;
  const court = courtById(f.courtId);
  const remaining = f.capacity - f.spots.length; // places encore ajoutables

  const existingHtml = f.joining ? `
    <div class="section-title">Joueurs déjà inscrits</div>
    ${f.existing.map((p) => `
      <div class="player">
        <div class="avatar">${initials(p.name)}</div>
        <div class="pinfo"><div class="pname">${esc(p.name)}</div>
          <div class="pmeta"><span>Adhérent</span></div></div>
        <span class="badge dark">${p.level}</span>
      </div>`).join("")}` : "";

  const spotsHtml = f.spots.map((s, i) => spotCard(s, i, f.dateIndex)).join("");

  // Cases d'ajout
  const canAdd = remaining > 0;
  const addHtml = `
    <div class="addgrid" style="margin-top:4px;">
      <button class="add-tile" data-action="add-member" ${canAdd ? "" : "disabled"}>
        <span class="big">＋</span>Adhérent
        <span class="hint">tarif préférentiel</span>
      </button>
      <button class="add-tile" data-action="add-guest" ${canAdd ? "" : "disabled"}>
        <span class="big">＋</span>Invité
        <span class="hint">tarif plein</span>
      </button>
    </div>`;

  return `
    <h1 class="page">${court.name}</h1>
    <p class="page-sub">${DATES[f.dateIndex].weekday}. ${DATES[f.dateIndex].day} ${DATES[f.dateIndex].month} · ${slotLabel(f.slotIndex)}</p>

    ${existingHtml}

    <div class="section-title">${f.joining ? "Vous ajoutez" : "Vos joueurs"}</div>
    ${f.spots.length === 0 ? `<p class="muted" style="font-size:13px;margin:0 2px 10px;">Ajoutez les joueurs de la partie — vous-même, des adhérents ou des invités.</p>` : ""}
    ${spotsHtml}
    ${canAdd ? addHtml : ""}`;
}

function spotCard(s, i, dateIndex) {
  if (s.kind === "me") {
    const price = priceFor(CURRENT_USER.adherent, dateIndex);
    return `
      <div class="player">
        <div class="avatar me">${initials(CURRENT_USER.firstName + " " + CURRENT_USER.lastName)}</div>
        <div class="pinfo">
          <div class="pname">${CURRENT_USER.firstName} ${CURRENT_USER.lastName} <span class="muted" style="font-weight:400;">(vous)</span></div>
          <div class="pmeta"><span>Adhérent</span></div>
        </div>
        <div style="display:flex;align-items:center;gap:10px;">
          <span class="badge dark">${CURRENT_USER.level}</span>
          <span class="pprice">${price} €</span>
        </div>
      </div>`;
  }
  if (s.kind === "member") {
    const price = priceFor(true, dateIndex);
    return `
      <div class="player">
        <div class="avatar">${initials(s.member.firstName + " " + s.member.lastName)}</div>
        <div class="pinfo">
          <div class="pname">${s.member.firstName} ${s.member.lastName}</div>
          <div class="pmeta"><span>Adhérent</span></div>
        </div>
        <div style="display:flex;align-items:center;gap:10px;">
          <span class="badge dark">${s.member.level}</span>
          <span class="pprice">${price} €</span>
          <button class="icon-btn" data-action="remove-spot" data-i="${i}" aria-label="Retirer">✕</button>
        </div>
      </div>`;
  }
  // guest
  const price = priceFor(false, dateIndex);
  return `
    <div class="player">
      <div class="avatar">${initials(s.firstName + " " + s.lastName)}</div>
      <div class="pinfo">
        <div class="pname">${esc(s.firstName)} ${esc(s.lastName)}</div>
        <div class="pmeta"><span>Non-adhérent</span></div>
        ${s.email ? `<div class="pmeta" style="margin-top:1px;">${esc(s.email)}</div>` : ""}
      </div>
      <div style="display:flex;align-items:center;gap:10px;">
        <span class="badge dark">${esc(s.level)}</span>
        <span class="pprice">${price} €</span>
        <button class="icon-btn" data-action="remove-spot" data-i="${i}" aria-label="Retirer">✕</button>
      </div>
    </div>`;
}

function bookingTotal() {
  const f = state.flow;
  return f.spots.reduce((sum, s) => {
    if (s.kind === "me") return sum + priceFor(CURRENT_USER.adherent, f.dateIndex);
    if (s.kind === "member") return sum + priceFor(true, f.dateIndex);
    return sum + priceFor(false, f.dateIndex);
  }, 0);
}

function barBooking() {
  const total = bookingTotal();
  const n = state.flow.spots.length;
  return `
    <div class="actionbar stacked">
      <div class="ab-summary"><span class="ab-lbl">Total · ${n} joueur${n > 1 ? "s" : ""}</span><span class="ab-amount">${total} €</span></div>
      <button class="btn" data-action="goto-payment" ${n === 0 ? "disabled" : ""}>Continuer</button>
    </div>`;
}

/* ============================================================
   ÉCRAN 5 — Validation & paiement
   ============================================================ */
function viewPayment() {
  const f = state.flow;
  const court = courtById(f.courtId);
  const total = bookingTotal();

  const lines = f.spots.map((s) => {
    let name, tag, price;
    if (s.kind === "me") { name = `${CURRENT_USER.firstName} ${CURRENT_USER.lastName} (vous)`; tag = "Adhérent"; price = priceFor(true, f.dateIndex); }
    else if (s.kind === "member") { name = `${s.member.firstName} ${s.member.lastName}`; tag = "Adhérent"; price = priceFor(true, f.dateIndex); }
    else { name = `${s.firstName} ${s.lastName}`; tag = "Non-adhérent"; price = priceFor(false, f.dateIndex); }
    return `<div class="summary-line"><span>${esc(name)} <span class="muted">· ${tag}</span></span><span>${price} €</span></div>`;
  }).join("");

  const summaryCard = `
    <div class="section-title">Récapitulatif</div>
    <div class="card">
      <div class="kv"><span class="k">Terrain</span><span class="v">${court.name} · ${court.kind}</span></div>
      <div class="kv"><span class="k">Date</span><span class="v">${DATES[f.dateIndex].full}</span></div>
      <div class="kv"><span class="k">Créneau</span><span class="v">${slotLabel(f.slotIndex)} (1h30)</span></div>
    </div>`;

  const participantsCard = `
    <div class="section-title">Participants & tarifs</div>
    <div class="card">
      ${lines}
      <div class="kv total" style="margin-top:6px;border-top:1px solid var(--line);padding-top:12px;"><span class="k" style="color:var(--ink);">Total</span><span class="v">${total} €</span></div>
    </div>`;

  if (state.view === "desktop") {
    return `<div class="cols2"><div class="col">${summaryCard}</div><div class="col">${participantsCard}</div></div>`;
  }
  return summaryCard + participantsCard;
}

function barPayment() {
  return `
    <div class="actionbar">
      <button class="btn" data-action="pay">Payer sur Wix ↗</button>
    </div>`;
}

/* ============================================================
   ÉCRAN — Confirmation
   ============================================================ */
function viewConfirmation() {
  const b = state.lastBooking;
  const court = courtById(b.courtId);
  const playerRows = b.players.map((p) =>
    `<div class="summary-line"><span>${esc(p.name)}${p.payer ? ' <span class="muted">(payeur)</span>' : ""}</span><span class="muted">${p.tag}</span></div>`).join("");

  return `
    <div class="center">
      <div class="success-mark">✓</div>
      <h1 class="page">Réservation confirmée</h1>
      <p class="page-sub">Un e-mail a été envoyé à ${CURRENT_USER.email}</p>
      <div class="ref-chip">${b.ref}</div>
    </div>

    <div class="card" style="margin-top:18px;">
      <div class="kv"><span class="k">Terrain</span><span class="v">${court.name}</span></div>
      <div class="kv"><span class="k">Date</span><span class="v">${DATES[b.dateIndex].full}</span></div>
      <div class="kv"><span class="k">Créneau</span><span class="v">${slotLabel(b.slotIndex)}</span></div>
      <div class="kv"><span class="k">Total réglé</span><span class="v">${b.total} €</span></div>
    </div>

    <div class="section-title">Joueurs</div>
    <div class="card">${playerRows}</div>

    <div style="margin-top:14px;">
      <button class="btn" data-action="goto" data-screen="reservations" data-tab="resa">Voir mes réservations</button>
      <button class="btn secondary" data-action="goto" data-screen="planning" data-tab="reserver" style="margin-top:10px;">Nouvelle réservation</button>
    </div>`;
}

/* ============================================================
   ÉCRAN — Mes réservations
   ============================================================ */
function viewReservations() {
  const sub = `
    <div class="btn-row" style="margin-bottom:14px;">
      <button class="btn ${state.resaTab === "avenir" ? "" : "secondary"} sm" style="flex:1;" data-action="resa-tab" data-t="avenir">À venir</button>
      <button class="btn ${state.resaTab === "passees" ? "" : "secondary"} sm" style="flex:1;" data-action="resa-tab" data-t="passees">Passées</button>
    </div>`;

  let body;
  if (state.resaTab === "avenir") {
    const ups = state.bookings.filter((b) => b.status === "À venir");
    body = ups.length ? ups.map(upcomingCard).join("") :
      `<div class="card center muted" style="padding:30px 16px;">Aucune réservation à venir.</div>`;
  } else {
    body = PAST_BOOKINGS.map((b) => `
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;">
          <div><div style="font-weight:650;">${b.label}</div>
          <div class="muted" style="font-size:12px;">${b.players} joueurs · ${b.ref}</div></div>
          <span class="badge">${b.status}</span>
        </div>
        <div class="kv" style="border:0;padding-bottom:0;"><span class="k">Total</span><span class="v">${b.total} €</span></div>
      </div>`).join("");
  }

  return `<h1 class="page">Mes réservations</h1><p class="page-sub">${CURRENT_USER.firstName} ${CURRENT_USER.lastName} · Adhérent</p>${sub}${body}`;
}

function upcomingCard(b) {
  const court = courtById(b.courtId);
  const d = DATES[b.dateIndex];
  const canCancel = b.dateIndex >= 1; // > 24h dans cette démo
  const players = b.players.map((p) =>
    `<span class="badge ${p.free ? "free" : ""}" style="font-size:10px;">${p.free ? "Place libre" : esc(p.name.split(" ")[0])}</span>`).join(" ");
  return `
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
        <div>
          <div style="font-weight:700;font-size:16px;">${d.full}</div>
          <div style="font-weight:600;font-size:14px;margin-top:1px;">${slotLabel(b.slotIndex)} <span class="muted" style="font-weight:400;">(1h30)</span></div>
          <div class="muted" style="font-size:12.5px;margin-top:3px;">${court.name} · ${court.kind}</div>
        </div>
        <span class="badge dark">${b.status}</span>
      </div>
      <div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:12px;">${players}</div>
      <div class="btn-row">
        <button class="btn secondary sm" style="flex:1;" data-action="cancel" data-ref="${b.ref}">Annuler</button>
      </div>
      ${canCancel
        ? `<p class="muted center" style="font-size:11px;margin:10px 0 0;">Annulation gratuite jusqu'à 24h avant · remboursement intégral</p>`
        : `<p class="muted center" style="font-size:11px;margin:10px 0 0;">Délai d'annulation dépassé (&lt; 24h)</p>`}
    </div>`;
}

/* ============================================================
   ÉCRAN — Adhésion & abonnements
   ============================================================ */
function viewAdhesion() {
  return `
    <h1 class="page">Adhésion</h1>
    <p class="page-sub">${CLUB.season} · jusqu'au ${CLUB.seasonEnd}</p>

    <div class="banner">
      <span class="b-ico">✦</span>
      <div><div class="b-title">Vous êtes adhérent</div><div class="b-sub">Adhésion active jusqu'au ${CLUB.seasonEnd}</div></div>
    </div>

    <div class="section-title">Vos avantages</div>
    <div class="card pad-0">
      <div style="padding:14px 16px;border-bottom:1px solid var(--line);"><div style="font-weight:600;">Tarif préférentiel</div><div class="muted" style="font-size:12.5px;">Journée et week-end</div></div>
      <div class="kv" style="padding:12px 16px;"><span class="k">Adhérent — journée (lun-ven)</span><span class="v">${PRICING.adherentJournee} €</span></div>
      <div class="kv" style="padding:12px 16px;"><span class="k">Adhérent — week-end</span><span class="v">${PRICING.adherentWeekend} €</span></div>
      <div class="kv" style="padding:12px 16px;"><span class="k">Non-adhérent — tarif plein</span><span class="v">${PRICING.nonAdherent} €</span></div>
    </div>
    <p class="muted" style="font-size:12px;margin:-2px 2px 0;">Tarifs par personne et par créneau (1h30).</p>

    <div class="section-title">Formule annuelle</div>
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:baseline;">
        <div style="font-weight:700;font-size:18px;">Adhésion saison</div>
        <div style="font-weight:750;font-size:20px;">${CLUB.membershipPriceYear} €<span class="muted" style="font-size:12px;font-weight:500;"> /an</span></div>
      </div>
      <p class="muted" style="font-size:13px;margin:8px 0 14px;">Saison de septembre à août. La 1ʳᵉ année est calculée au prorata des mois restants.</p>
      <button class="btn" data-action="noop">Adhérer / renouveler sur le site ↗</button>
    </div>`;
}

/* ============================================================
   ÉCRAN — Compte
   ============================================================ */
function viewCompte() {
  return `
    <h1 class="page">Compte</h1>
    <div class="card" style="position:relative;">
      <button class="icon-btn" data-action="noop" aria-label="Modifier mes informations" title="Modifier dans l'espace membre du site" style="position:absolute;top:12px;right:12px;">${ICONS.edit}</button>
      <div style="display:flex;align-items:center;gap:14px;">
        <div class="avatar me" style="width:54px;height:54px;font-size:18px;">${initials(CURRENT_USER.firstName + " " + CURRENT_USER.lastName)}</div>
        <div>
          <div style="font-weight:700;font-size:17px;">${CURRENT_USER.firstName} ${CURRENT_USER.lastName}</div>
          <div class="muted" style="font-size:13px;">${CURRENT_USER.email}</div>
          <span class="badge dark" style="margin-top:6px;">Adhérent</span>
        </div>
      </div>
    </div>

    <div class="section-title">Profil</div>
    <div class="card pad-0">
      <div class="kv" style="padding:12px 16px;"><span class="k">Téléphone</span><span class="v">${CURRENT_USER.phone}</span></div>
      <div class="kv" style="padding:12px 16px;"><span class="k">Niveau</span><span class="v">${CURRENT_USER.level}</span></div>
      <div class="kv" style="padding:12px 16px;"><span class="k">Adhésion</span><span class="v">Jusqu'au ${CLUB.seasonEnd}</span></div>
    </div>
    <p class="muted" style="font-size:12px;margin:-2px 2px 0;">Le niveau est défini par le club et n'est pas modifiable par le joueur.</p>

    <button class="btn secondary" data-action="goto" data-screen="login" style="margin-top:18px;">Se déconnecter</button>`;
}

/* ============================================================
   ÉCRAN — Administration (club)
   ============================================================ */
function viewAdmin() {
  const members = [CURRENT_USER, ...MEMBERS].slice(0, 8).map((m) => `
    <button class="list-row" data-action="edit-member" data-id="${m.id}">
      <span class="avatar">${initials(m.firstName + " " + m.lastName)}</span>
      <div class="lr-main"><div class="lr-title">${m.firstName} ${m.lastName}</div>
        <div class="lr-sub">${m.level} · ${m.adherent ? "Adhérent" : "Non-adhérent"}</div></div>
      <span class="badge">Modifier</span>
    </button>`).join("");

  return `
    <h1 class="page">Espace club</h1>
    <p class="page-sub">Gestion des adhérents · moniteur en chef</p>

    <div class="section-title">Adhérents</div>
    <div class="card pad-0" style="padding:0 16px;">${members}</div>`;
}

/* ============================================================
   MODALES / OVERLAYS
   ============================================================ */
function viewModal() {
  const m = state.modal;
  let inner = "";
  if (m.type === "members") inner = modalMembers();
  else if (m.type === "guest") inner = modalGuest();
  else if (m.type === "member-edit") inner = modalMemberEdit(m.member);
  else if (m.type === "cancel") inner = modalCancel(m.ref);
  return `<div class="overlay" data-action="close-modal"><div class="sheet" data-stop="1"><div class="grab"></div>${inner}</div></div>`;
}

function modalMembers() {
  const meAdded = state.flow.spots.some((s) => s.kind === "me");
  const meRow = meAdded ? "" : `
    <button class="player" style="width:100%;text-align:left;cursor:pointer;" data-action="select-me">
      <div class="avatar me">${initials(CURRENT_USER.firstName + " " + CURRENT_USER.lastName)}</div>
      <div class="pinfo"><div class="pname">${CURRENT_USER.firstName} ${CURRENT_USER.lastName} <span class="muted" style="font-weight:400;">(vous)</span></div>
        <div class="pmeta"><span>${CURRENT_USER.level}</span> · <span class="badge" style="font-size:10px;">Adhérent</span></div></div>
      <span class="chev">＋</span>
    </button>`;

  const chosen = new Set(state.flow.spots.filter((s) => s.kind === "member").map((s) => s.member.id));
  const rows = MEMBERS.filter((m) => !chosen.has(m.id)).map((m) => `
    <button class="player" style="width:100%;text-align:left;cursor:pointer;" data-action="select-member" data-id="${m.id}">
      <div class="avatar">${initials(m.firstName + " " + m.lastName)}</div>
      <div class="pinfo"><div class="pname">${m.firstName} ${m.lastName}</div>
        <div class="pmeta"><span>${m.level}</span> · <span class="badge" style="font-size:10px;">Adhérent</span></div></div>
      <span class="chev">＋</span>
    </button>`).join("");
  return `<h3>Choisir un adhérent</h3>
    <div class="field"><input placeholder="Rechercher un adhérent…" readonly></div>${meRow}${rows}`;
}

function modalGuest() {
  return `<h3>Ajouter un participant</h3>
    <p class="muted" style="font-size:12.5px;margin:-6px 2px 12px;">Non-adhérent — tarif plein appliqué.</p>
    <div class="field-row">
      <div class="field"><label>Prénom</label><input id="g-first" placeholder="Prénom"></div>
      <div class="field"><label>Nom</label><input id="g-last" placeholder="Nom"></div>
    </div>
    <div class="field"><label>E-mail</label><input id="g-email" type="email" inputmode="email" placeholder="email@exemple.fr"></div>
    <div class="field"><label>Niveau</label>
      <select id="g-level">${LEVELS.map((l) => `<option ${l === "Intermédiaire" ? "selected" : ""}>${l}</option>`).join("")}</select>
    </div>
    <button class="btn" data-action="confirm-guest">Ajouter le participant</button>`;
}

function modalMemberEdit(m) {
  return `<h3>Modifier l'adhérent</h3>
    <div class="field-row">
      <div class="field"><label>Prénom</label><input id="m-first" value="${esc(m.firstName)}"></div>
      <div class="field"><label>Nom</label><input id="m-last" value="${esc(m.lastName)}"></div>
    </div>
    <div class="field"><label>E-mail</label><input id="m-email" type="email" inputmode="email" value="${esc(m.email || "")}" placeholder="email@exemple.fr"></div>
    <div class="field"><label>Téléphone</label><input id="m-phone" value="${esc(m.phone || "")}" placeholder="06 00 00 00 00"></div>
    <div class="field"><label>Niveau <span class="muted" style="font-weight:400;">(défini par le club)</span></label>
      <select id="m-level">${LEVELS.map((l) => `<option ${l === m.level ? "selected" : ""}>${l}</option>`).join("")}</select>
    </div>
    <button class="btn" data-action="save-member" data-id="${m.id}">Enregistrer</button>`;
}

function modalCancel(ref) {
  const b = state.bookings.find((x) => x.ref === ref);
  const court = courtById(b.courtId);
  return `<h3>Annuler la réservation</h3>
    <div class="card flat" style="box-shadow:none;background:var(--surface-2);">
      <div style="font-weight:650;">${court.name} · ${DATES[b.dateIndex].full}</div>
      <div class="muted" style="font-size:13px;">${slotLabel(b.slotIndex)}</div>
    </div>
    <div class="note"><span class="tag">Politique</span><div>Annulation à plus de 24h du créneau : <b>remboursement intégral (${b.total} €)</b>.</div></div>
    <button class="btn" data-action="confirm-cancel" data-ref="${ref}">Confirmer l'annulation</button>
    <button class="btn ghost" data-action="close-modal" style="margin-top:6px;">Garder ma réservation</button>`;
}

/* ============================================================
   GESTION DES ÉVÉNEMENTS (délégation)
   ============================================================ */
function genRef() {
  const n = 600 + state.bookings.length + Math.floor((Date.now() / 1000) % 90);
  return `PAD-2026-0${n}`;
}

app.addEventListener("click", (e) => {
  const t = e.target.closest("[data-action]");
  // fermer la modale en cliquant en dehors de la feuille
  if (state.modal && e.target.classList.contains("overlay")) { state.modal = null; render(); return; }
  if (!t) return;
  const a = t.dataset.action;

  switch (a) {
    case "login":
      state.screen = "planning"; state.tab = "reserver";
      state.flow = { dateIndex: 0, slotIndex: null, courtId: null };
      break;

    case "tab":
      state.tab = t.dataset.tab; state.screen = t.dataset.screen;
      break;

    case "goto":
      if (t.dataset.tab) state.tab = t.dataset.tab;
      state.screen = t.dataset.screen;
      break;

    case "pick-date":
      state.flow.dateIndex = +t.dataset.i;
      break;

    case "pick-slot":
      state.flow.slotIndex = +t.dataset.i;
      state.screen = "slot";
      break;

    case "pick-court":
      startBooking(+t.dataset.id);
      state.screen = "booking";
      break;

    case "pick-cell":
      ensureFlow();
      state.flow.slotIndex = +t.dataset.slot;
      startBooking(+t.dataset.court);
      state.screen = "booking";
      break;

    case "add-member":
      state.modal = { type: "members" };
      break;

    case "select-me":
      if (!state.flow.spots.some((s) => s.kind === "me") && state.flow.spots.length < state.flow.capacity)
        state.flow.spots.unshift({ kind: "me" });
      state.modal = null;
      break;

    case "select-member": {
      const m = MEMBERS.find((x) => x.id === t.dataset.id);
      if (state.flow.spots.length < state.flow.capacity) state.flow.spots.push({ kind: "member", member: m });
      state.modal = null;
      break;
    }

    case "add-guest":
      state.modal = { type: "guest" };
      break;

    case "confirm-guest": {
      const first = (document.getElementById("g-first").value || "Invité").trim();
      const last = (document.getElementById("g-last").value || "").trim();
      const email = (document.getElementById("g-email").value || "").trim();
      const level = document.getElementById("g-level").value;
      if (state.flow.spots.length < state.flow.capacity)
        state.flow.spots.push({ kind: "guest", firstName: first, lastName: last, level, email });
      state.modal = null;
      break;
    }

    case "remove-spot":
      state.flow.spots.splice(+t.dataset.i, 1);
      break;

    case "goto-payment":
      state.screen = "payment";
      break;

    case "pay": {
      const f = state.flow;
      const players = spotsToPlayers(f);
      const booking = { ref: genRef(), dateIndex: f.dateIndex, slotIndex: f.slotIndex, courtId: f.courtId, players, total: bookingTotal(), status: "À venir" };
      state.bookings.unshift(booking);
      state.lastBooking = booking;
      state.screen = "confirmation";
      break;
    }

    case "resa-tab":
      state.resaTab = t.dataset.t;
      break;

    case "cancel":
      state.modal = { type: "cancel", ref: t.dataset.ref };
      break;

    case "confirm-cancel":
      state.bookings = state.bookings.filter((b) => b.ref !== t.dataset.ref);
      state.modal = null;
      break;


    case "edit-member": {
      const m = [CURRENT_USER, ...MEMBERS].find((x) => x.id === t.dataset.id);
      if (m) state.modal = { type: "member-edit", member: m };
      break;
    }

    case "save-member": {
      const m = [CURRENT_USER, ...MEMBERS].find((x) => x.id === t.dataset.id);
      if (m) {
        m.firstName = (document.getElementById("m-first").value || m.firstName).trim();
        m.lastName = (document.getElementById("m-last").value || m.lastName).trim();
        m.email = (document.getElementById("m-email").value || "").trim();
        m.phone = (document.getElementById("m-phone").value || "").trim();
        m.level = document.getElementById("m-level").value;
      }
      state.modal = null;
      break;
    }

    case "open-modal":
      state.modal = { type: t.dataset.modal };
      break;

    case "close-modal":
      if (e.target.closest("[data-stop]") && !e.target.closest('[data-action="close-modal"]')) return;
      state.modal = null;
      break;

    case "noop":
      return; // élément de maquette non actif

    default:
      return;
  }
  render();
});

/* empêcher la fermeture quand on clique dans la feuille */
app.addEventListener("click", (e) => {
  if (e.target.closest("[data-stop]") && !e.target.closest("[data-action]")) e.stopPropagation();
}, true);

render();
