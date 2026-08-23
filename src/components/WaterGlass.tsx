import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useParty } from '../context/PartyContext'

export function WaterGlass({
  id,
  className = '',
  size = 'md',
  hint = false,
}: {
  id: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
  hint?: boolean
}) {
  const { drinkWater, waterFound } = useParty()
  const found = waterFound.includes(id)
  const [pop, setPop] = useState(false)
  const box = size === 'sm' ? 'h-7 w-7 text-sm' : size === 'lg' ? 'h-12 w-12 text-2xl' : 'h-9 w-9 text-lg'

  const onClick = () => {
    if (found) return
    drinkWater(id)
    setPop(true)
    window.setTimeout(() => setPop(false), 1600)
  }

  return (
    <div className={`relative inline-flex ${className}`}>
      <button
        type="button"
        onClick={onClick}
        aria-label={found ? 'Verre d’eau déjà bu' : 'Verre d’eau caché'}
        className={`${box} flex items-center justify-center rounded-full transition ${
          found
            ? 'opacity-25 grayscale'
            : hint
              ? 'animate-pulse bg-sky-400/10 ring-1 ring-sky-300/40'
              : 'opacity-40 hover:opacity-100 hover:drop-shadow-[0_0_10px_rgba(56,189,248,0.7)]'
        }`}
      >
        💧
      </button>
      <AnimatePresence>
        {pop && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.9 }}
            animate={{ opacity: 1, y: -28, scale: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute left-1/2 top-0 z-50 -translate-x-1/2 whitespace-nowrap rounded-full bg-sky-400 px-2 py-1 text-[10px] font-bold text-sky-950 shadow-lg"
          >
            +1 verre d’eau !
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}