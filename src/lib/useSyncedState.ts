import { useCallback, useLayoutEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { useRoom } from '../context/RoomContext'

export function useSyncedState<T>(key: string, initial: T | (() => T)): [T, Dispatch<SetStateAction<T>>] {
  const { connected, isHost, game, setGameKey } = useRoom()
  const initRef = useRef(typeof initial === 'function' ? (initial as () => T)() : initial)
  const [local, setLocal] = useState<T>(() => initRef.current)
  const hasKey = Object.prototype.hasOwnProperty.call(game, key)
  const value = !connected ? local : hasKey ? (game[key] as T) : initRef.current

  useLayoutEffect(() => {
    if (connected && isHost && !hasKey) {
      setGameKey(key, initRef.current)
    }
  }, [connected, isHost, hasKey, key, setGameKey])

  const set = useCallback(
    (action: SetStateAction<T>) => {
      const curr = connected ? (hasKey ? (game[key] as T) : initRef.current) : local
      const next = typeof action === 'function' ? (action as (prev: T) => T)(curr) : action
      if (connected) setGameKey(key, next)
      else setLocal(next)
    },
    [connected, game, hasKey, key, local, setGameKey],
  )

  return [value, set]
}

export function useSyncedMap<T>(key: string) {
  const { connected, game, setGameKey, patchGame } = useRoom()
  const [local, setLocal] = useState<Record<string, T>>({})
  const value = (connected ? ((game[key] as Record<string, T> | undefined) ?? {}) : local) as Record<string, T>

  const setField = useCallback(
    (field: string, val: T) => {
      if (connected) patchGame(key, field, val)
      else setLocal((prev) => ({ ...prev, [field]: val }))
    },
    [connected, key, patchGame],
  )

  const reset = useCallback(() => {
    if (connected) setGameKey(key, {})
    else setLocal({})
  }, [connected, key, setGameKey])

  return [value, setField, reset] as const
}