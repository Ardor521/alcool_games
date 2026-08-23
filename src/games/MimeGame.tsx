import { useMemo, useState } from 'react'
import { useParty } from '../context/PartyContext'
import { MIME_WORDS } from '../lib/catalog'
import { shuffle } from '../lib/utils'
import { TurnBanner } from '../components/TurnBanner'
import { SipButtons } from '../components/SipToast'

export function MimeGame() {
  const { players, addSips } = useParty()
  const deck = useMemo(() => shuffle(MIME_WORDS), [])
  const [wi, setWi] = useState(0)
  const [turn, setTurn] = useState(0)
  const [show, setShow] = useState(false)
  const player = players[turn % Math.max(players.length, 1)]
  const word = deck[wi % deck.length]

  const next = () => {
    setShow(false)
    setWi((w) => w + 1)
    setTurn((t) => t + 1)
  }

  return (
    <div className="space-y-4">
      <TurnBanner playerId={player?.id} label="Mimeur" hint="Montre le mot sans parler." />
      <p className="text-sm text-white/65">
        <strong className="text-white">{player?.name}</strong> mime sans parler. Le groupe devine. Échec = 2 gorgées
        pour le mime.
      </p>
      <div className="card min-h-[160px] space-y-3 p-5 text-center">
        {show ? (
          <>
            <p className="text-xs uppercase tracking-widest text-cyan-200">À mimer</p>
            <p className="font-display text-3xl normal-case tracking-normal">{word}</p>
            <button type="button" onClick={() => setShow(false)} className="text-xs text-white/50 underline">
              Cacher
            </button>
          </>
        ) : (
          <button type="button" onClick={() => setShow(true)} className="btn-primary mx-auto">
            Montrer le mot au mime
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={next} className="btn-primary justify-center py-3">
          Trouvé !
        </button>
        <button
          type="button"
          onClick={() => {
            if (player) addSips(player.id, 2)
            next()
          }}
          className="btn-ghost justify-center py-3"
        >
          Raté (+2)
        </button>
      </div>
      {player && (
        <div className="card p-3">
          <SipButtons onSip={(n) => addSips(player.id, n)} />
        </div>
      )}
    </div>
  )
}