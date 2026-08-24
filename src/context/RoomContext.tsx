import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { DataConnection } from 'peerjs'
import type { Player } from '../types'
import { PLAYER_COLORS } from '../lib/catalog'
import { getSelfId, makeRoomCode, normalizeRoomCode, peerIdFor } from '../lib/roomCode'
import { guestMayAct, type ControlMode } from '../lib/control'

export type RoomAction =
  | { type: 'sips'; id: string; amount: number }
  | { type: 'addPlayer'; player: Player }
  | { type: 'removePlayer'; id: string }
  | { type: 'togglePause'; id: string }
  | { type: 'rename'; id: string; name: string }
  | { type: 'resetSips' }
  | { type: 'clearGuests' }
  | { type: 'water'; id: string }
  | { type: 'path'; path: string }
  | { type: 'turn'; id: string | null }
  | { type: 'gameSet'; key: string; value: unknown }
  | { type: 'gamePatch'; key: string; field: string; value: unknown }
  | { type: 'gameReset' }
  | { type: 'control'; mode: ControlMode }

type Snapshot = {
  v: number
  players: Player[]
  waterCount: number
  waterFound: string[]
  path: string
  turnId: string | null
  game: Record<string, unknown>
  hostName: string
  hostId: string | null
  control: ControlMode
}

type Wire =
  | { t: 'hello'; player: Player }
  | { t: 'action'; a: RoomAction; from: string }
  | { t: 'state'; s: Snapshot }
  | { t: 'bye'; id: string }
  | { t: 'ping' }

type Status = 'idle' | 'connecting' | 'connected' | 'error'

type RoomContextValue = {
  status: Status
  error: string
  roomCode: string | null
  isHost: boolean
  selfId: string
  selfName: string
  peerCount: number
  followTable: boolean
  setFollowTable: (v: boolean) => void
  players: Player[]
  waterCount: number
  waterFound: string[]
  path: string
  turnId: string | null
  game: Record<string, unknown>
  hostName: string
  hostId: string | null
  control: ControlMode
  connected: boolean
  createRoom: (name: string) => Promise<string>
  joinRoom: (code: string, name: string) => Promise<void>
  leaveRoom: () => void
  dispatch: (action: RoomAction) => void
  setGameKey: (key: string, value: unknown) => void
  patchGame: (key: string, field: string, value: unknown) => void
}

const RoomContext = createContext<RoomContextValue | null>(null)

const LAST_KEY = 'soiree-last-room-v1'

function emptySnap(hostName = ''): Snapshot {
  return {
    v: 0,
    players: [],
    waterCount: 0,
    waterFound: [],
    path: '/',
    turnId: null,
    game: {},
    hostName,
    hostId: null,
    control: 'host',
  }
}

function applyAction(prev: Snapshot, action: RoomAction): Snapshot {
  const next: Snapshot = {
    ...prev,
    v: prev.v + 1,
    players: prev.players.map((p) => ({ ...p })),
    waterFound: [...prev.waterFound],
    game: { ...prev.game },
  }
  switch (action.type) {
    case 'sips':
      next.players = next.players.map((p) =>
        p.id === action.id ? { ...p, sips: Math.max(0, p.sips + action.amount) } : p,
      )
      break
    case 'addPlayer': {
      if (next.players.length >= 12) break
      const exists = next.players.find(
        (p) => p.id === action.player.id || p.name.toLowerCase() === action.player.name.toLowerCase(),
      )
      if (exists) {
        next.players = next.players.map((p) =>
          p.id === exists.id
            ? { ...p, ...action.player, id: exists.id, sips: exists.sips, paused: exists.paused, online: true }
            : p,
        )
      } else {
        next.players = [...next.players, { ...action.player, online: true }]
      }
      break
    }
    case 'removePlayer':
      next.players = next.players.filter((p) => p.id !== action.id)
      break
    case 'togglePause':
      next.players = next.players.map((p) => (p.id === action.id ? { ...p, paused: !p.paused } : p))
      break
    case 'rename': {
      const name = action.name.trim().slice(0, 18)
      if (name) next.players = next.players.map((p) => (p.id === action.id ? { ...p, name } : p))
      break
    }
    case 'resetSips':
      next.players = next.players.map((p) => ({ ...p, sips: 0 }))
      break
    case 'clearGuests':
      next.players = next.players.filter((p) => p.device)
      break
    case 'water':
      if (!next.waterFound.includes(action.id)) {
        next.waterFound = [...next.waterFound, action.id]
        next.waterCount += 1
      }
      break
    case 'path':
      next.path = action.path
      if (action.path.startsWith('/jeu/') && action.path !== prev.path) {
        next.game = {}
      }
      break
    case 'turn':
      next.turnId = action.id
      break
    case 'gameSet':
      next.game = { ...next.game, [action.key]: action.value }
      break
    case 'gamePatch': {
      const prevMap =
        next.game[action.key] && typeof next.game[action.key] === 'object'
          ? (next.game[action.key] as Record<string, unknown>)
          : {}
      next.game = { ...next.game, [action.key]: { ...prevMap, [action.field]: action.value } }
      break
    }
    case 'gameReset':
      next.game = {}
      break
    case 'control':
      next.control = action.mode
      break
  }
  return next
}

