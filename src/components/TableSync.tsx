import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useRoom } from '../context/RoomContext'

export function TableSync() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { connected, isHost, path, followTable, dispatch } = useRoom()
  const lastSent = useRef(pathname)

  useEffect(() => {
    if (!connected || !isHost) return
    if (pathname === lastSent.current) return
    lastSent.current = pathname
    dispatch({ type: 'path', path: pathname })
  }, [connected, isHost, pathname, dispatch])

  useEffect(() => {
    if (!connected || isHost || !followTable || !path) return
    if (path === pathname) return
    navigate(path)
  }, [connected, isHost, followTable, path, pathname, navigate])

  return null
}