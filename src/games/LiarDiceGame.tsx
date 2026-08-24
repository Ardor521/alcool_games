import { useEffect, useMemo, useState } from 'react'
import { useSyncedMap, useSyncedState } from '../lib/useSyncedState'
import { useParty } from '../context/PartyContext'
import { useTableControl } from '../lib/useTableControl'
import { TurnBanner } from '../components/TurnBanner'
import { PlayerAvatar } from '../components/PlayerAvatar'
import { WaterGlass } from '../components/WaterGlass'

function roll5() {
  return Array.from({ length: 5 }, () => 1 + Math.floor(Math.random() * 6))
}

type Bid = { qty: number; face: number }
type Phase = 'roll' | 'see' | 'bid' | 'respond' | 'reveal'

function bidLabel(b: Bid) {
  return `${b.qty} × ${b.face}`
}

function higher(next: Bid, prev: Bid | null) {
  if (!prev) return next.qty >= 1
  if (next.qty > prev.qty) return true
  return next.qty === prev.qty && next.face > prev.face
}

function countFace(all: number[][], face: number) {
  const flat = all.flat()
  const wilds = flat.filter((n) => n === 1).length
  const faces = flat.filter((n) => n === face).length
  return { total: faces + wilds, faces, wilds, pool: flat.length }
}

function Cup({ n, highlight }: { n: number; highlight?: boolean }) {
  const isWild = n === 1
  return (
    <div
      className={`flex h-12 w-12 items-center justify-center rounded-xl font-black shadow sm:h-14 sm:w-14 sm:text-xl ${
        isWild
          ? 'bg-amber-300 text-amber-950 ring-2 ring-amber-100'
          : highlight
            ? 'bg-fuchsia-300 text-fuchsia-950 ring-2 ring-fuchsia-100'
            : 'bg-white text-zinc-900'
      }`}
    >
      {n}
    </div>
  )
}

function HiddenCup() {
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-amber-800 to-amber-950 text-amber-100 ring-1 ring-amber-400/40 sm:h-12 sm:w-12">
      ?
    </div>
  )
}

