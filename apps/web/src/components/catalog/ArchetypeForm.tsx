import { useState, type FormEvent } from 'react';
import axios from 'axios';
import {
  Complexity,
  FunctionType,
  TemplateCategory,
  type CreateTemplateComponentRequest,
  type CreateTemplateRequest,
  type Template,
} from '@pricefunc/shared';
import { HiOutlinePlus, HiOutlineTrash, HiOutlineX } from 'react-icons/hi';
import { api } from '../../lib/api';
import { categoryLabels, complexityLabels, functionTypeLabels } from '../../lib/functionPointLabels';
import { Button, Panel } from '../ui';

interface ArchetypeFormProps {
  onCreated: (template: Template) => void;
  onCancel: () => void;
}

interface DraftComponent extends CreateTemplateComponentRequest {
  key: string;
}

const inputClass = 'min-h-11 w-full rounded-input border border-line bg-input px-3.5 text-sm text-text-primary outline-none transition-[border-color,box-shadow] hover:border-line-strong focus:border-accent focus:shadow-focus placeholder:text-text-tertiary';
const textareaClass = `${inputClass} min-h-[104px] resize-y py-3 leading-6`;

function createDraftComponent(): DraftComponent {
  return {
    key: crypto.randomUUID(),
    name: '',
    description: '',
    functionType: FunctionType.EE,
    complexity: Complexity.MEDIUM,
    quantity: 1,
  };
}

function readApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) return message.join(' ');
    if (typeof message === 'string') return message;
  }
  return 'Não foi possível salvar o arquétipo. Revise os dados e tente novamente.';
}

