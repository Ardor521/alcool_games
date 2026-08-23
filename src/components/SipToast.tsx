import { Beer } from 'lucide-react'
import type { Player } from '../types'
import { PlayerAvatar } from './PlayerAvatar'

export function SipWho({
  amount,
  reason,
  players,
  onConfirm,
}: {
  amount: number
  reason: string
  players: Player[]
  onConfirm: (id: string) => void
}) {
  if (amount <= 0 || players.length === 0) return null
  return (
    <div className="space-y-2 rounded-2xl border border-amber-300/25 bg-amber-400/10 p-3">
      <p className="text-xs font-semibold uppercase tracking-widest text-amber-200">Qui boit ?</p>
      <p className="text-sm text-white/85">
        <span className="font-semibold text-amber-100">
          {amount} gorgée{amount > 1 ? 's' : ''}
        </span>
        {' — '}
        {reason}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {players.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onConfirm(p.id)}
            className="inline-flex items-center gap-1.5 rounded-full bg-black/30 px-2.5 py-1.5 text-xs font-medium hover:bg-black/50"
          >
            <PlayerAvatar player={p} size="sm" />
            {p.name}
          </button>
        ))}
      </div>
      <p className="text-[11px] text-white/40">Un tap = la règle s’applique à cette personne.</p>
    </div>
  )
}

export function SipBadge({ sips }: { sips: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-[11px] text-white/70">
      <Beer className="h-3 w-3 text-amber-300" />
      {sips}
    </span>
  )
}

export function SipButtons({ onSip }: { onSip: (n: number) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {[1, 2, 3, 4].map((n) => (
        <button key={n} type="button" onClick={() => onSip(n)} className="btn-ghost !px-2.5 !py-1 text-xs">
          +{n}
        </button>
      ))}
    </div>
  )
}