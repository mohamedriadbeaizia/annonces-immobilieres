# Usage de l'IA — Projet Annonces Immo

> Binôme : Imed Benabadji, Mohamed Riad Beaizia
> Outil principal : Claude (Anthropic), en conversation. Aucun agent n'a écrit directement dans le dépôt.

## Notre règle de travail

1. L'IA propose, nous exécutons nous-mêmes chaque commande et relisons chaque fichier avant commit.
2. Toute affirmation technique de l'IA est **vérifiée sur la machine** (`npm ls`, `git check-ignore`, logs Prisma, `curl`) plutôt que crue.
3. Chaque merge request est relue par l'autre membre du binôme : aucun code n'entre dans `main` sans qu'au moins l'un de nous deux sache l'expliquer.
4. Le code d'autorisation (vérification de propriété, rôles) est écrit ou réécrit par nous, jamais accepté tel quel.

## 1. Ce qui a été délégué / écrit nous-mêmes

| Phase | Délégué à l'IA | Fait par nous | Pourquoi ce partage |
|---|---|---|---|
| 0 · Mise en place | Synthèse du sujet et du cours, plan en 9 phases, `.gitignore` complet, squelettes README / AI.md | Création du dépôt sur la forge, installation, vérification des versions, restructuration du projet | Synthétiser 36 pages est rapide pour l'IA ; l'état réel de notre machine, seuls nous pouvons le constater |
| 1 · Infra et modèle | Premier jet de `docker-compose.yml`, `prisma.config.ts`, `prisma.ts`, `auth.ts`, modèles métier et seed | Choix du modèle (id `Int`, prix `Int`, enums, clé composée des favoris), résolution des erreurs d'environnement (port, `.env`, client non généré) | Le code d'infrastructure suit la doc ; les choix de modélisation, nous devons pouvoir les défendre |
| 2 · Lecture SSR | Premier jet des pages liste/détail, schémas Zod des paramètres d'URL | Mesures : `curl` des codes de statut, comptage des requêtes SQL à 12 puis 30 annonces | La conformité aux critères se prouve par la mesure, pas par la lecture du code || 3 · Authentification | | | |
| 4 · Autorisation | | | |
| 5 · Validation | | | |
| 6 · Interface | | | |
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

## 4. Bug introduit par génération (exigé par le sujet)

- **Lequel** : _À remplir._
- **Comment on l'a détecté** : _À remplir._
- **Comment on l'a corrigé** : _À remplir._

## 5. Bilan (à rédiger à la fin)

_Ce que l'IA a vraiment accéléré, là où elle nous a fait perdre du temps, et ce que nous ferions différemment._
