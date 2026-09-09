export const SPLIT_FLAP_ROWS = 10;
export const SPLIT_FLAP_COLUMNS = 20;

interface SplitFlapFrame {
  label: string;
  lines: readonly string[];
}

export const SPLIT_FLAP_FRAMES = [
  {
    label: 'Calculadora de dev. Pontos de função em uma leitura.',
    lines: [
      '',
      'CALCULADORA',
      'DE DEV',
      '',
      'PONTOS DE FUNCAO',
      'EM UMA LEITURA',
      '',
      '',
      'PRICEFUNC / PF.01',
      '',
    ],
  },
  {
    label: 'Escopo em números. Custo sem achismo.',
    lines: [
      '',
      'ESCOPO',
      'EM NUMEROS',
      '',
      'CUSTO',
      'SEM ACHISMO',
      '',
      '',
      'PRICEFUNC / PF.01',
      '',
    ],
  },
  {
    label: 'Do esforço ao valor. Orçamento rastreável.',
    lines: [
      '',
      'DO ESFORCO',
      'AO VALOR',
      '',
      'ORCAMENTO',
      'RASTREAVEL',
      '',
      '',
      'PRICEFUNC / PF.01',
      '',
    ],
  },
  {
    label: 'Arquétipos, parâmetros e estimativas. Técnica e comercial em sintonia.',
    lines: [
      '',
      'ARQUETIPOS',
      'PARAMETROS',
      'ESTIMATIVAS',
      '',
      'TECNICA',
      'COMERCIAL',
      'EM SINTONIA',
      'PRICEFUNC / PF.01',
      '',
    ],
  },
] as const satisfies readonly SplitFlapFrame[];

export function prepareSplitFlapMessage(
  message: string,
  columns: number,
): string[] {
  const normalized = message
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleUpperCase('pt-BR')
    .replace(/[^A-Z0-9 ./-]/g, '')
    .slice(0, columns);
  const remaining = Math.max(columns - normalized.length, 0);
  const leftPadding = Math.floor(remaining / 2);
  const rightPadding = remaining - leftPadding;

  return Array.from(
    `${' '.repeat(leftPadding)}${normalized}${' '.repeat(rightPadding)}`,
  );
}

export function prepareSplitFlapFrame(lines: readonly string[]): string[][] {
  return Array.from({ length: SPLIT_FLAP_ROWS }, (_, rowIndex) => (
    prepareSplitFlapMessage(lines[rowIndex] ?? '', SPLIT_FLAP_COLUMNS)
  ));
}
