import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import {
  HiOutlineChatAlt2,
  HiOutlinePaperAirplane,
  HiOutlineSparkles,
  HiOutlineX,
} from 'react-icons/hi';
import type { EstimateAssistantUiMessage } from '../../hooks/useEstimateAssistant';
import { Button } from '../ui';
import { AssistantMessage } from './AssistantMessage';

interface EstimateAssistantDrawerProps {
  open: boolean;
  enabled: boolean;
  configurationLoading: boolean;
  messages: readonly EstimateAssistantUiMessage[];
  isSending: boolean;
  error: string | null;
  eligibilityReason?: string;
  onClose: () => void;
  onSend: (message: string) => Promise<void>;
  onRetry: () => Promise<void>;
  onCancel: () => void;
  onApplyPremises: (content: string) => void;
  onFocusRequirement: () => void;
}

export function EstimateAssistantDrawer({
  open,
  enabled,
  configurationLoading,
  messages,
  isSending,
  error,
  eligibilityReason,
  onClose,
  onSend,
  onRetry,
  onCancel,
  onApplyPremises,
  onFocusRequirement,
}: EstimateAssistantDrawerProps) {
  const [draft, setDraft] = useState('');
  const drawerRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const logEndRef = useRef<HTMLDivElement>(null);
  const canSend = enabled && !configurationLoading && !eligibilityReason && !isSending;

  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.requestAnimationFrame(() => inputRef.current?.focus());
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (open) logEndRef.current?.scrollIntoView({ block: 'end' });
  }, [isSending, messages, open]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const message = draft.trim();
    if (!message || !canSend) return;
    setDraft('');
    await onSend(message);
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== 'Tab') return;
    const controls = Array.from(drawerRef.current?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
    ) ?? []);
    const first = controls.at(0);
    const last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  };

  if (!open) return null;

  return (
    <div className="print-hidden fixed inset-0 z-[70]" role="presentation">
      <button
        type="button"
        aria-label="Fechar assistente"
        onClick={onClose}
        className="absolute inset-0 bg-black/65 backdrop-blur-[2px]"
      />
      <aside
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="assistant-title"
        onKeyDown={handleKeyDown}
        className="assistant-drawer absolute inset-y-0 right-0 flex w-full max-w-[440px] flex-col border-l border-line bg-[#111411] shadow-overlay"
      >
        <header className="border-b border-line-subtle px-5 py-5 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-button border border-accent/30 bg-accent-soft text-accent">
                <HiOutlineSparkles aria-hidden="true" size={19} />
              </span>
              <div>
                <p className="eyebrow mb-1">Análise contextual</p>
                <h2 id="assistant-title" className="text-lg font-medium">Assistente da estimativa</h2>
              </div>
            </div>
            <button
              type="button"
              aria-label="Fechar assistente"
              onClick={onClose}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-button border border-line-subtle text-text-secondary hover:border-line-strong hover:text-text-primary"
            >
              <HiOutlineX aria-hidden="true" size={18} />
            </button>
          </div>
          <p className="mt-4 text-xs leading-5 text-text-tertiary">
            Sugestão assistida por IA. Valide requisitos e classificação antes de salvar.
          </p>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5 [scrollbar-gutter:stable] sm:px-6" aria-live="polite">
          {configurationLoading ? (
            <p className="text-sm text-text-secondary">Verificando disponibilidade do assistente…</p>
          ) : !enabled ? (
            <div className="rounded-panel border border-warning/25 bg-warning/[0.055] p-4 text-sm leading-6 text-text-secondary">
              Configure o assistente no Render para usar esta análise.
            </div>
          ) : eligibilityReason ? (
            <div className="rounded-panel border border-warning/25 bg-warning/[0.055] p-4">
              <p className="text-sm leading-6 text-text-secondary">{eligibilityReason}</p>
              <button
                type="button"
                onClick={onFocusRequirement}
                className="mt-3 text-sm font-medium text-accent hover:text-accent-hover"
              >
                Completar contexto do projeto
              </button>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-button border border-line-subtle text-text-tertiary">
                <HiOutlineChatAlt2 aria-hidden="true" size={22} />
              </span>
              <h3 className="mt-5 text-base font-medium">O contexto está pronto.</h3>
              <p className="mt-2 max-w-[34ch] text-sm leading-6 text-text-secondary">
                Pergunte sobre requisitos, premissas, riscos ou cobertura da lousa atual.
              </p>
            </div>
          ) : null}

          {messages.map((message) => (
            <AssistantMessage
              key={message.id}
              message={message}
              onApplyPremises={onApplyPremises}
            />
          ))}

          {isSending ? (
            <div className="flex items-center gap-3 text-sm text-text-secondary">
              <span className="h-4 w-4 animate-spin rounded-full border border-accent border-r-transparent" aria-hidden="true" />
              Analisando o contexto atual…
              <button type="button" onClick={onCancel} className="ml-auto text-xs text-text-tertiary hover:text-text-primary">
                Cancelar
              </button>
            </div>
          ) : null}

          {error ? (
            <div role="alert" className="rounded-panel border border-error/25 bg-error/[0.055] p-4">
              <p className="text-sm leading-6 text-error">{error}</p>
              <button type="button" onClick={() => void onRetry()} className="mt-3 text-xs font-medium text-text-primary hover:text-accent">
                Tentar novamente
              </button>
            </div>
          ) : null}
          <div ref={logEndRef} />
        </div>

        <form onSubmit={(event) => void submit(event)} className="border-t border-line-subtle bg-black/15 p-4 sm:p-5">
          <label className="sr-only" htmlFor="estimate-assistant-message">Mensagem para o assistente</label>
          <textarea
            ref={inputRef}
            id="estimate-assistant-message"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
            disabled={!canSend}
            maxLength={2_000}
            rows={3}
            placeholder="Pergunte o que pode estar faltando…"
            className="w-full resize-none rounded-input border border-line bg-input px-3.5 py-3 text-sm leading-6 text-text-primary outline-none placeholder:text-text-tertiary focus:border-accent focus:shadow-focus disabled:cursor-not-allowed disabled:opacity-50"
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-text-tertiary">Enter envia · Shift+Enter quebra linha</span>
            <Button
              type="submit"
              variant="primary"
              icon={<HiOutlinePaperAirplane size={16} />}
              disabled={!canSend || !draft.trim()}
            >
              Enviar
            </Button>
          </div>
        </form>
      </aside>
    </div>
  );
}
