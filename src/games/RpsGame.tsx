import { useState } from 'react'
import { useParty } from '../context/PartyContext'
import { TurnBanner } from '../components/TurnBanner'
import { SipButtons } from '../components/SipToast'

const MOVES = [
  { id: 'rock', label: 'Pierre', icon: '✊' },
  { id: 'paper', label: 'Feuille', icon: '✋' },
  { id: 'scissors', label: 'Ciseaux', icon: '✌️' },
] as const

type Move = (typeof MOVES)[number]['id']

function winner(a: Move, b: Move) {
  if (a === b) return 0
  if ((a === 'rock' && b === 'scissors') || (a === 'paper' && b === 'rock') || (a === 'scissors' && b === 'paper')) return 1
  return 2
}

export function RpsGame() {
  const { players, addSips } = useParty()
  const [turn, setTurn] = useState(0)
  const a = players[turn % Math.max(players.length, 1)]
  const b = players[(turn + 1) % Math.max(players.length, 1)]
  const [pickA, setPickA] = useState<Move | null>(null)
  const [pickB, setPickB] = useState<Move | null>(null)
  const [msg, setMsg] = useState('Chacun choisit en secret.')

  return (
    <div className="space-y-4">
      <TurnBanner playerId={a?.id} label="Duel" hint={b ? `contre ${b.name}` : undefined} />
      <p className="text-center text-sm">
        {a?.name} vs {b?.name}
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-3">
          <p className="mb-2 text-sm font-medium">{a?.name}</p>
          <div className="flex flex-wrap gap-2">
            {MOVES.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setPickA(m.id)}
                className={`rounded-xl px-2 py-2 text-xl ${pickA === m.id ? 'bg-white text-black' : 'bg-white/10'}`}
              >
                {m.icon}
              </button>
            ))}
          </div>
        </div>
        <div className="card p-3">
          <p className="mb-2 text-sm font-medium">{b?.name}</p>
          <div className="flex flex-wrap gap-2">
            {MOVES.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setPickB(m.id)}
                className={`rounded-xl px-2 py-2 text-xl ${pickB === m.id ? 'bg-white text-black' : 'bg-white/10'}`}
              >
                {m.icon}
              </button>
            ))}
          </div>
        </div>
      </div>
      <p className="text-center text-sm text-white/70">{msg}</p>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={!pickA || !pickB}
          onClick={() => {
            if (!pickA || !pickB || !a || !b) return
            const w = winner(pickA, pickB)
            if (w === 0) setMsg('Égalité ! Relancez.')
            else if (w === 1) {
              setMsg(`${b.name} perd et boit 2.`)
              addSips(b.id, 2)
            } else {
              setMsg(`${a.name} perd et boit 2.`)
              addSips(a.id, 2)
            }
          }}
          className="btn-primary justify-center disabled:opacity-40"
        >
          Révéler
        </button>
        <button
          type="button"
          onClick={() => {
            setPickA(null)
            setPickB(null)
            setTurn((t) => t + 1)
            setMsg('Nouveau duel.')
          }}
          className="btn-ghost justify-center"
        >
          Duel suivant
        </button>
      </div>
      {a && (
        <div className="card p-3">
          <SipButtons onSip={(n) => addSips(a.id, n)} />
        </div>
      )}
    </div>
  )
}