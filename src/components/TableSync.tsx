import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useRoom } from '../context/RoomContext'
import { defaultControl } from '../lib/control'
import { isBrowsePath } from '../lib/tableNav'

export function TableSync() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { connected, isHost, path, dispatch } = useRoom()
  const lastSent = useRef('')

  useEffect(() => {
    if (!connected || !isHost) return
    if (pathname === lastSent.current) return
    lastSent.current = pathname
    dispatch({ type: 'path', path: pathname })
    const match = pathname.match(/^\/jeu\/([^/]+)/)
    if (match) dispatch({ type: 'control', mode: defaultControl(match[1]) })
    else if (pathname === '/jeux' || pathname === '/aleatoire') dispatch({ type: 'control', mode: 'host' })
  }, [connected, isHost, pathname, dispatch])

  useEffect(() => {
    if (!connected || isHost || !path) return
    if (path === pathname) return
    if (isBrowsePath(pathname)) return
    navigate(path)
  }, [connected, isHost, path, pathname, navigate])

  return null
}