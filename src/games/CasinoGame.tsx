import { useState } from 'react'
import { motion } from 'framer-motion'
import { useParty } from '../context/PartyContext'
import { useSyncedState } from '../lib/useSyncedState'
import type { Player } from '../types'
import { PlayerAvatar } from '../components/PlayerAvatar'
import { TurnBanner } from '../components/TurnBanner'
import { WaterGlass } from '../components/WaterGlass'

const WHEEL = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26]
const REDS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36])

function colorOf(n: number) {
  return n === 0 ? 'green' : REDS.has(n) ? 'red' : 'black'
}

function luckyNumbers(players: Player[]) {
  const nums = Array.from({ length: 36 }, (_, i) => i + 1)
  for (let i = nums.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[nums[i], nums[j]] = [nums[j], nums[i]]
  }
  const per = Math.max(1, Math.floor(36 / Math.max(players.length, 1)))
  const map: Record<string, number[]> = {}
  players.forEach((p, i) => {
    const slice = nums.slice(i * per, Math.min(nums.length, (i + 1) * per))
    map[p.id] = [...slice].sort((a, b) => a - b)
  })
  return map
}

type Event = { playerId: string; amount: number; reason: string }
type Result = {
  number: number
  color: string
  lines: string[]
  events: Event[]
  pendingGive: number
  relance: boolean
}

function resolve(n: number, players: Player[], croupierId: string, lucky: Record<string, number[]>): Result {
  const color = colorOf(n)
  const idx = Math.max(0, players.findIndex((p) => p.id === croupierId))
  const croupier = players[idx]
  const left = players[(idx + players.length - 1) % players.length]
  const right = players[(idx + 1) % players.length]
  const lines: string[] = []
  const raw: Event[] = []
  let pendingGive = 0
  let relance = false
  const push = (id: string, amount: number, reason: string) => raw.push({ playerId: id, amount, reason })

  if (!croupier) return { number: n, color, lines: ['Ajoute des joueurs.'], events: raw, pendingGive, relance }

  if (n === 0) {
    lines.push('Zéro vert ! Tout le monde boit 3 gorgées.')
    players.forEach((p) => push(p.id, 3, 'Zéro'))
    lines.push(`${croupier.name} (croupier) boit encore 2.`)
    push(croupier.id, 2, 'Croupier')
  } else if (color === 'red') {
    lines.push('Rouge : tout le monde boit 1 gorgée.')
    players.forEach((p) => push(p.id, 1, 'Rouge'))
  } else {
    lines.push(`Noir : ${croupier.name} boit 2 gorgées.`)
    push(croupier.id, 2, 'Noir')
  }

  if (n !== 0) {
    if (n % 2 === 0) {
      lines.push(`Pair (${n}) : ${croupier.name} donne 2 gorgées.`)
      pendingGive += 2
    } else {
      lines.push(`Impair (${n}) : ${croupier.name} boit 2 gorgées de plus.`)
      push(croupier.id, 2, 'Impair')
    }
    if (n <= 12) {
      lines.push(`1re douzaine : ${players[0].name} boit 1.`)
      push(players[0].id, 1, '1-12')
    } else if (n <= 24) {
      const mid = players[Math.floor((players.length - 1) / 2)]
      lines.push(`2e douzaine : ${mid.name} (milieu de liste) boit 1.`)
      push(mid.id, 1, '13-24')
    } else {
      const last = players[players.length - 1]
      lines.push(`3e douzaine : ${last.name} boit 1.`)
      push(last.id, 1, '25-36')
    }
  }

  switch (n) {
    case 1:
      lines.push(`1 : ${players[0].name} boit 2 (premier de liste).`)
      push(players[0].id, 2, 'N°1')
      break
    case 7:
      lines.push('7 chanceux : tu donnes 3 gorgées.')
      pendingGive += 3
      break
    case 8:
      lines.push('8 : mime un animal pendant 5s ou bois 2.')
      push(croupier.id, 2, 'Défi 8')
      break
    case 11:
      lines.push('11 : invente une mini-règle pour 3 tours (faute = 1 gorgée).')
      break
    case 13:
      lines.push('13 malchance : bois 4 gorgées.')
      push(croupier.id, 4, 'N°13')
      break
    case 17:
      lines.push('17 : cul sec ! (compte 4 gorgées)')
      push(croupier.id, 4, 'Cul sec 17')
      break
    case 21:
      lines.push('21 blackjack : tout le monde trinque 1 gorgée.')
      players.forEach((p) => push(p.id, 1, '21'))
      break
    case 22:
      lines.push('22 double : bois 1 et relance la boule.')
      push(croupier.id, 1, 'N°22')
      relance = true
      break
    case 24:
      lines.push(`24 voisins : ${left.name} et ${right.name} boivent 2.`)
      push(left.id, 2, 'Voisin G')
      push(right.id, 2, 'Voisin D')
      break
    case 29: {
      const sober = [...players].sort((a, b) => a.sips - b.sips)[0]
      lines.push(`29 : le plus sobre (${sober.name}) boit 2.`)
      push(sober.id, 2, 'N°29')
      break
    }
    case 33:
      lines.push('33 triple : bois 3 et donne 3.')
      push(croupier.id, 3, 'N°33')
      pendingGive += 3
      break
    case 36:
      lines.push('36 max : tout le monde sauf toi boit 2.')
      players.filter((p) => p.id !== croupier.id).forEach((p) => push(p.id, 2, 'N°36'))
      break
  }

  players.forEach((p) => {
    if (lucky[p.id]?.includes(n)) {
      lines.push(`Numéro plein de ${p.name} ! +3 gorgées.`)
      push(p.id, 3, 'Plein')
    }
  })

  const merged = new Map<string, Event>()
  for (const e of raw) {
    const prev = merged.get(e.playerId)
    if (prev) {
      prev.amount += e.amount
      prev.reason = `${prev.reason} + ${e.reason}`
    } else merged.set(e.playerId, { ...e })
  }
  return { number: n, color, lines, events: [...merged.values()], pendingGive, relance }
}

