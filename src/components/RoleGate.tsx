import type { ReactNode } from 'react'
import { useTableControl } from '../lib/useTableControl'

export function HostOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  const { connected, isHost } = useTableControl()
  if (connected && !isHost) return <>{fallback}</>
  return <>{children}</>
}

export function TurnOnly({
  children,
  fallback = null,
  extraIds = [],
}: {
  children: ReactNode
  fallback?: ReactNode
  extraIds?: (string | undefined | null)[]
}) {
  const { connected, isHost, selfId, myTurn } = useTableControl()
  if (!connected || isHost || myTurn || (selfId && extraIds.includes(selfId))) return <>{children}</>
  return <>{fallback}</>
}