import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { getAnnonceModifiable, getAnnonceVisible, listerAnnoncesPubliees } from "@/lib/annonces";
import { prisma } from "@/lib/prisma";
import { creerAnnonce, creerUtilisateur, viderBase } from "./aide";

beforeEach(viderBase);
afterAll(() => prisma.$disconnect());

describe("requête : liste publique", () => {
  it("un brouillon n'apparaît pas dans la liste publique", async () => {
    const agent = await creerUtilisateur("AGENT");
    await creerAnnonce(agent.id, "PUBLIEE", "Annonce publiée");
    await creerAnnonce(agent.id, "BROUILLON", "Annonce en brouillon");

    const { annonces, total } = await listerAnnoncesPubliees({ page: 1 });

    expect(annonces.map((a) => a.titre)).toEqual(["Annonce publiée"]);
    // Le total sert à la pagination : il ne doit pas compter les brouillons non plus.
    expect(total).toBe(1);
  });
});

describe("requête : détail d'un brouillon", () => {
  it("est introuvable pour un visiteur (→ 404)", async () => {
    const agent = await creerUtilisateur("AGENT");
    const brouillon = await creerAnnonce(agent.id, "BROUILLON");

    expect(await getAnnonceVisible(brouillon.id, null)).toBeNull();
  });

  it("est introuvable pour un autre agent (→ 404)", async () => {
    const alice = await creerUtilisateur("AGENT");
    const bruno = await creerUtilisateur("AGENT");
    const brouillon = await creerAnnonce(alice.id, "BROUILLON");

    expect(await getAnnonceVisible(brouillon.id, { id: bruno.id, role: "AGENT" })).toBeNull();
  });

  it("est visible par son auteur", async () => {
    const alice = await creerUtilisateur("AGENT");
    const brouillon = await creerAnnonce(alice.id, "BROUILLON");

    expect(await getAnnonceVisible(brouillon.id, { id: alice.id, role: "AGENT" })).not.toBeNull();
  });

  it("est visible par un admin", async () => {
    const alice = await creerUtilisateur("AGENT");
    const admin = await creerUtilisateur("ADMIN");
    const brouillon = await creerAnnonce(alice.id, "BROUILLON");

    expect(await getAnnonceVisible(brouillon.id, { id: admin.id, role: "ADMIN" })).not.toBeNull();
  });
});

describe("requête : édition", () => {
  it("l'annonce d'un autre agent est introuvable en édition (→ 404, pas 403)", async () => {
    const alice = await creerUtilisateur("AGENT");
    const bruno = await creerUtilisateur("AGENT");
    const annonceAlice = await creerAnnonce(alice.id);

    expect(await getAnnonceModifiable(annonceAlice.id, { id: bruno.id, role: "AGENT" })).toBeNull();
    expect(await getAnnonceModifiable(annonceAlice.id, { id: alice.id, role: "AGENT" })).not.toBeNull();
  });
});