# Wireframe — Plateforme de réservation Padel

Maquette **fil de fer** (frontend uniquement, niveaux de gris) destinée à **valider les parcours avec le client** avant la rédaction des spécifications et le chiffrage. Surcouche envisagée à **Wix Bookings**.

> Aucune donnée réelle, aucun backend, aucun paiement réel. Tout est simulé en mémoire.

## Lancer

Ouvrir `index.html` dans un navigateur (double-clic), ou servir le dossier :

```bash
npx serve .
```

Conçu **mobile first** : sur grand écran, l'interface s'affiche dans un cadre de téléphone centré.

### Barre d'outils (bandeau indigo en haut, hors maquette)

Barre discrète à icônes (volontairement non grayscale) pour piloter la démo :

- **Sélecteur d'écran** — saute directement à n'importe quel écran ou état, y compris en milieu de parcours (ex. « Joueurs — rejoindre une partie »).
- **Vue** 📱 / 🖥️ — bascule Mobile / Desktop.
- **Annotations** 💬 — affiche / masque le panneau (affiché par défaut).

La vue **Desktop** est une vraie mise en page responsive (pas un simple recentrage) :
navigation supérieure au lieu des onglets du bas, **planning en grille terrains × créneaux**
(chaque cellule cliquable mène à la réservation), paiement sur deux colonnes, largeurs de
contenu adaptées. La vue **Mobile** conserve le parcours fil d'Ariane vertical d'origine.

## Parcours couverts

> **Annotations.** Les repères de validation et les questions client s'affichent dans un **panneau dédié, hors du cadre du téléphone** (à droite sur grand écran, sous le téléphone sur mobile) — pour ne jamais être confondus avec l'interface réelle. Bouton **Masquer / Afficher** dans l'en-tête du panneau.

1. **Identifiants** — connexion adhérent ou « réserver sans compte » (non-adhérent, tarif plein).
2. **Planning journalier** — défilement des jours, créneaux fixes de 1h30, planning visuel à 3 états (libre / partiellement libre / occupé), nombre de terrains disponibles par créneau.
3. **Choix du terrain** — 8 terrains ; un terrain libre démarre une partie, un terrain partiel permet de **rejoindre** une partie en cours.
4. **Joueurs** — vous (payeur) + ajout d'adhérents (annuaire) ou d'invités (nom, prénom, niveau) ; possibilité de **laisser des places libres**.
5. **Validation & paiement** — calcul selon le nombre de participants et leur statut ; e-mail de confirmation **au payeur uniquement**.
6. **Confirmation** — référence, récap, et **emplacement anticipé** pour le futur déverrouillage par code SMS.

**Parcours annexes**
- **Mes réservations** — à venir / passées, **annulation** (gratuite + remboursement intégral jusqu'à 24h avant).
- **Adhésion** — avantages, grille tarifaire, formule annuelle (sept → août, prorata 1ʳᵉ année), souscription en ligne.
- **Compte** — profil, niveau (défini par le club), actualités/événements.
- **Espace club (admin)** — annuaire adhérents (tables natives Wix), blocage créneaux/joueurs, statistiques, communication d'événements.

## Tarifs simulés (par personne / créneau 1h30)

| Statut | Tarif |
|---|---|
| Non-adhérent (plein) | 18 € |
| Adhérent — journée (lun-ven) | 10 € |
| Adhérent — week-end | 12 € |

Adhésion annuelle : 120 € (saison 2025–2026). Prix identique pour tous les terrains et créneaux.

## Questions ouvertes à valider avec le client

- **Annulation < 24h** : remboursement partiel, avoir, ou rien ? (≥ 24h = remboursement intégral, acté.)
- **Statistiques à enregistrer** : liste précise à cadrer (occupation par terrain/créneau, heures de pointe, réservations par adhérent, répartition adhérents/non-adhérents, CA par période).
- **Prorata 1ʳᵉ année d'adhésion** : modalités exactes (mensuel ? date de bascule ?).

## Hors périmètre de ce lot

Application mobile · design/config du site Wix · multilingue · déverrouillage SMS (interface anticipée seulement) · tableau de bord dédié gestion des membres · tournois.

## Structure

```
index.html        cadre + chargement
css/styles.css    système grayscale, mobile first
js/data.js        données fictives + générateur de planning
js/app.js         routeur d'écrans + logique d'interface
```
