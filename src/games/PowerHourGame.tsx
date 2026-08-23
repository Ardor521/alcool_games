import { useEffect, useState } from 'react'
import { useParty } from '../context/PartyContext'
import { SipButtons } from '../components/SipToast'

export function PowerHourGame() {
  const { players, addSips } = useParty()
  const [running, setRunning] = useState(false)
  const [left, setLeft] = useState(3600)
  const [every, setEvery] = useState(60)
  const [flash, setFlash] = useState(false)
  const [rounds, setRounds] = useState(0)

  useEffect(() => {
    if (!running) return
    const t = window.setInterval(() => {
      setLeft((s) => (s <= 1 ? (setRunning(false), 0) : s - 1))
    }, 1000)
    return () => window.clearInterval(t)
  }, [running])

  useEffect(() => {
    if (running && left > 0 && left % every === 0 && left !== 3600) {
      setFlash(true)
      setRounds((r) => r + 1)
      players.forEach((p) => addSips(p.id, 1))
      window.setTimeout(() => setFlash(false), 900)
    }
  }, [left, running, every])

  const mm = Math.floor(left / 60)
  const ss = left % 60

  return (
    <div className="space-y-4">
      <div className={`card p-6 text-center transition ${flash ? 'bg-fuchsia-500/30 ring-2 ring-fuchsia-300' : ''}`}>
        <p className="text-xs uppercase tracking-widest text-white/50">Temps restant</p>
        <p className="font-display text-6xl tabular-nums">
          {String(mm).padStart(2, '0')}:{String(ss).padStart(2, '0')}
        </p>
        <p className="mt-2 text-sm text-white/65">
          {flash ? 'TOUT LE MONDE BOIT !' : `Une gorgée toutes les ${every}s · ${rounds} tournée(s)`}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {[30, 60, 90].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setEvery(n)}
            className={`rounded-full px-3 py-1 text-xs ${every === n ? 'bg-white text-black' : 'bg-white/10'}`}
          >
            toutes les {n}s
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={() => setRunning((r) => !r)} className="btn-primary justify-center py-3">
          {running ? 'Pause' : 'Start'}
        </button>
        <button
          type="button"
          onClick={() => {
            setRunning(false)
            setLeft(3600)
            setRounds(0)
          }}
          className="btn-ghost justify-center py-3"
        >
          Reset 60 min
        </button>
      </div>
      {players[0] && (
        <div className="card p-3">
          <SipButtons onSip={(n) => players.forEach((p) => addSips(p.id, n))} />
        </div>
      )}
    </div>
  )
}