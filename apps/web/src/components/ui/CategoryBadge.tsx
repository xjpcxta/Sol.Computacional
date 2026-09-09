import { TemplateCategory } from '@pricefunc/shared';

export interface CategoryBadgeProps {
  category: TemplateCategory;
  className?: string;
}

const categoryStyles: Record<TemplateCategory, string> = {
  [TemplateCategory.FRONTEND]: 'bg-accent',
  [TemplateCategory.BACKEND]: 'bg-info',
  [TemplateCategory.INTEGRATION]: 'bg-warning',
  [TemplateCategory.INFRASTRUCTURE]: 'bg-text-secondary',
  [TemplateCategory.SECURITY]: 'bg-error',
  [TemplateCategory.REPORTING]: 'bg-success',
};

const categoryLabels: Record<TemplateCategory, string> = {
  [TemplateCategory.FRONTEND]: 'Frontend',
  [TemplateCategory.BACKEND]: 'Backend',
  [TemplateCategory.INTEGRATION]: 'Integração',
  [TemplateCategory.INFRASTRUCTURE]: 'Infraestrutura',
  [TemplateCategory.SECURITY]: 'Segurança',
  [TemplateCategory.REPORTING]: 'Relatórios',
};

export function CategoryBadge({ category, className = '' }: CategoryBadgeProps) {
  return (
    <span className={`inline-flex items-center gap-2 text-sm text-text-secondary ${className}`}>
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${categoryStyles[category]}`} />
      <span>{categoryLabels[category]}</span>
    </span>
  );
}

