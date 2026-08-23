import { useMemo, useState } from 'react'
import { useParty } from '../context/PartyContext'
import { newDeck } from '../lib/cards'
import type { PlayingCard } from '../types'
import { CardView } from '../components/CardView'
import { WaterGlass } from '../components/WaterGlass'

const ROWS = [1, 2, 3, 4, 5]
const PYR = 15
const HAND = 4

function deal(ids: string[]) {
  const deck = newDeck()
  const pyramid = deck.slice(0, PYR)
  let i = PYR
  const hands: Record<string, PlayingCard[]> = {}
  ids.forEach((id) => {
    hands[id] = deck.slice(i, i + HAND)
    i += HAND
  })
  return { pyramid, hands, seed: Date.now() }
}

export function PyramidBoard() {
  const { players, addSips } = useParty()
  const [state, setState] = useState(() => deal(players.map((p) => p.id)))
  const [flipped, setFlipped] = useState(() => Array(PYR).fill(false) as boolean[])
  const [peek, setPeek] = useState<string | null>(null)
  const [seen, setSeen] = useState<Record<string, boolean>>({})

  const floorOf = (i: number) => {
    let acc = 0
    for (let r = 0; r < ROWS.length; r += 1) {
      acc += ROWS[r]
      if (i < acc) return r
    }
    return 4
  }

  const lastIdx = useMemo(() => {
    for (let i = flipped.length - 1; i >= 0; i -= 1) if (flipped[i]) return i
    return -1
  }, [flipped])
  const last = lastIdx >= 0 ? state.pyramid[lastIdx] : null
  const sips = lastIdx >= 0 ? floorOf(lastIdx) + 1 : 0

  return (
    <div className="space-y-4">
      <p className="text-sm text-white/70">
        15 cartes tirées au hasard, <strong className="text-white">face cachée</strong>. Tape une carte pour la
        retourner (commence par le bas). Si tu as le même rang en main, tu <strong className="text-white">donnes</strong>{' '}
        autant de gorgées que l’étage.
      </p>
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(148px,240px)] items-start gap-2 sm:gap-3">
        <div className="min-w-0 space-y-1.5 rounded-2xl border border-white/10 bg-black/20 p-2 sm:p-3">
          {ROWS.map((count, row) => {
            const start = ROWS.slice(0, row).reduce((s, n) => s + n, 0)
            return (
              <div key={row} className="flex items-center justify-center gap-1.5">
                <span className="w-5 text-center text-[10px] text-amber-200/80">{row + 1}</span>
                {Array.from({ length: count }).map((_, k) => {
                  const i = start + k
                  return (
                    <CardView
                      key={`${state.seed}-${i}`}
                      card={state.pyramid[i]}
                      faceUp={flipped[i]}
                      tiny
                      onClick={() => {
                        if (!flipped[i]) setFlipped((f) => f.map((v, j) => (j === i ? true : v)))
                      }}
                      disabled={flipped[i]}
                    />
                  )
                })}
              </div>
            )
          })}
        </div>
        <div className="card sticky top-20 space-y-2 p-2 sm:p-3">
          <p className="text-[10px] uppercase tracking-widest text-white/45 sm:text-xs">Révéler cartes</p>
          <p className="text-xs text-white/50">
            Choisis ton prénom, regarde tes 4 cartes, puis cache-les. Les autres détournent le regard.
          </p>
          <div className="flex flex-wrap gap-2">
            {players.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPeek(peek === p.id ? null : p.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  peek === p.id ? 'bg-white text-black' : 'bg-white/10 text-white'
                }`}
              >
                {p.name}
                {seen[p.id] ? ' ✓' : ''}
              </button>
            ))}
          </div>
          {peek ? (
            <div className="space-y-2 rounded-xl bg-black/30 p-3">
              <p className="text-sm">
                Cartes de <strong>{players.find((p) => p.id === peek)?.name}</strong>
              </p>
              <div className="flex flex-wrap gap-2">
                {state.hands[peek]?.map((c, i) => (
                  <CardView key={`${peek}-${i}`} card={c} faceUp small />
                ))}
              </div>
              <button
                type="button"
                className="btn-primary w-full justify-center !py-2 text-sm"
                onClick={() => {
                  setSeen((s) => ({ ...s, [peek]: true }))
                  setPeek(null)
                }}
              >
                Cacher mes cartes
              </button>
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-white/15 px-3 py-6 text-center text-xs text-white/40">
              Tape un joueur pour révéler sa main
            </p>
          )}
        </div>
      </div>
      {last && (
        <div className="card space-y-2 p-3">
          <p className="text-sm">
            Dernière carte : <strong>{last.rank}{last.suit}</strong> →{' '}
            <strong className="text-amber-200">{sips} gorgée(s)</strong> à donner si tu as ce rang.
          </p>
          <p className="text-xs text-white/55">
            Si tu as ce rang en main : tu <strong className="text-white">donnes</strong> {sips} gorgée(s) (tape celui
            qui reçoit). Sinon tu ne tapotes personne.
          </p>
          <div className="flex flex-wrap gap-2">
            {players.map((p) => (
              <button key={p.id} type="button" className="btn-ghost !px-3 !py-1.5 text-xs" onClick={() => addSips(p.id, sips)}>
                {p.name} reçoit {sips}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => {
            setState(deal(players.map((p) => p.id)))
            setFlipped(Array(PYR).fill(false))
            setPeek(null)
            setSeen({})
          }}
          className="btn-ghost flex-1 justify-center"
        >
          Mélanger une nouvelle pyramide
        </button>
        <WaterGlass id="pyramid-water" size="sm" />
      </div>
    </div>
  )
}