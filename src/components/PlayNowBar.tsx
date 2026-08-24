import { Link, useLocation } from 'react-router-dom'
import { Play } from 'lucide-react'
import { useRoom } from '../context/RoomContext'
import { GAMES } from '../lib/catalog'
import { gameIdFromPath, isBrowsePath } from '../lib/tableNav'

export function PlayNowBar({ block = false }: { block?: boolean }) {
  const { connected, path } = useRoom()
  const { pathname } = useLocation()
  if (!connected || !path || path === pathname) return null
  if (!block && !isBrowsePath(pathname)) return null
  const game = GAMES.find((g) => g.id === gameIdFromPath(path))
  const label = game ? `Partie en cours — ${game.title}` : path.startsWith('/jeu/') ? 'Partie en cours' : 'Retour à la table'
  if (block) {
    return (
      <Link to={path} className="btn-primary w-full justify-center py-3">
        <Play className="h-4 w-4 fill-current" />
        {label}
      </Link>
    )
  }
  return (
    <Link
      to={path}
      className="inline-flex max-w-[42vw] items-center gap-1 truncate rounded-full border border-fuchsia-400/40 bg-fuchsia-500/20 px-2 py-1 text-[10px] font-semibold text-fuchsia-100 sm:max-w-none sm:gap-1.5 sm:px-2.5 sm:text-[11px]"
    >
      <Play className="h-3 w-3 shrink-0 fill-current" />
      <span className="truncate">{label}</span>
    </Link>
  )
}