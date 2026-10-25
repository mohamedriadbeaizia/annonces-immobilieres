# Port d'attache — annonces immobilières

Application Web full-stack de gestion d'annonces immobilières, réalisée dans le cadre du TP
« Frameworks côté serveur » (M2 IWOCS, Université Le Havre Normandie).

**Binôme** : Imed Benabadji, Mohamed Riad Beaizia

| Élément | Choix |
|---|---|
| Framework | Next.js 16, App Router |
| Langage | TypeScript, `strict: true` |
| Base de données | PostgreSQL 17 via Docker |
| ORM | Prisma 7 (driver adapter `@prisma/adapter-pg`) |
| Authentification | Better Auth (email + mot de passe, sessions en base) |
| Validation | Zod, sur toute donnée entrante |
| Tests | Vitest, sur une base de test séparée |

---

## Démarrage depuis zéro

### Prérequis

- **Node.js 20.9 ou plus** (22 LTS recommandé) et npm
- **Docker** avec Docker Compose
- Une connexion Internet au premier lancement (installation des paquets, polices téléchargées au build par `next/font`)

### Étapes

```bash
# 1. Récupérer le projet
git clone https://www-apps.univ-lehavre.fr/forge/bi253578/tp-gestion-d-annonces-immobilieres-benabadji-beaizia.git
cd tp-gestion-d-annonces-immobilieres-benabadji-beaizia

# 2. Configurer l'environnement
cp .env.example .env
openssl rand -base64 32
#    → coller la valeur obtenue dans BETTER_AUTH_SECRET du fichier .env

# 3. Démarrer PostgreSQL (crée aussi la base de test au premier démarrage)
docker compose up -d

# 4. Installer les dépendances (génère aussi le client Prisma via postinstall)
npm ci

# 5. Créer les tables, puis les données de démonstration
npx prisma migrate deploy
npm run db:seed

# 6. Lancer l'application
npm run dev
```

L'application est disponible sur **http://localhost:3000**.

### En cas de problème

| Symptôme | Cause | Solution |
|---|---|---|
| `docker compose up` s'arrête avec « manquant — copiez .env.example vers .env » | le fichier `.env` n'existe pas | étape 2 |
| L'application refuse de démarrer avec « Configuration invalide » | une variable manque ou est invalide (secret trop court, URL mal formée) | le message indique la variable à corriger |
| `port is already allocated` sur 5432 | un autre PostgreSQL utilise déjà ce port | dans `.env`, mettre `POSTGRES_PORT="5433"` et remplacer `5432` par `5433` dans `DATABASE_URL` et `DATABASE_URL_TEST`, puis `docker compose down && docker compose up -d` |
| L'application démarre sur le port 3001 | le port 3000 est déjà occupé | libérer le port 3000 : Better Auth est configuré pour `http://localhost:3000` (`BETTER_AUTH_URL`) |

---

## Comptes de test

Créés par `npm run db:seed`. Mot de passe commun : la valeur de `SEED_PASSWORD` dans `.env` (**`demo1234`** par défaut).

| Compte | Rôle | Ce qu'il permet de vérifier |
|---|---|---|
| `admin@immo.test` | ADMIN | tous les droits, sur toutes les annonces |
| `alice@immo.test` | AGENT | gère ses annonces, ne peut pas toucher à celles de Bruno |
| `bruno@immo.test` | AGENT | second agent, indispensable pour tester l'autorisation |
| `claire@immo.test` | USER | pose des questions, gère ses favoris (2 favoris dans le seed) |
| `david@immo.test` | USER | second utilisateur |

Le seed crée 12 annonces réparties entre Alice et Bruno, dont 4 brouillons, et quelques questions avec ou sans réponse.
Il **vide la base avant de la remplir** : on peut le relancer à volonté pour revenir à cet état.

Pour mesurer le N+1 avec plus de données : `NB_ANNONCES=30 npm run db:seed`.

---

## Scripts npm

| Script | Rôle |
|---|---|
| `npm run dev` | serveur de développement |
| `npm run build` | build de production |
| `npm run start` | lance le build de production |
| `npm test` | tests Vitest, sur la base de test |
| `npm run db:seed` | réinitialise la base de dev avec les données de démonstration |

---

## Variables d'environnement

Toutes documentées dans `.env.example`. Aucune valeur n'est écrite en dur dans le code ni dans `docker-compose.yml`.

