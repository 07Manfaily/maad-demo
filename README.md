<p align="center"><img src="backoffice/public/logo-maad.svg" width="260" alt="MAAD" /></p>

# MAAD V2 · Démos

Démonstrations (données fictives) de la nouvelle version de la **Mutuelle d'Assistance d'Adzopé**. La future version reposera sur une API Flask, un back-office React et une appli mobile React Native.

| Dossier | Application | En ligne |
|---|---|---|
| [`backoffice/`](backoffice) | Back-office des agents (React + Vite) | https://07manfaily.github.io/maad-demo/ |
| [`mobile/`](mobile) | Appli des adhérents (React Native / Expo, Android) et sa version web pour iPhone | https://07manfaily.github.io/maad-demo/mobile/ |

Le workflow `.github/workflows/pages.yml` construit les deux et les publie sur GitHub Pages à chaque push sur `main`.

## Back-office

```bash
cd backoffice
npm install
npm run dev      # http://localhost:5173
```

- Connexion et profil de l'agent ; tableau de bord
- Adhérents : liste, recherche, ajout, modification, suppression, import CSV, fiche détaillée
- Sous-couverts (5 au maximum) et ayants-droit
- Cotisations par période : montant dû, reste et statut calculés automatiquement
- Contrôle des doublons, avec la nouvelle règle : **une personne déjà inscrite ne peut pas être inscrite par quelqu'un d'autre**
- Identité visuelle : logo et palette

Pour tester la règle : « Sous-couverts » → « Nouvel sous-couvert » → choisir un adhérent → **Tester la règle**.

## Appli mobile des adhérents

```bash
cd mobile
npm install
npx expo start        # scanner le QR code avec l'appli Expo Go sur Android
npm run build:web     # version web statique dans mobile/dist
```

- Connexion par numéro d'adhésion et code PIN (démo : compte pré-rempli, tout numéro du back-office marche avec le code `1234`)
- Accueil : reste à payer, statut « À jour / Pas à jour », calcul de la cotisation
- Cotisations mois par mois (payé, partiel, impayé) et paiement d'avance
- Paiement Mobile Money **simulé** : Wave, Orange Money, MTN MoMo, Moov Money, avec saisie du numéro, récapitulatif, validation (code secret ou confirmation Wave) et reçu
- Historique des paiements (guichet et appli) et reçus
- Famille : sous-couverts et ayants-droit
- Profil, réinitialisation de la démo

Règles reprises du back-office : cotisation mensuelle = tarif (4 500 ou 5 000 FCFA) × nombre de personnes couvertes (l'adhérent et ses sous-couverts) ; un adhérent est à jour quand il ne reste rien à payer.

**iPhone** : la version web est la même appli (React Native Web). Sur ordinateur elle s'affiche dans un cadre de téléphone ; sur iPhone, l'ouvrir dans Safari puis « Partager → Sur l'écran d'accueil ».

**APK Android** : `npx eas-cli@latest build -p android --profile preview` (compte Expo gratuit) produit un fichier `.apk` installable directement, sans passer par le Play Store.

## Identité visuelle

Logo inspiré du tabouret baoulé (`backoffice/public/logo-maad.svg`, `logo-mark.svg`).

| Couleur | Hex | Usage |
|---|---|---|
| Ébène | `#1B1612` | textes, fonds sombres |
| Iroko | `#6B3F1F` | couleur de marque |
| Or baoulé | `#C9962B` | accents |
| Terre rouge | `#B5532A` | alertes, impayés |
| Indigo | `#1F3A5F` | informations |
| Vert raphia | `#4E7A3A` | « à jour » |
| Kaolin | `#F5EFE4` | fonds clairs |

## Analyse de l'existant

Voir [docs/comprehension-laravel.md](docs/comprehension-laravel.md).
