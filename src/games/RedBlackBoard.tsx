import { useState } from 'react'
import { useParty } from '../context/PartyContext'
import { newDeck, isRed } from '../lib/cards'
import type { PlayingCard } from '../types'
import { CardView } from '../components/CardView'
import { TurnBanner } from '../components/TurnBanner'
import { SipButtons } from '../components/SipToast'

export function RedBlackBoard() {
  const { players, addSips } = useParty()
  const [deck, setDeck] = useState(() => newDeck())
  const [turn, setTurn] = useState(0)
  const [card, setCard] = useState<PlayingCard | null>(null)
  const [up, setUp] = useState(false)
  const [choice, setChoice] = useState<string | null>(null)
  const [msg, setMsg] = useState('Choisis une couleur, puis retourne la carte.')
  const player = players[turn % Math.max(players.length, 1)]

  const play = (color: 'red' | 'black') => {
    const src = deck.length ? deck : newDeck()
    const [c, ...rest] = src
    setDeck(rest.length ? rest : newDeck())
    setCard(c)
    setChoice(color)
    setUp(false)
    setMsg('Retourne la carte…')
    window.setTimeout(() => {
      setUp(true)
      const ok = color === 'red' ? isRed(c.suit) : !isRed(c.suit)
      setMsg(ok ? `${player?.name} donne 2 gorgées.` : `${player?.name} boit 2 gorgées.`)
      if (!ok && player) addSips(player.id, 2)
      window.setTimeout(() => setTurn((t) => t + 1), 400)
    }, 350)
  }

  return (
    <div className="space-y-4">
      <TurnBanner playerId={player?.id} />
      <div className="flex justify-center">
        <CardView card={card} faceUp={up && !!card} />
      </div>
      <p className="text-center text-sm text-white/60">{msg}</p>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => play('red')}
          className="rounded-full bg-rose-600 py-3 font-semibold"
          disabled={!!choice && !up}
        >
          Rouge
        </button>
        <button
          type="button"
          onClick={() => play('black')}
          className="rounded-full bg-zinc-900 py-3 font-semibold ring-1 ring-white/20"
          disabled={!!choice && !up}
        >
          Noir
        </button>
      </div>
      {player && (
        <div className="card p-3">
          <p className="mb-2 text-xs text-white/45">Marquer / donner</p>
          <SipButtons onSip={(n) => addSips(player.id, n)} />
        </div>
      )}
    </div>
  )
}