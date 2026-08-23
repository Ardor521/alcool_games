import { useEffect, useState } from 'react'
import { useParty } from '../context/PartyContext'
import { NOYES_QS } from '../lib/catalog'
import { TurnBanner } from '../components/TurnBanner'
import { SipButtons } from '../components/SipToast'

export function NoYesGame() {
  const { players, addSips } = useParty()
  const [turn, setTurn] = useState(0)
  const [sec, setSec] = useState(30)
  const [running, setRunning] = useState(false)
  const [qi, setQi] = useState(0)
  const player = players[turn % Math.max(players.length, 1)]

  useEffect(() => {
    if (!running) return
    if (sec <= 0) {
      setRunning(false)
      return
    }
    const t = window.setTimeout(() => setSec((s) => s - 1), 1000)
    return () => window.clearTimeout(t)
  }, [running, sec])

  return (
    <div className="space-y-4">
      <TurnBanner playerId={player?.id} hint="Interdit de dire oui ou non." />
      <div className="card p-6 text-center">
        <p className="font-display text-5xl text-cyan-300">{sec}s</p>
        <p className="mt-4 text-xl">{NOYES_QS[qi % NOYES_QS.length]}</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" className="btn-ghost justify-center" onClick={() => setQi((q) => q + 1)} disabled={!running}>
          Question suivante
        </button>
        <button
          type="button"
          className="btn-ghost justify-center text-rose-200"
          onClick={() => {
            if (player) addSips(player.id, 2)
            setRunning(false)
            setTurn((t) => t + 1)
            setSec(30)
          }}
          disabled={!running && sec === 30}
        >
          A dit oui/non (+2)
        </button>
      </div>
      {running ? (
        <button
          type="button"
          onClick={() => {
            setRunning(false)
            setTurn((t) => t + 1)
            setSec(30)
          }}
          className="btn-primary w-full justify-center py-3"
        >
          A survécu → joueur suivant
        </button>
      ) : (
        <button
          type="button"
          onClick={() => {
            setSec(30)
            setRunning(true)
            setQi(0)
          }}
          className="btn-primary w-full justify-center py-3"
        >
          Lancer 30 secondes
        </button>
      )}
      {player && (
        <div className="card p-3">
          <SipButtons onSip={(n) => addSips(player.id, n)} />
        </div>
      )}
    </div>
  )
}