export function ArchetypeForm({ onCreated, onCancel }: ArchetypeFormProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState(TemplateCategory.BACKEND);
  const [description, setDescription] = useState('');
  const [components, setComponents] = useState<DraftComponent[]>([createDraftComponent()]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const updateComponent = <K extends keyof CreateTemplateComponentRequest>(
    key: string,
    field: K,
    value: CreateTemplateComponentRequest[K],
  ) => {
    setComponents((current) => current.map((component) => (
      component.key === key ? { ...component, [field]: value } : component
    )));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (name.trim().length < 3 || description.trim().length < 20) {
      setError('Informe um nome e uma descrição clara para o arquétipo.');
      return;
    }
    if (components.some((component) => (
      component.name.trim().length < 3 || component.description.trim().length < 30
    ))) {
      setError('Cada componente precisa de nome e descrição detalhada com pelo menos 30 caracteres.');
      return;
    }

    const payload: CreateTemplateRequest = {
      name: name.trim(),
      category,
      description: description.trim(),
      components: components.map(({ key: _key, ...component }) => ({
        ...component,
        name: component.name.trim(),
        description: component.description.trim(),
      })),
    };

    setSubmitting(true);
    try {
      const response = await api.post<Template>('/templates', payload);
      onCreated(response.data);
    } catch (requestError) {
      setError(readApiError(requestError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Panel tone="raised" crosshair className="overflow-hidden">
      <div className="flex items-start justify-between gap-6 border-b border-line-subtle px-5 py-5 sm:px-7">
        <div>
          <p className="eyebrow mb-2">Novo registro</p>
          <h2 className="text-xl font-medium tracking-[-0.025em]">Cadastrar arquétipo</h2>
          <p className="mt-2 max-w-[68ch] text-sm leading-6 text-text-secondary">
            Descreva cada função contada. O PriceFunc atribui o peso pela combinação entre tipo e complexidade.
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Fechar cadastro"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-button border border-line-subtle text-text-secondary hover:border-line-strong hover:text-text-primary"
        >
          <HiOutlineX aria-hidden="true" size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-5 sm:p-7">
        <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_240px]">
          <label className="text-sm font-medium text-text-primary">
            Nome do arquétipo
            <input
              autoFocus
              required
              minLength={3}
              maxLength={80}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ex.: Portal de autoatendimento"
              className={`${inputClass} mt-2`}
            />
          </label>
          <label className="text-sm font-medium text-text-primary">
            Categoria
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value as TemplateCategory)}
              className={`${inputClass} mt-2`}
            >
              {Object.values(TemplateCategory).map((value) => (
                <option key={value} value={value}>{categoryLabels[value]}</option>
              ))}
            </select>
          </label>
        </div>

        <label className="mt-5 block text-sm font-medium text-text-primary">
          Descrição do bloco funcional
          <textarea
            required
            minLength={20}
            maxLength={400}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Explique o valor de negócio e os limites deste arquétipo."
            className={`${textareaClass} mt-2`}
          />
        </label>

        <div className="mt-8 flex items-end justify-between gap-5 border-t border-line-subtle pt-7">
          <div>
            <p className="eyebrow mb-2">Memória de cálculo</p>
            <h3 className="text-lg font-medium">Componentes contados</h3>
          </div>
          <span className="font-mono text-xs text-text-tertiary">{components.length}/30</span>
        </div>

        <div className="mt-5 space-y-4">
          {components.map((component, index) => (
            <fieldset key={component.key} className="rounded-panel border border-line-subtle bg-black/10 p-4 sm:p-5">
              <legend className="px-2 font-mono text-[10px] uppercase tracking-[0.08em] text-text-tertiary">
                Componente {String(index + 1).padStart(2, '0')}
              </legend>
              <div className="grid gap-4 lg:grid-cols-[minmax(180px,1fr)_minmax(190px,0.85fr)_150px_100px_auto] lg:items-end">
                <label className="text-xs font-medium text-text-secondary">
                  Nome
                  <input
                    required
                    minLength={3}
                    maxLength={100}
                    value={component.name}
                    onChange={(event) => updateComponent(component.key, 'name', event.target.value)}
                    className={`${inputClass} mt-2`}
                  />
                </label>
                <label className="text-xs font-medium text-text-secondary">
                  Tipo funcional
                  <select
                    value={component.functionType}
                    onChange={(event) => updateComponent(component.key, 'functionType', event.target.value as FunctionType)}
                    className={`${inputClass} mt-2`}
                  >
                    {Object.values(FunctionType).map((value) => (
                      <option key={value} value={value}>{functionTypeLabels[value]}</option>
                    ))}
                  </select>
                </label>
                <label className="text-xs font-medium text-text-secondary">
                  Complexidade
                  <select
                    value={component.complexity}
                    onChange={(event) => updateComponent(component.key, 'complexity', event.target.value as Complexity)}
                    className={`${inputClass} mt-2`}
                  >
                    {Object.values(Complexity).map((value) => (
                      <option key={value} value={value}>{complexityLabels[value]}</option>
                    ))}
                  </select>
                </label>
                <label className="text-xs font-medium text-text-secondary">
                  Quantidade
                  <input
                    type="number"
                    min={1}
                    max={99}
                    required
                    value={component.quantity}
                    onChange={(event) => updateComponent(component.key, 'quantity', Number(event.target.value))}
                    className={`${inputClass} mt-2`}
                  />
                </label>
                <button
                  type="button"
                  disabled={components.length === 1}
                  onClick={() => setComponents((current) => current.filter((item) => item.key !== component.key))}
                  aria-label={`Remover componente ${index + 1}`}
                  className="flex h-11 w-11 items-center justify-center rounded-button border border-line-subtle text-text-tertiary hover:border-error/40 hover:text-error disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <HiOutlineTrash aria-hidden="true" size={18} />
                </button>
              </div>
              <label className="mt-4 block text-xs font-medium text-text-secondary">
                Descrição detalhada da função calculada
                <textarea
                  required
                  minLength={30}
                  maxLength={600}
                  value={component.description}
                  onChange={(event) => updateComponent(component.key, 'description', event.target.value)}
                  placeholder="Descreva o processo elementar ou grupo lógico de dados sob a ótica do usuário."
                  className={`${textareaClass} mt-2`}
                />
                <span className="mt-2 block text-right font-mono text-[10px] text-text-tertiary">
                  {component.description.trim().length}/600 · mínimo 30
                </span>
              </label>
            </fieldset>
          ))}
        </div>

        <button
          type="button"
          disabled={components.length >= 30}
          onClick={() => setComponents((current) => [...current, createDraftComponent()])}
          className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-button border border-dashed border-line px-4 text-sm text-text-secondary hover:border-accent/45 hover:text-accent disabled:opacity-40"
        >
          <HiOutlinePlus aria-hidden="true" size={18} />
          Adicionar componente
        </button>

        {error ? (
          <p role="alert" className="mt-5 rounded-input border border-error/25 bg-error/[0.055] px-4 py-3 text-sm text-error">
            {error}
          </p>
        ) : null}

        <div className="mt-7 flex flex-col-reverse gap-3 border-t border-line-subtle pt-6 sm:flex-row sm:justify-end">
          <Button type="button" onClick={onCancel}>Cancelar</Button>
          <Button type="submit" variant="primary" isLoading={submitting} icon={<HiOutlinePlus size={18} />}>
            {submitting ? 'Salvando' : 'Criar arquétipo'}
          </Button>
        </div>
      </form>
    </Panel>
  );
}
