
export enum StockStatus {
  DISPONIVEL = 'Disponível',
  BAIXO_ESTOQUE = 'Baixo Estoque',
  ESGOTADO = 'Esgotado',
  EM_USO = 'Em Uso',
  COM_SOBRA = 'Com Sobra',
  INTEIRA = 'Inteira'
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
  SUPER_ADMIN = 'SUPER_ADMIN',
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
  monthlyFee: number;
}

export interface CutHistoryRecord {
  id: string;
  date: string;
  project: string;
  clientName: string;
  type: 'SAIDA' | 'SOBRA' | 'ENTRADA';
  quantityChange: number;
  observations?: string;
  operatorName: string;
  areaUsed: number;
  cutWidth?: number;
  cutHeight?: number;
  leftoverWidth?: number;
  leftoverHeight?: number;
}

export interface InventoryItem {
  uid: string;
  id: string;
  entryIndex: number; 
  companyId: string;
  category: string;
  commercialName: string;
  thickness: string;
  width: number;
  height: number;
  availableArea: number; 
  originalWidth?: number;
  originalHeight?: number;
  location?: string;
  quantity: number;
  minQuantity: number;
  supplier: string;
  entryDate: string;
  photos: string[];
  status: StockStatus;
  history: CutHistoryRecord[];
  lastUpdatedAt: string;
}

// --- NOVAS INTERFACES PARA INSUMOS ---

export interface SupplyHistoryRecord {
  id: string;
  date: string;
  type: 'ENTRADA' | 'SAIDA';
  quantityChange: number;
  operatorName: string;
  observations?: string;
  project?: string;
}

export interface SupplyItem {
  uid: string;
  id: string;
  companyId: string;
  category: string;
  name: string;
  unit: string; // Un, Kg, L, Pacote, etc.
  quantity: number;
  minQuantity: number;
  location?: string;
  supplier?: string;
  lastUpdatedAt: string;
  history: SupplyHistoryRecord[];
  photos: string[];
}
