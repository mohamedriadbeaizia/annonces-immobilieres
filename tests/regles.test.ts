import { describe, expect, it } from "vitest";
import {
  type Acteur,
  estProprietaireOuAdmin,
  filtreModifiables,
  filtreVisibles,
  peutGererAnnonces,
  peutPoserQuestion,
} from "@/lib/authz";

const alice: Acteur = { id: "alice", role: "AGENT" };
const bruno: Acteur = { id: "bruno", role: "AGENT" };
const claire: Acteur = { id: "claire", role: "USER" };
const admin: Acteur = { id: "admin", role: "ADMIN" };

const annonceAlice = { auteurId: "alice" };

describe("règle : un agent ne modifie que ses propres annonces", () => {
  it("un agent peut modifier son annonce", () => {
    expect(estProprietaireOuAdmin(alice, annonceAlice)).toBe(true);
  });

  it("un agent ne peut PAS modifier l'annonce d'un autre agent", () => {
    expect(estProprietaireOuAdmin(bruno, annonceAlice)).toBe(false);
  });

  it("un admin peut modifier toutes les annonces", () => {
    expect(estProprietaireOuAdmin(admin, annonceAlice)).toBe(true);
  });

  it("la condition SQL d'un agent est restreinte à ses annonces", () => {
    expect(filtreModifiables(bruno)).toEqual({ auteurId: "bruno" });
  });

  it("la condition SQL d'un admin ne restreint rien", () => {
    expect(filtreModifiables(admin)).toEqual({});
  });
});

describe("règle : un USER ne crée ni ne modifie rien", () => {
  it("un USER ne peut pas gérer d'annonces", () => {
    expect(peutGererAnnonces(claire)).toBe(false);
  });

  it("un USER ne peut pas modifier une annonce, même si son id était l'auteur", () => {
    // Cas limite : un compte rétrogradé d'AGENT à USER perd ses droits sur ses anciennes annonces.
    expect(estProprietaireOuAdmin(claire, { auteurId: "claire" })).toBe(false);
  });

  it("la condition SQL d'un USER ne correspond à aucune annonce", () => {
    expect(filtreModifiables(claire)).toEqual({ id: -1 });
  });

  it("un agent et un admin peuvent gérer des annonces", () => {
    expect(peutGererAnnonces(alice)).toBe(true);
    expect(peutGererAnnonces(admin)).toBe(true);
  });
});

describe("règle : visibilité des brouillons", () => {
  it("un visiteur ne voit que les annonces publiées", () => {
    expect(filtreVisibles(null)).toEqual({ statutPublication: "PUBLIEE" });
  });

  it("un agent voit les publiées ET ses propres brouillons", () => {
    expect(filtreVisibles(alice)).toEqual({
      OR: [{ statutPublication: "PUBLIEE" }, { auteurId: "alice" }],
    });
  });

  it("un admin voit tout", () => {
    expect(filtreVisibles(admin)).toEqual({});
  });
});

describe("règle : questions", () => {
  it("un visiteur ne peut pas poser de question", () => {
    expect(peutPoserQuestion(null, { statutPublication: "PUBLIEE" })).toBe(false);
  });

  it("un utilisateur connecté peut questionner une annonce publiée", () => {
    expect(peutPoserQuestion(claire, { statutPublication: "PUBLIEE" })).toBe(true);
  });

  it("personne ne peut questionner un brouillon", () => {
    expect(peutPoserQuestion(claire, { statutPublication: "BROUILLON" })).toBe(false);
  });
});