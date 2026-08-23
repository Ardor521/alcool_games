import { useMemo, useState } from 'react'
import { useParty } from '../context/PartyContext'
import { RATHER_PAIRS } from '../lib/catalog'
import { shuffle } from '../lib/utils'
import { SipButtons } from '../components/SipToast'

export function RatherGame() {
  const { players, addSips } = useParty()
  const deck = useMemo(() => shuffle(RATHER_PAIRS), [])
  const [i, setI] = useState(0)
  const [votes, setVotes] = useState<Record<string, number>>({})
  const [revealed, setRevealed] = useState(false)
  const [a, b] = deck[i % deck.length]
  const sideA = players.filter((p) => votes[p.id] === 0)
  const sideB = players.filter((p) => votes[p.id] === 1)
  const minority =
    sideA.length === sideB.length ? [...sideA, ...sideB] : sideA.length < sideB.length ? sideA : sideB

  const next = () => {
    setI((x) => x + 1)
    setVotes({})
    setRevealed(false)
  }

  return (
    <div className="space-y-4">
      <p className="text-center text-xs uppercase tracking-widest text-orange-200">Tu préfères…</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <button type="button" disabled={revealed} onClick={() => {}} className="card min-h-[110px] p-4 text-left">
          <p className="text-xs text-rose-200">Option A</p>
          <p className="mt-1 font-display text-xl normal-case tracking-normal">{a}</p>
        </button>
        <button type="button" disabled={revealed} className="card min-h-[110px] p-4 text-left">
          <p className="text-xs text-cyan-200">Option B</p>
          <p className="mt-1 font-display text-xl normal-case tracking-normal">{b}</p>
        </button>
      </div>
      <div className="space-y-2">
        {players.map((p) => (
          <div key={p.id} className="card flex items-center gap-2 px-3 py-2">
            <span className="flex-1 truncate text-sm">{p.name}</span>
            <button
              type="button"
              disabled={revealed}
              onClick={() => setVotes((v) => ({ ...v, [p.id]: 0 }))}
              className={`rounded-full px-3 py-1 text-xs ${votes[p.id] === 0 ? 'bg-rose-500 text-white' : 'bg-white/10'}`}
            >
              A
            </button>
            <button
              type="button"
              disabled={revealed}
              onClick={() => setVotes((v) => ({ ...v, [p.id]: 1 }))}
              className={`rounded-full px-3 py-1 text-xs ${votes[p.id] === 1 ? 'bg-cyan-500 text-black' : 'bg-white/10'}`}
            >
              B
            </button>
          </div>
        ))}
      </div>
      {revealed ? (
        <div className="card space-y-3 p-4">
          <p className="text-sm text-white/70">
            A : {sideA.length} · B : {sideB.length}. La minorité boit 2 gorgées
            {sideA.length === sideB.length ? ' (égalité : tout le monde !)' : ''}.
          </p>
          {minority.map((p) => (
            <div key={p.id} className="flex items-center gap-2">
              <span className="text-sm">{p.name}</span>
              <SipButtons onSip={(n) => addSips(p.id, n)} />
            </div>
          ))}
          <button
            type="button"
            onClick={() => {
              minority.forEach((p) => addSips(p.id, 2))
              next()
            }}
            className="btn-primary w-full justify-center"
          >
            +2 à la minorité & suivant
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={Object.keys(votes).length < players.length}
          onClick={() => setRevealed(true)}
          className="btn-primary w-full justify-center py-3 disabled:opacity-40"
        >
          Révéler
        </button>
      )}
    </div>
  )
}