| Variable | Nature | Rôle |
|---|---|---|
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_PORT` | configuration | initialisation du conteneur PostgreSQL |
| `DATABASE_URL` | configuration | connexion de Prisma à la base de dev |
| `DATABASE_URL_TEST` | configuration | base utilisée par `npm test`, **toujours différente** de `DATABASE_URL` |
| `BETTER_AUTH_SECRET` | **secret** | signature des cookies de session ; jamais commité, régénéré par environnement |
| `BETTER_AUTH_URL` | configuration | URL publique de l'application |
| `UPLOAD_DIR` | configuration | dossier de stockage des photos (hors de `public/`) |
| `SEED_PASSWORD` | configuration | mot de passe des comptes de démonstration |
| `SEED_ADMIN_PASSWORD` | configuration (optionnelle) | mot de passe distinct du compte admin ; vide → `SEED_PASSWORD` |

**Configuration ou secret ?** Une valeur de configuration peut être documentée dans le dépôt : connaître sa forme ne donne aucun pouvoir. Un secret donne un pouvoir à qui le connaît (ici : fabriquer des cookies de session valides) : il n'apparaît dans le dépôt sous aucune forme.

Toutes ces variables sont **validées au démarrage** par `src/lib/env.ts` (Zod) : une variable absente ou invalide empêche l'application de démarrer, avec un message qui dit quoi corriger.

---

## Tests

```bash
npm test
```

42 tests, répartis en 5 fichiers :

| Fichier | Ce qui est testé | Base de données |
|---|---|---|
| `tests/regles.test.ts` | règles d'autorisation de `authz.ts` | non |
| `tests/validation.test.ts` | schémas Zod (prix négatif, titre trop court, identifiants d'URL) | non |
| `tests/requetes.test.ts` | un brouillon n'apparaît pas dans la liste publique, n'est visible que par son auteur et les admins | oui |
| `tests/actions.test.ts` | **absence d'IDOR** sur la vraie Server Action de suppression, règles appliquées par les actions | oui |
| `tests/configuration.test.ts` | les tests sont bien connectés à la base de test | oui |

### Isolation

Les tests vident la base à chaque exécution : ils tournent sur une **base séparée** (`immo_test`), dans le même conteneur que la base de dev. Trois garde-fous successifs :

1. `tests/global-setup.ts` refuse de démarrer si `DATABASE_URL_TEST` est absente ou égale à `DATABASE_URL`, puis applique les migrations sur la base de test ;
2. `tests/setup.ts` bascule toute l'application sur la base de test **avant** que Prisma soit chargé ;
3. `viderBase` (dans `tests/aide.ts`) demande à PostgreSQL le nom de la base réellement connectée et refuse d'en vider une qui ne finit pas par `_test`.

La base `immo_test` est créée automatiquement au premier démarrage du conteneur (`docker/initdb/01-base-de-test.sh`). Sur un volume créé avant l'ajout de ce script : `docker compose exec db createdb -U immo immo_test`.

### Chaque test peut échouer

Pour vérifier que les tests détectent vraiment les bugs, nous avons cassé volontairement le code, un sabotage à la fois :

| Sabotage | Test(s) passés au rouge |
|---|---|
| `deleteMany` de `supprimerAnnonce` sans condition de propriété | l'agent A ne peut PAS supprimer l'annonce de l'agent B |
| `peutGererAnnonces` renvoie toujours `true` | un USER ne peut pas gérer d'annonces · un USER ne peut pas créer d'annonce |
| `.positive()` retiré du prix | rejette un prix négatif · rejette un prix nul · un prix négatif est refusé par l'action |
| filtre `PUBLIEE` retiré de la liste publique | un brouillon n'apparaît pas dans la liste publique |

---

## Choix d'architecture

### Organisation du code

```
src/
├─ app/
│  ├─ (auth)/              connexion, inscription et leurs Server Actions
│  ├─ annonces/            liste, détail, création, édition, Server Actions des annonces et des photos
│  ├─ mes-annonces/        tableau de gestion d'un agent (toutes les annonces pour un admin)
│  ├─ favoris/             favoris de l'utilisateur connecté
│  ├─ photos/[nom]/        lecture des photos stockées hors de public/
│  └─ api/auth/[...all]/   handler de Better Auth
├─ components/             navigation, boutons de gestion, formulaire de texte
└─ lib/
   ├─ authz.ts             règles d'autorisation, PURES (aucune dépendance)
   ├─ session.ts           lecture de la session, acteur courant
   ├─ schemas.ts           schémas Zod de toutes les entrées
   ├─ env.ts               validation des variables d'environnement
   ├─ annonces.ts          requêtes de lecture (règles de visibilité intégrées)
   ├─ photos.ts            stockage et vérification des photos
   ├─ prisma.ts, auth.ts   clients Prisma et Better Auth
