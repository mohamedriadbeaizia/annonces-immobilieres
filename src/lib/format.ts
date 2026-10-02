const euros = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export function formatPrix(prix: number, typeBien: "VENTE" | "LOCATION") {
  return typeBien === "LOCATION" ? `${euros.format(prix)} / mois` : euros.format(prix);
}

export function formatDate(date: Date) {
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export const LIBELLE_TYPE = { VENTE: "Vente", LOCATION: "Location" } as const;

export const LIBELLE_STATUT_BIEN = {
  DISPONIBLE: "Disponible",
  LOUE: "Loué",
  VENDU: "Vendu",
} as const;