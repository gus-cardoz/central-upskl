import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, CalendarDays, Clock, MapPin, Video, Building2, Users, ExternalLink } from 'lucide-react'
import {
  SectionHeader,
  Button,
  Card,
  AgendaRow,
  Avatar,
  AvatarGroup,
  Badge,
  Tabs,
  TabList,
  Tab,
  DatePicker,
  Divider,
  Modal,
  EmptyState,
  useToast,
} from '@/components/ui'
import { TEAM_AGENDA, TODAY, getClient, type AgendaItem } from './data'
import { useSession } from '@/lib/session'

interface DayGroup {
  day: string
  month: string
  weekday: string
  items: AgendaItem[]
}

function groupByDay(items: AgendaItem[]): DayGroup[] {
  const order: DayGroup[] = []
  const map = new Map<string, DayGroup>()
  for (const ev of items) {
    const key = `${ev.day}-${ev.month}`
    let g = map.get(key)
    if (!g) {
      g = { day: ev.day, month: ev.month, weekday: ev.weekday, items: [] }
      map.set(key, g)
      order.push(g)
    }
    g.items.push(ev)
  }
  return order
}

/** Linha de metadado do modal (ícone + texto). */
function MetaRow({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 text-body-s text-fg">
      <span className="shrink-0 text-steel-300">{icon}</span>
      <span className="min-w-0">{children}</span>
    </div>
  )
}

