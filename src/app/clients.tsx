import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { CLIENTS, type Client, type ClientStatus } from './data'

/* ----------------------------------------------------------------------------
   Store de clientes
   ----------------------------------------------------------------------------
   Mantém os clientes em estado para que o admin possa alterar o status. As
   mudanças de status persistem em localStorage (em produção iriam ao back-end).
   Guardamos só os overrides de status por id e mesclamos sobre os dados base.
---------------------------------------------------------------------------- */

const STATUS_KEY = 'upskl-client-status'
const AVATAR_KEY = 'upskl-client-avatar'

function read<T>(key: string): Record<string, T> {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem(key) || '{}')
  } catch {
    return {}
  }
}

interface ClientsCtx {
  clients: Client[]
  getClient: (id?: string) => Client | undefined
  setClientStatus: (id: string, status: ClientStatus) => void
  setClientAvatar: (id: string, dataUrl: string) => void
}

const Context = createContext<ClientsCtx | null>(null)

export function ClientsProvider({ children }: { children: React.ReactNode }) {
  const [statuses, setStatuses] = useState<Record<string, ClientStatus>>(() => read(STATUS_KEY))
  const [avatars, setAvatars] = useState<Record<string, string>>(() => read(AVATAR_KEY))

  useEffect(() => {
    localStorage.setItem(STATUS_KEY, JSON.stringify(statuses))
  }, [statuses])
  useEffect(() => {
    try {
      localStorage.setItem(AVATAR_KEY, JSON.stringify(avatars))
    } catch {
      // localStorage cheio (imagem grande) — ignora a persistência.
    }
  }, [avatars])

  const clients = useMemo(
    () =>
      CLIENTS.map((c) => ({
        ...c,
        status: statuses[c.id] ?? c.status,
        avatar: avatars[c.id] ?? c.avatar,
      })),
    [statuses, avatars],
  )

  const getClient = useCallback((id?: string) => clients.find((c) => c.id === id), [clients])

  const setClientStatus = useCallback(
    (id: string, status: ClientStatus) => setStatuses((o) => ({ ...o, [id]: status })),
    [],
  )
  const setClientAvatar = useCallback(
    (id: string, dataUrl: string) => setAvatars((o) => ({ ...o, [id]: dataUrl })),
    [],
  )

  const value = useMemo<ClientsCtx>(
    () => ({ clients, getClient, setClientStatus, setClientAvatar }),
    [clients, getClient, setClientStatus, setClientAvatar],
  )

  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function useClients() {
  const ctx = useContext(Context)
  if (!ctx) throw new Error('useClients deve ser usado dentro de <ClientsProvider>')
  return ctx
}
