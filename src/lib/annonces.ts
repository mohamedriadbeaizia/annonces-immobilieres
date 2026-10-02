import { prisma } from "./prisma";

export const PAR_PAGE = 9;

type FiltresAnnonces = { page: number; type?: "VENTE" | "LOCATION" };

export async function listerAnnoncesPubliees({ page, type }: FiltresAnnonces) {
  const where = {
    statutPublication: "PUBLIEE" as const,
    ...(type ? { typeBien: type } : {}),
  };

  // Promise.all et pas $transaction : même résultat ici, sans les requêtes
  // BEGIN/COMMIT qui gonfleraient le compte dans les logs.
  const [total, annonces] = await Promise.all([
    prisma.annonce.count({ where }),
    prisma.annonce.findMany({
      where,
      orderBy: { createdAt: "desc" }, // servi par @@index([statutPublication, createdAt])
      skip: (page - 1) * PAR_PAGE,
      take: PAR_PAGE,
      select: {
        id: true,
        titre: true,
        prix: true,
        typeBien: true,
        statutBien: true,
        dateDisponibilite: true,
        // Chaque relation incluse = UNE requête groupée (WHERE ... IN (...)),
        // quel que soit le nombre d'annonces. Pas de N+1.
        auteur: { select: { name: true } },
        photos: { select: { url: true }, orderBy: { ordre: "asc" } },
      },
    }),
  ]);

  return { annonces, total, pages: Math.max(1, Math.ceil(total / PAR_PAGE)) };
}

export async function getAnnoncePublique(id: number) {
  // findFirst (et pas findUnique) : on filtre aussi sur le statut.
  // Un brouillon est donc introuvable publiquement → 404.
  return prisma.annonce.findFirst({
    where: { id, statutPublication: "PUBLIEE" },
    include: {
      auteur: { select: { name: true } },
      photos: { orderBy: { ordre: "asc" } },
    },
  });
}

export async function listerQuestions(annonceId: number) {
  return prisma.question.findMany({
    where: { annonceId },
    orderBy: { createdAt: "asc" }, // servi par @@index([annonceId, createdAt])
    include: { auteur: { select: { name: true } } },
  });
}