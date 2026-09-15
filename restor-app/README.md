# RestorApp

RestorApp est une application web (Vue 3 + Vite) permettant de trouver des restaurants, de consulter leurs détails, de partager des favoris entre utilisateurs et de suivre l’activité des profils.

## Prérequis

- Git [Windows](http://www.git-scm.com/book/en/Getting-Started-Installing-Git#Installing-on-Windows), [Mac](http://www.git-scm.com/book/en/Getting-Started-Installing-Git#Installing-on-Mac), [Linux](http://www.git-scm.com/book/en/Getting-Started-Installing-Git#Installing-on-Linux)
- [Node.js](https://nodejs.org/en/) (version LTS recommandée)

Vérifier que Node et npm sont installés :

```bash
node -v
npm -v
```

## Installation

```bash
npm install
```

## Lancer l’application

```bash
npm run dev
```

Ouvrir dans le navigateur : **http://localhost:5173** (ou l’URL affichée dans le terminal).

Pour prévisualiser le build de production :

```bash
npm run build
npm run preview
```

---

## Fonctionnalités supplémentaires

### Photo de profil (Gravatar) — `src/pages/User.vue`

Sur la page profil, l’avatar affiché au-dessus du nom est une **photo de profil fournie par [Gravatar](https://gravatar.com/)** : l’adresse courriel de l’utilisateur est hachée (MD5, normalisée en minuscules) et utilisée pour construire l’URL d’image sur le service Gravatar. S’il n’y a pas de courriel, une image par défaut de style **« retro »** est utilisée. L’image est affichée en carré arrondi (150×150 px, `object-fit: cover`) avec une bordure mise en avant.

### Restaurants similaires — `src/components/SimilarRestaurants.vue`

Sur la **page détail d’un restaurant**, cette section propose des établissements **similaires** au restaurant courant : le service réutilise la recherche API avec le **même intervalle de prix** et les **mêmes genres** que le restaurant affiché, puis exclut le restaurant actuel et limite le nombre de résultats. L’interface est une **liste horizontale défilable** (scroll tactile ou souris), avec des **boutons ‹ ›** lorsque le dépassement horizontal le permet, un indicateur de chargement, une gestion d’erreur avec bouton **Retry**, et des cartes restaurant réutilisant `RestaurantCard` (sans le bouton « Mark as visited » sur ces cartes).

---

## Parcours dans l’application (pages, URLs, boutons)

### 1. Page d’accueil — Liste des restaurants

| Élément   | Détail                                                                 |
| --------- | ---------------------------------------------------------------------- |
| **URL**   | `http://localhost:5173/`                                               |
| **Accès** | Cliquer sur **« RestorApp »** ou **« Home »** dans la barre de navigation. |

**Sur la page :**

- **Recherche restaurants** (carte « Search & Filters ») : champ « Search by name, address, or genre... » pour filtrer les restaurants.
- **Recherche d’utilisateurs dans la barre de navigation** : si vous êtes **connecté**, le champ de recherche global de la navbar est affiché sur l’accueil avec le libellé **« Search user... »**. Il interroge uniquement les **profils utilisateurs** (au moins 2 caractères) ; choisir un résultat ouvre le profil correspondant (`/user/:id`). La recherche de restaurants depuis la navbar est désactivée sur l’accueil pour éviter le doublon avec le bloc **Search & Filters** ci-dessus. **Non connecté** : ce champ n’apparaît pas sur l’accueil.
- **Filtres** : cases à cocher **Price range** ($ à $$$$$) et **Genres** (l’API applique un OR entre les genres sélectionnés).
- **Bouton « Reset All Filters »** : réinitialise la recherche et les filtres.
- **Cartes restaurant** :
  - **« View »** (œil) : ouvre la page détail du restaurant.
  - **« Mark as visited »** : ouvre le formulaire pour enregistrer une visite (utilisateur connecté).

---

### 2. Page détail d’un restaurant

| Élément   | Détail                                                                                                   |
| --------- | -------------------------------------------------------------------------------------------------------- |
| **URL**   | `http://localhost:5173/restaurant/:id` (ex. `http://localhost:5173/restaurant/5f3200b2e4657c2040ba0e34`) |
| **Accès** | Depuis l’accueil : cliquer sur **« View »** sur une carte restaurant.                                    |

**Sur la page :**

- **« Favorite »** (étoile) : ajouter le restaurant à une liste de favoris (liste à choisir dans la modale). Visible et utilisable lorsque l’utilisateur est connecté.
- **« Visit »** : enregistrer une visite au restaurant (modale).
- **« Get Directions (from my location) »** : calcul d’itinéraire depuis la position actuelle (ou depuis un point cliqué sur la carte).
- **Modale « Select Favorite List »** : choisir une liste puis valider pour ajouter le restaurant aux favoris ; **« Cancel »** pour fermer.
- **« Similar Restaurants »** : bloc en bas de page listant des restaurants proches par prix et genres (détails dans la section **Fonctionnalités supplémentaires** ci-dessus).

---

### 3. Page profil utilisateur

| Élément   | Détail                                                                                                                                                                                                                            |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **URL**   | `http://localhost:5173/user/:id` (l’identifiant utilisateur, ex. celui de l’utilisateur connecté).                                                                                                                                |
| **Accès** | Dans la barre de navigation : bouton **« Profile »** (visible si connecté) ; liens vers un profil depuis les modales followers / following ou la recherche. **Sans connexion**, l’accès à cette route redirige vers **`/login`**. |

**Sur la page :**

- **Photo de profil** : avatar Gravatar basé sur le courriel (détails dans **Photo de profil (Gravatar)** dans la section **Fonctionnalités supplémentaires**).
- **Identité** : nom affiché sous l’avatar.
- **Follow / Unfollow** : si le profil consulté n’est pas le vôtre, bouton pour suivre ou cesser de suivre l’utilisateur.
- **Réputation** : étoiles (note / 100) et badge **points** (valeur brute de la note).
- **Followers / Following** : tuiles cliquables ouvrant une modale listant abonnés et abonnements (avec liens vers les profils).
- **Tableau « Restaurants Visited Recently »** : cliquer sur une **ligne** du tableau ouvre une modale avec le détail des visites pour ce restaurant.
- Si aucun restaurant visité : message adapté (vous / l’autre utilisateur) ; pour votre propre profil, bouton **« Go to the homepage to explore restaurants »** → `/`.

---

### 4. Barre de navigation (toutes les pages)

| Élément                | Action                                                                                                                                                                                                                                                                                                                                                                    |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **« RestorApp »**          | Lien vers `/` (accueil).                                                                                                                                                                                                                                                                                                                                                  |
| **« Home »**           | Lien vers `/` (accueil).                                                                                                                                                                                                                                                                                                                                                  |
| **« My Favorites »**   | (Si connecté) Ouvre la modale « My Favorite Lists » : listes de favoris, créer une liste, éditer/supprimer une liste, ouvrir le contenu d’une liste.                                                                                                                                                                                                                      |
| **Champ de recherche** | **Accueil (`/`)** : visible **uniquement si connecté** ; recherche **utilisateurs** seulement (placeholder « Search user... »). **Autres pages** : toujours visible ; si non connecté, recherche **restaurants** uniquement (« Search restaurant... ») ; si connecté, **restaurants et utilisateurs** (« Search restaurant or user... »). Saisie minimale : 2 caractères. |
| **« Login »**          | (Si non connecté) Lien vers la page de connexion (`/login`).                                                                                                                                                                                                                                                                                                              |
| **« Profile »**        | (Si connecté) Lien vers `/user/<votre id>`.                                                                                                                                                                                                                                                                                                                               |
| **« Logout »**         | (Si connecté) Déconnexion ; si vous êtes sur une page profil, retour à l’accueil `/`.                                                                                                                                                                                                                                                                                     |

---

### 5. Modale « My Favorites » (depuis la barre)

- **Ouvrir** : bouton **« My Favorites »** dans la navbar (si connecté).
- **Listes** : cliquer sur une **liste** pour voir les restaurants qu’elle contient.
- **Créer une liste** : saisir un nom dans « New list name » puis **« Create List »**.
- **Éditer une liste** : bouton ✏️ sur une liste, modifier le nom, **« Save »** ou **« Cancel »**.
- **Supprimer une liste** : bouton 🗑 → modale de confirmation avec **« Cancel »** et **« Delete »**.
- **Fermer** : **« Close »** ou retour depuis la vue contenu de la liste.

---

## Qualité du code et tests

### ESLint

ESLint est configuré pour maintenir un style de code cohérent au sein de l’équipe. La configuration s’appuie notamment sur Prettier pour le formatage. Vous pouvez adapter ces règles selon les besoins du projet.

```bash
npm run lint
```

### Tests (Vitest)

Les tests unitaires sont lancés avec Vitest :

```bash
npm test
```

### Formatage Prettier

```bash
npm run format
```

---

## Notes

- Les scripts **Husky** / **lint-staged** peuvent exécuter le lint et le formatage avant les commits (voir `package.json`).