prisma/                    schéma, migrations versionnées, seed
tests/                     tests Vitest et leur configuration
docker/initdb/             création de la base de test au premier démarrage
```

### Authentification et autorisation

- **Toute mutation passe par une Server Action.** Les deux seules Route Handlers sont le handler de Better Auth (appelé par la bibliothèque, pas par nos formulaires) et `/photos/[nom]`, en **lecture seule**.
- **Chaque Server Action commence dans le même ordre** : authentification (`exigerUtilisateur`) → autorisation (`authz.ts`) → validation (Zod) → écriture. Une Server Action est un point d'entrée public : cacher un bouton ne protège rien.
- **La propriété fait partie de la requête**, pas d'un simple `if` : `deleteMany({ where: { id, ...filtreModifiables(acteur) } })` devient `DELETE … WHERE id = ? AND "auteurId" = ?`. Un agent qui envoie l'id d'une annonce d'un autre ne touche aucune ligne et reçoit une erreur.
- **404 plutôt que 403** pour une annonce d'un autre agent en édition : on ne révèle pas l'existence d'une ressource interdite.
- **Le rôle n'est pas falsifiable** : déclaré en `additionalFields` avec `input: false` (une inscription qui envoie `role=ADMIN` crée un compte USER), et stocké dans un **enum** PostgreSQL (la base refuse toute autre valeur).
- **Sessions en base** (table `session`), pas en JWT : le cookie ne contient qu'un identifiant opaque. Pour bannir un compte immédiatement, il suffit de supprimer ses sessions ; avec un JWT, il faudrait attendre son expiration.
- Les identifiants envoyés par les formulaires (champs cachés) sont **modifiables par le client** : chaque action les revalide et revérifie les droits. Testé à la main (console du navigateur) et automatiquement (`tests/actions.test.ts`).

### Composants serveur et client

Les composants sont **serveur par défaut**. Les seuls composants client, chacun justifié par `useActionState` (afficher les erreurs renvoyées par une Server Action et conserver la saisie sans recharger la page) :

| Composant | Rôle |
|---|---|
| `app/(auth)/formulaire-auth.tsx` | connexion et inscription |
| `app/annonces/formulaire-annonce.tsx` | création et modification d'une annonce |
| `components/formulaire-texte.tsx` | question et réponse |
| `app/annonces/formulaire-photos.tsx` | envoi de photos |

Les boutons de gestion, la déconnexion et les favoris sont de simples `<form>` serveur, sans JavaScript client.

### Modèle de données

- `Annonce` : identifiant **entier** (URL courtes, et `/annonces/abc` est un vrai cas « non numérique → 404 ») ; **prix en euros entiers** (`Int`), car un `Float` introduit des erreurs d'arrondi sur de l'argent et un `Decimal` ne se transmet pas tel quel à un composant client.
- Types de bien, statut de publication et statut du bien en **enums** : la base refuse toute valeur hors liste.
- `Favori` à **clé primaire composée** (`userId`, `annonceId`) : impossible d'ajouter deux fois le même favori.
- La réponse est un champ de `Question` (une question a au plus une réponse, par l'agent propriétaire).
- `onDelete: Cascade` : supprimer une annonce supprime ses photos, questions et favoris.

Index, chacun justifié par une requête réelle :

| Index | Requête servie |
|---|---|
| `Annonce(statutPublication, createdAt)` | liste publique : annonces publiées, les plus récentes d'abord |
| `Annonce(auteurId)` | « Mes annonces » et vérification de propriété |
| `Question(annonceId, createdAt)` | questions d'une annonce, dans l'ordre |
| `Photo(annonceId)` | photos incluses dans la liste et le détail |
| `Favori(annonceId)` | favoris rattachés à une annonce |

### Performances : pas de N+1

La liste `/annonces` émet **4 requêtes** quel que soit le nombre d'annonces affichées : le total (pagination), les annonces, puis une requête groupée (`WHERE … IN (…)`) par relation incluse (photos, auteurs). Mesuré dans les logs Prisma (`log: ["query"]`) avec 12 puis 30 annonces : le compte ne bouge pas.

### Rendu serveur et codes HTTP

- Les pages sont rendues côté serveur : `curl -s localhost:3000/annonces` contient déjà les titres des annonces.
- `params` et `searchParams` sont des Promises (Next 15+) : toujours `await`és, puis validés par Zod.
- **Pas de `loading.tsx`** : placé dans un dossier parent, il mettrait tout le sous-arbre en streaming, et `notFound()` / `redirect()` ne pourraient plus changer le code HTTP (tout répondrait 200). Nous utilisons un `<Suspense>` **local** autour des questions de la page détail : l'annonce s'affiche immédiatement, les questions arrivent ensuite, et le 404 est décidé avant la frontière de streaming.

### Photos

- Envoyées par une Server Action, comme les autres mutations (aucune exception à la règle n°1).
- **Stockées hors de `public/`** (`UPLOAD_DIR`) : Next ne sert depuis `public/` que les fichiers présents au moment du build. Elles sont servies par la route en lecture `/photos/[nom]`.
- **Nom généré par le serveur** (uuid + extension choisie par nous), jamais repris du client. La route n'accepte que ce format exact : une tentative de *path traversal* (`/photos/..%2F.env`) répond 404.
- **Trois niveaux de vérification** : Zod (nombre, taille, type annoncé), limite de photos par annonce, et **signature du fichier** (premiers octets) : un fichier quelconque renommé en `.jpg` est refusé.
- Compromis assumé : la photo d'un brouillon est accessible à qui connaît son URL. Le nom étant un uuid aléatoire, il est impossible à deviner ; le protéger demanderait une requête en base à chaque image affichée.

### Validation

Zod valide **chaque frontière** où une donnée entre dans l'application : formulaires, paramètres d'URL, champs cachés, fichiers envoyés, variables d'environnement. Les erreurs sont affichées **sous le champ concerné**, et la saisie est conservée.

---

## Critères mesurables : comment les vérifier

```bash
# Build sans erreur ni warning TypeScript
npm run build

