import { useEffect } from 'react'
import { useParty } from '../context/PartyContext'
import { PlayerAvatar } from './PlayerAvatar'

export function TurnBanner({
  playerId,
  label = 'Tour de',
  hint,
}: {
  playerId?: string
  label?: string
  hint?: string
}) {
  const { players, setActiveTurnId } = useParty()
  const player = players.find((p) => p.id === playerId) ?? players[0]

  useEffect(() => {
    setActiveTurnId(player?.id ?? null)
    return () => setActiveTurnId(null)
  }, [player?.id, setActiveTurnId])

  if (!player) return null

  return (
    <div
      className="flex items-center gap-3 rounded-2xl border px-3 py-2.5"
      style={{
        borderColor: `${player.color}66`,
        background: `linear-gradient(90deg, ${player.color}22, transparent)`,
      }}
    >
      <PlayerAvatar player={player} />
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-widest text-white/50">{label}</p>
        <p className="truncate font-display text-xl leading-none" style={{ color: player.color }}>
          {player.name}
        </p>
        {hint && <p className="mt-0.5 text-xs text-white/55">{hint}</p>}
      </div>
    </div>
  )
}