import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useParty } from '../context/PartyContext'
import { KINGS_RULES } from '../lib/catalog'
import { newDeck } from '../lib/cards'
import type { PlayingCard } from '../types'
import { CardView } from '../components/CardView'
import { TurnBanner } from '../components/TurnBanner'
import { WaterGlass } from '../components/WaterGlass'

export function KingsBoard() {
  const { players, addSips } = useParty()
  const [deck, setDeck] = useState(() => newDeck())
  const [card, setCard] = useState<PlayingCard | null>(null)
  const [up, setUp] = useState(false)
  const [turn, setTurn] = useState(0)
  const [kings, setKings] = useState(0)
  const [house, setHouse] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const current = players[turn % Math.max(players.length, 1)]
  const drawer = card && players.length ? players[(turn + players.length - 1) % players.length] : current
  const rule = card ? KINGS_RULES[card.rank] : null

  const draw = () => {
    if (busy) return
    if (deck.length === 0) {
      setDeck(newDeck())
      setCard(null)
      setUp(false)
      return
    }
    const [next, ...rest] = deck
    setBusy(true)
    setUp(false)
    setCard(next)
    setDeck(rest)
    window.setTimeout(() => {
      setUp(true)
      if (next.rank === 'K') setKings((k) => Math.min(4, k + 1))
      setTurn((t) => (t + 1) % Math.max(players.length, 1))
      setBusy(false)
    }, 280)
  }

  return (
    <div className="space-y-4">
      <TurnBanner playerId={current?.id} hint={`${deck.length} cartes · rois ${kings}/4`} />
      <div className="flex justify-center gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`h-2 w-10 rounded-full ${i < kings ? 'bg-amber-300' : 'bg-white/10'}`} />
        ))}
      </div>
      <div className="flex flex-col items-center gap-3">
        <CardView
          card={card}
          faceUp={up && !!card}
          onClick={draw}
          disabled={busy}
          label={deck.length === 0 ? 'Remélanger' : 'Tirer / retourner'}
        />
        <p className="text-xs text-white/45">Tape le paquet pour retourner une carte</p>
      </div>
      <AnimatePresence mode="wait">
        {card && rule && up ? (
          <motion.div
            key={`${card.rank}${card.suit}${deck.length}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="card space-y-3 p-5 text-center"
          >
            <p className="text-xs uppercase tracking-widest text-orange-200">{rule.title}</p>
            <p className="text-lg">{rule.rule}</p>
            {card.rank === 'K' && kings >= 4 && (
              <p className="font-semibold text-amber-200">4e roi ! {drawer?.name} finit le verre du milieu.</p>
            )}
            {drawer && (
              <button type="button" className="btn-ghost text-sm" onClick={() => addSips(drawer.id, 2)}>
                {drawer.name} applique la règle (2 gorgées si besoin)
              </button>
            )}
            <WaterGlass id="kings-water" size="sm" />
          </motion.div>
        ) : (
          <div className="card p-6 text-center text-white/55">Tire une carte pour commencer.</div>
        )}
      </AnimatePresence>
      <div className="card space-y-2 p-4">
        <p className="text-xs uppercase tracking-wide text-white/45">Règles maison</p>
        <input
          placeholder="Ajouter une règle du Valet…"
          className="h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm outline-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const v = e.currentTarget.value.trim()
              if (!v) return
              setHouse((h) => [v, ...h].slice(0, 6))
              e.currentTarget.value = ''
            }
          }}
        />
        <ul className="space-y-1 text-sm text-white/75">
          {house.map((r) => (
            <li key={r}>• {r}</li>
          ))}
        </ul>
      </div>
      <button type="button" onClick={draw} className="btn-primary w-full justify-center py-3">
        {deck.length === 0 ? 'Mélanger un nouveau jeu' : 'Retourner une carte'}
      </button>
    </div>
  )
}