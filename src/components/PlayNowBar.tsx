import { Link, useLocation } from 'react-router-dom'
import { Play } from 'lucide-react'
import { useRoom } from '../context/RoomContext'
import { GAMES } from '../lib/catalog'
import { gameIdFromPath, isBrowsePath } from '../lib/tableNav'

export function PlayNowBar() {
  const { connected, path } = useRoom()
  const { pathname } = useLocation()
  if (!connected || !path || path === pathname) return null
  if (!isBrowsePath(pathname)) return null
  const game = GAMES.find((g) => g.id === gameIdFromPath(path))
  const label = game ? `Partie en cours — ${game.title}` : path.startsWith('/jeu/') ? 'Partie en cours' : 'Retour à la table'
  return (
    <Link
      to={path}
      className="inline-flex items-center gap-1.5 rounded-full border border-fuchsia-400/40 bg-fuchsia-500/20 px-2.5 py-1 text-[11px] font-semibold text-fuchsia-100 shadow-[0_0_16px_rgba(244,63,157,0.25)]"
    >
      <Play className="h-3 w-3 fill-current" />
      {label}
    </Link>
  )
}