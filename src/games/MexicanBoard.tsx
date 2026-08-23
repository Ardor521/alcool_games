import { useMemo, useState } from 'react'
import { useParty } from '../context/PartyContext'
import { TurnBanner } from '../components/TurnBanner'
import { WaterGlass } from '../components/WaterGlass'
import { DiceFace } from '../components/DiceFace'

function rollDie() {
  return 1 + Math.floor(Math.random() * 6)
}

function score(a: number, b: number) {
  const hi = Math.max(a, b)
  const lo = Math.min(a, b)
  if (hi === 2 && lo === 1) return 210
  if (hi === lo) return 100 + hi
  return hi * 10 + lo
}

function label(a: number, b: number) {
  const hi = Math.max(a, b)
  const lo = Math.min(a, b)
  if (hi === 2 && lo === 1) return 'Mexicain'
  if (hi === lo) return `Double ${hi}`
  return `${hi}-${lo}`
}

const COMBOS = (() => {
  const a: [number, number][] = []
  for (let i = 1; i <= 6; i += 1) for (let j = 1; j <= i; j += 1) a.push([i, j])
  return a.sort((x, y) => score(x[0], x[1]) - score(y[0], y[1]))
})()

type Phase = 'roll' | 'peek' | 'announce' | 'respond' | 'reveal'

