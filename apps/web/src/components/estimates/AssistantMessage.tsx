import { EstimateAssistantIntent } from '@pricefunc/shared';
import { HiOutlineSparkles } from 'react-icons/hi';
import type { EstimateAssistantUiMessage } from '../../hooks/useEstimateAssistant';
import { Button } from '../ui';

interface AssistantMessageProps {
  message: EstimateAssistantUiMessage;
  onApplyPremises: (content: string) => void;
}

export function AssistantMessage({ message, onApplyPremises }: AssistantMessageProps) {
  const assistant = message.role === 'assistant';

  return (
    <article
      className={`max-w-[92%] rounded-panel border px-4 py-3 ${assistant
        ? 'border-line-subtle bg-white/[0.025] text-text-secondary'
        : 'ml-auto border-accent/25 bg-accent-soft text-text-primary'}`}
    >
      <div className="mb-2 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.08em] text-text-tertiary">
        {assistant ? <HiOutlineSparkles aria-hidden="true" size={13} /> : null}
        {assistant ? 'Assistente' : 'Você'}
      </div>
      <p className="whitespace-pre-wrap text-sm leading-6">{message.content}</p>
      {assistant && message.intent === EstimateAssistantIntent.PREMISES_DRAFT ? (
        <Button
          className="mt-4 w-full"
          onClick={() => onApplyPremises(message.content)}
        >
          Usar nas premissas
        </Button>
      ) : null}
    </article>
  );
}
