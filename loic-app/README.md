# Loïc App — Matériel topographique

Application Android de **vente**, **location**, **réservation** et **gestion de stock** d'appareils topographiques.
Basée à **Mbalgong** — ☎ +237 676 173 003 / 690 583 91 — ✉ tassialoic9@gmail.com

Couleurs : bleu marine `#0B1F3A`, blanc, vert `#1FA35B` — Police : *Plus Jakarta Sans*.

## Fonctionnalités

### Côté client
| Écran | Contenu |
|---|---|
| **Accueil** | Présentation, accès rapide (stations, GNSS, drones, services), contacts |
| **Vente** | 11 références (243 unités) : recherche, filtres par catégorie, stock en temps réel, panier |
| **Location** | Stations totales, Hi-Target V300, Mavic 2 Pro + opérateur, niveaux, trépieds, cannes — tarifs/jour |
| **Réservation** | Choix des dates et de l'heure de retrait, contrôle automatique de la disponibilité, calcul du prix |
| **Commande en ligne** | Panier → coordonnées → envoi par WhatsApp ou e-mail avec un numéro de référence |
| **Prestations** | Levé, implantation, bornage, nivellement, drone, formation, maintenance, assistance RTK → demande de devis |
| **Mes suivis** | Statut des réservations, commandes et devis du client |

### Espace gestion (cadenas en haut à droite — PIN initial **1234**)
- **Tableau de bord** : stock, appareils sortis, demandes à valider, **retours en retard**, sorties et retours du jour, chiffre d'affaires.
- **Stock** : modifier les quantités (+1/−1, entrée fournisseur, ajustement d'inventaire), les prix, ajouter ou supprimer des appareils.
- **Sorties / Retours** : journal horodaté (**date, heure et jour**) de chaque mouvement, liste des appareils dehors.
- **Réservations** : En attente → Confirmée → Sortie → Retournée (heure de sortie et de retour enregistrées automatiquement), notification WhatsApp au client.
- **Commandes** : saisie du prix des articles « sur devis », confirmation (déduit le stock), livraison, annulation (remet le stock).
- **Réglages** : changement du PIN, sauvegarde/restauration (.json), exports Excel (.csv), réinitialisation.

## Tarifs de location (par jour)
| Appareil | Prix |
|---|---|
| Niveau optique | 10 000 FCFA |
| Récepteur GNSS | 20 000 FCFA |
| Drone avec opérateur | 100 000 FCFA |
| Station totale | 10 000 FCFA |
| Trépied | 5 000 FCFA |
| Canne | 2 000 FCFA |

Les **prix de vente** sont affichés « sur devis » : renseignez-les dans *Gestion → Stock → ✏️*.

## Installer sur Android

**Option 1 — APK (recommandé)** : chaque modification du dossier `loic-app/` lance le workflow GitHub
*« Loïc App — build APK Android »* (onglet **Actions** du dépôt). Téléchargez l'artefact `LoicApp-apk`,
copiez `app-debug.apk` sur le téléphone et installez-le (autoriser « sources inconnues »).

**Option 2 — PWA** : hébergez le dossier `www/` (GitHub Pages, Netlify…), ouvrez le lien dans Chrome
sur Android → menu ⋮ → **Installer l'application**. Fonctionne ensuite hors connexion.

**Option 3 — Android Studio** :
```bash
cd loic-app
npm install
npx cap add android
npx cap open android      # puis Build > Build APK / Generate Signed Bundle (Play Store)
```

## Structure
```
loic-app/
├── www/                  # application (HTML/CSS/JS, hors ligne)
│   ├── index.html
│   ├── styles.css
│   ├── app.js            # écrans, réservations, stock, journal, exports
│   ├── data.js           # catalogue initial, prix, prestations, contacts
│   ├── sw.js             # cache hors-ligne
│   └── icons/
├── capacitor.config.json # empaquetage Android (com.loicapp.topo)
└── package.json
```

## Bon à savoir
- Les données sont enregistrées **sur le téléphone** (fonctionne sans Internet). Les commandes et réservations des clients
  arrivent chez vous par **WhatsApp / e-mail** avec leur référence. Pensez à faire une **sauvegarde** régulière (Réglages).
- Étape suivante possible : une base de données en ligne (Firebase ou Supabase) pour synchroniser plusieurs téléphones
  et recevoir les commandes directement dans l'espace gestion.