export function MexicanBoard() {
  const { players, addSips } = useParty()
  const [turn, setTurn] = useState(0)
  const [bar, setBar] = useState(0)
  const [dice, setDice] = useState<[number, number] | null>(null)
  const [claim, setClaim] = useState<[number, number] | null>(null)
  const [phase, setPhase] = useState<Phase>('roll')
  const [rerolls, setRerolls] = useState(1)
  const [msg, setMsg] = useState('Lance les dés en secret, puis annonce (ou bluffe).')
  const [shaking, setShaking] = useState(false)
  const shooter = players[turn % Math.max(players.length, 1)]
  const next = players[(turn + 1) % Math.max(players.length, 1)]
  const above = useMemo(() => COMBOS.filter(([a, b]) => score(a, b) > bar), [bar])
  const barLabel = useMemo(() => {
    const c = COMBOS.find(([a, b]) => score(a, b) === bar)
    return c ? label(c[0], c[1]) : null
  }, [bar])

  const throwDice = (keep?: 'left' | 'right') => {
    setShaking(true)
    window.setTimeout(() => {
      setDice((prev) => {
        const a = keep === 'left' && prev ? prev[0] : rollDie()
        const b = keep === 'right' && prev ? prev[1] : rollDie()
        return [a, b]
      })
      setPhase('peek')
      setShaking(false)
    }, 450)
  }

  const resetRound = (text: string) => {
    setTurn((t) => t + 1)
    setDice(null)
    setClaim(null)
    setPhase('roll')
    setRerolls(1)
    setMsg(text)
  }

  return (
    <div className="space-y-4">
      <TurnBanner
        playerId={phase === 'respond' || phase === 'reveal' ? next?.id : shooter?.id}
        label={phase === 'respond' || phase === 'reveal' ? 'À réagir' : 'Lanceur'}
        hint={
          phase === 'respond'
            ? `${shooter?.name} a annoncé ${claim ? label(claim[0], claim[1]) : ''}`
            : barLabel
              ? `Il faut battre ${barLabel}`
              : 'Aucune annonce en cours'
        }
      />
      <p className="text-sm text-white/65">
        2 dés interactifs. <strong className="text-white">2+1 = Mexicain</strong>, le plus fort. Relance possible une
        fois. Annonce un score plus haut (vrai ou bluff). Le suivant croit ou doute.
      </p>
      <div className="card flex min-h-[150px] flex-col items-center justify-center gap-3 p-5">
        {phase === 'roll' && <p className="text-white/50">Passe le téléphone à {shooter?.name}.</p>}
        {(phase === 'peek' || phase === 'reveal') && dice && (
          <div className={`flex gap-4 ${shaking ? 'animate-pulse' : ''}`}>
            <DiceFace n={dice[0]} />
            <DiceFace n={dice[1]} />
          </div>
        )}
        {phase === 'respond' && (
          <div className="text-center">
            <p className="text-xs uppercase tracking-widest text-amber-200">Annonce cachée</p>
            <p className="mt-2 font-display text-4xl">{claim ? label(claim[0], claim[1]) : ''}</p>
            <p className="mt-2 text-sm text-white/50">Les dés restent secrets tant que personne ne doute.</p>
          </div>
        )}
        <p className="text-center text-sm text-white/75">{msg}</p>
      </div>
      {phase === 'roll' && (
        <button type="button" onClick={() => throwDice()} className="btn-primary w-full justify-center py-3">
          Lancer les dés (secret)
        </button>
      )}
      {phase === 'peek' && dice && (
        <div className="space-y-2">
          <p className="text-center text-xs text-white/45">Seul {shooter?.name} doit regarder l’écran.</p>
          {rerolls > 0 && (
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                className="btn-ghost justify-center text-xs"
                onClick={() => {
                  setRerolls(0)
                  throwDice('right')
                }}
              >
                Relancer 1er
              </button>
              <button
                type="button"
                className="btn-ghost justify-center text-xs"
                onClick={() => {
                  setRerolls(0)
                  throwDice()
                }}
              >
                Relancer 2
              </button>
              <button
                type="button"
                className="btn-ghost justify-center text-xs"
                onClick={() => {
                  setRerolls(0)
                  throwDice('left')
                }}
              >
                Relancer 2e
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              if (dice) setClaim(dice)
              else if (!claim) return
              setPhase('announce')
            }}
            className="btn-primary w-full justify-center py-3"
          >
            Passer à l’annonce
          </button>
        </div>
      )}
      {phase === 'announce' && (
        <div className="card space-y-3 p-4">
          <p className="text-xs text-amber-200">Cache l’écran aux autres avant d’annoncer.</p>
          <p className="text-sm">Choisis ce que tu annonces (tu peux mentir) :</p>
          <select
            className="w-full rounded-xl bg-white/10 px-3 py-3 text-sm outline-none"
            value={claim ? `${Math.max(claim[0], claim[1])}-${Math.min(claim[0], claim[1])}` : ''}
            onChange={(e) => {
              const [a, b] = e.target.value.split('-').map(Number)
              setClaim([a, b])
            }}
          >
            {above.map(([a, b]) => (
              <option key={`${a}-${b}`} value={`${a}-${b}`}>
                {label(a, b)}
              </option>
            ))}
          </select>
          {above.length === 0 ? (
            <button
              type="button"
              className="btn-primary w-full justify-center"
              onClick={() => {
                if (shooter) addSips(shooter.id, 2)
                setBar(0)
                resetRound('Nouvelle manche.')
              }}
            >
              Plus rien au-dessus : boire 2 & reset
            </button>
          ) : (
            <button
              type="button"
              className="btn-primary w-full justify-center"
              onClick={() => {
                if (!claim || !shooter) return
                if (score(claim[0], claim[1]) <= bar) return
                setBar(score(claim[0], claim[1]))
                setPhase('respond')
                setMsg(`${shooter.name} annonce ${label(claim[0], claim[1])}. ${next?.name} croit ou doute.`)
              }}
            >
              Annoncer à {next?.name}
            </button>
          )}
        </div>
      )}
      {phase === 'respond' && (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => resetRound(`Cru. ${next?.name} doit faire mieux que l’annonce.`)}
            className="btn-ghost justify-center py-3"
          >
            Je crois
          </button>
          <button
            type="button"
            onClick={() => {
              setPhase('reveal')
              if (!dice || !claim || !shooter || !next) return
              const real = [Math.max(dice[0], dice[1]), Math.min(dice[0], dice[1])].join('-')
              const said = [Math.max(claim[0], claim[1]), Math.min(claim[0], claim[1])].join('-')
              if (real !== said) {
                addSips(shooter.id, 3)
                setMsg(`Menteur ! C’était ${label(dice[0], dice[1])}, pas ${label(claim[0], claim[1])}. ${shooter.name} boit 3.`)
              } else {
                addSips(next.id, 3)
                setMsg(`C’était vrai (${label(dice[0], dice[1])}). ${next.name} boit 3.`)
              }
              setBar(0)
            }}
            className="btn-primary justify-center py-3"
          >
            Menteur !
          </button>
        </div>
      )}
      {phase === 'reveal' && (
        <button type="button" onClick={() => resetRound('Nouvelle manche.')} className="btn-primary w-full justify-center py-3">
          Manche suivante
        </button>
      )}
      {shooter && (
        <div className="card p-3">
          <WaterGlass id="mexican-water" size="sm" />
        </div>
      )}
    </div>
  )
}