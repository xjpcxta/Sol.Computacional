import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  CostProfileSource,
  type CostProfileSettings,
  type CostProfileValues,
  type UpdateGlobalCostProfileRequest,
} from '@pricefunc/shared';
import { HiOutlineDocumentReport, HiOutlineGlobeAlt, HiOutlineRefresh, HiOutlineSave, HiOutlineUser } from 'react-icons/hi';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { calculateCommercialTotals } from '../lib/estimateMath';
import { Button, Panel, Skeleton } from '../components/ui';

const inputClass = 'min-h-11 w-full rounded-input border border-line bg-input px-3.5 text-sm text-text-primary outline-none hover:border-line-strong focus:border-accent focus:shadow-focus';

const fields: Array<{ key: keyof CostProfileValues; label: string; suffix: string; min: number }> = [
  { key: 'hourlyRate', label: 'Valor por hora', suffix: 'R$/h', min: 0.01 },
  { key: 'hoursPerPf', label: 'Fator de produtividade', suffix: 'h/PF', min: 0.01 },
  { key: 'riskMargin', label: 'Margem de risco', suffix: '%', min: 0 },
  { key: 'profitMarkup', label: 'Markup de lucro', suffix: '%', min: 0 },
  { key: 'taxRate', label: 'Impostos', suffix: '%', min: 0 },
];

function valuesFrom(settings: CostProfileSettings, scope: 'user' | 'global'): CostProfileValues {
  const profile = scope === 'user' ? settings.userProfile : settings.globalProfile;
  return {
    hourlyRate: profile.hourlyRate,
    hoursPerPf: profile.hoursPerPf,
    riskMargin: profile.riskMargin,
    profitMarkup: profile.profitMarkup,
    taxRate: profile.taxRate,
  };
}

function readError(error: unknown): string {
  if (axios.isAxiosError(error) && typeof error.response?.data?.message === 'string') return error.response.data.message;
  return 'Não foi possível salvar o perfil de custo.';
}

