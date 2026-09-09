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

// ---- Dashboard DTOs ----

export interface DashboardMetrics {
  totalTemplates: number;
  hourlyRate: number;
  hoursPerPf: number;
  riskMargin: number;
}
