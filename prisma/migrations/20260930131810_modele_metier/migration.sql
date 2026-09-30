-- CreateEnum
CREATE TYPE "TypeBien" AS ENUM ('VENTE', 'LOCATION');

-- CreateEnum
CREATE TYPE "StatutPublication" AS ENUM ('BROUILLON', 'PUBLIEE');

-- CreateEnum
CREATE TYPE "StatutBien" AS ENUM ('DISPONIBLE', 'LOUE', 'VENDU');

-- CreateTable
CREATE TABLE "Annonce" (
    "id" SERIAL NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "typeBien" "TypeBien" NOT NULL,
    "statutPublication" "StatutPublication" NOT NULL DEFAULT 'BROUILLON',
    "statutBien" "StatutBien" NOT NULL DEFAULT 'DISPONIBLE',
    "prix" INTEGER NOT NULL,
    "dateDisponibilite" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "auteurId" TEXT NOT NULL,

    CONSTRAINT "Annonce_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Photo" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "annonceId" INTEGER NOT NULL,

    CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" SERIAL NOT NULL,
    "contenu" TEXT NOT NULL,
    "reponse" TEXT,
    "reponduLe" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "annonceId" INTEGER NOT NULL,
    "auteurId" TEXT NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Favori" (
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "annonceId" INTEGER NOT NULL,

    CONSTRAINT "Favori_pkey" PRIMARY KEY ("userId","annonceId")
);

-- CreateIndex
CREATE INDEX "Annonce_statutPublication_createdAt_idx" ON "Annonce"("statutPublication", "createdAt");

-- CreateIndex
CREATE INDEX "Annonce_auteurId_idx" ON "Annonce"("auteurId");

-- CreateIndex
CREATE INDEX "Photo_annonceId_idx" ON "Photo"("annonceId");

-- CreateIndex
CREATE INDEX "Question_annonceId_createdAt_idx" ON "Question"("annonceId", "createdAt");

-- CreateIndex
CREATE INDEX "Favori_annonceId_idx" ON "Favori"("annonceId");

-- AddForeignKey
ALTER TABLE "Annonce" ADD CONSTRAINT "Annonce_auteurId_fkey" FOREIGN KEY ("auteurId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_annonceId_fkey" FOREIGN KEY ("annonceId") REFERENCES "Annonce"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_annonceId_fkey" FOREIGN KEY ("annonceId") REFERENCES "Annonce"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_auteurId_fkey" FOREIGN KEY ("auteurId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favori" ADD CONSTRAINT "Favori_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favori" ADD CONSTRAINT "Favori_annonceId_fkey" FOREIGN KEY ("annonceId") REFERENCES "Annonce"("id") ON DELETE CASCADE ON UPDATE CASCADE;
