
export enum StockStatus {
  INTEIRA = 'Inteira',
  EM_USO = 'Em Uso',
  COM_SOBRA = 'Com Sobra',
  FINALIZADA = 'Finalizada'
}

export enum MaterialCategory {
  GRANITO = 'Granito',
  MARMORE = 'Mármore',
  QUARTZO = 'Quartzo',
  DEKTON = 'Dekton',
  MDF = 'MDF',
  OUTRO = 'Outro'
}

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN', // Dono da plataforma
  ADMIN = 'ADMIN',             // Dono da Marmoraria
  OPERATOR = 'OPERATOR'       // Funcionário
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  companyId: string;
}

export enum CompanyStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING = 'PENDING'
}

export interface Company {
  id: string;
  name: string;
  adminId: string;
  status: CompanyStatus;
  createdAt: string;
  monthlyFee: number; // Valor da assinatura mensal
}

export interface Point {
  x: number;
  y: number;
}

export interface CutHistoryRecord {
  id: string;
  date: string;
  project: string;
  clientName: string;
  areaUsed: number;
  leftoverWidth: number;
  leftoverHeight: number;
  leftoverPoints?: Point[];
  observations?: string;
  operatorId: string;
  operatorName: string;
}

export interface InventoryItem {
  id: string;
  companyId: string;
  parentItemId?: string;
  category: MaterialCategory;
  commercialName: string;
  thickness: string;
  originalWidth: number;
  originalHeight: number;
  currentWidth: number;
  currentHeight: number;
  location?: string;
  shapePoints?: Point[];
  totalArea: number;
  availableArea: number;
  supplier: string;
  entryDate: string;
  purchaseValue?: number;
  observations?: string;
  photos: string[];
  status: StockStatus;
  history: CutHistoryRecord[];
  lastOperatorId?: string;
  lastOperatorName?: string;
  lastUpdatedAt?: string;
}

export interface DashboardStats {
  totalItems: number;
  totalAreaInStock: number;
  byCategory: Record<string, number>;
  byStatus: Record<string, number>;
}
