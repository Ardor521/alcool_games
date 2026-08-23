import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Users } from 'lucide-react'
import type { GameDef } from '../types'
import { useParty } from '../context/PartyContext'
import { PlayerAvatar } from './PlayerAvatar'
import { WaterGlass } from './WaterGlass'

export function GameShell({
  game,
  children,
  footer,
}: {
  game: GameDef
  children: ReactNode
  footer?: ReactNode
}) {
  const navigate = useNavigate()
  const { activePlayers, pausedPlayers, activeTurnId, selfId } = useParty()

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => navigate('/jeux')}
          className="mt-1 rounded-xl border border-white/10 bg-white/5 p-2 hover:bg-white/10"
          aria-label="Retour aux jeux"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] uppercase tracking-[0.2em] text-white/45">En cours</p>
          <h1 className="font-display text-2xl leading-tight sm:text-3xl">{game.title}</h1>
          <p className="text-sm text-white/60">{game.tagline}</p>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-white/10">
        <img src={game.image} alt="" className="h-28 w-full object-cover sm:h-36" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#07020f] via-[#07020f]/40 to-transparent" />
        <WaterGlass id={`shell-${game.id}`} size="sm" className="absolute right-2 top-2" />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {activePlayers.map((p) => (
          <div
            key={p.id}
            className={`flex shrink-0 items-center gap-2 rounded-full border px-2 py-1 ${
              activeTurnId === p.id
                ? 'border-white bg-white text-black shadow-[0_0_16px_rgba(255,255,255,0.25)]'
                : 'border-white/10 bg-white/5'
            }`}
          >
            <PlayerAvatar player={p} size="sm" />
            <span className="text-xs font-medium">{p.name}</span>
            {p.id === selfId && (
              <span className="rounded-full bg-fuchsia-500 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                toi
              </span>
            )}
            {activeTurnId === p.id && (
              <span className="rounded-full bg-black px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                tour
              </span>
            )}
            <span className={`text-[10px] ${activeTurnId === p.id ? 'text-amber-700' : 'text-amber-200/80'}`}>
              {p.sips}
            </span>
          </div>
        ))}
        {pausedPlayers.length > 0 && (
          <span className="flex shrink-0 items-center rounded-full border border-white/10 px-2 py-1 text-[10px] text-white/40">
            {pausedPlayers.length} en pause
          </span>
        )}
        <Link
          to="/joueurs"
          className="flex shrink-0 items-center gap-1 rounded-full border border-dashed border-white/20 px-3 py-1 text-xs text-white/50 hover:text-white"
        >
          <Users className="h-3.5 w-3.5" />
          Gérer
        </Link>
      </div>

      {children}
      {footer}
    </div>
  )
}