export function LiarDiceGame() {
  const { players, addSips, selfId, connected } = useParty()
  const { isHost, setControl } = useTableControl()
  const [turn, setTurn] = useSyncedState('liar.turn', 0)
  const [phase, setPhase] = useSyncedState<Phase>('liar.phase', 'roll')
  const [seeIndex, setSeeIndex] = useSyncedState('liar.see', 0)
  const [dice, setDiceField, resetDice] = useSyncedMap<number[]>('liar.dice')
  const [, setSeenField, resetSeen] = useSyncedMap<boolean>('liar.seen')
  const [bid, setBid] = useSyncedState<Bid | null>('liar.bid', null)
  const [qty, setQty] = useSyncedState('liar.qty', 1)
  const [face, setFace] = useSyncedState('liar.face', 2)
  const [msg, setMsg] = useSyncedState(
    'liar.msg',
    'Chaque joueur lance 5 dés. Le pari porte sur TOUS les dés de la table. Les 1 sont jokers.',
  )
  const [showOthers, setShowOthers] = useState(false)

  const totalDice = players.length * 5
  const announcer = players[turn % Math.max(players.length, 1)]
  const challenger = players[(turn + 1) % Math.max(players.length, 1)]
  const viewer = players[seeIndex % Math.max(players.length, 1)]
  const allDice = useMemo(() => players.map((p) => dice[p.id] ?? []), [players, dice])
  const result = bid ? countFace(allDice, bid.face) : null
  const activeId = phase === 'respond' || phase === 'reveal' ? challenger?.id : announcer?.id

  const me = connected ? players.find((p) => p.id === selfId) ?? players[0] : viewer ?? players[0]
  const myDice = me ? dice[me.id] : undefined
  const rolledCount = players.filter((p) => (dice[p.id] ?? []).length === 5).length
  const allRolled = players.length > 0 && rolledCount >= players.length

  const beginRound = () => {
    resetDice()
    resetSeen()
    setBid(null)
    setQty(Math.max(1, Math.min(3, Math.ceil(totalDice / 4))))
    setFace(2)
    setSeeIndex(0)
    setShowOthers(false)
    setPhase('see')
    setControl('all')
    setMsg(
      connected
        ? `Chacun lance ses 5 dés sur son téléphone. Pari sur ${totalDice} dés.`
        : `Chaque joueur lance ses 5 dés. Pari sur ${totalDice} dés au total.`,
    )
  }

  const rollMine = () => {
    const target = connected ? me : viewer
    if (!target) return
    if (connected && selfId && target.id !== selfId && !isHost) return
    setDiceField(target.id, roll5())
    setSeenField(target.id, true)
    if (!connected) {
      const nextRemaining = players.filter((p) => p.id !== target.id && (dice[p.id] ?? []).length !== 5)
      if (nextRemaining.length === 0 && rolledCount + 1 >= players.length) {
        setPhase('bid')
        setMsg(`${announcer?.name} ouvre les enchères sur les ${totalDice} dés.`)
      }
    }
  }

  const confirmAllRolled = () => {
    setPhase('bid')
    setControl('turn')
    setMsg(`${announcer?.name} ouvre les enchères sur les ${totalDice} dés de la table.`)
  }

  useEffect(() => {
    if (phase === 'see' && allRolled) {
      setPhase('bid')
      setControl('turn')
      setMsg(`${announcer?.name} ouvre les enchères sur les ${totalDice} dés de la table.`)
    }
  }, [phase, allRolled])

  const announce = () => {
    const nextBid = { qty, face }
    if (!higher(nextBid, bid)) {
      setMsg('Il faut monter : plus de dés, ou même quantité avec une face plus haute.')
      return
    }
    setBid(nextBid)
    setShowOthers(false)
    setPhase('respond')
    setMsg(
      `${announcer?.name} parie ${bidLabel(nextBid)} sur les ${totalDice} dés. ${challenger?.name} relance ou doute.`,
    )
  }

  const raise = () => {
    setTurn((t) => t + 1)
    setShowOthers(false)
    if (bid) {
      if (bid.face < 6) {
        setQty(Math.min(totalDice, bid.qty))
        setFace(bid.face + 1)
      } else {
        setQty(Math.min(totalDice, bid.qty + 1))
        setFace(bid.face)
      }
    }
    setPhase('bid')
    setMsg(`${challenger?.name} relance. Regarde tes dés, puis monte l’enchère.`)
  }

  const callLiar = () => {
    if (!bid || !announcer || !challenger) return
    const tally = countFace(allDice, bid.face)
    setShowOthers(false)
    setPhase('reveal')
    if (tally.total >= bid.qty) {
      addSips(challenger.id, 2)
      setMsg(
        `Vrai : ${tally.total} × ${bid.face} sur ${tally.pool} dés (${tally.faces} + ${tally.wilds} joker${tally.wilds > 1 ? 's' : ''}). ${challenger.name} doute à tort et boit 2.`,
      )
    } else {
      addSips(announcer.id, 2)
      setMsg(`Menteur ! Seulement ${tally.total} × ${bid.face} sur ${tally.pool} dés. ${announcer.name} boit 2.`)
    }
  }

  return (
    <div className="space-y-4">
      <TurnBanner
        playerId={phase === 'see' ? viewer?.id : activeId}
        label={phase === 'see' ? 'Regarde tes dés' : phase === 'respond' ? 'À réagir' : 'Annonceur'}
        hint={bid ? `Enchère : ${bidLabel(bid)} / ${totalDice}` : `${totalDice} dés sur la table`}
      />

      <div className="card space-y-2 p-4">
        <p className="text-sm text-white/70">
          {players.length} joueur{players.length > 1 ? 's' : ''} × 5 dés ={' '}
          <strong className="text-white">{totalDice} dés</strong> au total. Les{' '}
          <strong className="text-amber-200">1 sont jokers</strong>. Le pari compte toutes les faces + les jokers.
        </p>
        <div className="flex flex-wrap gap-2">
          {players.map((p) => (
            <div key={p.id} className="flex items-center gap-1.5 rounded-full bg-white/5 px-2 py-1">
              <PlayerAvatar player={p} size="sm" />
              <span className="text-xs">{p.name}</span>
              <span className="text-[10px] text-white/45">
                {(dice[p.id] ?? []).length === 5 ? 'lancé ✓' : '5 dés'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-center text-sm text-white/80">{msg}</p>

      {phase === 'roll' && (
        <button type="button" onClick={beginRound} className="btn-primary w-full justify-center py-3">
          Nouvelle manche — {totalDice} dés
        </button>
      )}

      {phase === 'see' && (
        <div className="card space-y-4 p-5">
          <p className="text-center text-xs uppercase tracking-widest text-amber-200">
            {connected ? 'Lance tes 5 dés' : `Tour de lancer — ${me?.name ?? ''}`}
          </p>
          <p className="text-center font-display text-2xl">{me?.name}</p>
          <p className="text-center text-xs text-white/50">
            {rolledCount}/{players.length} ont lancé · {totalDice} dés dans le pari
          </p>
          {myDice && myDice.length === 5 ? (
            <div className="space-y-3">
              <div className="flex flex-wrap justify-center gap-2">
                {myDice.map((n, i) => (
                  <Cup key={i} n={n} />
                ))}
              </div>
              <p className="text-center text-[11px] text-white/45">Tes 5 dés. Les 1 dorés sont des jokers.</p>
            </div>
          ) : (
            <button type="button" onClick={rollMine} className="btn-primary w-full justify-center py-3">
              Lancer mes 5 dés
            </button>
          )}
          {!connected && myDice && myDice.length === 5 && !allRolled && (
            <button
              type="button"
              onClick={() => {
                const next = players.find((p) => (dice[p.id] ?? []).length !== 5)
                if (next) setSeeIndex(players.findIndex((p) => p.id === next.id))
              }}
              className="btn-ghost w-full justify-center"
            >
              Passer le téléphone
            </button>
          )}
          {allRolled && (
            <button type="button" onClick={confirmAllRolled} className="btn-primary w-full justify-center py-3">
              Tout le monde a lancé — ouvrir les paris
            </button>
          )}
        </div>
      )}

      {(phase === 'bid' || phase === 'respond') && announcer && (
        <div className="space-y-3">
          <div className="card space-y-3 p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs uppercase tracking-widest text-white/45">Tes 5 dés</p>
              <button
                type="button"
                onClick={() => setShowOthers((v) => !v)}
                className="text-xs text-fuchsia-200 underline"
              >
                {showOthers ? 'Masquer les autres' : 'Aperçu table (faces cachées)'}
              </button>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {(myDice ?? []).map((n, i) => (
                <Cup key={i} n={n} />
              ))}
            </div>
            {showOthers && (
              <div className="space-y-2">
                {players
                  .filter((p) => p.id !== me?.id)
                  .map((p) => (
                    <div key={p.id} className="flex items-center gap-2">
                      <span className="w-16 truncate text-xs text-white/60">{p.name}</span>
                      <div className="flex gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <HiddenCup key={i} />
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            )}
            <p className="text-center text-[11px] text-white/40">
              Pari commun : {totalDice} dés (tout le monde). Seuls tes dés sont visibles.
            </p>
          </div>

          {phase === 'bid' && (
            <div className="card space-y-3 p-4">
              <p className="text-sm">
                Pari sur la table entière (max {totalDice}). Doit battre {bid ? bidLabel(bid) : 'rien'}.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <label className="text-xs text-white/50">
                  Quantité (1–{totalDice})
                  <select
                    className="mt-1 w-full rounded-xl bg-white/10 px-2 py-2 text-sm text-white"
                    value={qty}
                    onChange={(e) => setQty(Number(e.target.value))}
                  >
                    {Array.from({ length: totalDice }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n} className="bg-zinc-900">
                        {n} / {totalDice}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs text-white/50">
                  Face
                  <select
                    className="mt-1 w-full rounded-xl bg-white/10 px-2 py-2 text-sm text-white"
                    value={face}
                    onChange={(e) => setFace(Number(e.target.value))}
                  >
                    {[2, 3, 4, 5, 6].map((n) => (
                      <option key={n} value={n} className="bg-zinc-900">
                        {n} (+ jokers)
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <button type="button" onClick={announce} className="btn-primary w-full justify-center">
                Annoncer {qty} × {face} sur {totalDice} dés
              </button>
            </div>
          )}

          {phase === 'respond' && bid && (
            <div className="space-y-2">
              <div className="card p-4 text-center">
                <p className="text-xs uppercase tracking-widest text-amber-200">Enchère en cours</p>
                <p className="mt-1 font-display text-4xl">{bidLabel(bid)}</p>
                <p className="mt-1 text-sm text-white/55">
                  sur {totalDice} dés (faces {bid.face} + jokers 1)
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={raise} className="btn-ghost justify-center py-3">
                  Je relance
                </button>
                <button type="button" onClick={callLiar} className="btn-primary justify-center py-3">
                  Menteur !
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {phase === 'reveal' && bid && result && (
        <div className="space-y-3">
          <div className="card space-y-2 p-4 text-center">
            <p className="text-xs uppercase tracking-widest text-amber-200">Décompte table entière</p>
            <p className="font-display text-4xl">
              {result.total} × {bid.face}
            </p>
            <p className="text-sm text-white/65">
              {result.faces} face{result.faces > 1 ? 's' : ''} {bid.face} + {result.wilds} joker
              {result.wilds > 1 ? 's' : ''} · {result.pool} dés au total
            </p>
            <p className="text-sm text-white/80">
              Pari : {bidLabel(bid)} — {result.total >= bid.qty ? 'tenu' : 'menti'}
            </p>
          </div>
          <div className="space-y-2">
            {players.map((p) => (
              <div key={p.id} className="card flex items-center gap-2 p-2">
                <PlayerAvatar player={p} size="sm" />
                <span className="w-16 truncate text-sm">{p.name}</span>
                <div className="flex flex-wrap gap-1">
                  {(dice[p.id] ?? []).map((n, i) => (
                    <Cup key={i} n={n} highlight={n === bid.face} />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              setTurn((t) => t + 1)
              setPhase('roll')
              resetDice()
              resetSeen()
              setBid(null)
              setShowOthers(false)
              setMsg('Nouvelle manche. Relancez les gobelets.')
            }}
            className="btn-primary w-full justify-center py-3"
          >
            Manche suivante
          </button>
        </div>
      )}

      <div className="flex justify-end">
        <WaterGlass id="liar-water" size="sm" />
      </div>
    </div>
  )
}