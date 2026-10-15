/**
 * Point d'entree appele une fois au demarrage de chaque instance serveur.
 *
 * `register` doit se terminer avant que le serveur accepte des requetes :
 * on se contente donc d'armer un minuteur, sans attendre la moindre passe.
 */
export async function register() {
  // Egalement evalue par le runtime edge, ou ni la base ni les minuteurs
  // longs n'ont de sens.
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  // Desactive par defaut : l'ordonnanceur consomme du quota Sentinel Hub,
  // il s'active explicitement par variable d'environnement.
  if (process.env.NDVI_ALERT_SCHEDULE !== 'on') return;

  // Import dynamique : evite de charger la base et les services dans les
  // runtimes ou ce module est evalue sans etre utilise.
  const { startNdviAlertScheduler } = await import(
    './server/services/ndvi-alert.scheduler'
  );
  startNdviAlertScheduler();
}