# Tous les tests passent
npm test

# Rendu serveur effectif : le HTML brut contient déjà les annonces
curl -s localhost:3000/annonces | grep -o "Studio — [A-Za-zé ]*" | head -3

# Aucun identifiant en dur dans docker-compose.yml (ne doit rien afficher)
grep -rE 'POSTGRES_PASSWORD:\s*\w' docker-compose.yml

# Codes de statut
curl -s -o /dev/null -w '%{http_code}\n' localhost:3000/annonces/abc       # 404
curl -s -o /dev/null -w '%{http_code}\n' localhost:3000/annonces/999999    # 404
curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' localhost:3000/annonces/1/edit   # 307 → /login

# Rôle non falsifiable : le compte créé est USER
curl -s -X POST localhost:3000/api/auth/sign-up/email \
  -H "Content-Type: application/json" -H "Origin: http://localhost:3000" \
  -d '{"email":"pirate@test.fr","name":"Pirate","password":"motdepasse","role":"ADMIN"}'
docker compose exec db psql -U immo -d immo -c "SELECT email, role FROM \"user\" WHERE email = 'pirate@test.fr';"

# Tests isolés : le nombre d'annonces de la base de dev ne change pas
docker compose exec db psql -U immo -d immo -c 'SELECT count(*) FROM "Annonce";'
npm test
docker compose exec db psql -U immo -d immo -c 'SELECT count(*) FROM "Annonce";'
```

Pour les codes 200 (agent propriétaire) et 404 (agent non propriétaire) sur `/edit`, se connecter avec `curl -c cookies.txt` sur `/api/auth/sign-in/email`, puis réutiliser le cookie avec `curl -b cookies.txt`.

---

## Travailler sur le projet (binôme)

Après chaque `git pull` :

```bash
npm ci                     # si package-lock.json a changé
npx prisma migrate dev     # si prisma/ a changé : applique les migrations et régénère le client

# Vérifier que .env contient toutes les variables de .env.example (aucune ligne = rien ne manque)
diff <(grep -o '^[A-Z_]*' .env.example | sort) <(grep -o '^[A-Z_]*' .env | sort)
```

Organisation : une branche par phase, une merge request relue et fusionnée par l'autre membre du binôme.

---

## Usage de l'IA

L'usage d'assistants IA était autorisé. Ce que nous avons délégué, ce que nous avons rejeté et les erreurs que nous avons détectées sont décrits dans [`AI.md`](AI.md).