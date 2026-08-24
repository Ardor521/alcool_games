import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Copy, DoorOpen, Link2, LogOut, Radio, Users, Wifi } from 'lucide-react'
import { useRoom } from '../context/RoomContext'
import { useParty } from '../context/PartyContext'
import { PlayerAvatar } from '../components/PlayerAvatar'
import { WaterGlass } from '../components/WaterGlass'
import { normalizeRoomCode } from '../lib/roomCode'
import { PlayNowBar } from '../components/PlayNowBar'

export function Salon() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const room = useRoom()
  const { allPlayers } = useParty()
  const [name, setName] = useState(room.selfName)
  const [code, setCode] = useState(params.get('code') ?? '')
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState('')

  useEffect(() => {
    const q = params.get('code')
    if (q) setCode(normalizeRoomCode(q))
  }, [params])

  const shareUrl = useMemo(() => {
    if (!room.roomCode || typeof window === 'undefined') return ''
    return `${window.location.origin}/salon?code=${room.roomCode}`
  }, [room.roomCode])

  const create = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      await room.createRoom(name)
    } catch {
      /* error set in RoomContext */
    } finally {
      setBusy(false)
    }
  }

  const join = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      await room.joinRoom(code, name)
    } catch {
      /* error set in RoomContext */
    } finally {
      setBusy(false)
    }
  }

  const copy = async (text: string, kind: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(kind)
      window.setTimeout(() => setCopied(''), 1600)
    } catch {
      /* ignore */
    }
  }

  if (room.connected && room.roomCode) {
    return (
      <div className="space-y-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-3xl">Salon {room.roomCode}</h1>
            <WaterGlass id="salon-live" size="sm" />
          </div>
          <p className="mt-1 text-sm text-white/60">
            {room.isHost ? 'Tu es l’hôte. Tes potes rejoignent avec ce code.' : `Table de ${room.hostName}.`}
          </p>
        </div>

        <div className="card space-y-4 p-5 text-center">
          <p className="text-[11px] uppercase tracking-[0.25em] text-fuchsia-200">Code du salon</p>
          <p className="font-display text-6xl tracking-[0.18em] text-white">{room.roomCode}</p>
          <div className="flex flex-wrap justify-center gap-2">
            <button type="button" className="btn-ghost text-sm" onClick={() => copy(room.roomCode!, 'code')}>
              <Copy className="h-4 w-4" />
              {copied === 'code' ? 'Copié' : 'Copier le code'}
            </button>
            <button type="button" className="btn-ghost text-sm" onClick={() => copy(shareUrl, 'link')}>
              <Link2 className="h-4 w-4" />
              {copied === 'link' ? 'Lien copié' : 'Copier le lien'}
            </button>
          </div>
          <p className="text-xs text-white/40 break-all">{shareUrl}</p>
        </div>

        <div className="card space-y-3 p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-widest text-white/45">Autour de la table</p>
            <span className="inline-flex items-center gap-1 text-xs text-emerald-300">
              <Wifi className="h-3.5 w-3.5" />
              {allPlayers.filter((p) => p.online !== false).length} en ligne
            </span>
          </div>
          <div className="space-y-2">
            {allPlayers.map((p) => (
              <div key={p.id} className="flex items-center gap-3">
                <PlayerAvatar player={p} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {p.name}
                    {p.id === room.selfId && (
                      <span className="ml-2 rounded-full bg-fuchsia-500/20 px-1.5 py-0.5 text-[10px] uppercase text-fuchsia-200">
                        toi
                      </span>
                    )}
                    {room.isHost && p.id === room.selfId && (
                      <span className="ml-1 rounded-full bg-amber-400/15 px-1.5 py-0.5 text-[10px] uppercase text-amber-200">
                        hôte
                      </span>
                    )}
                  </p>
                  <p className="text-[11px] text-white/40">{p.online === false ? 'hors ligne' : 'connecté'}</p>
                </div>
                <span className={`h-2 w-2 rounded-full ${p.online === false ? 'bg-white/20' : 'bg-emerald-400'}`} />
              </div>
            ))}
          </div>
        </div>

        {!room.isHost && (
          <p className="card p-4 text-sm text-white/70">
            Balade-toi dans Joueurs, Jeux ou Stats. Reviens à la table avec « Partie en cours ».
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {room.isHost ? (
            <Link to="/jeux" className="btn-primary flex-1 justify-center">
              Lancer un jeu
            </Link>
          ) : (
            <div className="flex flex-1 justify-center">
              <PlayNowBar />
            </div>
          )}
          <button type="button" onClick={room.leaveRoom} className="btn-ghost text-rose-200">
            <LogOut className="h-4 w-4" />
            Quitter
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="font-display text-3xl">Salon en ligne</h1>
          <WaterGlass id="salon-title" size="sm" />
        </div>
        <p className="mt-1 text-sm text-white/60">
          Chaque téléphone est un joueur. Crée un salon, envoie le code, et tout le monde joue sur la même table.
        </p>
      </div>

      <form onSubmit={create} className="card space-y-3 p-4">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <Radio className="h-4 w-4 text-fuchsia-300" />
          Créer un salon
        </p>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ton prénom"
          maxLength={18}
          className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm outline-none"
        />
        <button type="submit" disabled={busy} className="btn-primary w-full justify-center disabled:opacity-50">
          {busy && room.status === 'connecting' ? 'Ouverture…' : 'Ouvrir le salon'}
        </button>
      </form>

      <form onSubmit={join} className="card space-y-3 p-4">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <DoorOpen className="h-4 w-4 text-cyan-300" />
          Rejoindre
        </p>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ton prénom"
          maxLength={18}
          className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm outline-none"
        />
        <input
          value={code}
          onChange={(e) => setCode(normalizeRoomCode(e.target.value))}
          placeholder="Code (ex: 7K2P)"
          className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-center font-display text-2xl tracking-[0.3em] outline-none uppercase"
        />
        <button type="submit" disabled={busy} className="btn-primary w-full justify-center disabled:opacity-50">
          {busy && room.status === 'connecting' ? 'Connexion…' : 'Entrer dans le salon'}
        </button>
      </form>

      {room.error && <p className="text-sm text-rose-300">{room.error}</p>}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="card p-4">
          <Users className="mb-2 h-5 w-5 text-fuchsia-300" />
          <p className="font-semibold">Jusqu’à 12 téléphones</p>
          <p className="mt-1 text-sm text-white/60">Chacun voit les mêmes gorgées, le même tour, le même jeu.</p>
        </div>
        <div className="card p-4">
          <Wifi className="mb-2 h-5 w-5 text-fuchsia-300" />
          <p className="font-semibold">Sans compte</p>
          <p className="mt-1 text-sm text-white/60">Pair-à-pair. L’hôte garde le salon ouvert.</p>
        </div>
      </div>

      <button type="button" onClick={() => navigate('/joueurs')} className="btn-ghost w-full justify-center text-sm">
        Jouer sur un seul téléphone
      </button>
    </div>
  )
}