/** Popup de detalhes de um compromisso da agenda. */
function EventModal({ event, onClose }: { event: AgendaItem | null; onClose: () => void }) {
  const navigate = useNavigate()
  if (!event) return null
  const client = event.clientId ? getClient(event.clientId) : undefined
  const dot =
    event.category === 'sand' ? 'bg-sand-300'
    : event.category === 'success' ? 'bg-ok'
    : event.category === 'danger' ? 'bg-err'
    : 'bg-steel-400'

  return (
    <Modal
      open={!!event}
      onClose={onClose}
      title={
        <span className="flex items-center gap-2.5">
          <span className={`size-2 shrink-0 rounded-full ${dot}`} aria-hidden />
          {event.title}
        </span>
      }
      description={`${event.weekday}, ${event.day} ${event.month.toLowerCase()}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Fechar</Button>
          {client && (
            <Button
              variant="secondary"
              leftIcon={<Building2 size={16} strokeWidth={1.5} />}
              onClick={() => { onClose(); navigate(`/app/clientes/${client.id}`) }}
            >
              Abrir cliente
            </Button>
          )}
          {event.meetingUrl && (
            <Button
              className="text-white [&_svg]:text-white"
              leftIcon={<Video size={16} strokeWidth={1.5} />}
              onClick={() => window.open(event.meetingUrl, '_blank', 'noopener,noreferrer')}
            >
              Entrar na chamada
            </Button>
          )}
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2.5">
          <MetaRow icon={<Clock size={16} strokeWidth={1.5} />}>{event.time}</MetaRow>
          {event.location && <MetaRow icon={<MapPin size={16} strokeWidth={1.5} />}>{event.location}</MetaRow>}
          {client && (
            <MetaRow icon={<Building2 size={16} strokeWidth={1.5} />}>
              Cliente: <span className="font-medium text-strong">{client.name}</span>
            </MetaRow>
          )}
          {event.meetingUrl && (
            <MetaRow icon={<Video size={16} strokeWidth={1.5} />}>
              <a
                href={event.meetingUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-steel-300 transition-colors hover:text-steel-400 focus-visible:outline-none focus-visible:shadow-focus"
              >
                <span className="truncate">{event.meetingUrl.replace(/^https?:\/\//, '')}</span>
                <ExternalLink size={12} strokeWidth={1.5} aria-hidden />
              </a>
            </MetaRow>
          )}
        </div>

        {event.description && (
          <>
            <Divider />
            <div>
              <div className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-faint">Descrição</div>
              <p className="whitespace-pre-wrap text-body-s text-fg">{event.description}</p>
            </div>
          </>
        )}

        {event.people && event.people.length > 0 && (
          <>
            <Divider />
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Users size={15} strokeWidth={1.5} className="text-steel-300" aria-hidden />
                <span className="text-body-s font-medium text-strong">
                  Participantes <span className="text-faint">· {event.people.length}</span>
                </span>
              </div>
              <ul className="flex flex-col gap-2">
                {event.people.map((p) => (
                  <li key={p} className="flex items-center gap-2.5">
                    <Avatar size="sm" name={p} />
                    <span className="text-body-s text-strong">{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}

export function AgendaPage() {
  const toast = useToast()
  const { role } = useSession()
  const [scope, setScope] = useState('todos')
  const [date, setDate] = useState<Date | null>(null)
  const [openEvent, setOpenEvent] = useState<AgendaItem | null>(null)

  const groups = useMemo(() => {
    const filtered = scope === 'hoje' ? TEAM_AGENDA.filter((e) => e.day === TODAY) : TEAM_AGENDA
    return groupByDay(filtered)
  }, [scope])

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <SectionHeader
        eyebrow="Operação"
        title="Agenda do time"
        description="Compromissos, prazos e cerimônias da equipe."
        className="mb-6"
        actions={
          role === 'admin' ? (
            <Button
              leftIcon={<Plus size={18} strokeWidth={1.5} />}
              onClick={() => toast.success('Compromisso criado', 'Adicionado à agenda do time.')}
            >
              Novo compromisso
            </Button>
          ) : undefined
        }
      />

      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <Tabs value={scope} onValueChange={setScope} variant="segmented">
          <TabList aria-label="Período">
            <Tab value="todos">Próximos</Tab>
            <Tab value="hoje">Hoje</Tab>
          </TabList>
        </Tabs>
        <div className="w-52">
          <DatePicker value={date} onChange={setDate} placeholder="Ir para data" />
        </div>
      </div>

      {groups.length === 0 ? (
        <EmptyState
          icon={<CalendarDays size={22} strokeWidth={1.5} />}
          title="Nada por aqui"
          description="Não há compromissos no período selecionado."
        />
      ) : (
        <div className="flex flex-col gap-8">
          {groups.map((g) => {
            const isToday = g.day === TODAY
            return (
              <section key={`${g.day}-${g.month}`}>
                <div className="mb-3 flex items-baseline gap-3">
                  <h2 className="font-display text-h3 font-semibold text-strong">
                    {g.weekday}, {g.day} {g.month.toLowerCase()}
                  </h2>
                  {isToday && (
                    <Badge tone="steel" dot>
                      hoje
                    </Badge>
                  )}
                  <span className="font-mono text-mono-data text-faint">
                    {g.items.length} {g.items.length === 1 ? 'evento' : 'eventos'}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {g.items.map((ev) => (
                    <AgendaRow
                      key={ev.id}
                      day={ev.day}
                      month={ev.month}
                      time={ev.time}
                      title={ev.title}
                      meta={ev.meta}
                      category={ev.category}
                      interactive
                      onClick={() => setOpenEvent(ev)}
                      trailing={
                        ev.people ? (
                          <AvatarGroup max={4}>
                            {ev.people.map((p) => (
                              <Avatar key={p} size="sm" name={p} />
                            ))}
                          </AvatarGroup>
                        ) : undefined
                      }
                    />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}

      <Card className="mt-8 flex items-center gap-3">
        <span className="grid size-9 place-items-center rounded-md bg-steel-tint text-steel-300">
          <CalendarDays size={18} strokeWidth={1.5} aria-hidden />
        </span>
        <p className="text-body-s text-muted">
          Clique em um compromisso para ver detalhes — participantes, descrição e link da chamada.
        </p>
      </Card>

      <EventModal event={openEvent} onClose={() => setOpenEvent(null)} />
    </div>
  )
}
