import { useState } from 'react'
import {
  Image as ImageIcon,
  Video,
  Palette,
  BookText,
  ExternalLink,
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  ShieldCheck,
  Plus,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, Button, useToast } from '@/components/ui'
import {
  getResources,
  type MediaLink,
  type Credential,
} from './data'

const MEDIA_ICON: Record<MediaLink['kind'], React.ReactNode> = {
  imagens: <ImageIcon size={18} strokeWidth={1.5} />,
  videos: <Video size={18} strokeWidth={1.5} />,
  marca: <Palette size={18} strokeWidth={1.5} />,
  conteudos: <BookText size={18} strokeWidth={1.5} />,
}

function prettyUrl(url: string) {
  return url.replace(/^https?:\/\//, '')
}

/** Campo copiável; com `secret`, oculta o valor e oferece mostrar/ocultar. */
function CopyField({ label, value, secret }: { label: string; value: string; secret?: boolean }) {
  const [show, setShow] = useState(false)
  const toast = useToast()
  const display = secret && !show ? '•'.repeat(12) : value
  return (
    <div className="rounded-md border border-line bg-slate-800 px-2.5 py-1.5">
      <div className="font-mono text-[10px] uppercase tracking-wider text-faint">{label}</div>
      <div className="flex items-center gap-2">
        <span className="min-w-0 flex-1 truncate font-mono text-mono-data text-strong">{display}</span>
        {secret && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
            className="shrink-0 text-muted transition-colors hover:text-strong focus-visible:outline-none focus-visible:shadow-focus"
          >
            {show ? <EyeOff size={14} strokeWidth={1.5} /> : <Eye size={14} strokeWidth={1.5} />}
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            navigator.clipboard?.writeText(value)
            toast.success('Copiado', label)
          }}
          aria-label={`Copiar ${label.toLowerCase()}`}
          className="shrink-0 text-muted transition-colors hover:text-strong focus-visible:outline-none focus-visible:shadow-focus"
        >
          <Copy size={14} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  )
}

function CredentialRow({ cred }: { cred: Credential }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-line bg-slate-900 p-4 sm:flex-row sm:items-center">
      <div className="flex items-center gap-3 sm:w-52 sm:shrink-0">
        <span className="grid size-9 shrink-0 place-items-center rounded-md bg-steel-tint font-mono text-mono-data font-semibold uppercase text-steel-300">
          {cred.platform.slice(0, 2)}
        </span>
        <div className="min-w-0">
          <div className="truncate font-medium text-strong">{cred.platform}</div>
          {cred.url ? (
            <a
              href={cred.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-mono text-[11px] text-faint transition-colors hover:text-steel-300 focus-visible:outline-none focus-visible:shadow-focus"
            >
              <span className="truncate">{prettyUrl(cred.url)}</span>
              <ExternalLink size={11} strokeWidth={1.5} aria-hidden />
            </a>
          ) : cred.note ? (
            <div className="truncate font-mono text-[11px] text-faint">{cred.note}</div>
          ) : null}
        </div>
      </div>
      <div className="grid flex-1 gap-2 sm:grid-cols-2">
        <CopyField label="Usuário" value={cred.username} />
        <CopyField label="Senha" value={cred.password} secret />
      </div>
    </div>
  )
}

/** Conteúdo da aba "Acessos" do cliente — o cofre de recursos do trabalho. */
export function ClientAccess({ clientId, canManage }: { clientId: string; canManage: boolean }) {
  const toast = useToast()
  const resources = getResources(clientId)

  if (!resources) {
    return (
      <Card className="text-center">
        <p className="text-body-s text-muted">Nenhum acesso cadastrado para este cliente ainda.</p>
        {canManage && (
          <Button className="mt-4" leftIcon={<Plus size={18} strokeWidth={1.5} />} onClick={() => toast.info('Em breve')}>
            Adicionar acesso
          </Button>
        )}
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Bancos & mídia */}
      <Card>
        <CardHeader>
          <CardTitle>Bancos & mídia</CardTitle>
          {canManage && (
            <Button size="sm" variant="secondary" leftIcon={<Plus size={16} strokeWidth={1.5} />} onClick={() => toast.info('Em breve')}>
              Adicionar
            </Button>
          )}
        </CardHeader>
        <div className="grid gap-3 sm:grid-cols-3">
          {resources.media.map((m) => (
            <a
              key={m.id}
              href={m.url}
              target="_blank"
              rel="noreferrer"
              className="group flex flex-col gap-3 rounded-lg border border-line bg-slate-900 p-4 transition-colors hover:border-strong hover:bg-slate-800 focus-visible:outline-none focus-visible:shadow-focus"
            >
              <div className="flex items-center justify-between">
                <span className="grid size-9 place-items-center rounded-md bg-steel-tint text-steel-300">
                  {MEDIA_ICON[m.kind]}
                </span>
                <ExternalLink size={15} strokeWidth={1.5} className="text-faint transition-colors group-hover:text-steel-300" aria-hidden />
              </div>
              <div>
                <div className="font-medium text-strong">{m.label}</div>
                <div className="text-body-s text-muted">{m.hint}</div>
              </div>
            </a>
          ))}
        </div>
      </Card>

      {/* Senhas das plataformas */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2.5">
            <KeyRound size={18} strokeWidth={1.5} className="text-steel-300" aria-hidden />
            <CardTitle>Senhas das plataformas</CardTitle>
          </div>
          {canManage && (
            <Button size="sm" variant="secondary" leftIcon={<Plus size={16} strokeWidth={1.5} />} onClick={() => toast.info('Em breve')}>
              Adicionar
            </Button>
          )}
        </CardHeader>
        <div className="flex flex-col gap-2">
          {resources.credentials.map((cred) => (
            <CredentialRow key={cred.id} cred={cred} />
          ))}
        </div>
        <p className="mt-4 flex items-center gap-2 text-body-s text-faint">
          <ShieldCheck size={15} strokeWidth={1.5} aria-hidden />
          Protótipo — em produção, senhas ficam cifradas e com acesso auditado.
        </p>
      </Card>
    </div>
  )
}
