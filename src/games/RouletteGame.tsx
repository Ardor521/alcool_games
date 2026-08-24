import { useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useParty } from '../context/PartyContext'
import { useRoom } from '../context/RoomContext'
import { useSyncedState } from '../lib/useSyncedState'
import { nextPlayerId, playerByTurn } from '../lib/turns'
import { TurnBanner } from '../components/TurnBanner'

type Slice = { label: string; sips: number; color: string }

function wheelBg(slices: Slice[]) {
  const step = 100 / slices.length
  return `conic-gradient(${slices
    .map((s, i) => {
      const a = i * step
      const b = (i + 1) * step
      return `${s.color} ${a}% ${b}%`
    })
    .join(', ')})`
}

export function RouletteGame() {
  const { players, addSips, selfId, connected } = useParty()
  const { isHost } = useRoom()
  const [turnId, setTurnId] = useSyncedState<string | null>('rou.turnId', players[0]?.id ?? null)
  const [spinning, setSpinning] = useSyncedState('rou.spin', false)
  const [rot, setRot] = useSyncedState('rou.rot', 0)
  const [result, setResult] = useSyncedState<Slice | null>('rou.result', null)
  const [spinIdx, setSpinIdx] = useSyncedState('rou.idx', -1)
  const [token, setToken] = useSyncedState('rou.token', 0)
  const [spinnerId, setSpinnerId] = useSyncedState<string | null>('rou.spinner', null)
  const current = playerByTurn(players, turnId)
  const spinner = players.find((p) => p.id === spinnerId) ?? current
  const mySpin = !connected || !selfId || selfId === current?.id
  const next = players.find((p) => p.id === nextPlayerId(players, current?.id))
  const slices = useMemo<Slice[]>(
    () => [
      { label: '1 gorgée', sips: 1, color: '#34d399' },
      { label: '2 gorgées', sips: 2, color: '#22d3ee' },
      { label: 'Passe', sips: 0, color: '#64748b' },
      { label: '3 gorgées', sips: 3, color: '#a78bfa' },
      { label: 'Donne 2', sips: -2, color: '#fbbf24' },
      { label: 'Cul sec', sips: 5, color: '#f43f9d' },
      { label: '1 gorgée', sips: 1, color: '#60a5fa' },
      { label: 'Tout le monde 1', sips: 99, color: '#fb7185' },
    ],
    [],
  )

  const spin = () => {
    if (spinning || !mySpin || !current) return
    const idx = Math.floor(Math.random() * slices.length)
    const step = 360 / slices.length
    const extra = 6 * 360 + (360 - idx * step - step / 2)
    setSpinnerId(current.id)
    setResult(null)
    setSpinIdx(idx)
    setToken((t) => t + 1)
    setRot((prev) => Number(prev) + extra - (Number(prev) % 360))
    setSpinning(true)
  }

  useEffect(() => {
    if (connected && !isHost) return
    if (!spinning || spinIdx < 0) return
    const t = window.setTimeout(() => {
      setResult(slices[spinIdx % slices.length])
      setSpinning(false)
    }, 3200)
    return () => window.clearTimeout(t)
  }, [spinning, spinIdx, token, connected, isHost])

  const apply = (giveTo?: string) => {
    if (!result || !spinner) return
    if (result.sips === 99) players.forEach((p) => addSips(p.id, 1))
    else if (result.sips < 0 && giveTo) addSips(giveTo, Math.abs(result.sips))
    else if (result.sips > 0 && result.sips < 99) addSips(spinner.id, result.sips === 5 ? 4 : result.sips)
    setResult(null)
    setTurnId(nextPlayerId(players, current?.id))
  }

  return (
    <div className="space-y-4">
      <TurnBanner
        playerId={current?.id}
        label={`Tour de ${current?.name ?? ''}`}
        hint={mySpin ? 'C’est toi qui lances.' : `Au tour de ${current?.name}`}
      />
      <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-[minmax(0,1.05fr)_minmax(150px,1fr)] sm:gap-2">
        <div className="min-w-0 space-y-3">
          <div className="relative w-full">
            <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2 text-2xl text-fuchsia-300">▼</div>
            <motion.div
              className="aspect-square w-full rounded-full border-4 border-white/10 shadow-[0_0_40px_rgba(244,63,157,0.25)]"
              style={{ background: wheelBg(slices) }}
              animate={{ rotate: rot }}
              transition={{ duration: 3.1, ease: [0.12, 0.8, 0.1, 1] }}
            />
            <div className="pointer-events-none absolute inset-0 m-auto h-12 w-12 rounded-full bg-[#07020f] ring-4 ring-white/10 sm:h-16 sm:w-16" />
          </div>
          <button type="button" onClick={spin} disabled={spinning || !mySpin} className="btn-primary w-full justify-center py-3 disabled:opacity-50">
            {spinning ? 'La roue tourne…' : mySpin ? 'Lancer la roulette' : `Au tour de ${current?.name}`}
          </button>
        </div>
        <div className="card flex min-h-[220px] flex-col gap-3 p-3 sm:min-h-[280px] sm:p-4">
          <p className="text-[10px] uppercase tracking-widest text-emerald-200 sm:text-xs">Résultat & implication</p>
          {!result || spinning ? (
            <div className="flex flex-1 flex-col justify-center text-sm text-white/45">
              <p>{spinning ? 'La boule décide…' : 'Espace libre : le résumé s’affichera ici après le lancer.'}</p>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} className="flex flex-1 flex-col gap-3">
              <p className="font-display text-2xl leading-none sm:text-3xl">{result.label}</p>
              <p className="text-sm text-white/70">
                {result.sips === 99 && 'Tout le monde boit 1 gorgée.'}
                {result.sips === 0 && `${spinner?.name} passe son tour. Ouf.`}
                {result.sips === 5 && `${spinner?.name} prend un cul sec (4 gorgées).`}
                {result.sips > 0 && result.sips < 5 && `${spinner?.name} boit ${result.sips} gorgée(s).`}
                {result.sips < 0 && `${spinner?.name} donne 2 gorgées à quelqu’un.`}
              </p>
              {result.sips < 0 ? (
                <div className="space-y-2">
                  <p className="text-xs text-white/55">Choisis qui boit :</p>
                  <div className="flex flex-wrap gap-1.5">
                    {players
                      .filter((p) => p.id !== spinner?.id)
                      .map((p) => (
                        <button key={p.id} type="button" onClick={() => apply(p.id)} className="btn-ghost !px-2 !py-1 text-xs">
                          {p.name}
                        </button>
                      ))}
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => apply()} className="btn-primary mt-auto w-full justify-center !py-2 text-sm">
                  Valider & suivant{next ? ` → ${next.name}` : ''}
                </button>
              )}
            </motion.div>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-[11px] text-white/70 sm:grid-cols-4">
        {slices.map((s) => (
          <div key={s.label + s.color} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
            {s.label}
          </div>
        ))}
      </div>
    </div>
  )
}