export function CostProfilePage() {
  const [settings, setSettings] = useState<CostProfileSettings | null>(null);
  const [userDraft, setUserDraft] = useState<CostProfileValues | null>(null);
  const [globalDraft, setGlobalDraft] = useState<CostProfileValues | null>(null);
  const [globalActive, setGlobalActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<'user' | 'global' | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<CostProfileSettings>('/cost-profile/settings');
      setSettings(response.data);
      setUserDraft(valuesFrom(response.data, 'user'));
      setGlobalDraft(valuesFrom(response.data, 'global'));
      setGlobalActive(response.data.globalProfile.isActive);
    } catch {
      setError('Não foi possível carregar os parâmetros comerciais.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const preview = useMemo(() => {
    if (!settings || !userDraft || !globalDraft) return null;
    const profile = globalActive ? globalDraft : userDraft;
    return calculateCommercialTotals(100, 0, profile);
  }, [globalActive, globalDraft, settings, userDraft]);

  const updateDraft = (scope: 'user' | 'global', key: keyof CostProfileValues, value: number) => {
    const setter = scope === 'user' ? setUserDraft : setGlobalDraft;
    setter((current) => current ? { ...current, [key]: value } : current);
  };

  const saveUser = async () => {
    if (!userDraft) return;
    setSaving('user'); setError(null); setMessage(null);
    try {
      await api.put('/cost-profile/user', userDraft);
      setMessage('Perfil individual atualizado.');
      await load();
    } catch (requestError) { setError(readError(requestError)); } finally { setSaving(null); }
  };

  const saveGlobal = async () => {
    if (!globalDraft) return;
    setSaving('global'); setError(null); setMessage(null);
    const payload: UpdateGlobalCostProfileRequest = { ...globalDraft, isActive: globalActive };
    try {
      await api.put('/cost-profile/global', payload);
      setMessage('Perfil global atualizado.');
      await load();
    } catch (requestError) { setError(readError(requestError)); } finally { setSaving(null); }
  };

  if (loading) return <div className="space-y-6"><Skeleton width="55%" height="64px" /><Skeleton shape="block" height="520px" /></div>;
  if (!settings || !userDraft || !globalDraft) return <Panel role="alert" className="p-8 text-center"><p className="text-error">{error}</p><Button onClick={() => void load()} icon={<HiOutlineRefresh size={18} />} className="mt-5">Tentar novamente</Button></Panel>;

  const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

  const renderFields = (scope: 'user' | 'global', values: CostProfileValues) => (
    <div className="grid gap-4 sm:grid-cols-2">
      {fields.map((field) => (
        <label key={field.key} className="text-xs font-medium text-text-secondary">
          {field.label}
          <span className="relative mt-2 block">
            <input type="number" min={field.min} max={field.suffix === '%' ? 100 : undefined} step="0.01" value={values[field.key]} onChange={(event) => updateDraft(scope, field.key, Number(event.target.value))} className={`${inputClass} pr-16`} />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10px] text-text-tertiary">{field.suffix}</span>
          </span>
        </label>
      ))}
    </div>
  );

  return (
    <div className="space-y-8 pb-12">
      <header className="flex flex-col gap-5 border-b border-line-subtle pb-8 lg:flex-row lg:items-end lg:justify-between">
        <div><p className="eyebrow mb-3">Gestão / parâmetros comerciais</p><h1 className="font-display text-[clamp(2.5rem,5vw,4.4rem)] font-light leading-none tracking-[-0.05em]">Perfil de custo.</h1><p className="mt-4 max-w-[65ch] text-sm leading-6 text-text-secondary">Defina produtividade, preço da hora e adicionais usados nas próximas estimativas.</p></div>
        <Link to="/settings/report" className="print-hidden inline-flex min-h-11 items-center justify-center gap-2 rounded-button border border-line px-5 text-sm text-text-primary hover:border-accent/45 hover:text-accent"><HiOutlineDocumentReport size={18} />Exportar perfil</Link>
      </header>

      <div className={`rounded-panel border px-5 py-4 ${settings.effectiveProfile.source === CostProfileSource.GLOBAL ? 'border-accent/30 bg-accent-soft' : 'border-line-subtle bg-white/[0.02]'}`}>
        <p className="text-sm font-medium text-text-primary">{settings.effectiveProfile.source === CostProfileSource.GLOBAL ? 'Perfil global ativo' : 'Perfil individual ativo'}</p>
        <p className="mt-1 text-xs text-text-secondary">Este conjunto será fotografado nas novas estimativas; relatórios antigos não serão recalculados.</p>
      </div>

      {message ? <p role="status" className="rounded-input border border-success/25 bg-success/[0.055] px-4 py-3 text-sm text-success">{message}</p> : null}
      {error ? <p role="alert" className="rounded-input border border-error/25 bg-error/[0.055] px-4 py-3 text-sm text-error">{error}</p> : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel className="p-5 sm:p-6">
          <div className="mb-6 flex items-start gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-button border border-line-subtle text-text-secondary"><HiOutlineUser size={19} /></span><div><h2 className="text-lg font-medium">Perfil individual</h2><p className="mt-1 text-xs text-text-tertiary">{globalActive ? 'Armazenado; não aplicado enquanto o perfil global estiver ativo.' : 'Aplicado às suas novas estimativas.'}</p></div></div>
          {renderFields('user', userDraft)}
          <Button variant="primary" icon={<HiOutlineSave size={18} />} isLoading={saving === 'user'} onClick={() => void saveUser()} className="mt-6">Salvar perfil individual</Button>
        </Panel>

        <Panel className="p-5 sm:p-6">
          <div className="mb-6 flex items-start justify-between gap-4"><div className="flex items-start gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-button border border-accent/25 text-accent"><HiOutlineGlobeAlt size={19} /></span><div><h2 className="text-lg font-medium">Perfil global</h2><p className="mt-1 text-xs text-text-tertiary">Quando ativo, prevalece integralmente para todos.</p></div></div><label className="flex items-center gap-2 text-xs text-text-secondary"><input type="checkbox" checked={globalActive} disabled={!settings.canManageGlobal} onChange={(event) => setGlobalActive(event.target.checked)} className="h-4 w-4 accent-[var(--accent-bg)]" />Ativo</label></div>
          <fieldset disabled={!settings.canManageGlobal} className="disabled:opacity-50">{renderFields('global', globalDraft)}</fieldset>
          {settings.canManageGlobal ? <Button variant="primary" icon={<HiOutlineSave size={18} />} isLoading={saving === 'global'} onClick={() => void saveGlobal()} className="mt-6">Salvar perfil global</Button> : <p className="mt-6 text-xs text-text-tertiary">Somente administradores podem alterar este perfil.</p>}
        </Panel>
      </div>

      {preview ? <Panel className="p-5 sm:p-6"><p className="eyebrow mb-2">Leitura da fórmula</p><h2 className="text-xl font-medium">Exemplo com 100 PF</h2><p className="mt-2 text-xs text-text-tertiary">Prévia do perfil {globalActive ? 'global' : 'individual'} ainda que existam alterações não salvas.</p><div className="mt-5 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3"><p>Esforço: <strong>{preview.functionPointHours.toLocaleString('pt-BR')} h</strong></p><p>Custo-base: <strong>{currency.format(preview.baseCost)}</strong></p><p>Risco: <strong>{currency.format(preview.riskAmount)}</strong></p><p>Lucro: <strong>{currency.format(preview.profitAmount)}</strong></p><p>Impostos: <strong>{currency.format(preview.taxAmount)}</strong></p><p className="text-accent">Total: <strong>{currency.format(preview.totalPrice)}</strong></p></div></Panel> : null}
    </div>
  );
}