const RULES = [
  { title: '0 vert', text: 'Tout le monde boit 3 + le croupier 2.' },
  { title: 'Rouge', text: 'Tout le monde boit 1 gorgée.' },
  { title: 'Noir', text: 'Le lanceur boit 2 gorgées.' },
  { title: 'Pair', text: 'Le lanceur donne 2 gorgées.' },
  { title: 'Impair', text: 'Le lanceur boit 2 gorgées de plus.' },
  { title: '1-12 / 13-24 / 25-36', text: '1er / milieu / dernier joueur de la liste boit 1.' },
  { title: 'N° plein', text: 'Si la boule tombe sur TON numéro : +3 gorgées.' },
  { title: 'Spéciaux', text: '7 donne 3 · 13 bois 4 · 17 cul sec · 21 tous 1 · 22 relance · 24 voisins · 33 triple · 36 max.' },
]

const CX = 160
const CY = 160
const OUTER = 148
const INNER = 102
const STEP = 360 / WHEEL.length

function polar(r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) }
}

function pocketPath(i: number) {
  const a = i * STEP
  const b = (i + 1) * STEP
  const p1 = polar(OUTER, a)
  const p2 = polar(OUTER, b)
  const p3 = polar(INNER, b)
  const p4 = polar(INNER, a)
  return `M ${p1.x} ${p1.y} A ${OUTER} ${OUTER} 0 0 1 ${p2.x} ${p2.y} L ${p3.x} ${p3.y} A ${INNER} ${INNER} 0 0 0 ${p4.x} ${p4.y} Z`
}

const FILL = { red: '#dc2626', black: '#0f172a', green: '#16a34a' }

