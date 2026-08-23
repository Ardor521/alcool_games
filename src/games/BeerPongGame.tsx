import { useState } from 'react'
import { useParty } from '../context/PartyContext'
import { SipButtons } from '../components/SipToast'

function TeamCard({
  name,
  members,
  cups,
  active,
}: {
  name: string
  members: string[]
  cups: number
  active: boolean
}) {
  return (
    <div className={`card p-3 ${active ? 'ring-2 ring-fuchsia-400/60' : ''}`}>
      <p className="font-semibold">{name}</p>
      <p className="text-xs text-white/50">{members.join(', ') || '—'}</p>
      <div className="mt-3 grid grid-cols-3 gap-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={`h-8 rounded-full ${i < cups ? 'bg-amber-400/80' : 'bg-white/10'}`} />
        ))}
      </div>
      <p className="mt-2 text-center text-sm">{cups} gobelets</p>
    </div>
  )
}

export function BeerPongGame() {
  const { players, addSips } = useParty()
  const mid = Math.ceil(players.length / 2)
  const teamA = players.slice(0, mid)
  const teamB = players.slice(mid)
  const [cupsA, setCupsA] = useState(6)
  const [cupsB, setCupsB] = useState(6)
  const [turn, setTurn] = useState<'A' | 'B'>('A')

  const basket = (who: 'A' | 'B') => {
    if (who === 'A') {
      setCupsB((c) => Math.max(0, c - 1))
      teamB.forEach((p) => addSips(p.id, 1))
    } else {
      setCupsA((c) => Math.max(0, c - 1))
      teamA.forEach((p) => addSips(p.id, 1))
    }
    setTurn(who === 'A' ? 'B' : 'A')
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-white/65">
        6 gobelets virtuels par équipe. Un panier = l’autre équipe boit 1. Zéro gobelet = défaite (cul sec collectif).
      </p>
      <div className="grid grid-cols-2 gap-3">
        <TeamCard name="Équipe A" members={teamA.map((p) => p.name)} cups={cupsA} active={turn === 'A'} />
        <TeamCard name="Équipe B" members={teamB.map((p) => p.name)} cups={cupsB} active={turn === 'B'} />
      </div>
      <p className="text-center text-sm">Tour : équipe {turn}</p>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={() => basket(turn)} className="btn-primary justify-center py-3">
          Panier !
        </button>
        <button type="button" onClick={() => setTurn((t) => (t === 'A' ? 'B' : 'A'))} className="btn-ghost justify-center py-3">
          Raté
        </button>
      </div>
      {(cupsA === 0 || cupsB === 0) && (
        <div className="card p-4 text-center">
          <p className="font-display text-2xl">{cupsA === 0 ? 'Équipe B gagne' : 'Équipe A gagne'}</p>
          <button
            type="button"
            className="btn-primary mt-3 w-full justify-center"
            onClick={() => {
              ;(cupsA === 0 ? teamA : teamB).forEach((p) => addSips(p.id, 4))
              setCupsA(6)
              setCupsB(6)
            }}
          >
            Cul sec des perdants & reset
          </button>
        </div>
      )}
      {players[0] && (
        <div className="card p-3">
          <SipButtons onSip={(n) => addSips(players[0].id, n)} />
        </div>
      )}
    </div>
  )
}