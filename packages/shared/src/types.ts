// ============================================
// PriceFunc — Shared Types & DTOs
// ============================================

// ---- Enums ----

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

export enum Complexity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export enum TemplateCategory {
  FRONTEND = 'frontend',
  BACKEND = 'backend',
  INTEGRATION = 'integration',
  INFRASTRUCTURE = 'infrastructure',
  SECURITY = 'security',
  REPORTING = 'reporting',
}

export enum FunctionType {
  ALI = 'ALI',
  AIE = 'AIE',
  EE = 'EE',
  SE = 'SE',
  CE = 'CE',
}

export enum EstimateStatus {
  DRAFT = 'draft',
  SENT = 'sent',
}

export enum EstimateItemKind {
  ARCHETYPE = 'archetype',
  CUSTOM = 'custom',
}

export enum EstimatePresetKey {
  COMPLETE_SOFTWARE = 'complete-software',
  MVP = 'mvp',
  SALES_SOFTWARE = 'sales-software',
  LEGACY_INTEGRATION = 'legacy-integration',
}

// ---- Entities ----

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface Template {
  id: string;
  name: string;
  category: TemplateCategory;
  description: string;
  /** Arquivo Lógico Interno */
  pfAli: number;
  /** Arquivo de Interface Externa */
  pfAie: number;
  /** Entrada Externa */
  pfEe: number;
  /** Saída Externa */
  pfSe: number;
  /** Consulta Externa */
  pfCe: number;
  /** Total PF (computed) */
  totalPf: number;
  components: TemplateComponent[];
  createdAt: string;
  updatedAt: string;
}

export interface TemplateComponent {
  id: string;
  templateId: string;
  name: string;
  description: string;
  functionType: FunctionType;
  complexity: Complexity;
  quantity: number;
  unitPf: number;
  totalPf: number;
  createdAt: string;
  updatedAt: string;
}

export interface CostProfile {
  id: string;
  userId: string;
  /** Valor da hora em BRL */
  hourlyRate: number;
  /** Horas por Ponto de Função */
  hoursPerPf: number;
  /** Margem de risco/lucro em % */
  riskMargin: number;
  createdAt: string;
  updatedAt: string;
}

// ---- Auth DTOs ----

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}

export interface AuthUser {
  id: string;
  username: string;
  role: UserRole;
}

// ---- Cost Profile DTOs ----

export interface UpdateCostProfileRequest {
  hourlyRate?: number;
  hoursPerPf?: number;
  riskMargin?: number;
}

// ---- Catalog DTOs ----

export interface CreateTemplateComponentRequest {
  name: string;
  description: string;
  functionType: FunctionType;
  complexity: Complexity;
  quantity: number;
}

export interface CreateTemplateRequest {
  name: string;
  category: TemplateCategory;
  description: string;
  components: CreateTemplateComponentRequest[];
}

// ---- Estimation DTOs ----

export type FunctionPointWeightMatrix = Record<
  FunctionType,
  Record<Complexity, number>
>;

export interface EstimatePreset {
  key: EstimatePresetKey;
  name: string;
  description: string;
  templateIds: string[];
  templateNames: string[];
}

export interface EstimateConfiguration {
  presets: EstimatePreset[];
  weights: FunctionPointWeightMatrix;
}

export interface CreateEstimateItemRequest {
  kind: EstimateItemKind;
  quantity: number;
  templateId?: string;
  name?: string;
  description?: string;
  components?: CreateTemplateComponentRequest[];
}

export interface CreateEstimateRequest {
  title: string;
  clientName: string;
  scopeBoundary: string;
  calculationNotes: string;
  presetKey?: EstimatePresetKey;
  status: EstimateStatus;
  items: CreateEstimateItemRequest[];
}

export interface EstimateItemComponent {
  id: string;
  estimateItemId: string;
  name: string;
  description: string;
  functionType: FunctionType;
  complexity: Complexity;
  quantity: number;
  unitPf: number;
  totalPf: number;
  createdAt: string;
}

export interface EstimateItem {
  id: string;
  estimateId: string;
  templateId: string | null;
  kind: EstimateItemKind;
  name: string;
  description: string;
  quantity: number;
  totalPf: number;
  components: EstimateItemComponent[];
  createdAt: string;
}

export interface EstimateSummary {
  id: string;
  title: string;
  clientName: string;
  presetKey: EstimatePresetKey | null;
  status: EstimateStatus;
  totalPf: number;
  estimatedHours: number;
  totalPrice: number;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Estimate extends EstimateSummary {
  userId: string;
  scopeBoundary: string;
  calculationNotes: string;
  hourlyRate: number;
  hoursPerPf: number;
  riskMargin: number;
  baseCost: number;
  riskAmount: number;
  items: EstimateItem[];
}

// ---- Dashboard DTOs ----

export interface DashboardMetrics {
  totalTemplates: number;
  hourlyRate: number;
  hoursPerPf: number;
  riskMargin: number;
}
