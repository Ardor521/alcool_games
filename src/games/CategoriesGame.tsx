import { useMemo, useState } from 'react'
import { useParty } from '../context/PartyContext'
import { CATEGORY_WORDS } from '../lib/catalog'
import { shuffle } from '../lib/utils'
import { TurnBanner } from '../components/TurnBanner'
import { SipButtons } from '../components/SipToast'

export function CategoriesGame() {
  const { players, addSips } = useParty()
  const deck = useMemo(() => shuffle(CATEGORY_WORDS), [])
  const [ci, setCi] = useState(0)
  const [turn, setTurn] = useState(0)
  const player = players[turn % Math.max(players.length, 1)]

  return (
    <div className="space-y-4">
      <TurnBanner playerId={player?.id} />
      <div className="card p-6 text-center">
        <p className="text-xs uppercase tracking-widest text-violet-200">Catégorie</p>
        <p className="mt-2 font-display text-3xl">{deck[ci % deck.length]}</p>
        <p className="mt-3 text-sm text-white/60">
          À <strong className="text-white">{player?.name}</strong> de donner un mot. Doublon / blanc = 2 gorgées.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={() => setTurn((t) => t + 1)} className="btn-ghost justify-center py-3">
          Valide → suivant
        </button>
        <button
          type="button"
          onClick={() => {
            if (player) addSips(player.id, 2)
            setTurn((t) => t + 1)
          }}
          className="btn-primary justify-center py-3"
        >
          Bloqué (+2)
        </button>
      </div>
      <button
        type="button"
        onClick={() => {
          setCi((c) => c + 1)
          setTurn(0)
        }}
        className="btn-ghost w-full justify-center"
      >
        Nouvelle catégorie
      </button>
      {player && (
        <div className="card p-3">
          <SipButtons onSip={(n) => addSips(player.id, n)} />
        </div>
      )}
    </div>
  )
}