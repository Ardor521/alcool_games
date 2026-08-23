import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useParty } from '../context/PartyContext'
import { BOTTLE_DARES } from '../lib/catalog'
import { fillNames, pick, pickOther } from '../lib/utils'
import { TurnBanner } from '../components/TurnBanner'
import { WaterGlass } from '../components/WaterGlass'

export function BottleBoard() {
  const { activePlayers, addSips } = useParty()
  const list = activePlayers
  const [spinning, setSpinning] = useState(false)
  const [rot, setRot] = useState(0)
  const [idx, setIdx] = useState<number | null>(null)
  const [dare, setDare] = useState('')
  const n = Math.max(list.length, 1)
  const slice = 360 / n
  const bg = useMemo(
    () =>
      list.length
        ? `conic-gradient(from 0deg, ${list
            .map((p, i) => {
              const a = (i / n) * 100
              const b = ((i + 1) / n) * 100
              return `${p.color} ${a}% ${b}%`
            })
            .join(', ')})`
        : '#1a0b2e',
    [list, n],
  )

  const spin = () => {
    if (spinning || list.length === 0) return
    setSpinning(true)
    setDare('')
    const winner = Math.floor(Math.random() * list.length)
    const extra = 6 + Math.floor(Math.random() * 3)
    const target = winner * slice + slice / 2
    setRot((prev) => {
      const cur = ((prev % 360) + 360) % 360
      let delta = target - cur
      if (delta <= 20) delta += 360
      return prev + delta + extra * 360
    })
    window.setTimeout(() => {
      setIdx(winner)
      const p = list[winner]
      const o = pickOther(list, p.id)
      setDare(fillNames(pick(BOTTLE_DARES), p.name, o?.name))
      setSpinning(false)
    }, 3000)
  }

  const chosen = idx !== null ? list[idx] : null

  return (
    <div className="space-y-5">
      {chosen && !spinning && (
        <TurnBanner playerId={chosen.id} label="La bouteille désigne" hint="C’est à toi de jouer le défi." />
      )}
      <div className="relative mx-auto aspect-square w-full max-w-sm">
        <div
          className="absolute inset-0 overflow-hidden rounded-full border-4 border-white/15 shadow-[0_0_40px_rgba(0,0,0,0.45)]"
          style={{ background: bg }}
        >
          {list.map((p, i) => {
            const ang = i * slice + slice / 2
            return (
              <div
                key={p.id}
                className="absolute left-1/2 top-[8%] origin-[50%_210%]"
                style={{ transform: `translateX(-50%) rotate(${ang}deg)` }}
              >
                <span
                  className="block max-w-[72px] truncate rounded-full bg-black/45 px-2 py-0.5 text-center text-[11px] font-semibold text-white"
                  style={{ transform: `rotate(${-ang}deg)` }}
                >
                  {p.name}
                </span>
              </div>
            )
          })}
          <div className="absolute inset-[28%] rounded-full bg-[#12061f] ring-2 ring-white/10" />
        </div>
        <motion.div
          className="pointer-events-none absolute inset-0"
          animate={{ rotate: rot }}
          transition={{ duration: 2.9, ease: [0.12, 0.75, 0.1, 1] }}
        >
          <div className="absolute left-1/2 top-[18%] h-[34%] w-5 -translate-x-1/2">
            <div className="h-full w-full rounded-full bg-gradient-to-b from-amber-50 via-amber-300 to-amber-800 shadow-[0_8px_20px_rgba(0,0,0,0.45)]" />
            <div className="absolute left-1/2 top-0 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-100" />
          </div>
          <div className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-zinc-900 ring-2 ring-amber-200" />
        </motion.div>
      </div>
      <button type="button" onClick={spin} disabled={spinning} className="btn-primary w-full justify-center py-3 disabled:opacity-50">
        {spinning ? 'Ça tourne…' : 'Tourner la bouteille'}
      </button>
      {chosen && dare && !spinning && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card space-y-3 p-5">
          <p className="text-lg">{dare}</p>
          <button type="button" className="btn-primary w-full justify-center" onClick={() => addSips(chosen.id, 2)}>
            {chosen.name} boit 2 (règle du défi)
          </button>
          <WaterGlass id="bottle-water" size="sm" className="self-end" />
        </motion.div>
      )}
    </div>
  )
}