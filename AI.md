# Usage de l'IA — Projet Annonces Immo

> Binôme : Imed Benabadji, Mohamed Riad Beaizia
> Outil principal : Claude (Anthropic), en conversation. Aucun agent n'a écrit directement dans le dépôt.

## Notre règle de travail

1. L'IA propose, nous exécutons nous-mêmes chaque commande et relisons chaque fichier avant commit.
2. Toute affirmation technique de l'IA est **vérifiée sur la machine** (`npm ls`, `git check-ignore`, logs Prisma, `curl`) plutôt que crue.
3. Chaque merge request est relue par l'autre membre du binôme : aucun code n'entre dans `main` sans qu'au moins l'un de nous deux sache l'expliquer.
4. Le code d'autorisation (vérification de propriété, rôles) n'est jamais accepté sur la seule foi de sa lecture : chaque règle est **éprouvée par un test d'attaque** (IDOR) avant merge.

## 1. Ce qui a été délégué / écrit nous-mêmes

| Phase | Délégué à l'IA | Fait par nous | Pourquoi ce partage |
|---|---|---|---|
| 0 · Mise en place | Synthèse du sujet et du cours, plan en 9 phases, `.gitignore` complet, squelettes README / AI.md | Création du dépôt sur la forge, installation, vérification des versions, restructuration du projet | Synthétiser 36 pages est rapide pour l'IA ; l'état réel de notre machine, seuls nous pouvons le constater |
| 1 · Infra et modèle | Premier jet de `docker-compose.yml`, `prisma.config.ts`, `prisma.ts`, `auth.ts`, modèles métier et seed | Choix du modèle (id `Int`, prix `Int`, enums, clé composée des favoris), résolution des erreurs d'environnement (port, `.env`, client non généré) | Le code d'infrastructure suit la doc ; les choix de modélisation, nous devons pouvoir les défendre |
| 2 · Lecture SSR | Premier jet des pages liste/détail, schémas Zod des paramètres d'URL | Mesures : `curl` des codes de statut, comptage des requêtes SQL à 12 puis 30 annonces | La conformité aux critères se prouve par la mesure, pas par la lecture du code |
| 3 · Authentification | Premier jet des Server Actions d'inscription / connexion, du formulaire client et de la navigation | Tests manuels avec plusieurs comptes, vérification en base du rôle et de la table `session` | La configuration Better Auth suit la doc ; le rôle non falsifiable, nous l'avons prouvé nous-mêmes (curl + SQL) |
| 4 · Autorisation | Premier jet de `authz.ts`, des Server Actions (CRUD, questions, réponses, favoris) et des pages de gestion | Relecture de chaque condition d'autorisation, tests des codes 200/404/307 en curl, tests IDOR manuels (suppression, réponse, question et favori sur brouillon) en modifiant les champs cachés depuis la console | C'est la partie évaluée en priorité : nous devons pouvoir montrer où et comment chaque droit est vérifié |
| 5 · Validation | Schémas Zod (construits au fil des phases 2 à 4), validation des variables d'environnement, page 404 | Vérification que chaque entrée (formulaire, paramètre d'URL, champ caché, variable d'environnement) passe par Zod ; test du garde-fou avec un secret invalide | La validation a été ajoutée là où chaque donnée entre, pas dans une phase à part ; cette phase a servi à vérifier qu'aucune frontière n'avait été oubliée |
| 6 · Interface | Premier jet de la route de lecture des photos, des Server Actions d'upload et des formulaires | Choix du stockage hors de `public/` (fichiers ajoutés après le build), tests path traversal en curl, test d'un faux `.jpg`, test IDOR sur la suppression de photo, vérification responsive en mode mobile | L'upload est une surface d'attaque : chaque protection (nom généré, signature du fichier, propriété) a été testée par une tentative réelle |
| 7 · Tests | | | |

## 2. Suggestions rejetées (avec justification technique)

1. **`role String` généré par la CLI Better Auth → enum `Role`.** La CLI ne traduit pas la liste de valeurs en enum Prisma. Avec `String`, PostgreSQL accepterait n'importe quelle valeur ; l'enum garantit la contrainte au niveau de la base, même pour une écriture qui contourne Better Auth.
2. _À remplir._

