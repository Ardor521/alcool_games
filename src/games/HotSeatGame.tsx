import { useMemo, useState } from 'react'
import { useParty } from '../context/PartyContext'
import { HOTSEAT_QS } from '../lib/catalog'
import { shuffle } from '../lib/utils'
import { TurnBanner } from '../components/TurnBanner'
import { PlayerAvatar } from '../components/PlayerAvatar'
import { SipButtons } from '../components/SipToast'

export function HotSeatGame() {
  const { players, addSips } = useParty()
  const deck = useMemo(() => shuffle(HOTSEAT_QS), [])
  const [turn, setTurn] = useState(0)
  const [qi, setQi] = useState(0)
  const [inSeat, setInSeat] = useState(0)
  const player = players[turn % Math.max(players.length, 1)]

  const nextQ = () => {
    setQi((q) => q + 1)
    setInSeat((s) => {
      const n = s + 1
      if (n >= 4) {
        setTurn((t) => t + 1)
        return 0
      }
      return n
    })
  }

  return (
    <div className="space-y-4">
      <TurnBanner playerId={player?.id} label="Sur le grill" />
      {player && (
        <div className="flex items-center gap-3">
          <PlayerAvatar player={player} size="lg" />
          <div>
            <p className="text-xs uppercase tracking-widest text-white/45">Sur le gril</p>
            <p className="font-display text-2xl">{player.name}</p>
            <p className="text-xs text-white/50">Question {inSeat + 1}/4</p>
          </div>
        </div>
      )}
      <div className="card p-5">
        <p className="font-display text-2xl leading-snug normal-case tracking-normal">{deck[qi % deck.length]}</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={nextQ} className="btn-primary justify-center py-3">
          A répondu
        </button>
        <button
          type="button"
          onClick={() => {
            if (player) addSips(player.id, 2)
            nextQ()
          }}
          className="btn-ghost justify-center py-3"
        >
          Refuse (+2)
        </button>
      </div>
      <button
        type="button"
        onClick={() => {
          setTurn((t) => t + 1)
          setInSeat(0)
        }}
        className="btn-ghost w-full justify-center text-sm"
      >
        Changer de victime
      </button>
      {player && (
        <div className="card p-3">
          <SipButtons onSip={(n) => addSips(player.id, n)} />
        </div>
      )}
    </div>
  )
}