import { useMemo, useState } from 'react'
import { useParty } from '../context/PartyContext'
import { newDeck, isRed, SUITS } from '../lib/cards'
import type { PlayingCard, Suit } from '../types'
import { shuffle } from '../lib/utils'
import { CardView } from '../components/CardView'
import { WaterGlass } from '../components/WaterGlass'

const FINISH = 6

export function HorsesBoard() {
  const { players, addSips } = useParty()
  const base = useMemo(() => newDeck().filter((c) => c.rank !== 'A'), [])
  const [deck, setDeck] = useState(() => shuffle(base))
  const [discard, setDiscard] = useState<PlayingCard[]>([])
  const [card, setCard] = useState<PlayingCard | null>(null)
  const [flipping, setFlipping] = useState(false)
  const [pos, setPos] = useState<Record<Suit, number>>({ '♥': 0, '♦': 0, '♣': 0, '♠': 0 })
  const [bets, setBets] = useState<Record<string, Suit>>({})
  const [winner, setWinner] = useState<Suit | null>(null)
  const [started, setStarted] = useState(false)
  const [shown, setShown] = useState(false)

  const flip = () => {
    if (winner || flipping) return
    const src = deck.length ? deck : shuffle(base)
    const [c, ...rest] = src
    setFlipping(true)
    setShown(false)
    setCard(c)
    setDeck(rest)
    window.setTimeout(() => setShown(true), 50)
    window.setTimeout(() => {
      setPos((p) => {
        const next = { ...p, [c.suit]: Math.min(FINISH, p[c.suit] + 1) }
        if (next[c.suit] >= FINISH) setWinner(c.suit)
        return next
      })
      setDiscard((d) => [c, ...d].slice(0, 8))
      setFlipping(false)
    }, 650)
    setStarted(true)
  }

  const reset = () => {
    setDeck(shuffle(base))
    setDiscard([])
    setCard(null)
    setShown(false)
    setPos({ '♥': 0, '♦': 0, '♣': 0, '♠': 0 })
    setWinner(null)
    setStarted(false)
    setFlipping(false)
  }

  const losers = winner ? players.filter((p) => bets[p.id] && bets[p.id] !== winner) : []
  const winners = winner ? players.filter((p) => bets[p.id] === winner) : []
  const allBet = players.every((p) => bets[p.id])

  return (
    <div className="space-y-4">
      <p className="text-sm text-white/70">
        Parie sur une couleur, puis <strong className="text-white">retourne les cartes</strong> du paquet. Chaque carte
        avance le cheval de sa couleur.
      </p>
      {!started && (
        <div className="card space-y-2 p-4">
          <p className="text-sm text-white/70">Chacun choisit son cheval :</p>
          {players.map((p) => (
            <div key={p.id} className="flex items-center gap-2">
              <span className="w-20 truncate text-sm">{p.name}</span>
              <div className="flex gap-1">
                {SUITS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setBets((b) => ({ ...b, [p.id]: s }))}
                    className={`h-9 w-9 rounded-lg text-lg ${bets[p.id] === s ? 'bg-white text-black' : 'bg-white/10'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="space-y-2 rounded-2xl border border-white/10 bg-emerald-950/30 p-3">
        {SUITS.map((s) => (
          <div key={s} className="flex items-center gap-2">
            <span className={`w-7 text-center text-xl ${isRed(s) ? 'text-rose-400' : 'text-white'}`}>{s}</span>
            <div className="relative h-9 flex-1 overflow-hidden rounded-full bg-black/30">
              {Array.from({ length: FINISH }).map((_, i) => (
                <span
                  key={i}
                  className="absolute top-0 h-full w-px bg-white/10"
                  style={{ left: `${((i + 1) / FINISH) * 100}%` }}
                />
              ))}
              <div
                className="absolute top-1 flex h-7 w-7 items-center justify-center rounded-full bg-amber-300 text-sm text-black transition-all duration-500"
                style={{ left: `calc(${(pos[s] / FINISH) * 100}% - 14px)` }}
              >
                ♞
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-end justify-center gap-4">
        <div className="text-center">
          <p className="mb-2 text-[11px] uppercase tracking-widest text-white/45">Paquet</p>
          <CardView
            card={card}
            faceUp={shown && !!card}
            onClick={winner ? undefined : flip}
            disabled={flipping || !!winner || (!started && !allBet)}
            label="Retourner une carte"
          />
          <p className="mt-1 text-[11px] text-white/40">{deck.length} restantes</p>
        </div>
        {discard[0] && (
          <div className="text-center">
            <p className="mb-2 text-[11px] uppercase tracking-widest text-white/45">Défausse</p>
            <CardView card={discard[0]} faceUp small />
          </div>
        )}
      </div>
      {winner ? (
        <div className="card space-y-3 p-4">
          <p className="font-display text-2xl">Arrivée : {winner}</p>
          <p className="text-sm text-white/70">Gagnants : {winners.map((p) => p.name).join(', ') || 'personne'}</p>
          <p className="text-sm text-white/70">Perdants (2 gorgées) : {losers.map((p) => p.name).join(', ') || '—'}</p>
          {losers.map((p) => (
            <div key={p.id} className="flex items-center gap-2">
              <span className="text-sm">{p.name}</span>
              <button type="button" className="btn-ghost !px-2 !py-1 text-xs" onClick={() => addSips(p.id, 2)}>
                +2 (perdant)
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => {
              losers.forEach((p) => addSips(p.id, 2))
              reset()
            }}
            className="btn-primary w-full justify-center"
          >
            Marquer 2 & nouvelle course
          </button>
          <WaterGlass id="horses-water" size="sm" className="mx-auto" />
        </div>
      ) : (
        <button
          type="button"
          onClick={flip}
          className="btn-primary w-full justify-center py-3 disabled:opacity-40"
          disabled={flipping || (!started && !allBet)}
        >
          {flipping ? 'Révélation…' : 'Retourner une carte'}
        </button>
      )}
    </div>
  )
}