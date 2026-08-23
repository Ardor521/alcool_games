import { useMemo, useState } from 'react'
import { useParty } from '../context/PartyContext'
import { BAC_CATS, BAC_LETTERS } from '../lib/catalog'
import { SipButtons } from '../components/SipToast'

export function BacGame() {
  const { players, addSips } = useParty()
  const start = useMemo(() => BAC_LETTERS[Math.floor(Math.random() * BAC_LETTERS.length)], [])
  const [offset, setOffset] = useState(0)
  const letter = useMemo(
    () => BAC_LETTERS[(BAC_LETTERS.indexOf(start) + offset) % BAC_LETTERS.length],
    [start, offset],
  )
  const [miss, setMiss] = useState<Record<string, number>>({})

  return (
    <div className="space-y-4">
      <div className="card p-5 text-center">
        <p className="text-xs uppercase tracking-widest text-indigo-200">Lettre</p>
        <p className="font-display text-6xl text-white">{letter}</p>
        <p className="mt-2 text-sm text-white/60">
          Un mot par catégorie commençant par cette lettre. 45 secondes chrono (à la table).
        </p>
      </div>
      <ul className="grid grid-cols-2 gap-2 text-sm">
        {BAC_CATS.map((c) => (
          <li key={c} className="card px-3 py-2">
            {c}
          </li>
        ))}
      </ul>
      <div className="card space-y-2 p-4">
        <p className="text-sm text-white/70">Cases vides / doublons : +1 gorgée par case.</p>
        {players.map((p) => (
          <div key={p.id} className="flex items-center gap-2">
            <span className="w-20 truncate text-sm">{p.name}</span>
            <input
              type="number"
              min={0}
              max={6}
              value={miss[p.id] ?? 0}
              onChange={(e) => setMiss((m) => ({ ...m, [p.id]: Number(e.target.value) }))}
              className="w-16 rounded-lg bg-white/10 px-2 py-1 text-sm outline-none"
            />
            <button type="button" className="btn-ghost !px-3 !py-1 text-xs" onClick={() => addSips(p.id, miss[p.id] ?? 0)}>
              Marquer
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => {
          setOffset((o) => o + 1)
          setMiss({})
        }}
        className="btn-primary w-full justify-center py-3"
      >
        Nouvelle lettre
      </button>
      <SipButtons onSip={(n) => players[0] && addSips(players[0].id, n)} />
    </div>
  )
}