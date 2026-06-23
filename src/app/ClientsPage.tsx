import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Building2, ArrowRight } from 'lucide-react'
import {
  SectionHeader,
  Button,
  Card,
  Badge,
  Avatar,
  AvatarGroup,
  ProgressBar,
  SearchField,
  Tabs,
  TabList,
  Tab,
  EmptyState,
  useToast,
} from '@/components/ui'
import { CLIENT_STATUS_META, TEAM, type ClientStatus } from './data'
import { useClients } from './clients'
import { ClientAvatar } from './ClientAvatar'
import { useSession } from '@/lib/session'

export function ClientsPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { clients } = useClients()
  const { role } = useSession()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<'todos' | ClientStatus>('todos')

  const counts = {
    todos: clients.length,
    ativo: clients.filter((c) => c.status === 'ativo').length,
    onboarding: clients.filter((c) => c.status === 'onboarding').length,
    pausado: clients.filter((c) => c.status === 'pausado').length,
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return clients.filter((c) => {
      const matchQ = !q || c.name.toLowerCase().includes(q)
      const matchStatus = status === 'todos' || c.status === status
      return matchQ && matchStatus
    })
  }, [clients, query, status])

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <SectionHeader
        eyebrow="Operação"
        title="Clientes"
        description="Contas, planos e progresso de implantação."
        className="mb-6"
        actions={
          role === 'admin' ? (
            <Button leftIcon={<Plus size={18} strokeWidth={1.5} />} onClick={() => toast.success('Cliente criado')}>
              Novo cliente
            </Button>
          ) : undefined
        }
      />

      {role === 'admin' && (
        <>
          <Tabs value={status} onValueChange={(v) => setStatus(v as typeof status)} className="mb-4">
            <TabList aria-label="Filtrar por status">
              <Tab value="todos" badge={<Badge tone="neutral">{counts.todos}</Badge>}>Todos</Tab>
              <Tab value="ativo" badge={<Badge tone="success">{counts.ativo}</Badge>}>Ativos</Tab>
              <Tab value="onboarding" badge={<Badge tone="steel">{counts.onboarding}</Badge>}>Onboarding</Tab>
              <Tab value="pausado" badge={<Badge tone="warning">{counts.pausado}</Badge>}>Pausados</Tab>
            </TabList>
          </Tabs>

          <div className="mb-5 max-w-md">
            <SearchField
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onClear={() => setQuery('')}
              placeholder="Buscar cliente"
              aria-label="Buscar clientes"
            />
          </div>
        </>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Building2 size={22} strokeWidth={1.5} />}
          title="Nenhum cliente encontrado"
          description="Ajuste a busca ou o filtro de status."
          action={
            <Button variant="secondary" onClick={() => { setQuery(''); setStatus('todos') }}>
              Limpar filtros
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => {
            const meta = CLIENT_STATUS_META[c.status]
            return (
              <Card
                key={c.id}
                variant="interactive"
                tabIndex={0}
                role="button"
                onClick={() => navigate(`/app/clientes/${c.id}`)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    navigate(`/app/clientes/${c.id}`)
                  }
                }}
                className="group flex flex-col gap-4"
              >
                <div className="flex items-center gap-3">
                  <ClientAvatar src={c.avatar} name={c.name} className="size-10 rounded-md" iconSize={18} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-display text-h3 font-semibold text-strong">{c.name}</div>
                    <div className="truncate text-body-s text-muted">{c.phase}</div>
                  </div>
                  <Badge tone={meta.tone} dot>{meta.label}</Badge>
                </div>

                <ProgressBar
                  label="Projeto"
                  value={c.progress}
                  showValue
                  tone={c.status === 'pausado' ? 'warning' : 'steel'}
                />

                <div className="mt-auto flex items-center justify-between gap-2 border-t border-subtle pt-3">
                  <div className="flex items-center gap-2">
                    <AvatarGroup max={3}>
                      {TEAM.map((u) => (
                        <Avatar key={u.id} size="xs" name={u.name} />
                      ))}
                    </AvatarGroup>
                    <span className="text-body-s text-muted">Time</span>
                  </div>
                  <span className="inline-flex items-center gap-1 font-mono text-mono-data text-faint transition-colors group-hover:text-steel-300">
                    Abrir
                    <ArrowRight size={14} strokeWidth={1.5} aria-hidden />
                  </span>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
