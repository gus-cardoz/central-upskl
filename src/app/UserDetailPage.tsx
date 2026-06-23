import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Mail, MoreHorizontal, Trash2, KeyRound, ShieldCheck, UserX } from 'lucide-react'
import {
  Breadcrumb,
  Button,
  IconButton,
  Avatar,
  Badge,
  Card,
  CardTitle,
  StatCard,
  Divider,
  Tabs,
  TabList,
  Tab,
  TabPanel,
  Stepper,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  Input,
  Combobox,
  DatePicker,
  Switch,
  EmptyState,
  DropdownMenu,
  MenuItem,
  MenuSeparator,
  useToast,
  type ComboboxOption,
} from '@/components/ui'
import { USERS, STATUS_META } from './data'

const ROLE_OPTIONS: ComboboxOption[] = [
  { value: 'Admin', label: 'Admin · acesso total' },
  { value: 'Operador', label: 'Operador · edição' },
  { value: 'Visualizador', label: 'Visualizador · leitura' },
]

const ONBOARDING = [
  { label: 'Convite', description: 'Enviado' },
  { label: 'Cadastro', description: 'Conta criada' },
  { label: 'Verificação', description: '2FA pendente' },
  { label: 'Ativo', description: 'Acesso liberado' },
]

export function UserDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const user = USERS.find((u) => u.id === id)

  const [tab, setTab] = useState('visao')
  const [role, setRole] = useState<string | null>(user?.role ?? null)
  const [date, setDate] = useState<Date | null>(null)
  const [name, setName] = useState(user?.name ?? '')

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16">
        <EmptyState
          icon={<UserX size={22} strokeWidth={1.5} />}
          title="Usuário não encontrado"
          description={`Não há registro para "${id}".`}
          action={<Button onClick={() => navigate('/app/usuarios')}>Voltar à lista</Button>}
        />
      </div>
    )
  }

  const meta = STATUS_META[user.status]
  const currentStep = user.status === 'ativo' ? 3 : user.status === 'convidado' ? 0 : 2

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <Breadcrumb
        className="mb-6"
        items={[
          { label: 'Usuários', href: '/app/usuarios' },
          { label: user.name },
        ]}
      />

      {/* Cabeçalho do perfil */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar size="xl" name={user.name} status={user.status === 'ativo' ? 'online' : 'away'} />
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-h1 font-semibold text-strong">{user.name}</h1>
              <Badge tone={meta.tone} dot>{meta.label}</Badge>
            </div>
            <p className="mt-1 font-mono text-mono-data text-muted">
              {user.email} · {user.id}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" leftIcon={<Mail size={18} strokeWidth={1.5} />}>
            Mensagem
          </Button>
          <Button leftIcon={<ShieldCheck size={18} strokeWidth={1.5} />} onClick={() => toast.success('Permissões revisadas')}>
            Revisar acesso
          </Button>
          <DropdownMenu
            align="end"
            trigger={
              <IconButton aria-label="Mais ações">
                <MoreHorizontal size={18} strokeWidth={1.5} />
              </IconButton>
            }
          >
            <MenuItem icon={<KeyRound size={16} strokeWidth={1.5} />}>Redefinir senha</MenuItem>
            <MenuItem icon={<UserX size={16} strokeWidth={1.5} />}>Suspender</MenuItem>
            <MenuSeparator />
            <MenuItem icon={<Trash2 size={16} strokeWidth={1.5} />} destructive>Remover usuário</MenuItem>
          </DropdownMenu>
        </div>
      </div>

      <Divider className="my-6" />

      <Tabs value={tab} onValueChange={setTab}>
        <TabList aria-label="Seções do usuário">
          <Tab value="visao">Visão geral</Tab>
          <Tab value="config">Configurações</Tab>
          <Tab value="permissoes">Permissões</Tab>
        </TabList>

        {/* VISÃO GERAL */}
        <TabPanel value="visao">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Sessões" value={String(user.sessions)} delta={{ value: 'total', direction: 'neutral' }} />
            <StatCard label="Último acesso" value={user.lastActive} />
            <StatCard label="Papel" value={user.role} />
            <StatCard label="Time" value={user.team} />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardTitle className="mb-5">Onboarding</CardTitle>
              <Stepper steps={ONBOARDING} current={currentStep} />
            </Card>
            <Card>
              <CardTitle className="mb-4">Resumo</CardTitle>
              <dl className="flex flex-col gap-3 text-body-s">
                {[
                  ['Identificador', user.id],
                  ['E-mail', user.email],
                  ['Papel', user.role],
                  ['Time', user.team],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between gap-3">
                    <dt className="text-muted">{k}</dt>
                    <dd className="truncate font-medium text-strong">{v}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          </div>
        </TabPanel>

        {/* CONFIGURAÇÕES */}
        <TabPanel value="config">
          <Card className="max-w-2xl">
            <CardTitle className="mb-5">Dados da conta</CardTitle>
            <div className="flex flex-col gap-4">
              <Input label="Nome completo" value={name} onChange={(e) => setName(e.target.value)} />
              <Input label="E-mail" type="email" defaultValue={user.email} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Combobox label="Papel" options={ROLE_OPTIONS} value={role} onChange={setRole} clearable={false} />
                <DatePicker label="Data de admissão" optional value={date} onChange={setDate} />
              </div>
              <Divider className="my-1" />
              <Switch label="Acesso ativo" description="Permite que o usuário faça login." defaultChecked={user.status === 'ativo'} />
              <Switch label="Notificações por e-mail" description="Resumos e alertas operacionais." defaultChecked />
            </div>
            <div className="mt-6 flex items-center gap-2">
              <Button onClick={() => toast.success('Alterações salvas', `${name} atualizado.`)}>Salvar alterações</Button>
              <Button variant="ghost" onClick={() => navigate('/app/usuarios')}>Cancelar</Button>
            </div>
          </Card>
        </TabPanel>

        {/* PERMISSÕES */}
        <TabPanel value="permissoes">
          <div className="max-w-2xl">
            <Accordion type="multiple" defaultValue={['usuarios']}>
              <AccordionItem value="usuarios">
                <AccordionTrigger>Usuários & equipe</AccordionTrigger>
                <AccordionContent>
                  <div className="flex flex-col gap-3">
                    <Switch label="Visualizar usuários" defaultChecked />
                    <Switch label="Convidar e editar usuários" defaultChecked={user.role !== 'Visualizador'} />
                    <Switch label="Remover usuários" defaultChecked={user.role === 'Admin'} />
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="dados">
                <AccordionTrigger>Dados & relatórios</AccordionTrigger>
                <AccordionContent>
                  <div className="flex flex-col gap-3">
                    <Switch label="Exportar relatórios" defaultChecked />
                    <Switch label="Configurar integrações" defaultChecked={user.role === 'Admin'} />
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="seguranca">
                <AccordionTrigger>Segurança</AccordionTrigger>
                <AccordionContent>
                  <div className="flex flex-col gap-3">
                    <Switch label="Ver logs de auditoria" defaultChecked={user.role === 'Admin'} />
                    <Switch label="Gerenciar chaves de API" defaultChecked={user.role === 'Admin'} />
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </TabPanel>
      </Tabs>
    </div>
  )
}
