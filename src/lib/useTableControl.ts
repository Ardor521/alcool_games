import { useCallback, useMemo } from 'react'
import { useRoom } from '../context/RoomContext'
import type { ControlMode } from './control'

export function useTableControl() {
  const room = useRoom()
  const connected = room.connected
  const isHost = room.isHost
  const selfId = room.selfId
  const turnId = room.turnId
  const myTurn = !!selfId && turnId === selfId
  const mode: ControlMode = room.control
  const canDirect = !connected || isHost
  const canAct = !connected || isHost || myTurn || mode === 'all'
  const turnName = useMemo(
    () => room.players.find((p) => p.id === turnId)?.name ?? null,
    [room.players, turnId],
  )

  const setControl = useCallback(
    (next: ControlMode) => {
      if (!connected) return
      room.dispatch({ type: 'control', mode: next })
    },
    [connected, room],
  )

  return {
    connected,
    isHost,
    selfId,
    turnId,
    myTurn,
    mode,
    canDirect,
    canAct,
    turnName,
    hostName: room.hostName,
    setControl,
  }
}