function makePlayer(name: string, index: number, id: string): Player {
  return {
    id,
    name: name.trim().slice(0, 18),
    color: PLAYER_COLORS[index % PLAYER_COLORS.length],
    sips: 0,
    paused: false,
    online: true,
    device: true,
  }
}

export function RoomProvider({ children }: { children: ReactNode }) {
  const selfId = useMemo(() => (typeof window === 'undefined' ? 'ssr' : getSelfId()), [])
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')
  const [roomCode, setRoomCode] = useState<string | null>(null)
  const [isHost, setIsHost] = useState(false)
  const [selfName, setSelfName] = useState('')
  const [followTable, setFollowTable] = useState(true)
  const [snap, setSnap] = useState<Snapshot>(() => emptySnap())
  const [peerCount, setPeerCount] = useState(0)

  const hostRef = useRef(false)
  const snapRef = useRef(snap)
  const peerRef = useRef<import('peerjs').default | null>(null)
  const connsRef = useRef<Map<string, DataConnection>>(new Map())
  const hostConnRef = useRef<DataConnection | null>(null)
  const peerPlayerRef = useRef<Map<string, string>>(new Map())
  const queueRef = useRef<RoomAction[]>([])
  snapRef.current = snap
  hostRef.current = isHost

  const broadcast = useCallback((msg: Wire) => {
    connsRef.current.forEach((c) => {
      if (c.open) c.send(msg)
    })
  }, [])

  const pushState = useCallback(
    (next: Snapshot) => {
      snapRef.current = next
      setSnap(next)
      if (hostRef.current) broadcast({ t: 'state', s: next })
    },
    [broadcast],
  )

  const applyAndPush = useCallback(
    (action: RoomAction) => {
      pushState(applyAction(snapRef.current, action))
    },
    [pushState],
  )

  const destroyPeer = useCallback(() => {
    connsRef.current.forEach((c) => {
      try {
        c.close()
      } catch {
        /* ignore */
      }
    })
    connsRef.current.clear()
    hostConnRef.current = null
    try {
      peerRef.current?.destroy()
    } catch {
      /* ignore */
    }
    peerRef.current = null
    setPeerCount(0)
  }, [])

  const attachHostConn = useCallback(
    (conn: DataConnection) => {
      connsRef.current.set(conn.peer, conn)
      setPeerCount(connsRef.current.size)
      conn.on('data', (raw) => {
        const msg = raw as Wire
        if (msg.t === 'hello') {
          peerPlayerRef.current.set(conn.peer, msg.player.id)
          applyAndPush({ type: 'addPlayer', player: { ...msg.player, online: true, device: true } })
          window.setTimeout(() => {
            if (conn.open) conn.send({ t: 'state', s: snapRef.current })
          }, 40)
        } else if (msg.t === 'ping') {
          if (conn.open) conn.send({ t: 'state', s: snapRef.current })
        } else if (msg.t === 'action') {
          const actor = peerPlayerRef.current.get(conn.peer) ?? msg.from
          const snap = snapRef.current
          const allowed = guestMayAct(
            msg.a.type,
            snap.control,
            snap.turnId === actor,
            actor,
            'id' in msg.a ? (msg.a as { id?: string }).id : undefined,
          )
          if (allowed) applyAndPush(msg.a)
          else if (conn.open) conn.send({ t: 'state', s: snap })
        } else if (msg.t === 'bye') {
          pushState({
            ...applyAction(snapRef.current, { type: 'sips', id: msg.id, amount: 0 }),
            players: snapRef.current.players.map((p) => (p.id === msg.id ? { ...p, online: false } : p)),
            v: snapRef.current.v + 1,
          })
        }
      })
      conn.on('close', () => {
        connsRef.current.delete(conn.peer)
        setPeerCount(connsRef.current.size)
      })
      conn.on('error', () => {
        connsRef.current.delete(conn.peer)
        setPeerCount(connsRef.current.size)
      })
    },
    [applyAndPush, pushState],
  )

  const createRoom = useCallback(
    async (name: string) => {
      const trimmed = name.trim().slice(0, 18)
      if (!trimmed) throw new Error('Entre ton prénom.')
      destroyPeer()
      const code = makeRoomCode()
      setStatus('connecting')
      setError('')
      setSelfName(trimmed)
      try {
      const { default: Peer } = await import('peerjs')
      await new Promise<void>((resolve, reject) => {
        const peer = new Peer(peerIdFor(code), {
          debug: 0,
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:global.stun.twilio.com:3478' },
            ],
          },
        })
        peerRef.current = peer
        const t = window.setTimeout(() => reject(new Error('Connexion trop longue.')), 12000)
        peer.on('open', () => {
          window.clearTimeout(t)
          const me = makePlayer(trimmed, 0, selfId)
          const initial = { ...emptySnap(trimmed), players: [me], v: 1, hostId: selfId, control: 'host' as const }
          hostRef.current = true
          setIsHost(true)
          setRoomCode(code)
          pushState(initial)
          setStatus('connected')
          try {
            localStorage.setItem(LAST_KEY, JSON.stringify({ code, name: trimmed, role: 'host' }))
          } catch {
            /* ignore */
          }
          resolve()
        })
        peer.on('connection', (conn) => {
          conn.on('open', () => attachHostConn(conn))
        })
        peer.on('error', (err) => {
          window.clearTimeout(t)
          reject(err)
        })
      })
      return code
      } catch (err) {
        destroyPeer()
        setStatus('error')
        setError(err instanceof Error ? err.message : 'Impossible de créer le salon.')
        throw err
      }
    },
    [attachHostConn, destroyPeer, pushState, selfId],
  )

  const joinRoom = useCallback(
    async (rawCode: string, name: string) => {
      const code = normalizeRoomCode(rawCode)
      const trimmed = name.trim().slice(0, 18)
      if (!trimmed) throw new Error('Entre ton prénom.')
      if (code.length < 4) throw new Error('Code salon invalide.')
      destroyPeer()
      setStatus('connecting')
      setError('')
      setSelfName(trimmed)
      try {
      const { default: Peer } = await import('peerjs')
      await new Promise<void>((resolve, reject) => {
        const peer = new Peer({
          debug: 0,
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:global.stun.twilio.com:3478' },
            ],
          },
        })
        peerRef.current = peer
        const t = window.setTimeout(() => reject(new Error('Salon introuvable ou hors ligne.')), 14000)
        const fail = (err: Error) => {
          window.clearTimeout(t)
          reject(err)
        }
        peer.on('error', (err) => fail(err instanceof Error ? err : new Error('Connexion impossible.')))
        peer.on('open', () => {
          const conn = peer.connect(peerIdFor(code), { reliable: true })
          hostConnRef.current = conn
          conn.on('open', () => {
            const me = makePlayer(trimmed, 9, selfId)
            conn.send({ t: 'hello', player: me } satisfies Wire)
            const pending = queueRef.current
            queueRef.current = []
            pending.forEach((a) => conn.send({ t: 'action', a, from: selfId } satisfies Wire))
          })
          conn.on('data', (raw) => {
            const msg = raw as Wire
            if (msg.t === 'state') {
              if (!msg.s) return
              window.clearTimeout(t)
              hostRef.current = false
              setIsHost(false)
              setRoomCode(code)
              const incoming: Snapshot = {
                ...emptySnap(msg.s.hostName),
                ...msg.s,
                control: msg.s.control ?? 'host',
                hostId: msg.s.hostId ?? null,
              }
              snapRef.current = incoming
              setSnap(incoming)
              setStatus('connected')
              setPeerCount(incoming.players.filter((p) => p.online !== false).length)
              try {
                localStorage.setItem(LAST_KEY, JSON.stringify({ code, name: trimmed, role: 'guest' }))
              } catch {
                /* ignore */
              }
              resolve()
            }
          })
          conn.on('close', () => {
            if (hostRef.current) return
            setStatus((s) => (s === 'connected' ? 'error' : s))
            setError('L’hôte a quitté le salon.')
          })
          conn.on('error', () => fail(new Error('Connexion au salon refusée.')))
        })
      })
      } catch (err) {
        destroyPeer()
        setStatus('error')
        setError(err instanceof Error ? err.message : 'Salon introuvable.')
        throw err
      }
    },
    [destroyPeer, selfId],
  )


  const leaveRoom = useCallback(() => {
    const bye: Wire = { t: 'bye', id: selfId }
    if (hostConnRef.current?.open) hostConnRef.current.send(bye)
    broadcast(bye)
    destroyPeer()
    hostRef.current = false
    setIsHost(false)
    setRoomCode(null)
    setStatus('idle')
    setError('')
    setSnap(emptySnap())
    try {
      localStorage.removeItem(LAST_KEY)
    } catch {
      /* ignore */
    }
  }, [broadcast, destroyPeer, selfId])

  const dispatch = useCallback(
    (action: RoomAction) => {
      if (status !== 'connected') return
      if (hostRef.current) {
        applyAndPush(action)
        return
      }
      const next = applyAction(snapRef.current, action)
      snapRef.current = next
      setSnap(next)
      const conn = hostConnRef.current
      if (conn?.open) conn.send({ t: 'action', a: action, from: selfId } satisfies Wire)
      else queueRef.current.push(action)
    },
    [applyAndPush, selfId, status],
  )

  const setGameKey = useCallback(
    (key: string, value: unknown) => {
      dispatch({ type: 'gameSet', key, value })
    },
    [dispatch],
  )

  const patchGame = useCallback(
    (key: string, field: string, value: unknown) => {
      dispatch({ type: 'gamePatch', key, field, value })
    },
    [dispatch],
  )

  useEffect(() => () => destroyPeer(), [destroyPeer])

  useEffect(() => {
    if (status !== 'connected' || isHost) return
    const t = window.setInterval(() => {
      if (hostConnRef.current?.open) hostConnRef.current.send({ t: 'ping' } satisfies Wire)
    }, 2500)
    return () => window.clearInterval(t)
  }, [status, isHost])

  const value = useMemo<RoomContextValue>(
    () => ({
      status,
      error,
      roomCode,
      isHost,
      selfId,
      selfName,
      peerCount,
      followTable,
      setFollowTable,
      players: snap.players,
      waterCount: snap.waterCount,
      waterFound: snap.waterFound,
      path: snap.path,
      turnId: snap.turnId,
      game: snap.game,
      hostName: snap.hostName,
      hostId: snap.hostId,
      control: snap.control ?? 'host',
      connected: status === 'connected',
      createRoom,
      joinRoom,
      leaveRoom,
      dispatch,
      setGameKey,
      patchGame,
    }),
    [
      status,
      error,
      roomCode,
      isHost,
      selfId,
      selfName,
      peerCount,
      followTable,
      snap,
      createRoom,
      joinRoom,
      leaveRoom,
      dispatch,
      setGameKey,
      patchGame,
    ],
  )

  return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>
}

export function useRoom() {
  const ctx = useContext(RoomContext)
  if (!ctx) throw new Error('useRoom must be used within RoomProvider')
  return ctx
}