/**
 * Quand une écriture sur l'arbre démo est redirigée côté API vers la copie
 * personnelle de l'utilisateur, la réponse porte `demoForkTreeId`. On le
 * capture ici (hors du cycle React) pour que la page arbre puisse basculer
 * l'URL vers cette copie juste après l'action qui l'a déclenchée.
 */
let pendingForkTreeId: string | null = null

export function setPendingDemoFork(treeId: string) {
  pendingForkTreeId = treeId
}

export function consumePendingDemoFork(): string | null {
  const id = pendingForkTreeId
  pendingForkTreeId = null
  return id
}
