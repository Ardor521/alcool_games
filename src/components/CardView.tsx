import { motion } from 'framer-motion'
import type { PlayingCard } from '../types'
import { isRed } from '../lib/cards'

export function CardView({
  card,
  faceUp,
  small = false,
  tiny = false,
  onClick,
  disabled = false,
  label,
}: {
  card?: PlayingCard | null
  faceUp: boolean
  small?: boolean
  tiny?: boolean
  onClick?: () => void
  disabled?: boolean
  label?: string
}) {
  const size = tiny ? 'h-11 w-[1.95rem] sm:h-[4.6rem] sm:w-[3.25rem]' : small ? 'h-[4.6rem] w-[3.25rem]' : 'h-40 w-28'
  const red = card ? isRed(card.suit) : false

  return (
    <button
      type="button"
      disabled={disabled || !onClick}
      onClick={onClick}
      className={`relative ${size} shrink-0 [perspective:800px] ${onClick && !disabled ? 'cursor-pointer' : 'cursor-default'}`}
      aria-label={label ?? (faceUp && card ? `${card.rank}${card.suit}` : 'Carte face cachée')}
    >
      <motion.div
        className="relative h-full w-full [transform-style:preserve-3d]"
        animate={{ rotateY: faceUp ? 180 : 0 }}
        transition={{ duration: 0.45 }}
      >
        <div className="absolute inset-0 overflow-hidden rounded-xl border border-white/20 bg-[linear-gradient(145deg,#1e1b4b,#4c1d95_45%,#831843)] shadow-lg [backface-visibility:hidden]">
          <div className="absolute inset-1 rounded-lg border border-fuchsia-200/20" />
          <div className="flex h-full items-center justify-center">
            <span className={`font-display text-fuchsia-100/80 ${tiny ? 'text-sm sm:text-lg' : small ? 'text-lg' : 'text-3xl'}`}>
              ♠
            </span>
          </div>
        </div>
        <div
          className={`absolute inset-0 flex flex-col justify-between rounded-xl border bg-white shadow-xl [backface-visibility:hidden] [transform:rotateY(180deg)] ${tiny ? 'p-0.5 sm:p-1' : small ? 'p-1' : 'p-2'} ${red ? 'text-rose-600' : 'text-zinc-900'}`}
        >
          {card ? (
            <>
              <span className={`font-bold leading-none ${tiny ? 'text-[8px] sm:text-[11px]' : small ? 'text-[11px]' : 'text-xl'}`}>
                {card.rank}
                {card.suit}
              </span>
              <span className={`self-center ${tiny ? 'text-sm sm:text-lg' : small ? 'text-lg' : 'text-4xl'}`}>{card.suit}</span>
              <span
                className={`self-end rotate-180 font-bold leading-none ${tiny ? 'text-[8px] sm:text-[11px]' : small ? 'text-[11px]' : 'text-xl'}`}
              >
                {card.rank}
                {card.suit}
              </span>
            </>
          ) : (
            <span className="m-auto text-zinc-400">?</span>
          )}
        </div>
      </motion.div>
    </button>
  )
}