import { describe, expect, it } from "vitest";
import { AnnonceInput, IdAnnonce, QuestionInput } from "@/lib/schemas";

// Une annonce valide, telle qu'elle arrive d'un formulaire (tout en texte).
const valide = {
  titre: "Maison de ville — Le Havre",
  description: "Belle maison lumineuse, proche des commerces et de la plage.",
  typeBien: "VENTE",
  statutBien: "DISPONIBLE",
  prix: "250000",
  dateDisponibilite: "2026-11-01",
};

// Renvoie les messages d'erreur d'un champ, ou [] si la validation passe.
function erreursDe(donnees: unknown, champ: string) {
  const r = AnnonceInput.safeParse(donnees);
  return r.success ? [] : r.error.issues.filter((i) => i.path[0] === champ).map((i) => i.message);
}

describe("validation d'une annonce", () => {
  it("accepte une annonce valide et convertit le texte en nombre et en date", () => {
    const r = AnnonceInput.safeParse(valide);
    expect(r.success).toBe(true);
    expect(r.data?.prix).toBe(250000);
    expect(r.data?.dateDisponibilite).toBeInstanceOf(Date);
  });

  it("rejette un prix négatif", () => {
    expect(erreursDe({ ...valide, prix: "-5" }, "prix")).toContain("Le prix doit être positif");
  });

  it("rejette un prix nul", () => {
    expect(erreursDe({ ...valide, prix: "0" }, "prix")).toContain("Le prix doit être positif");
  });

  it("rejette un prix à virgule", () => {
    expect(erreursDe({ ...valide, prix: "12.5" }, "prix")).toContain("Prix en euros entiers");
  });

  it("rejette un titre trop court", () => {
    expect(erreursDe({ ...valide, titre: "ab" }, "titre")).toContain("5 caractères minimum");
  });

  it("ne compte pas les espaces autour du titre", () => {
    expect(erreursDe({ ...valide, titre: "   ab   " }, "titre")).toContain("5 caractères minimum");
  });

  it("rejette un type de bien inconnu", () => {
    expect(erreursDe({ ...valide, typeBien: "CHATEAU" }, "typeBien")).toContain("Type de bien invalide");
  });
});

describe("validation de l'identifiant d'URL", () => {
  it.each(["abc", "1.5", "-1", "0", "99999999999"])("rejette « %s » (→ 404)", (valeur) => {
    expect(IdAnnonce.safeParse(valeur).success).toBe(false);
  });

  it("accepte un entier positif et le convertit", () => {
    expect(IdAnnonce.parse("42")).toBe(42);
  });
});

describe("validation d'une question", () => {
  it("rejette une question trop courte", () => {
    expect(QuestionInput.safeParse({ contenu: "abc" }).success).toBe(false);
  });
});