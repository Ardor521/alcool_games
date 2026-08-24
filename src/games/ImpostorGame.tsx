import { useSyncedMap, useSyncedState } from '../lib/useSyncedState'
import { useParty } from '../context/PartyContext'
import { IMPOSTOR_WORDS } from '../lib/catalog'
import { pick, shuffle } from '../lib/utils'
import { PlayerAvatar } from '../components/PlayerAvatar'
import { SipButtons } from '../components/SipToast'

type Phase = 'deal' | 'talk' | 'vote' | 'end'

export function ImpostorGame() {
  const { players, addSips, selfId, connected } = useParty()
  const [round, setRound] = useSyncedState('imp.round', 0)
  const [secret] = useSyncedState(`imp.secret.${round}`, () => {
    const word = pick(IMPOSTOR_WORDS)
    const impostor = pick(players)
    return { word, impostorId: impostor?.id ?? players[0]?.id ?? '', order: shuffle(players) }
  })
  const [i, setI] = useSyncedState('imp.i', 0)
  const [votes, setVoteField, resetVotes] = useSyncedMap<string>('imp.votes')
  const [phase, setPhase] = useSyncedState<Phase>('imp.phase', 'deal')
  const viewer = secret.order[i]
  const counts: Record<string, number> = {}
  Object.values(votes).forEach((id) => {
    counts[id] = (counts[id] ?? 0) + 1
  })
  const max = Math.max(0, ...Object.values(counts))
  const accused = players.filter((p) => (counts[p.id] ?? 0) === max && max > 0)
  const impostor = players.find((p) => p.id === secret.impostorId)

  return (
    <div className="space-y-4">
      {phase === 'deal' && viewer && (
        <div className="card space-y-4 p-5 text-center">
          <p className="text-sm text-white/60">
            {connected && selfId ? 'Regarde ton rôle' : 'Passe le téléphone à'}
          </p>
          <p className="font-display text-3xl">
            {connected && selfId ? players.find((p) => p.id === selfId)?.name ?? viewer.name : viewer.name}
          </p>
          <details className="rounded-xl bg-white/5 p-4 text-left">
            <summary className="cursor-pointer text-center text-sm text-fuchsia-200">Je suis seul(e), montrer</summary>
            <p className="mt-3 text-center font-display text-2xl normal-case tracking-normal">
              {(connected && selfId ? selfId : viewer.id) === secret.impostorId
                ? 'Tu es l’IMPOSTEUR'
                : secret.word}
            </p>
            <p className="mt-2 text-center text-xs text-white/45">
              {(connected && selfId ? selfId : viewer.id) === secret.impostorId
                ? 'Devine le mot en écoutant les autres. Ne te fais pas griller.'
                : 'Décris le mot sans le dire. Trouvez l’imposteur.'}
            </p>
          </details>
          <button
            type="button"
            className="btn-primary w-full justify-center"
            onClick={() => {
              if (i + 1 >= secret.order.length) setPhase('talk')
              else setI((x) => x + 1)
            }}
          >
            Cacher & suivant
          </button>
        </div>
      )}
      {phase === 'talk' && (
        <div className="card space-y-3 p-5 text-center">
          <p className="text-sm text-white/65">Chacun décrit le mot (sans le dire) en un indice. Puis votez.</p>
          <button type="button" onClick={() => setPhase('vote')} className="btn-primary w-full justify-center">
            Passer au vote
          </button>
        </div>
      )}
      {phase === 'vote' && (
        <div className="space-y-3">
          {players.map((p) => (
            <div key={p.id} className="card space-y-2 p-3">
              <p className="text-sm font-medium">{p.name} vote contre…</p>
              <div className="flex flex-wrap gap-2">
                {players
                  .filter((o) => o.id !== p.id)
                  .map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => setVoteField(p.id, o.id)}
                      disabled={!!connected && !!selfId && p.id !== selfId}
                      className={`rounded-full px-3 py-1 text-xs ${votes[p.id] === o.id ? 'bg-white text-black' : 'bg-white/10'}`}
                    >
                      {o.name}
                    </button>
                  ))}
              </div>
            </div>
          ))}
          <button
            type="button"
            disabled={Object.keys(votes).length < players.length}
            onClick={() => setPhase('end')}
            className="btn-primary w-full justify-center disabled:opacity-40"
          >
            Révéler
          </button>
        </div>
      )}
      {phase === 'end' && impostor && (
        <div className="card space-y-3 p-5">
          <p className="text-sm text-white/60">Le mot était</p>
          <p className="font-display text-3xl">{secret.word}</p>
          <div className="flex items-center gap-2">
            <PlayerAvatar player={impostor} />
            <p>
              Imposteur : <strong>{impostor.name}</strong>
            </p>
          </div>
          <p className="text-sm text-white/70">Accusé(s) : {accused.map((p) => p.name).join(', ') || '—'}</p>
          <p className="text-sm text-white/60">
            Si l’imposteur est accusé, il boit 3. Sinon tout le monde sauf lui boit 2.
          </p>
          <button
            type="button"
            onClick={() => {
              if (accused.some((p) => p.id === impostor.id)) addSips(impostor.id, 3)
              else players.filter((p) => p.id !== impostor.id).forEach((p) => addSips(p.id, 2))
              setRound((r) => r + 1)
              setI(0)
              resetVotes()
              setPhase('deal')
            }}
            className="btn-primary w-full justify-center"
          >
            Appliquer & nouvelle manche
          </button>
          <SipButtons onSip={(n) => addSips(impostor.id, n)} />
        </div>
      )}
    </div>
  )
}