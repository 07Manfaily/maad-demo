<p align="center"><img src="public/logo-maad.svg" width="260" alt="MAAD" /></p>

# MAAD V2 · Démo web

Démonstration statique (React + Vite, données fictives) de la nouvelle version de l'application de gestion de la **Mutuelle d'Assistance d'Adzopé**. Elle reprend toutes les fonctions de l'application Laravel actuelle avec une interface modernisée, et applique la nouvelle règle : **une personne déjà inscrite ne peut pas être inscrite par quelqu'un d'autre**.

La future version reposera sur Flask (API) et React, avec une application mobile.

## Lancer la démo

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # version statique dans dist/
```

Les identifiants sont pré-remplis sur l'écran de connexion. Les modifications sont gardées dans le navigateur ; le bouton « Réinitialiser la démo » remet les données de départ.

Le workflow `.github/workflows/pages.yml` publie la démo sur GitHub Pages à chaque push sur `main` (activer Pages avec la source « GitHub Actions » dans les réglages du dépôt).

## Écrans

- Connexion et profil de l'agent
- Tableau de bord : totaux, cotisations par mois, statut des adhérents
- Adhérents : liste, recherche, ajout, modification, suppression, import CSV
- Fiche adhérent : sous-couverts (5 au maximum), ayants-droit, historique des cotisations
- Sous-couverts et ayants-droit
- Cotisations par période : calcul automatique du montant dû, du reste et du statut
- Contrôle des doublons : vérification d'une personne et journal des inscriptions refusées
- Identité visuelle : logo et palette

## Pour tester la nouvelle règle

Ouvrir « Sous-couverts », puis « Nouvel sous-couvert », choisir un adhérent et cliquer sur **Tester la règle** : le formulaire est pré-rempli avec une personne déjà inscrite chez un autre adhérent, l'alerte s'affiche et l'enregistrement est refusé.

## Identité visuelle proposée

Logo inspiré du tabouret baoulé (`public/logo-maad.svg`, `public/logo-mark.svg`).

| Couleur | Hex | Usage |
|---|---|---|
| Ébène | `#1B1612` | textes, barre latérale |
| Iroko | `#6B3F1F` | couleur de marque |
| Or baoulé | `#C9962B` | accents |
| Terre rouge | `#B5532A` | alertes, impayés |
| Indigo | `#1F3A5F` | informations |
| Vert raphia | `#4E7A3A` | « à jour » |
| Kaolin | `#F5EFE4` | fonds clairs |

## Analyse de l'existant

Voir [docs/comprehension-laravel.md](docs/comprehension-laravel.md).
