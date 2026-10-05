// Règles d'autorisation PURES : aucune dépendance (ni Prisma, ni Better Auth, ni Next).
// Elles sont donc testables avec Vitest sans base de données ni serveur.

export type Role = "USER" | "AGENT" | "ADMIN";
export type Acteur = { id: string; role: Role };

/** Créer et gérer des annonces : AGENT et ADMIN. */
export function peutGererAnnonces(acteur: Acteur): boolean {
  return acteur.role === "AGENT" || acteur.role === "ADMIN";
}

/** Un ADMIN peut tout ; un AGENT seulement ses propres annonces ; un USER rien. */
export function estProprietaireOuAdmin(acteur: Acteur, annonce: { auteurId: string }): boolean {
  return acteur.role === "ADMIN" || (acteur.role === "AGENT" && annonce.auteurId === acteur.id);
}

/**
 * Condition à ajouter au WHERE de chaque modification / suppression :
 * "seulement les annonces que cet acteur a le droit de toucher".
 */
export function filtreModifiables(acteur: Acteur) {
  if (acteur.role === "ADMIN") return {};
  if (acteur.role === "AGENT") return { auteurId: acteur.id };
  // USER : aucune annonce. Placé après l'id dans { id, ...filtre }, il l'écrase par -1.
  return { id: -1 };
}

/** Condition "annonces visibles" : les brouillons sont réservés à leur auteur et aux admins. */
export function filtreVisibles(acteur: Acteur | null) {
  if (!acteur) return { statutPublication: "PUBLIEE" as const };
  if (acteur.role === "ADMIN") return {};
  return { OR: [{ statutPublication: "PUBLIEE" as const }, { auteurId: acteur.id }] };
}