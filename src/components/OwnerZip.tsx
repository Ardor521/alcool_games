import { useEffect, useState } from 'react'

const CLAIM_KEY = 'soiree-zip-claimed-v1'
const OWNER_CODE = 'Ardor521_AD'
const ZIP_HREF = '/_a521-9f3k2m.zip'

export function OwnerZip({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [claimed, setClaimed] = useState(false)

  useEffect(() => {
    setClaimed(localStorage.getItem(CLAIM_KEY) === '1')
  }, [])

  const submit = () => {
    if (code.trim() !== OWNER_CODE) {
      setError('Code incorrect.')
      return
    }
    const a = document.createElement('a')
    a.href = ZIP_HREF
    a.download = 'soiree-ardor521.zip'
    document.body.appendChild(a)
    a.click()
    a.remove()
    localStorage.setItem(CLAIM_KEY, '1')
    setClaimed(true)
    setOpen(false)
    setCode('')
  }

  if (claimed) {
    return compact ? null : <p className="text-center text-xs text-white/35">by Ardor521_AD</p>
  }

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setOpen(true)
          setError('')
        }}
        className={
          compact
            ? 'text-left text-[9px] tracking-wide text-white/40 hover:text-white/70'
            : 'text-center text-xs text-white/35 hover:text-white/60'
        }
      >
        by Ardor521_AD
      </button>
      {open && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4">
          <div className="card w-full max-w-sm space-y-3 p-4">
            <p className="text-sm font-semibold">Zone privée</p>
            <p className="text-xs text-white/55">
              Entre ton code. Après téléchargement, le lien disparaît sur cet appareil.
            </p>
            <input
              type="password"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Code"
              className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm outline-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter') submit()
              }}
            />
            {error && <p className="text-xs text-rose-300">{error}</p>}
            <div className="flex gap-2">
              <button type="button" onClick={() => setOpen(false)} className="btn-ghost flex-1 justify-center text-sm">
                Annuler
              </button>
              <button type="button" onClick={submit} className="btn-primary flex-1 justify-center text-sm">
                Télécharger
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}