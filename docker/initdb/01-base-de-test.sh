#!/bin/sh
# Exécuté par l'image postgres au PREMIER démarrage uniquement (volume vide).
# Crée la base de test à côté de la base de dev : "<POSTGRES_DB>_test".
# Aucun identifiant ici : tout vient des variables du conteneur, donc du .env.
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" \
  -c "CREATE DATABASE \"${POSTGRES_DB}_test\";"