import type { ReactNode } from 'react'
import { useTableControl } from '../lib/useTableControl'

export function TurnLock({ children, allowWhen }: { children: ReactNode; allowWhen?: boolean }) {
  const { connected, isHost, myTurn, mode, turnName, hostName } = useTableControl()
  const open = !connected || isHost || myTurn || mode === 'all' || allowWhen
  if (open) return <>{children}</>
  return (
    <div className="relative">
      <div className="pointer-events-none select-none opacity-45">{children}</div>
      <div className="absolute inset-0 z-10 flex items-end justify-center rounded-2xl bg-gradient-to-t from-[#07020f]/90 via-[#07020f]/20 to-transparent p-4">
        <p className="rounded-full border border-white/15 bg-black/60 px-3 py-1.5 text-center text-xs text-white/80 backdrop-blur">
          {mode === 'host'
            ? `L’hôte (${hostName || 'table'}) pilote le jeu.`
            : `C’est au tour de ${turnName ?? 'quelqu’un'}.`}
        </p>
      </div>
    </div>
  )
}