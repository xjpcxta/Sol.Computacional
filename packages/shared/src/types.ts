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

export enum TemplateCalculationBasis {
  FUNCTION_POINTS = 'function-points',
  SERVICE_HOURS = 'service-hours',
}

export enum CostProfileSource {
  USER = 'user',
  GLOBAL = 'global',
}

export enum EstimatePresetKey {
  COMPLETE_SOFTWARE = 'complete-software',
  MVP = 'mvp',
  SALES_SOFTWARE = 'sales-software',
  LEGACY_INTEGRATION = 'legacy-integration',
  LANDING_PAGE = 'landing-page',
  RISK_ASSESSMENT = 'risk-assessment',
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
  calculationBasis: TemplateCalculationBasis;
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
  serviceActivities: TemplateServiceActivity[];
  serviceHours: number;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateServiceActivity {
  id: string;
  templateId: string;
  name: string;
  description: string;
  estimatedHours: number;
  createdAt: string;
  updatedAt: string;
}

export interface CostProfileValues {
  hourlyRate: number;
  hoursPerPf: number;
  riskMargin: number;
  profitMarkup: number;
  taxRate: number;
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
  /** Margem de risco em % */
  riskMargin: number;
  /** Markup de lucro aplicado após o adicional de risco */
  profitMarkup: number;
  /** Impostos aplicados após custo, risco e lucro */
  taxRate: number;
  createdAt: string;
  updatedAt: string;
}

export interface GlobalCostProfile extends CostProfileValues {
  id: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EffectiveCostProfile extends CostProfileValues {
  source: CostProfileSource;
}

export interface CostProfileSettings {
  userProfile: CostProfile;
  globalProfile: GlobalCostProfile;
  effectiveProfile: EffectiveCostProfile;
  canManageGlobal: boolean;
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
  profitMarkup?: number;
  taxRate?: number;
}

export interface UpdateGlobalCostProfileRequest extends CostProfileValues {
  isActive: boolean;
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
  calculationBasis: TemplateCalculationBasis;
  components?: CreateTemplateComponentRequest[];
  serviceActivities?: CreateTemplateServiceActivityRequest[];
}

export interface CreateTemplateServiceActivityRequest {
  name: string;
  description: string;
  estimatedHours: number;
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
  calculationBasis: TemplateCalculationBasis;
  totalPf: number;
  serviceHours: number;
  components: EstimateItemComponent[];
  serviceActivities: EstimateItemServiceActivity[];
  createdAt: string;
}

export interface EstimateItemServiceActivity {
  id: string;
  estimateItemId: string;
  name: string;
  description: string;
  estimatedHours: number;
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
  profitMarkup: number;
  taxRate: number;
  pricingSource: CostProfileSource;
  functionPointHours: number;
  serviceHours: number;
  baseCost: number;
  riskAmount: number;
  profitAmount: number;
  taxAmount: number;
  items: EstimateItem[];
}

// ---- Estimate AI assistant DTOs ----

export enum EstimateAssistantIntent {
  CHAT = 'chat',
  CUSTOM_FUNCTION_REVIEW = 'custom-function-review',
  PREMISES_DRAFT = 'premises-draft',
  BOARD_REVIEW = 'board-review',
}

export type EstimateAssistantMessageRole = 'user' | 'assistant';

export interface EstimateAssistantChatMessage {
  role: EstimateAssistantMessageRole;
  content: string;
}

export interface EstimateAssistantBoardComponent {
  name: string;
  description: string;
  functionType: FunctionType;
  complexity: Complexity;
  quantity: number;
}

export interface EstimateAssistantBoardItem {
  name: string;
  description: string;
  calculationBasis: TemplateCalculationBasis;
  quantity: number;
  components: EstimateAssistantBoardComponent[];
  serviceActivities: Array<{
    name: string;
    description: string;
    estimatedHours: number;
  }>;
}

export interface EstimateAssistantCatalogItem {
  name: string;
  description: string;
  calculationBasis: TemplateCalculationBasis;
}

export interface EstimateAssistantContext {
  projectTitle: string;
  scopeBoundary: string;
  calculationNotes: string;
  boardItems: EstimateAssistantBoardItem[];
  catalogItems: EstimateAssistantCatalogItem[];
}

export interface EstimateAssistantCustomFunctionDraft {
  name: string;
  description: string;
  functionType: FunctionType;
  complexity: Complexity;
  quantity: number;
}

export interface EstimateAssistantRequest {
  intent: EstimateAssistantIntent;
  message?: string;
  context: EstimateAssistantContext;
  customFunction?: EstimateAssistantCustomFunctionDraft;
  history: EstimateAssistantChatMessage[];
}

export interface EstimateAssistantResponse {
  message: string;
  requestId: string;
  intent: EstimateAssistantIntent;
}

export interface EstimateAssistantConfiguration {
  enabled: boolean;
  maxHistoryMessages: number;
}

// ---- Dashboard DTOs ----

export interface DashboardMetrics {
  totalTemplates: number;
  hourlyRate: number;
  hoursPerPf: number;
  riskMargin: number;
}
