#!/usr/bin/env bash
#
# Cliquet sur la dette de lint.
#
# Le lint n'ayant jamais tourne avant la mise en place de la CI, la base
# comptait 165 erreurs. Les rendre bloquantes d'un coup imposerait de toutes
# les corriger, et les ignorer laisserait les nouvelles passer inapercues.
#
# Ce script compare le nombre d'erreurs au plafond enregistre dans
# .lint-baseline : il echoue si le total augmente. La dette ne peut donc que
# diminuer, et chaque resorption abaisse le plafond.
#
# Un controle restreint aux fichiers modifies a ete ecarte : toucher un
# fichier ancien ferait heriter de sa dette, et bloquerait des corrections
# sans rapport.

set -euo pipefail

cd "$(dirname "$0")/.."

BASELINE_FILE=".lint-baseline"

if [ ! -f "$BASELINE_FILE" ]; then
  echo "Fichier $BASELINE_FILE absent." >&2
  exit 1
fi

baseline=$(tr -dc '0-9' < "$BASELINE_FILE")

# --max-diagnostics eleve : sans cela Biome tronque et le total serait fausse.
output=$(pnpm exec biome lint --max-diagnostics=10000 . 2>&1 || true)
count=$(printf '%s' "$output" | grep -oE 'Found [0-9]+ error' | grep -oE '[0-9]+' | head -1 || true)

if [ -z "$count" ]; then
  # Aucune ligne de total : Biome n'a signale aucune erreur.
  count=0
fi

echo "Erreurs de lint : $count (plafond : $baseline)"

if [ "$count" -gt "$baseline" ]; then
  echo >&2
  echo "Le nombre d'erreurs de lint augmente ($baseline -> $count)." >&2
  echo "Corrigez les nouvelles erreurs, ou justifiez-les par une directive" >&2
  echo "biome-ignore motivee. Le plafond ne doit jamais etre releve." >&2
  exit 1
fi

if [ "$count" -lt "$baseline" ]; then
  echo
  echo "Dette en baisse. Abaissez le plafond :"
  echo "  echo $count > $BASELINE_FILE"
fi