Pièges annoncés par le cours, à surveiller dans chaque proposition :
- configuration Prisma 6 (`url = env(...)` dans le schéma, `prisma-client-js`, pas de driver adapter) alors que nous sommes en Prisma 7 ;
- suppression / modification par `id` seul, sans condition de propriété (faille IDOR) ;
- `prisma.user.create` dans le seed au lieu de `auth.api.signUpEmail` ;
- `"use client"` posé sur une page entière au lieu d'un petit composant ;
- `params.id` sans `await` ;
- `loading.tsx` placé haut dans l'arbre, qui fausse les codes HTTP.

## 3. Erreurs de l'IA détectées

### Phase 0 — `.gitignore` supposé au lieu d'être lu
- **Ce qui s'est passé** : l'IA a affirmé (en se basant sur le cours) que le template contenait `.env*`. Notre template contenait en réalité `.env`.
- **Détection** : en collant le vrai fichier puis avec `git check-ignore -v .env`, qui affichait le motif `.env`.
- **Correction** : remplacement par `.env*` + `!.env.example`, vérifié dans les deux sens avec `git check-ignore -v`.
- **Leçon** : une IA raisonne sur le cas général ; il faut lui donner le fichier réel.

### Phase 0 — Structure `src/` annoncée mais pas générée
- **Ce qui s'est passé** : l'IA a donné des réponses aux questions de `create-next-app` en supposant qu'elles seraient toutes posées. Avec Next 16, accepter les « recommended defaults » saute ces questions et crée le projet **sans** `src/`.
- **Détection** : `ls -a` montrait `app/` à la racine.
- **Correction** : `mv app src/app` et alias `@/*` → `./src/*` dans `tsconfig.json`, puis `npm run build` pour valider.

### Phase 1 — CLI Better Auth sans variables d'environnement
- **Ce qui s'est passé** : la procédure proposée supposait que `npx @better-auth/cli generate` lirait le `.env`. Ce n'est pas le cas.
- **Détection** : notre garde-fou dans `prisma.ts` a levé `DATABASE_URL manquante` au lieu d'un plantage obscur.
- **Correction** : `set -a; source .env; set +a` avant la commande, dans le terminal uniquement.

### Phase 4 — Script de vérification non exécutable
- **Ce qui s'est passé** : un script de test proposé par l'IA (`npx tsx -e` avec `await` au premier niveau) a échoué : `tsx -e` compile en CommonJS, qui n'autorise pas le top-level await.
- **Détection** : erreur `Top-level await is currently not supported with the "cjs" output format`.
- **Correction** : code enveloppé dans une fonction `async` auto-appelée.

### Phase 4 — Modification de la page détail non appliquée
- **Ce qui s'est passé** : les instructions découpées en petites étapes ont rendu facile l'oubli d'un ajout : la variable `gestionnaire` et les boutons de gestion de la page détail n'étaient pas dans le commit 4A.
- **Détection** : `npx tsc --noEmit` a signalé `Cannot find name 'gestionnaire'` à l'étape suivante.
- **Correction** : réécriture complète du fichier à partir d'une version de référence, et `tsc` lancé à chaque étape.

## 4. Bug introduit par génération (exigé par le sujet)

- **Lequel** : après la création d'une annonce, l'utilisateur était redirigé vers une **page 404**. Le code généré créait l'annonce en brouillon (comportement voulu) puis redirigeait vers sa page détail, mais cette page utilisait encore une requête qui ne renvoie que les annonces **publiées**. L'IA avait annoncé à tort que l'annonce s'afficherait normalement.
- **Comment on l'a détecté** : test manuel de création en agent ; puis requête SQL confirmant que l'annonce existait bien en base avec le statut `BROUILLON`.
- **Comment on l'a corrigé** : remplacement de la requête par `getAnnonceVisible`, qui applique la règle `filtreVisibles` de `authz.ts` (brouillon visible par son auteur et les admins). Vérifié avec quatre comptes : auteur et admin voient le brouillon, autre agent et visiteur obtiennent un 404.

## 5. Bilan (à rédiger à la fin)

_Ce que l'IA a vraiment accéléré, là où elle nous a fait perdre du temps, et ce que nous ferions différemment._