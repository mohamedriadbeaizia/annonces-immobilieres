import { z } from "zod";

// Identifiant d'annonce venant de l'URL : toujours une chaîne au départ.
// "abc", "1.5", "-3" → échec → 404. Le max évite un dépassement d'INT PostgreSQL
// (/annonces/99999999999 ferait sinon une erreur 500 côté base).
export const IdAnnonce = z.coerce.number().int().positive().max(2_147_483_647);

// Paramètres de la liste. .catch() : une valeur invalide retombe sur le défaut
// au lieu de faire planter la page (?page=abc → page 1).
export const FiltresListe = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  type: z.enum(["VENTE", "LOCATION"]).optional().catch(undefined),
});