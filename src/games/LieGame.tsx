import { useSyncedMap, useSyncedState } from '../lib/useSyncedState'
import { useParty } from '../context/PartyContext'
import { LIE_STARTERS } from '../lib/catalog'
import { pick } from '../lib/utils'
import { TurnBanner } from '../components/TurnBanner'
import { PlayerAvatar } from '../components/PlayerAvatar'
import { SipButtons } from '../components/SipToast'

export function LieGame() {
  const { players, addSips, selfId, connected } = useParty()
  const [turn, setTurn] = useSyncedState('lie.turn', 0)
  const [starter, setStarter] = useSyncedState('lie.start', () => pick(LIE_STARTERS))
  const [votes, setVoteField, resetVotes] = useSyncedMap<number>('lie.votes')
  const [lie, setLie] = useSyncedState<number | null>('lie.lie', null)
  const teller = players[turn % Math.max(players.length, 1)]

  return (
    <div className="space-y-4">
      <TurnBanner playerId={teller?.id} label="Conteur" hint="2 vérités, 1 mensonge." />
      <div className="card p-5">
        <p className="text-xs uppercase tracking-widest text-fuchsia-200">Au micro</p>
        <p className="font-display text-2xl">{teller?.name}</p>
        <p className="mt-2 text-sm text-white/65">
          Dis 3 phrases à voix haute (2 vraies, 1 fausse). Amorce : « {starter} »
        </p>
        <p className="mt-2 text-xs text-white/45">
          Indique en secret quelle phrase est le mensonge, puis le groupe vote.
        </p>
        <div className="mt-3 flex gap-2">
          {[1, 2, 3].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setLie(n)}
              className={`rounded-full px-3 py-1 text-xs ${lie === n ? 'bg-fuchsia-500' : 'bg-white/10'}`}
            >
              Mensonge = #{n}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        {players
          .filter((p) => p.id !== teller?.id)
          .map((p) => (
            <div key={p.id} className="card flex items-center gap-2 px-3 py-2">
              <PlayerAvatar player={p} size="sm" />
              <span className="flex-1 text-sm">{p.name}</span>
              {[1, 2, 3].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setVoteField(p.id, n)}
                  disabled={!!connected && !!selfId && p.id !== selfId}
                  className={`h-8 w-8 rounded-lg text-xs ${votes[p.id] === n ? 'bg-white text-black' : 'bg-white/10'}`}
                >
                  {n}
                </button>
              ))}
            </div>
          ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={!lie}
          onClick={() => {
            if (!lie) return
            players.forEach((p) => {
              if (p.id === teller.id) return
              if (votes[p.id] && votes[p.id] !== lie) addSips(p.id, 1)
              if (votes[p.id] === lie) addSips(teller.id, 1)
            })
          }}
          className="btn-ghost justify-center disabled:opacity-40"
        >
          Révéler & marquer
        </button>
        <button
          type="button"
          onClick={() => {
            setTurn((t) => t + 1)
            setStarter(pick(LIE_STARTERS))
            resetVotes()
            setLie(null)
          }}
          className="btn-primary justify-center"
        >
          Joueur suivant
        </button>
      </div>
      {teller && (
        <div className="card p-3">
          <SipButtons onSip={(n) => addSips(teller.id, n)} />
        </div>
      )}
    </div>
  )
}