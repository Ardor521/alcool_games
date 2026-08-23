import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useParty } from '../context/PartyContext'
import { newDeck } from '../lib/cards'
import { shuffle } from '../lib/utils'
import type { PlayingCard } from '../types'
import { CardView } from '../components/CardView'
import { PlayerAvatar } from '../components/PlayerAvatar'
import { WaterGlass } from '../components/WaterGlass'

type Hand = { id: string; pile: PlayingCard[]; won: PlayingCard[]; streak: number; shields: number }
type Phase = 'pick' | 'play' | 'war' | 'over'

function recycle(h: Hand): Hand {
  return h.pile.length > 0 || h.won.length === 0 ? h : { ...h, pile: shuffle(h.won), won: [] }
}

function count(h: Hand) {
  return h.pile.length + h.won.length
}

function streakBonus(s: number) {
  return s >= 5 ? 3 : s >= 4 ? 2 : s >= 2 ? 1 : 0
}

function warSips(diff: number, wars: number) {
  return wars > 0 ? Math.min(6, 2 + wars * 2) : diff >= 8 ? 3 : diff >= 4 ? 2 : 1
}

export function WarBattle() {
  const { players, addSips } = useParty()
  const [idA, setIdA] = useState(players[0]?.id ?? '')
  const [idB, setIdB] = useState(players[1]?.id ?? players[0]?.id ?? '')
  const [handA, setHandA] = useState<Hand | null>(null)
  const [handB, setHandB] = useState<Hand | null>(null)
  const [phase, setPhase] = useState<Phase>('pick')
  const [showA, setShowA] = useState<PlayingCard | null>(null)
  const [showB, setShowB] = useState<PlayingCard | null>(null)
  const [face, setFace] = useState(false)
  const [busy, setBusy] = useState(false)
  const [wars, setWars] = useState(0)
  const [pot, setPot] = useState<PlayingCard[]>([])
  const [msg, setMsg] = useState('Choisis 2 joueurs. Chacun reçoit un jeu de 52 cartes.')
  const [log, setLog] = useState<string[]>([])
  const [adjust, setAdjust] = useState<string | null>(null)

  const pA = players.find((p) => p.id === idA)
  const pB = players.find((p) => p.id === idB)
  const list = useMemo(() => players, [players])

  const make = (id: string): Hand => ({ id, pile: newDeck(), won: [], streak: 0, shields: 0 })

  const deal = () => {
    if (!idA || !idB || idA === idB) {
      setMsg('Choisis deux joueurs différents.')
      return
    }
    const a = make(idA)
    const b = make(idB)
    setHandA(a)
    setHandB(b)
    setShowA(a.pile[0] ?? null)
    setShowB(b.pile[0] ?? null)
    setFace(false)
    setWars(0)
    setPot([])
    setAdjust(null)
    setLog([])
    setPhase('play')
    setMsg('Les cartes sont déjà sur la table. Tape Jouer pour les retourner.')
  }

  const take = (h: Hand) => {
    const rec = recycle(h)
    if (rec.pile.length === 0) return { card: null as PlayingCard | null, next: rec }
    const [c, ...rest] = rec.pile
    return { card: c, next: { ...rec, pile: rest } }
  }

  const reveal = (cA: PlayingCard | null, cB: PlayingCard | null, then: () => void) => {
    setBusy(true)
    setFace(false)
    window.setTimeout(() => {
      setShowA(cA)
      setShowB(cB)
      setFace(true)
      window.setTimeout(() => {
        then()
        setBusy(false)
      }, 380)
    }, 320)
  }

  const applyWin = (winner: Hand, loser: Hand, sips: number, extra?: string) => {
    let nextLoser: Hand = { ...loser, streak: 0 }
    let blocked = false
    const streak = winner.streak + 1
    let nextWinner: Hand = { ...winner, streak }
    if ((streak === 3 || streak === 5) && nextWinner.shields < 2) {
      nextWinner = { ...nextWinner, shields: nextWinner.shields + 1 }
    }
    let pay = sips
    if (loser.shields > 0) {
      nextLoser = { ...nextLoser, shields: nextLoser.shields - 1 }
      blocked = true
      pay = 0
    } else if (loser.streak >= 4) {
      pay = sips * 2
    }
    if (pay > 0) addSips(loser.id, pay)
    if (streak >= 5) addSips(winner.id, 1)
    const wName = winner.id === idA ? pA?.name : pB?.name
    const lName = loser.id === idA ? pA?.name : pB?.name
    const bits = [
      `${wName} gagne (série ${streak}).`,
      blocked ? `Bouclier de ${lName} : 0 gorgée.` : `${lName} boit ${pay}${loser.streak >= 4 && pay > 0 ? ' (chute x2)' : ''}.`,
    ]
    if (streak === 2) bits.push('Avantage +1 activé.')
    if (streak === 3 || streak === 5) bits.push(`${wName} gagne un bouclier.`)
    if (streak === 4) bits.push('Pression : +2 infligés, défaite x2.')
    if (streak >= 5) bits.push(`Tyran : tribut 1 gorgée pour ${wName}.`)
    if (extra) bits.push(extra)
    setAdjust(blocked ? null : loser.id)
    setMsg(bits.join(' '))
    setLog((l) => [bits.join(' '), ...l].slice(0, 5))
    return { nextWinner, nextLoser }
  }

  const resolve = (cA: PlayingCard, cB: PlayingCard, nA: Hand, nB: Hand, potCards: PlayingCard[], warN: number) => {
    if (cA.value === cB.value) {
      setHandA(nA)
      setHandB(nB)
      setPot(potCards)
      setWars(warN + 1)
      setPhase('war')
      setMsg(`Égalité ${cA.rank}=${cB.rank}. Bataille x${warN + 1} : relance sur les mêmes emplacements.`)
      return
    }
    const aWins = cA.value > cB.value
    const diff = Math.abs(cA.value - cB.value)
    const bonus = streakBonus(aWins ? nA.streak : nB.streak)
    const sips = warSips(diff, warN) + bonus
    const extra = warN > 0 ? `Bataille x${warN}.` : ''
    if (aWins) {
      const r = applyWin({ ...nA, won: [...nA.won, ...potCards] }, nB, sips, extra)
      setHandA(r.nextWinner)
      setHandB(r.nextLoser)
    } else {
      const r = applyWin({ ...nB, won: [...nB.won, ...potCards] }, nA, sips, extra)
      setHandB(r.nextWinner)
      setHandA(r.nextLoser)
    }
    setPot([])
    setWars(0)
    setPhase('play')
  }

  const play = () => {
    if (!handA || !handB || busy) return
    let a = recycle(handA)
    let b = recycle(handB)
    if (count(a) === 0 || count(b) === 0) {
      setPhase('over')
      setMsg('Plus de cartes : fin de partie.')
      return
    }
    const ta = take(a)
    const tb = take(b)
    if (!ta.card || !tb.card) {
      setPhase('over')
      return
    }
    const potCards = [ta.card, tb.card]
    setPot(potCards)
    setHandA(ta.next)
    setHandB(tb.next)
    reveal(ta.card, tb.card, () => resolve(ta.card!, tb.card!, ta.next, tb.next, potCards, 0))
  }

  const war = () => {
    if (!handA || !handB || busy) return
    let a = recycle(handA)
    let b = recycle(handB)
    const buried: PlayingCard[] = []
    for (let i = 0; i < 3; i += 1) {
      const ta = take(a)
      a = ta.next
      if (ta.card) buried.push(ta.card)
      const tb = take(b)
      b = tb.next
      if (tb.card) buried.push(tb.card)
    }
    const fa = take(a)
    const fb = take(b)
    if (!fa.card || !fb.card) {
      setHandA(a)
      setHandB(b)
      setPhase('over')
      setMsg('Plus assez de cartes pour la bataille.')
      return
    }
    const potCards = [...pot, ...buried, fa.card, fb.card]
    setPot(potCards)
    setHandA(fa.next)
    setHandB(fb.next)
    reveal(fa.card, fb.card, () => resolve(fa.card!, fb.card!, fa.next, fb.next, potCards, wars))
  }

  const badges = (h: Hand | null) => {
    if (!h) return []
    const out: { label: string; cls: string }[] = []
    if (h.streak >= 5) out.push({ label: `Tyran x${h.streak}`, cls: 'bg-rose-500 text-white' })
    else if (h.streak === 4) out.push({ label: 'Pression x4', cls: 'bg-orange-400 text-black' })
    else if (h.streak === 3) out.push({ label: 'Série x3', cls: 'bg-fuchsia-400 text-black' })
    else if (h.streak === 2) out.push({ label: 'Avantage +1', cls: 'bg-amber-300 text-black' })
    else if (h.streak === 1) out.push({ label: 'Série x1', cls: 'bg-white/10 text-white' })
    if (h.shields > 0) out.push({ label: `Bouclier x${h.shields}`, cls: 'bg-sky-300 text-black' })
    return out
  }

  return (
    <div className="space-y-4">
      <div className="card space-y-1 p-3 text-xs text-white/70">
        <p className="text-[10px] uppercase tracking-widest text-fuchsia-200">Séries</p>
        <p>
          <strong className="text-white">x2 Avantage</strong> — +1 gorgée infligée.
        </p>
        <p>
          <strong className="text-white">x3 Protection</strong> — +1 bouclier (annule une défaite).
        </p>
        <p>
          <strong className="text-white">x4 Pression</strong> — +2 infligés, chute x2.
        </p>
        <p>
          <strong className="text-white">x5 Tyran</strong> — +3 infligés, +1 bouclier, tribut 1 gorgée.
        </p>
      </div>
      {phase === 'pick' && (
        <div className="card space-y-3 p-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1 text-xs text-white/60">
              Joueur A
              <select
                className="w-full rounded-xl bg-white/10 px-2 py-2 text-sm text-white outline-none"
                value={idA}
                onChange={(e) => setIdA(e.target.value)}
              >
                {list.map((p) => (
                  <option key={p.id} value={p.id} className="bg-zinc-900">
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-xs text-white/60">
              Joueur B
              <select
                className="w-full rounded-xl bg-white/10 px-2 py-2 text-sm text-white outline-none"
                value={idB}
                onChange={(e) => setIdB(e.target.value)}
              >
                {list.map((p) => (
                  <option key={p.id} value={p.id} className="bg-zinc-900">
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button type="button" onClick={deal} className="btn-primary w-full justify-center py-3">
            Distribuer les 2 jeux
          </button>
        </div>
      )}
      {phase !== 'pick' && handA && handB && pA && pB && (
        <>
          <div className="grid grid-cols-2 gap-2">
            {[handA, handB].map((h, i) => {
              const pl = i === 0 ? pA : pB
              return (
                <div key={h.id} className={`card space-y-1.5 p-2 ${i === 1 ? 'text-right' : ''}`}>
                  <div className={`flex items-center gap-2 ${i === 1 ? 'flex-row-reverse' : ''}`}>
                    <PlayerAvatar player={pl} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{pl.name}</p>
                      <p className="text-[11px] text-white/50">{count(h)} cartes</p>
                    </div>
                  </div>
                  <div className={`flex flex-wrap gap-1 ${i === 1 ? 'justify-end' : ''}`}>
                    {badges(h).length === 0 && <span className="text-[10px] text-white/35">Aucune série</span>}
                    {badges(h).map((b) => (
                      <span key={b.label} className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${b.cls}`}>
                        {b.label}
                      </span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="flex items-end justify-center gap-5 sm:gap-10">
            <CardView card={showA} faceUp={face && !!showA} />
            <motion.div className="pb-10 font-display text-xl text-fuchsia-200">VS</motion.div>
            <CardView card={showB} faceUp={face && !!showB} />
          </div>
          {pot.length > 2 && <p className="text-center text-xs text-amber-200">En jeu : {pot.length} cartes</p>}
          <p className="text-center text-sm text-white/80">{msg}</p>
          {phase === 'play' && (
            <button type="button" disabled={busy} onClick={play} className="btn-primary w-full justify-center py-3 disabled:opacity-50">
              {face ? 'Manche suivante (retourne ici)' : 'Retourner les cartes'}
            </button>
          )}
          {phase === 'war' && (
            <button type="button" disabled={busy} onClick={war} className="btn-primary w-full justify-center py-3 disabled:opacity-50">
              Relancer la bataille ici {wars > 1 ? `x${wars}` : ''}
            </button>
          )}
          {adjust && (
            <div className="card p-3">
              <p className="mb-2 text-xs text-white/50">Ajuster les gorgées</p>
              <WaterGlass id="war-water" size="sm" />
            </div>
          )}
          {log.length > 0 && (
            <div className="space-y-1 text-xs text-white/45">
              {log.map((l, i) => (
                <p key={`${i}-${l.slice(0, 16)}`}>• {l}</p>
              ))}
            </div>
          )}
          {phase === 'over' && (
            <div className="card space-y-3 p-4 text-center">
              <p className="font-display text-2xl">Fin de la bataille</p>
              <button
                type="button"
                onClick={() => {
                  const loser = count(handA) > count(handB) ? pB : pA
                  addSips(loser.id, 4)
                  deal()
                }}
                className="btn-primary w-full justify-center"
              >
                Perdant +4 & nouvelle partie
              </button>
              <button type="button" onClick={() => setPhase('pick')} className="btn-ghost w-full justify-center">
                Changer les joueurs
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}