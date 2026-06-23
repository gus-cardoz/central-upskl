import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, MoreHorizontal, Pencil, Mail, Trash2, UserX, SlidersHorizontal } from 'lucide-react'
import {
  SectionHeader,
  Button,
  SearchField,
  Combobox,
  Tabs,
  TabList,
  Tab,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
  TableEmpty,
  TableFooter,
  Checkbox,
  Badge,
  Avatar,
  Pagination,
  EmptyState,
  DropdownMenu,
  MenuItem,
  MenuSeparator,
  IconButton,
  useToast,
  type ComboboxOption,
} from '@/components/ui'
import { USERS, STATUS_META, type UserStatus } from './data'

const PAGE_SIZE = 6

const TEAM_OPTIONS: ComboboxOption[] = Array.from(new Set(USERS.map((u) => u.team))).map((t) => ({
  value: t,
  label: t,
}))

export function UsersPage() {
  const navigate = useNavigate()
  const toast = useToast()

  const [query, setQuery] = useState('')
  const [team, setTeam] = useState<string | null>(null)
  const [status, setStatus] = useState<'todos' | UserStatus>('todos')
  const [sortDir, setSortDir] = useState<'asc' | 'desc' | false>(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let rows = USERS.filter((u) => {
      const matchQ = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      const matchTeam = !team || u.team === team
      const matchStatus = status === 'todos' || u.status === status
      return matchQ && matchTeam && matchStatus
    })
    if (sortDir) rows = [...rows].sort((a, b) => (sortDir === 'asc' ? a.sessions - b.sessions : b.sessions - a.sessions))
    return rows
  }, [query, team, status, sortDir])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount)
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const allOnPageSelected = pageRows.length > 0 && pageRows.every((r) => selected.has(r.id))
  const someSelected = pageRows.some((r) => selected.has(r.id))

  const resetPage = () => setPage(1)

  const toggleAll = () =>
    setSelected((cur) => {
      const next = new Set(cur)
      if (allOnPageSelected) pageRows.forEach((r) => next.delete(r.id))
      else pageRows.forEach((r) => next.add(r.id))
      return next
    })

  const toggleOne = (id: string) =>
    setSelected((cur) => {
      const next = new Set(cur)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const counts = {
    todos: USERS.length,
    ativo: USERS.filter((u) => u.status === 'ativo').length,
    convidado: USERS.filter((u) => u.status === 'convidado').length,
    suspenso: USERS.filter((u) => u.status === 'suspenso').length,
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <SectionHeader
        eyebrow="Operação"
        title="Usuários"
        description="Gerencie acessos, papéis e status da equipe."
        className="mb-6"
        actions={
          <Button leftIcon={<Plus size={18} strokeWidth={1.5} />} onClick={() => toast.success('Convite enviado', 'O novo usuário receberá um e-mail.')}>
            Novo usuário
          </Button>
        }
      />

      {/* Abas de status */}
      <Tabs value={status} onValueChange={(v) => { setStatus(v as typeof status); resetPage() }} className="mb-4">
        <TabList aria-label="Filtrar por status">
          <Tab value="todos" badge={<Badge tone="neutral">{counts.todos}</Badge>}>Todos</Tab>
          <Tab value="ativo" badge={<Badge tone="success">{counts.ativo}</Badge>}>Ativos</Tab>
          <Tab value="convidado" badge={<Badge tone="steel">{counts.convidado}</Badge>}>Convidados</Tab>
          <Tab value="suspenso" badge={<Badge tone="warning">{counts.suspenso}</Badge>}>Suspensos</Tab>
        </TabList>
      </Tabs>

      {/* Filtros */}
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="min-w-56 flex-1">
          <SearchField
            value={query}
            onChange={(e) => { setQuery(e.target.value); resetPage() }}
            onClear={() => { setQuery(''); resetPage() }}
            placeholder="Buscar por nome ou e-mail"
            aria-label="Buscar usuários"
          />
        </div>
        <div className="w-56">
          <Combobox
            options={TEAM_OPTIONS}
            value={team}
            onChange={(v) => { setTeam(v); resetPage() }}
            placeholder="Todos os times"
          />
        </div>
        <Button variant="secondary" leftIcon={<SlidersHorizontal size={18} strokeWidth={1.5} />}>
          Filtros
        </Button>
      </div>

      {/* Barra de seleção */}
      {someSelected && (
        <div className="mb-3 flex items-center gap-3 rounded-md border border-steel-500/30 bg-steel-tint px-3 py-2">
          <span className="font-mono text-mono-data text-steel-300">
            {[...selected].length} selecionado(s)
          </span>
          <div className="ml-auto flex items-center gap-2">
            <Button size="sm" variant="ghost" leftIcon={<Mail size={16} strokeWidth={1.5} />}>
              Reenviar convite
            </Button>
            <Button size="sm" variant="danger" leftIcon={<UserX size={16} strokeWidth={1.5} />} onClick={() => { setSelected(new Set()); toast.info('Ação aplicada') }}>
              Suspender
            </Button>
          </div>
        </div>
      )}

      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell className="w-10">
              <Checkbox
                aria-label="Selecionar página"
                checked={allOnPageSelected}
                indeterminate={someSelected && !allOnPageSelected}
                onChange={toggleAll}
              />
            </TableHeaderCell>
            <TableHeaderCell>Usuário</TableHeaderCell>
            <TableHeaderCell>Papel</TableHeaderCell>
            <TableHeaderCell>Time</TableHeaderCell>
            <TableHeaderCell
              align="right"
              sortable
              sortDirection={sortDir}
              onSort={() => setSortDir((d) => (d === 'asc' ? 'desc' : d === 'desc' ? false : 'asc'))}
            >
              Sessões
            </TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell className="w-12" align="right">Ações</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {pageRows.length === 0 ? (
            <TableEmpty colSpan={7}>
              <EmptyState
                className="border-0 bg-transparent py-0"
                icon={<UserX size={22} strokeWidth={1.5} />}
                title="Nenhum usuário encontrado"
                description="Ajuste a busca ou os filtros para ver mais resultados."
                action={
                  <Button size="sm" variant="secondary" onClick={() => { setQuery(''); setTeam(null); setStatus('todos'); resetPage() }}>
                    Limpar filtros
                  </Button>
                }
              />
            </TableEmpty>
          ) : (
            pageRows.map((u) => {
              const meta = STATUS_META[u.status]
              return (
                <TableRow
                  key={u.id}
                  interactive
                  selected={selected.has(u.id)}
                  onClick={() => navigate(`/app/usuarios/${u.id}`)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      aria-label={`Selecionar ${u.name}`}
                      checked={selected.has(u.id)}
                      onChange={() => toggleOne(u.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar size="sm" name={u.name} />
                      <div className="min-w-0">
                        <div className="font-medium text-strong">{u.name}</div>
                        <div className="font-mono text-[11px] text-faint">{u.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{u.role}</TableCell>
                  <TableCell>{u.team}</TableCell>
                  <TableCell align="right" mono>{u.sessions}</TableCell>
                  <TableCell>
                    <Badge tone={meta.tone} dot>{meta.label}</Badge>
                  </TableCell>
                  <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu
                      align="end"
                      trigger={
                        <IconButton size="sm" aria-label={`Ações de ${u.name}`}>
                          <MoreHorizontal size={16} strokeWidth={1.5} />
                        </IconButton>
                      }
                    >
                      <MenuItem icon={<Pencil size={16} strokeWidth={1.5} />} onClick={() => navigate(`/app/usuarios/${u.id}`)}>
                        Editar
                      </MenuItem>
                      <MenuItem icon={<Mail size={16} strokeWidth={1.5} />}>Reenviar convite</MenuItem>
                      <MenuSeparator />
                      <MenuItem icon={<Trash2 size={16} strokeWidth={1.5} />} destructive>Remover</MenuItem>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>

      <TableFooter className="mt-3 rounded-lg border border-line">
        <Pagination
          page={safePage}
          pageCount={pageCount}
          onPageChange={setPage}
          totalItems={filtered.length}
          pageSize={PAGE_SIZE}
        />
      </TableFooter>
    </div>
  )
}
