
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
  ADMIN = 'ADMIN',
  OPERATOR = 'OPERATOR'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  companyId: string;
}

export interface Company {
  id: string;
  name: string;
  adminId: string;
}

export interface Point {
  x: number;
  y: number;
}

export interface CutHistoryRecord {
  id: string;
  date: string;
  project: string;
  clientName: string; // Novo campo para busca
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
}

export interface DashboardStats {
  totalItems: number;
  totalAreaInStock: number;
  byCategory: Record<string, number>;
  byStatus: Record<string, number>;
}
