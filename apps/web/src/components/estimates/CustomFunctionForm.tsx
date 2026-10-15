import { useState, type FormEvent } from 'react';
import {
  Complexity,
  EstimateItemKind,
  FunctionType,
  TemplateCalculationBasis,
  type FunctionPointWeightMatrix,
} from '@pricefunc/shared';
import { HiOutlinePlus, HiOutlinePuzzle } from 'react-icons/hi';
import { complexityLabels, functionTypeLabels } from '../../lib/functionPointLabels';
import type { BoardItem } from '../../lib/estimateMath';
import { Button, Panel } from '../ui';

interface CustomFunctionFormProps {
  weights: FunctionPointWeightMatrix;
  onAdd: (item: BoardItem) => void;
}

const inputClass = 'min-h-11 w-full rounded-input border border-line bg-input px-3.5 text-sm text-text-primary outline-none hover:border-line-strong focus:border-accent focus:shadow-focus placeholder:text-text-tertiary';

export function CustomFunctionForm({ weights, onAdd }: CustomFunctionFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [functionType, setFunctionType] = useState(FunctionType.EE);
  const [complexity, setComplexity] = useState(Complexity.MEDIUM);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const unitPf = weights[functionType][complexity];

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (name.trim().length < 3 || description.trim().length < 30) {
      setError('Dê um nome à função e descreva em pelo menos 30 caracteres o que o usuário reconhece.');
      return;
    }

    const key = `custom:${crypto.randomUUID()}`;
    onAdd({
      key,
      kind: EstimateItemKind.CUSTOM,
      name: name.trim(),
      description: description.trim(),
      quantity: 1,
      calculationBasis: TemplateCalculationBasis.FUNCTION_POINTS,
      components: [{
        key: `${key}:component`,
        name: name.trim(),
        description: description.trim(),
        functionType,
        complexity,
        quantity,
        unitPf,
      }],
      serviceActivities: [],
    });

    setName('');
    setDescription('');
    setFunctionType(FunctionType.EE);
    setComplexity(Complexity.MEDIUM);
    setQuantity(1);
  };

  return (
    <Panel className="overflow-hidden">
      <div className="border-b border-line-subtle px-5 py-5">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-button border border-line-subtle text-text-secondary">
            <HiOutlinePuzzle aria-hidden="true" size={18} />
          </span>
          <div>
            <p className="eyebrow mb-1">Fora do catálogo</p>
            <h2 className="text-base font-medium">Funcionalidade personalizada</h2>
          </div>
        </div>
        <p className="mt-3 text-sm leading-6 text-text-secondary">
          Registre aqui o que surgiu na conversa e ainda não virou um arquétipo reutilizável.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 p-5">
        <label className="block text-xs font-medium text-text-secondary">
          Nome da função
          <input
            required
            minLength={3}
            maxLength={100}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ex.: Aprovação em duas alçadas"
            className={`${inputClass} mt-2`}
          />
        </label>

        <label className="block text-xs font-medium text-text-secondary">
          Descrição detalhada
          <textarea
            required
            minLength={30}
            maxLength={600}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Explique o processo, os dados envolvidos e o resultado percebido pelo usuário."
            className={`${inputClass} mt-2 min-h-[112px] resize-y py-3 leading-6`}
          />
          <span className="mt-1.5 block text-right font-mono text-[10px] text-text-tertiary">
            {description.trim().length}/600 · mínimo 30
          </span>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-xs font-medium text-text-secondary">
            Tipo funcional
            <select
              value={functionType}
              onChange={(event) => setFunctionType(event.target.value as FunctionType)}
              className={`${inputClass} mt-2`}
            >
              {Object.values(FunctionType).map((value) => (
                <option key={value} value={value}>{functionTypeLabels[value]}</option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-medium text-text-secondary">
            Complexidade
            <select
              value={complexity}
              onChange={(event) => setComplexity(event.target.value as Complexity)}
              className={`${inputClass} mt-2`}
            >
              {Object.values(Complexity).map((value) => (
                <option key={value} value={value}>{complexityLabels[value]}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
          <label className="block text-xs font-medium text-text-secondary">
            Quantidade deste componente
            <input
              type="number"
              min={1}
              max={99}
              required
              value={quantity}
              onChange={(event) => setQuantity(Number(event.target.value))}
              className={`${inputClass} mt-2`}
            />
          </label>
          <div className="pb-2 text-right">
            <p className="data-value font-mono text-xl text-accent">{unitPf * quantity} PF</p>
            <p className="font-mono text-[9px] uppercase tracking-[0.08em] text-text-tertiary">prévia</p>
          </div>
        </div>

        {error ? <p role="alert" className="text-sm leading-5 text-error">{error}</p> : null}

        <Button type="submit" icon={<HiOutlinePlus size={18} />} fullWidth>
          Colocar na lousa
        </Button>
      </form>
    </Panel>
  );
}
