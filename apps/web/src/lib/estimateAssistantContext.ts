import type {
  EstimateAssistantContext,
  Template,
} from '@pricefunc/shared';
import type { BoardItem } from './estimateMath';

interface EstimateAssistantContextInput {
  title: string;
  scopeBoundary: string;
  calculationNotes: string;
  items: readonly BoardItem[];
  templates: readonly Template[];
}

export function buildEstimateAssistantContext(
  input: EstimateAssistantContextInput,
): EstimateAssistantContext {
  return {
    projectTitle: input.title.trim(),
    scopeBoundary: input.scopeBoundary.trim(),
    calculationNotes: input.calculationNotes.trim(),
    boardItems: input.items.map((item) => ({
      name: item.name,
      description: item.description,
      calculationBasis: item.calculationBasis,
      quantity: item.quantity,
      components: item.components.map((component) => ({
        name: component.name,
        description: component.description,
        functionType: component.functionType,
        complexity: component.complexity,
        quantity: component.quantity,
      })),
      serviceActivities: item.serviceActivities.map((activity) => ({
        name: activity.name,
        description: activity.description,
        estimatedHours: activity.estimatedHours,
      })),
    })),
    catalogItems: input.templates.map((template) => ({
      name: template.name,
      description: template.description,
      calculationBasis: template.calculationBasis,
    })),
  };
}
