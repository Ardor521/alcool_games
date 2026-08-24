import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useParty } from '../context/PartyContext'
import { useSyncedMap, useSyncedState } from '../lib/useSyncedState'
import { newDeck } from '../lib/cards'
import { shuffle } from '../lib/utils'
import type { PlayingCard } from '../types'
import { CardView } from '../components/CardView'
import { PlayerAvatar } from '../components/PlayerAvatar'
import { WaterGlass } from '../components/WaterGlass'

type Hand = { id: string; pile: PlayingCard[]; won: PlayingCard[]; streak: number; shields: number }
type Phase = 'pick' | 'ready' | 'play' | 'war' | 'over'

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
  const { players, addSips, selfId, connected } = useParty()
  const [idA, setIdA] = useSyncedState('war.idA', players[0]?.id ?? '')
  const [idB, setIdB] = useSyncedState('war.idB', players[1]?.id ?? players[0]?.id ?? '')
  const [handA, setHandA] = useSyncedState<Hand | null>('war.handA', null)
  const [handB, setHandB] = useSyncedState<Hand | null>('war.handB', null)
  const [phase, setPhase] = useSyncedState<Phase>('war.phase', 'pick')
  const [showA, setShowA] = useSyncedState<PlayingCard | null>('war.showA', null)
  const [showB, setShowB] = useSyncedState<PlayingCard | null>('war.showB', null)
  const [face, setFace] = useSyncedState('war.face', false)
  const [wars, setWars] = useSyncedState('war.wars', 0)
  const [pot, setPot] = useSyncedState<PlayingCard[]>('war.pot', [])
  const [msg, setMsg] = useSyncedState('war.msg', 'Choisis 2 joueurs. Chacun reçoit un jeu de 52 cartes.')
  const [log, setLog] = useSyncedState<string[]>('war.log', [])
  const [adjust, setAdjust] = useSyncedState<string | null>('war.adjust', null)
  const [ready, setReadyField, resetReady] = useSyncedMap<boolean>('war.ready')

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
    resetReady()
    setPhase('ready')
    setMsg('Chacun tape Prêt. Les deux cartes se retournent en même temps.')
  }

  const take = (h: Hand) => {
    const rec = recycle(h)
    if (rec.pile.length === 0) return { card: null as PlayingCard | null, next: rec }
    const [c, ...rest] = rec.pile
    return { card: c, next: { ...rec, pile: rest } }
  }

  const flipNow = (cA: PlayingCard, cB: PlayingCard, nA: Hand, nB: Hand, potCards: PlayingCard[], warN: number) => {
    setShowA(cA)
    setShowB(cB)
    setFace(true)
    setHandA(nA)
    setHandB(nB)
    setPot(potCards)
    resolve(cA, cB, nA, nB, potCards, warN)
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
    resetReady()
  }

  const bothReady = !!(ready[idA] && ready[idB])

  const drawRound = (isWar: boolean) => {
    if (!handA || !handB) return
    let a = recycle(handA)
    let b = recycle(handB)
    if (count(a) === 0 || count(b) === 0) {
      setPhase('over')
      setMsg('Plus de cartes : fin de partie.')
      return
    }
    const buried: PlayingCard[] = []
    if (isWar) {
      for (let i = 0; i < 3; i += 1) {
        const ta = take(a)
        a = ta.next
        if (ta.card) buried.push(ta.card)
        const tb = take(b)
        b = tb.next
        if (tb.card) buried.push(tb.card)
      }
    }
    const ta = take(a)
    const tb = take(b)
    if (!ta.card || !tb.card) {
      setPhase('over')
      setMsg('Plus assez de cartes pour la bataille.')
      return
    }
    const potCards = isWar ? [...pot, ...buried, ta.card, tb.card] : [ta.card, tb.card]
    flipNow(ta.card, tb.card, ta.next, tb.next, potCards, isWar ? wars : 0)
  }

  const markReady = (id: string) => {
    if (ready[id]) return
    const nowBoth = (id === idA || !!ready[idA]) && (id === idB || !!ready[idB])
    setReadyField(id, true)
    if (nowBoth) {
      window.setTimeout(() => {
        drawRound(phase === 'war')
        resetReady()
      }, 120)
    }
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
          <div className="flex items-end justify-center gap-4 sm:gap-10">
            <div className="text-center">
              <p className="mb-1 text-[10px] uppercase text-white/40">{pA.name}</p>
              <CardView
                card={showA}
                faceUp={face && !!showA}
                small={connected && selfId === idB}
              />
            </div>
            <motion.div className="pb-10 font-display text-xl text-fuchsia-200">VS</motion.div>
            <div className="text-center">
              <p className="mb-1 text-[10px] uppercase text-white/40">{pB.name}</p>
              <CardView
                card={showB}
                faceUp={face && !!showB}
                small={connected && selfId === idA}
              />
            </div>
          </div>
          {pot.length > 2 && <p className="text-center text-xs text-amber-200">En jeu : {pot.length} cartes</p>}
          <p className="text-center text-sm text-white/80">{msg}</p>
          {(phase === 'play' || phase === 'ready' || phase === 'war') && (
            <div className="grid grid-cols-2 gap-2">
              {[pA, pB].map((pl) => {
                const mine = !connected || !selfId || selfId === pl.id
                const isReady = !!ready[pl.id]
                return (
                  <button
                    key={pl.id}
                    type="button"
                    disabled={!mine || isReady}
                    onClick={() => markReady(pl.id)}
                    className={`justify-center py-3 ${isReady ? 'btn-ghost opacity-70' : 'btn-primary'}`}
                  >
                    {isReady ? `${pl.name} prêt ✓` : mine ? `Prêt — ${pl.name}` : `En attente de ${pl.name}`}
                  </button>
                )
              })}
            </div>
          )}
          {bothReady && <p className="text-center text-xs text-fuchsia-200">Les deux sont prêts — révélation…</p>}
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