import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

/* ----------------------------------------------------------------------------
   Sessão / perfil de acesso
   ----------------------------------------------------------------------------
   Define o tipo de acesso do usuário logado. Dois perfis:
   - admin: gestão completa — pode adicionar/excluir seções da plataforma.
   - colaborador: visão do dia a dia — tarefas, reuniões e acessos úteis.

   Há um seletor "Ver como" no topo para pré-visualizar cada perfil. O valor
   persiste em localStorage. Em produção isso viria do back-end de auth.
---------------------------------------------------------------------------- */

export type Role = 'admin' | 'colaborador'

export interface Profile {
  /** Id do usuário (mapeia para USERS em data.ts). */
  id: string
  name: string
  email: string
  roleLabel: string
}

export const PROFILES: Record<Role, Profile> = {
  admin: { id: 'USR-1042', name: 'Ana Lima', email: 'ana.lima@upskl.io', roleLabel: 'Admin' },
  colaborador: { id: 'USR-1047', name: 'Felipe Rocha', email: 'felipe.rocha@upskl.io', roleLabel: 'Colaborador' },
}

export const ROLE_OPTIONS: { value: Role; label: string; hint: string }[] = [
  { value: 'admin', label: 'Admin', hint: 'Gestão completa da plataforma' },
  { value: 'colaborador', label: 'Colaborador', hint: 'Visão do dia a dia' },
]

const ROLE_KEY = 'upskl-role'

interface SessionCtx {
  role: Role
  user: Profile
  setRole: (r: Role) => void
}

const Context = createContext<SessionCtx | null>(null)

function readRole(): Role {
  if (typeof window === 'undefined') return 'admin'
  const saved = localStorage.getItem(ROLE_KEY)
  return saved === 'colaborador' || saved === 'admin' ? saved : 'admin'
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<Role>(readRole)

  useEffect(() => {
    localStorage.setItem(ROLE_KEY, role)
  }, [role])

  const setRole = useCallback((r: Role) => setRoleState(r), [])

  const value = useMemo<SessionCtx>(
    () => ({ role, user: PROFILES[role], setRole }),
    [role, setRole],
  )

  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function useSession() {
  const ctx = useContext(Context)
  if (!ctx) throw new Error('useSession deve ser usado dentro de <SessionProvider>')
  return ctx
}
