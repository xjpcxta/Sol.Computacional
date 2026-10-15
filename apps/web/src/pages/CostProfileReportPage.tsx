import { useEffect, useState } from 'react';
import { CostProfileSource, type CostProfileSettings } from '@pricefunc/shared';
import { HiOutlineArrowLeft, HiOutlinePrinter } from 'react-icons/hi';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Button, Panel, Skeleton } from '../components/ui';

export function CostProfileReportPage() {
  const [settings, setSettings] = useState<CostProfileSettings | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    api.get<CostProfileSettings>('/cost-profile/settings').then((response) => setSettings(response.data)).catch(() => setFailed(true));
  }, []);

  if (failed) return <Panel role="alert" className="p-8 text-center text-error">Não foi possível preparar o relatório do perfil.</Panel>;
  if (!settings) return <Skeleton shape="block" height="620px" />;

  const profile = settings.effectiveProfile;
  const formatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });
  const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  const updatedAt = profile.source === CostProfileSource.GLOBAL ? settings.globalProfile.updatedAt : settings.userProfile.updatedAt;

  return (
    <div className="cost-profile-report overflow-hidden rounded-panel border border-line-subtle bg-[#0d0f0d]/90 shadow-overlay">
      <div className="print-hidden flex flex-wrap items-center justify-between gap-3 border-b border-line-subtle p-4"><Link to="/settings" className="inline-flex min-h-11 items-center gap-2 text-sm text-text-secondary hover:text-text-primary"><HiOutlineArrowLeft size={18} />Voltar</Link><Button variant="primary" icon={<HiOutlinePrinter size={18} />} onClick={() => window.print()}>Imprimir / salvar PDF</Button></div>
      <header className="border-b border-line-subtle px-6 py-8 sm:px-10"><p className="eyebrow mb-3">PriceFunc / parâmetros comerciais</p><h1 className="font-display text-4xl font-light tracking-[-0.045em]">Perfil de custo vigente</h1><p className="mt-3 text-sm text-text-secondary">Origem: {profile.source === CostProfileSource.GLOBAL ? 'global' : 'individual'} · Atualizado em {new Intl.DateTimeFormat('pt-BR').format(new Date(updatedAt))}</p></header>
      <section className="grid gap-px bg-line-subtle sm:grid-cols-2 lg:grid-cols-5">
        {[
          ['Valor por hora', currency.format(profile.hourlyRate)],
          ['Produtividade', `${formatter.format(profile.hoursPerPf)} h/PF`],
          ['Risco', `${formatter.format(profile.riskMargin)}%`],
          ['Markup de lucro', `${formatter.format(profile.profitMarkup)}%`],
          ['Impostos', `${formatter.format(profile.taxRate)}%`],
        ].map(([label, value]) => <div key={label} className="bg-[#111411] px-5 py-6"><p className="text-xs text-text-tertiary">{label}</p><p className="mt-2 font-mono text-xl text-text-primary">{value}</p></div>)}
      </section>
      <section className="px-6 py-8 sm:px-10"><p className="eyebrow mb-3">Memória da fórmula</p><h2 className="text-xl font-medium">Ordem de aplicação</h2><ol className="mt-5 space-y-3 text-sm leading-6 text-text-secondary"><li>1. Horas funcionais = Pontos de Função × fator de produtividade.</li><li>2. Horas totais = horas funcionais + horas de serviços consultivos.</li><li>3. Custo-base = horas totais × valor por hora.</li><li>4. Margem de risco é aplicada sobre o custo-base.</li><li>5. Markup de lucro é aplicado sobre custo-base mais risco.</li><li>6. Impostos são aplicados sobre o subtotal comercial.</li></ol><p className="mt-7 border-t border-line-subtle pt-5 text-xs leading-5 text-text-tertiary">Este documento registra os parâmetros vigentes na data da emissão. Cada estimativa salva mantém sua própria fotografia dos parâmetros utilizados.</p></section>
    </div>
  );
}
