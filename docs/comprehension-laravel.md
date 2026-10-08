# Compréhension de l'application Laravel existante (Mutuelle)

Lecture seule du dossier `C:\laragon\www\Mutuelle` (Laravel 10, formulaires `kris/laravel-form-builder`, import `maatwebsite/excel`, thème Bootstrap « SmartHR »).

## Ce que fait l'application

Un back-office pour un agent de la mutuelle, protégé par connexion (Auth Laravel standard : connexion, mot de passe oublié, profil avec changement de nom, e-mail et mot de passe).

| Écran | Rôle | Fichiers |
|---|---|---|
| Tableau de bord | Totaux d'adhérents, de sous-couverts et d'ayants-droit, liste des adhérents avec leurs compteurs, recherche | `HomeController@index`, `views/index.blade.php` |
| Fiche adhérent | Identité, téléphone, sous-couverts et ayants-droit rattachés | `HomeController@show`, `views/show.blade.php` |
| Adhérents | Liste, création, modification, suppression, import Excel (numéro, nom, téléphone) | `MemberController`, `MembersImport` |
| Sous-couverts | Personnes couvertes par la cotisation d'un adhérent | `InsuredController` |
| Ayants-droit | Bénéficiaires désignés par un adhérent, avec lien de parenté | `BeneficiariesController` |
| Cotisations | Par période (mois) : nombre d'adhérents à jour / non à jour, solde en caisse, impayés, saisie d'une cotisation | `ContributionController`, `PeriodController` |

## Modèle de données

- **members** : `Number` (n° d'adhésion), `Name`, `Birthday`, `Phone`.
- **insureds** (sous-couverts) : `Code`, `Name`, `Birthday`, `Phone`, `member_id`.
- **beneficiaries** (ayants-droit) : `Code`, `Name`, `Lien`, `Phone`, `member_id`.
- **periods** : `Period` au format `AAAA-MM`, unique.
- **contributions** : `MustPay`, `Pay`, `Solde`, `Statut` (« A jour » / « Pas a jour »), `Insured` (nombre de sous-couverts), `period`, `member_id`.

Suppression en cascade : supprimer un adhérent supprime ses sous-couverts, ayants-droit et cotisations.

## Règles métier relevées

- N° d'adhésion : 4 chiffres. Nom : 5 à 50 caractères. Téléphone : 10 chiffres.
- Sous-couvert : 3 à 75 ans, **5 au maximum par adhérent**.
- Lien de parenté : lettres uniquement.
- Cotisation : tarif mensuel de **4 500 ou 5 000 FCFA** par personne ; somme due = tarif × (1 adhérent + nombre de sous-couverts) ; reste = dû − payé ; statut « À jour » quand le reste est nul.
- Une période ne peut être créée qu'une fois.

## Limites constatées (à corriger dans la V2 Flask)

- Aucune règle d'unicité sur les personnes : la même personne peut être inscrite plusieurs fois, y compris par deux adhérents différents. Le n° d'adhésion n'est pas non plus unique en base.
- `MembersRequest.php` contient une classe dupliquée collée à l'intérieur de la première (fichier invalide).
- `PeriodController@edit` appelle `findOrFail()` sans identifiant et une vue `pages.periods` inexistante.
- `MemberController@destroy` ne supprime rien (renvoie toujours une erreur).
- `ContributionController@index` utilise `$SelectPeriods` dans la vue sans la transmettre.
- La date de naissance est une chaîne libre, et les ayants-droit n'en ont pas.
- La fiche adhérent affiche `$member->Statut`, qui n’existe pas dans la table members.

## Nouvelle règle appliquée dans la V2

**Une personne déjà inscrite ne peut pas être inscrite par quelqu'un d'autre.** Adhérents, sous-couverts et ayants-droit forment un seul registre. Une inscription est refusée si la personne y figure déjà avec :
- le même n° de pièce d'identité (nouveau champ, facultatif), ou
- le même nom et prénoms (accents, casse et ordre des mots ignorés) **et** la même date de naissance (désormais obligatoire pour tous).

Le message indique sous quel rôle et par quel adhérent la personne a déjà été inscrite, et chaque refus est tracé dans un journal (« Contrôle des doublons »). Côté Flask, la même règle devra être appliquée en base (index unique sur la pièce d'identité, contrôle transactionnel nom + date de naissance) pour ne pas dépendre de l'interface.