export function CasinoGame() {
  const { players, addSips, selfId, connected } = useParty()
  const [turn, setTurn] = useSyncedState('casino.turn', 0)
  const [spinning, setSpinning] = useSyncedState('casino.spin', false)
  const [rot, setRot] = useSyncedState('casino.rot', 0)
  const [result, setResult] = useSyncedState<Result | null>('casino.result', null)
  const [showRules, setShowRules] = useState(false)
  const [lucky] = useSyncedState('casino.lucky', () => luckyNumbers(players))
  const croupier = players[turn % Math.max(players.length, 1)]
  const mySpin = !connected || !selfId || selfId === croupier?.id

  const spin = () => {
    if (spinning || !croupier) return
    setSpinning(true)
    setResult(null)
    const idx = Math.floor(Math.random() * WHEEL.length)
    const extra = 8 * 360 - (idx * STEP + STEP / 2)
    setRot((prev) => prev + extra - (((prev % 360) + 360) % 360))
    window.setTimeout(() => {
      setResult(resolve(WHEEL[idx], players, croupier.id, lucky))
      setSpinning(false)
    }, 4200)
  }

  const apply = (giveTo?: string) => {
    if (!result) return
    result.events.forEach((e) => addSips(e.playerId, e.amount))
    if (result.pendingGive && giveTo) addSips(giveTo, result.pendingGive)
    if (result.relance) {
      setResult(null)
      return
    }
    setResult(null)
    setTurn((t) => t + 1)
  }

  return (
    <div className="space-y-4">
      <TurnBanner playerId={croupier?.id} label="Croupier / tour de" hint="C’est toi qui lances la boule." />
      <div className="flex items-center justify-end">
        <button type="button" onClick={() => setShowRules((v) => !v)} className="text-xs text-emerald-300 underline">
          {showRules ? 'Masquer les règles' : 'Voir les règles'}
        </button>
      </div>
      {showRules && (
        <div className="card space-y-2 p-4 text-sm text-white/75">
          {RULES.map((r) => (
            <p key={r.title}>
              <span className="font-semibold text-white">{r.title} — </span>
              {r.text}
            </p>
          ))}
        </div>
      )}
      <div className="grid grid-cols-[minmax(0,1.05fr)_minmax(150px,1fr)] items-start gap-2 sm:gap-3">
        <div className="min-w-0 space-y-3">
          <div className="relative w-full">
            <div className="absolute left-1/2 top-0 z-20 -translate-x-1/2 text-amber-300 drop-shadow">▼</div>
            <div className="rounded-full bg-gradient-to-b from-amber-200 via-amber-600 to-amber-900 p-1.5 shadow-[0_0_50px_rgba(234,179,8,0.28)] sm:p-2">
              <div className="overflow-hidden rounded-full bg-[#111] p-1">
                <motion.svg
                  viewBox="0 0 320 320"
                  className="block w-full"
                  animate={{ rotate: rot }}
                  transition={{ duration: 4, ease: [0.12, 0.75, 0.08, 1] }}
                >
                  <circle cx={CX} cy={CY} r={154} fill="#1c1917" />
                  {WHEEL.map((n, i) => {
                    const col = colorOf(n)
                    const mid = polar((OUTER + INNER) / 2, i * STEP + STEP / 2)
                    return (
                      <g key={`${n}-${i}`}>
                        <path d={pocketPath(i)} fill={FILL[col]} stroke="#eab308" strokeWidth="0.6" />
                        <text
                          x={mid.x}
                          y={mid.y}
                          fill="white"
                          fontSize="9"
                          fontWeight="700"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          transform={`rotate(${i * STEP + STEP / 2} ${mid.x} ${mid.y})`}
                        >
                          {n}
                        </text>
                      </g>
                    )
                  })}
                  <circle cx={CX} cy={CY} r={96} fill="#14532d" />
                  <circle cx={CX} cy={CY} r={88} fill="#052e16" />
                  <text x={CX} y={CY - 8} textAnchor="middle" fill="#fde68a" fontSize="13" fontWeight="700">
                    SOIRÉE
                  </text>
                  <text x={CX} y={CY + 12} textAnchor="middle" fill="#bbf7d0" fontSize="10">
                    ROULETTE
                  </text>
                </motion.svg>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={spin}
            disabled={spinning || !mySpin}
            className="btn-primary w-full justify-center py-3 disabled:opacity-50"
          >
            {spinning ? 'La boule tourne…' : mySpin ? 'Lancer la boule' : `Au tour de ${croupier?.name}`}
          </button>
        </div>
        <div className="card flex min-h-[240px] flex-col gap-2 p-3 sm:min-h-[300px] sm:p-4">
          <p className="text-[10px] uppercase tracking-widest text-amber-200 sm:text-xs">Résultat & implication</p>
          {!result || spinning ? (
            <div className="flex flex-1 flex-col justify-center text-sm text-white/45">
              <p>{spinning ? 'La boule décide…' : 'Espace libre : le résumé s’affichera ici après le lancer.'}</p>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} className="flex flex-1 flex-col gap-2 overflow-y-auto">
              <div className="flex items-center gap-2">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-black text-white sm:h-14 sm:w-14 sm:text-xl"
                  style={{
                    background: result.color === 'red' ? '#dc2626' : result.color === 'black' ? '#0f172a' : '#16a34a',
                    border: '2px solid #eab308',
                  }}
                >
                  {result.number}
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-amber-200">
                    {result.color === 'red' ? 'Rouge' : result.color === 'black' ? 'Noir' : 'Vert'}
                  </p>
                  <p className="font-display text-xl leading-none sm:text-2xl">Case {result.number}</p>
                </div>
              </div>
              <ul className="space-y-1 text-xs text-white/80 sm:text-sm">
                {result.lines.map((l) => (
                  <li key={l}>• {l}</li>
                ))}
              </ul>
              {result.pendingGive > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs text-white/70">
                    La case l’oblige à <strong className="text-white">donner {result.pendingGive} gorgée(s)</strong> à
                    quelqu’un d’autre :
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {players
                      .filter((p) => p.id !== croupier?.id)
                      .map((p) => (
                        <button key={p.id} type="button" onClick={() => apply(p.id)} className="btn-ghost !px-2 !py-1 text-xs">
                          {p.name}
                        </button>
                      ))}
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => apply()} className="btn-primary mt-auto w-full justify-center !py-2 text-sm">
                  {result.relance ? 'Relancer' : 'Valider & suivant'}
                </button>
              )}
              <WaterGlass id="casino-panel" size="sm" className="self-end" />
            </motion.div>
          )}
        </div>
      </div>
      <div className="card space-y-2 p-3">
        <p className="text-[11px] uppercase tracking-widest text-white/45">Numéros porte-bonheur</p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {players.map((p) => (
            <div key={p.id} className="min-w-[120px] rounded-xl bg-white/5 p-2">
              <div className="mb-1 flex items-center gap-1.5">
                <PlayerAvatar player={p} size="sm" />
                <span className="truncate text-xs font-medium">{p.name}</span>
              </div>
              <p className="text-[10px] leading-relaxed text-white/55">{(lucky[p.id] ?? []).join(', ')}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}