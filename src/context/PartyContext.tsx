import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Player } from '../types'
import { PLAYER_COLORS } from '../lib/catalog'
import { useRoom } from './RoomContext'

const PARTY_KEY = 'soiree-party-v1'
const WATER_KEY = 'soiree-water-v1'

type WaterState = { count: number; found: string[] }

type PartyContextValue = {
  players: Player[]
  allPlayers: Player[]
  activePlayers: Player[]
  pausedPlayers: Player[]
  addPlayer: (name: string) => boolean
  removePlayer: (id: string) => void
  renamePlayer: (id: string, name: string) => void
  addSips: (id: string, amount: number) => void
  resetSips: () => void
  clearPlayers: () => void
  togglePause: (id: string) => void
  activeTurnId: string | null
  setActiveTurnId: (id: string | null) => void
  waterCount: number
  waterFound: string[]
  drinkWater: (id: string) => void
  selfId: string | null
  connected: boolean
}

const PartyContext = createContext<PartyContextValue | null>(null)

function loadPlayers(): Player[] {
  try {
    const raw = localStorage.getItem(PARTY_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((p: Player) => p && typeof p.name === 'string' && p.id)
      .map((p: Player) => ({ ...p, paused: !!p.paused }))
  } catch {
    return []
  }
}

function loadWater(): WaterState {
  try {
    const raw = localStorage.getItem(WATER_KEY)
    if (!raw) return { count: 0, found: [] }
    const parsed = JSON.parse(raw)
    return { count: parsed.count ?? 0, found: parsed.found ?? [] }
  } catch {
    return { count: 0, found: [] }
  }
}

export function PartyProvider({ children }: { children: ReactNode }) {
  const room = useRoom()
  const [localPlayers, setLocalPlayers] = useState<Player[]>(() => loadPlayers())
  const [localTurn, setLocalTurn] = useState<string | null>(null)
  const [localWaterCount, setLocalWaterCount] = useState(() => loadWater().count)
  const [localWaterFound, setLocalWaterFound] = useState<string[]>(() => loadWater().found)
  const connected = room.connected

  useEffect(() => {
    if (connected) return
    localStorage.setItem(PARTY_KEY, JSON.stringify(localPlayers))
  }, [localPlayers, connected])

  useEffect(() => {
    if (connected) return
    localStorage.setItem(WATER_KEY, JSON.stringify({ count: localWaterCount, found: localWaterFound }))
  }, [localWaterCount, localWaterFound, connected])

  const addPlayer = useCallback(
    (name: string) => {
      const trimmed = name.trim().slice(0, 18)
      if (!trimmed) return false
      if (connected) {
        const list = room.players
        if (list.length >= 12 || list.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())) return false
        room.dispatch({
          type: 'addPlayer',
          player: {
            id: crypto.randomUUID(),
            name: trimmed,
            color: PLAYER_COLORS[list.length % PLAYER_COLORS.length],
            sips: 0,
            paused: false,
            online: true,
            device: false,
          },
        })
        return true
      }
      let ok = true
      setLocalPlayers((prev) => {
        if (prev.length >= 12 || prev.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())) {
          ok = false
          return prev
        }
        const color = PLAYER_COLORS[prev.length % PLAYER_COLORS.length]
        return [...prev, { id: crypto.randomUUID(), name: trimmed, color, sips: 0, paused: false }]
      })
      return ok
    },
    [connected, room],
  )

  const removePlayer = useCallback(
    (id: string) => {
      if (connected) room.dispatch({ type: 'removePlayer', id })
      else setLocalPlayers((prev) => prev.filter((p) => p.id !== id))
    },
    [connected, room],
  )

  const renamePlayer = useCallback(
    (id: string, name: string) => {
      const trimmed = name.trim().slice(0, 18)
      if (!trimmed) return
      if (connected) room.dispatch({ type: 'rename', id, name: trimmed })
      else setLocalPlayers((prev) => prev.map((p) => (p.id === id ? { ...p, name: trimmed } : p)))
    },
    [connected, room],
  )

  const addSips = useCallback(
    (id: string, amount: number) => {
      if (connected) room.dispatch({ type: 'sips', id, amount })
      else
        setLocalPlayers((prev) =>
          prev.map((p) => (p.id === id ? { ...p, sips: Math.max(0, p.sips + amount) } : p)),
        )
    },
    [connected, room],
  )

  const resetSips = useCallback(() => {
    if (connected) room.dispatch({ type: 'resetSips' })
    else setLocalPlayers((prev) => prev.map((p) => ({ ...p, sips: 0 })))
  }, [connected, room])

  const clearPlayers = useCallback(() => {
    if (connected) room.dispatch({ type: 'clearGuests' })
    else setLocalPlayers([])
  }, [connected, room])

  const togglePause = useCallback(
    (id: string) => {
      if (connected) room.dispatch({ type: 'togglePause', id })
      else setLocalPlayers((prev) => prev.map((p) => (p.id === id ? { ...p, paused: !p.paused } : p)))
    },
    [connected, room],
  )

  const drinkWater = useCallback(
    (id: string) => {
      if (connected) room.dispatch({ type: 'water', id })
      else {
        setLocalWaterFound((prev) => {
          if (prev.includes(id)) return prev
          setLocalWaterCount((c) => c + 1)
          return [...prev, id]
        })
      }
    },
    [connected, room],
  )

  const setActiveTurnId = useCallback(
    (id: string | null) => {
      if (connected) room.dispatch({ type: 'turn', id })
      else setLocalTurn(id)
    },
    [connected, room],
  )

  const allPlayers = connected ? room.players : localPlayers
  const players = useMemo(() => allPlayers.filter((p) => !p.paused), [allPlayers])
  const pausedPlayers = useMemo(() => allPlayers.filter((p) => !!p.paused), [allPlayers])
  const activeTurnId = connected ? room.turnId : localTurn
  const waterCount = connected ? room.waterCount : localWaterCount
  const waterFound = connected ? room.waterFound : localWaterFound

  const value = useMemo<PartyContextValue>(
    () => ({
      players,
      allPlayers,
      activePlayers: players,
      pausedPlayers,
      addPlayer,
      removePlayer,
      renamePlayer,
      addSips,
      resetSips,
      clearPlayers,
      togglePause,
      activeTurnId,
      setActiveTurnId,
      waterCount,
      waterFound,
      drinkWater,
      selfId: connected ? room.selfId : null,
      connected,
    }),
    [
      players,
      allPlayers,
      pausedPlayers,
      addPlayer,
      removePlayer,
      renamePlayer,
      addSips,
      resetSips,
      clearPlayers,
      togglePause,
      activeTurnId,
      setActiveTurnId,
      waterCount,
      waterFound,
      drinkWater,
      connected,
      room.selfId,
    ],
  )

  return <PartyContext.Provider value={value}>{children}</PartyContext.Provider>
}

export function useParty() {
  const ctx = useContext(PartyContext)
  if (!ctx) throw new Error('useParty must be used within PartyProvider')
  return ctx
}