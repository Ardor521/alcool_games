export function isBrowsePath(path: string) {
  return (
    path === '/' ||
    path === '/salon' ||
    path === '/jeux' ||
    path === '/joueurs' ||
    path === '/stats' ||
    path === '/aleatoire'
  )
}

export function gameIdFromPath(path: string) {
  const m = path.match(/^\/jeu\/([^/]+)/)
  return m?.[1] ?? null
}