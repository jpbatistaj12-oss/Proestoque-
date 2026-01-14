
import { InventoryItem, User, Company, UserRole, CompanyStatus, MaterialCategory, SupplyItem } from '../types';

export interface StoredUser extends User {
  password?: string;
}

export interface GlobalMaterial {
  uid?: string;
  name: string;
  category: string;
}

const KEYS = {
  INVENTORY: 'marm_inventory_v2',
  SUPPLIES: 'marm_supplies_v2',
  USERS: 'marm_users_v2',
  COMPANIES: 'marm_companies_v2',
  SESSION: 'marm_active_session',
  GLOBAL_MATERIALS: 'marm_global_materials_v2',
  GLOBAL_CATEGORIES: 'marm_global_categories_v2',
  GLOBAL_SUPPLY_MATERIALS: 'marm_global_supply_materials_v2',
  GLOBAL_SUPPLY_CATEGORIES: 'marm_global_supply_categories_v2',
  CLOUD_CONFIG: 'marm_cloud_config'
};

// Sistema de eventos simples para reatividade entre abas/componentes
export const notifyCloudChange = () => {
  window.dispatchEvent(new Event('marm_cloud_updated'));
};

const safeJSONParse = (key: string, defaultValue: any) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (e) {
    console.error(`Erro ao ler ${key} do LocalStorage:`, e);
    return defaultValue;
  }
};

const normalizeEmail = (email: string | undefined): string => {
  if (!email) return '';
  return email.trim().toLowerCase();
};

// --- CLOUD SYNC LOGIC ---

export interface CloudConfig {
  syncKey: string;
  lastSync: string;
  status: 'ONLINE' | 'OFFLINE';
  autoSync: boolean;
}

export const getCloudConfig = (): CloudConfig => {
  return safeJSONParse(KEYS.CLOUD_CONFIG, {
    syncKey: '',
    lastSync: '',
    status: 'OFFLINE',
    autoSync: false
  });
};

export const saveCloudConfig = (config: CloudConfig) => {
  localStorage.setItem(KEYS.CLOUD_CONFIG, JSON.stringify(config));
  notifyCloudChange();
};

export const generateSyncKey = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ01234564789';
  let key = '';
  for (let i = 0; i < 16; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
    if ((i + 1) % 4 === 0 && i !== 15) key += '-';
  }
  return key;
};

// Exporta todo o banco de dados como um arquivo JSON
export const exportDatabaseAsFile = () => {
  const snapshot: Record<string, string | null> = {};
  Object.values(KEYS).forEach(key => {
    if (key !== KEYS.SESSION) {
      snapshot[key] = localStorage.getItem(key);
    }
  });
  
  const blob = new Blob([JSON.stringify(snapshot)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `backup_marmoraria_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Restaura o banco de dados a partir de um texto JSON
export const restoreDatabaseFromJSON = (jsonString: string): boolean => {
  try {
    const snapshot = JSON.parse(jsonString);
    Object.entries(snapshot).forEach(([key, value]) => {
      if (value) {
        localStorage.setItem(key, value as string);
      }
    });
    return true;
  } catch (e) {
    console.error("Erro ao restaurar banco de dados:", e);
    return false;
  }
};

export const getFullDatabaseSnapshot = () => {
  const snapshot: Record<string, any> = {};
  Object.values(KEYS).forEach(key => {
    if (key !== KEYS.SESSION && key !== KEYS.CLOUD_CONFIG) {
      snapshot[key] = localStorage.getItem(key);
    }
  });
  return btoa(JSON.stringify(snapshot));
};

export const restoreDatabaseFromSnapshot = (base64Snapshot: string) => {
  try {
    const snapshot = JSON.parse(atob(base64Snapshot));
    Object.entries(snapshot).forEach(([key, value]) => {
      if (value) localStorage.setItem(key, value as string);
    });
    return true;
  } catch (e) {
    console.error("Erro ao restaurar backup:", e);
    return false;
  }
};

// --- CORE SERVICES ---

export const getGlobalCategories = (): string[] => {
  const defaults = Object.values(MaterialCategory);
  return safeJSONParse(KEYS.GLOBAL_CATEGORIES, defaults);
};

export const addGlobalCategory = (categoryName: string): void => {
  const categories = getGlobalCategories();
  if (!categories.includes(categoryName)) {
    categories.push(categoryName);
    localStorage.setItem(KEYS.GLOBAL_CATEGORIES, JSON.stringify(categories));
  }
};

export const removeGlobalCategory = (categoryName: string): void => {
  const categories = getGlobalCategories();
  const filtered = categories.filter(cat => cat !== categoryName);
  localStorage.setItem(KEYS.GLOBAL_CATEGORIES, JSON.stringify(filtered));
};

export const getGlobalMaterials = (): GlobalMaterial[] => {
  const defaults: GlobalMaterial[] = [
    { name: 'Preto São Gabriel', category: 'Granito' },
    { name: 'Verde Ubatuba', category: 'Granito' },
    { name: 'Branco Siena', category: 'Granito' },
    { name: 'Branco Prime', category: 'Quartzo' },
    { name: 'Cinza Absoluto', category: 'Quartzo' },
    { name: 'Mármore Carrara', category: 'Mármore' }
  ];
  const stored = localStorage.getItem(KEYS.GLOBAL_MATERIALS);
  if (!stored) return defaults;
  return JSON.parse(stored);
};

export const addGlobalMaterial = (name: string, category: string): void => {
  const materials = getGlobalMaterials();
  if (!materials.find(m => m.name.toLowerCase() === name.toLowerCase())) {
    materials.push({ name, category, uid: `GLOB-${Date.now()}` });
    localStorage.setItem(KEYS.GLOBAL_MATERIALS, JSON.stringify(materials));
  }
};

export const removeGlobalMaterial = (name: string): void => {
  const materials = getGlobalMaterials();
  const filtered = materials.filter(m => m.name !== name);
  localStorage.setItem(KEYS.GLOBAL_MATERIALS, JSON.stringify(filtered));
};

export const getCurrentUser = (): User | null => {
  return safeJSONParse(KEYS.SESSION, null);
};

export const login = (email: string, password?: string, preferredRole?: UserRole): User | null => {
  const cleanEmail = normalizeEmail(email);
  const cleanPassword = (password || '').trim();
  
  if (cleanEmail === 'admin@marmoraria.control' && cleanPassword === 'marm@2025') {
    const superAdmin: User = {
      id: 'SUPER-001',
      name: 'Administrador Central',
      email: 'admin@marmoraria.control',
      role: UserRole.SUPER_ADMIN,
      companyId: 'PLATFORM_OWNER'
    };
    localStorage.setItem(KEYS.SESSION, JSON.stringify(superAdmin));
    return superAdmin;
  }

  const users: StoredUser[] = safeJSONParse(KEYS.USERS, []);
  const user = users.find(u => normalizeEmail(u.email) === cleanEmail);
  
  if (!user) throw new Error("E-MAIL NÃO ENCONTRADO.");
  if (user.password !== cleanPassword) throw new Error("SENHA INCORRETA.");

  const companies: Company[] = safeJSONParse(KEYS.COMPANIES, []);
  const company = companies.find(c => c.id === user.companyId);

  // REGRA DE NEGÓCIO: MENSAGEM DE BLOQUEIO PARA SUPORTE
  if (company && company.status === CompanyStatus.SUSPENDED) {
    throw new Error("Entrar em contato com o suporte pois está bloqueado o acesso.");
  }

  if (!company && user.role !== UserRole.SUPER_ADMIN) throw new Error("EMPRESA NÃO VINCULADA.");

  const { password: _, ...userWithoutPassword } = user;
  localStorage.setItem(KEYS.SESSION, JSON.stringify(userWithoutPassword));
  return userWithoutPassword;
};

export const getInventory = (companyId: string): InventoryItem[] => {
  const allItems: InventoryItem[] = safeJSONParse(KEYS.INVENTORY, []);
  return allItems.filter(item => item && item.companyId === companyId);
};

export const saveItem = (item: InventoryItem): void => {
  const inventory: InventoryItem[] = safeJSONParse(KEYS.INVENTORY, []);
  const index = inventory.findIndex(i => i.uid === item.uid);
  if (index >= 0) inventory[index] = item; else inventory.push(item);
  localStorage.setItem(KEYS.INVENTORY, JSON.stringify(inventory));
};

export const deleteItem = (uid: string): void => {
  const inventory: InventoryItem[] = safeJSONParse(KEYS.INVENTORY, []);
  const filtered = inventory.filter(i => i.uid !== uid);
  localStorage.setItem(KEYS.INVENTORY, JSON.stringify(filtered));
};

export const getSupplies = (companyId: string): SupplyItem[] => {
  const allSupplies: SupplyItem[] = safeJSONParse(KEYS.SUPPLIES, []);
  return allSupplies.filter(s => s && s.companyId === companyId);
};

export const saveSupplyItem = (item: SupplyItem): void => {
  const allSupplies: SupplyItem[] = safeJSONParse(KEYS.SUPPLIES, []);
  const index = allSupplies.findIndex(s => s.uid === item.uid);
  if (index >= 0) allSupplies[index] = item; else allSupplies.push(item);
  localStorage.setItem(KEYS.SUPPLIES, JSON.stringify(allSupplies));
};

export const logout = () => { localStorage.removeItem(KEYS.SESSION); };

export const getItemByUid = (uid: string, companyId: string): InventoryItem | undefined => {
  return getInventory(companyId).find(i => i.uid === uid);
};

export const getItemById = (id: string, companyId: string): InventoryItem | undefined => {
  return getInventory(companyId).find(i => i.id === id);
};

export const getAllCompanies = (): Company[] => safeJSONParse(KEYS.COMPANIES, []);

export const createCompanyAccount = (adminName: string, email: string, companyName: string, password?: string): void => {
  const companies = getAllCompanies();
  const users = safeJSONParse(KEYS.USERS, []);
  const companyId = `COMP-${Date.now()}`;
  const adminId = `USR-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
  
  const newCompany = { 
    id: companyId, 
    name: companyName, 
    adminId, 
    status: CompanyStatus.ACTIVE, 
    createdAt: new Date().toISOString(), 
    monthlyFee: 299 
  };
  
  const newUser = { 
    id: adminId, 
    name: adminName, 
    email: normalizeEmail(email), 
    role: UserRole.ADMIN, 
    companyId, 
    password: password || 'marm123' 
  };

  companies.push(newCompany);
  users.push(newUser);
  
  localStorage.setItem(KEYS.COMPANIES, JSON.stringify(companies));
  localStorage.setItem(KEYS.USERS, JSON.stringify(users));
};

export const deleteCompany = (id: string): void => {
  const companies = getAllCompanies();
  localStorage.setItem(KEYS.COMPANIES, JSON.stringify(companies.filter(c => c.id !== id)));
  const users: StoredUser[] = safeJSONParse(KEYS.USERS, []);
  localStorage.setItem(KEYS.USERS, JSON.stringify(users.filter(u => u.companyId !== id)));
  const inventory: InventoryItem[] = safeJSONParse(KEYS.INVENTORY, []);
  localStorage.setItem(KEYS.INVENTORY, JSON.stringify(inventory.filter(i => i.companyId !== id)));
};

export const updateCompanyStatus = (id: string, status: CompanyStatus) => {
  const companies = getAllCompanies();
  const index = companies.findIndex(c => c.id === id);
  if (index >= 0) { 
    companies[index].status = status; 
    localStorage.setItem(KEYS.COMPANIES, JSON.stringify(companies)); 
  }
};

export const updateCompanyFee = (id: string, fee: number) => {
  const companies = getAllCompanies();
  const index = companies.findIndex(c => c.id === id);
  if (index >= 0) { 
    companies[index].monthlyFee = fee; 
    localStorage.setItem(KEYS.COMPANIES, JSON.stringify(companies)); 
  }
};

export const getCompanyAdminCredentials = (companyId: string): StoredUser | null => {
  const users: StoredUser[] = safeJSONParse(KEYS.USERS, []);
  return users.find(u => u.companyId === companyId && u.role === UserRole.ADMIN) || null;
};

export const getGlobalSupplyCategories = (): string[] => {
  const defaults = ['Adesivos', 'Ferramentas', 'Acabamento', 'EPI', 'Cubas', 'Instalação'];
  return safeJSONParse(KEYS.GLOBAL_SUPPLY_CATEGORIES, defaults);
};

export const addGlobalSupplyCategory = (name: string): void => {
  const cats = getGlobalSupplyCategories();
  if (!cats.includes(name)) {
    cats.push(name);
    localStorage.setItem(KEYS.GLOBAL_SUPPLY_CATEGORIES, JSON.stringify(cats));
  }
};

export const removeGlobalSupplyCategory = (name: string): void => {
  const cats = getGlobalSupplyCategories();
  localStorage.setItem(KEYS.GLOBAL_SUPPLY_CATEGORIES, JSON.stringify(cats.filter(c => c !== name)));
};

export const getGlobalSupplyMaterials = (): GlobalMaterial[] => {
  const defaults = [
    { name: 'Cola PU 40 Branca', category: 'Adesivos' },
    { name: 'Disco de Corte Diamantado', category: 'Ferramentas' },
    { name: 'Massa Plástica', category: 'Acabamento' },
    { name: 'Silicone Transparente', category: 'Instalação' }
  ];
  return safeJSONParse(KEYS.GLOBAL_SUPPLY_MATERIALS, defaults);
};

export const addGlobalSupplyMaterial = (name: string, category: string): void => {
  const mats = getGlobalSupplyMaterials();
  if (!mats.find(m => m.name === name)) {
    mats.push({ name, category, uid: `SUP-GLOB-${Date.now()}` });
    localStorage.setItem(KEYS.GLOBAL_SUPPLY_MATERIALS, JSON.stringify(mats));
  }
};

export const removeGlobalSupplyMaterial = (name: string): void => {
  const mats = getGlobalSupplyMaterials();
  localStorage.setItem(KEYS.GLOBAL_SUPPLY_MATERIALS, JSON.stringify(mats.filter(m => m.name !== name)));
};

export const getTeamMembers = (companyId: string): StoredUser[] => {
  const users: StoredUser[] = safeJSONParse(KEYS.USERS, []);
  return users.filter(u => u.companyId === companyId);
};

export const addTeamMember = (name: string, email: string, role: UserRole, companyId: string, password?: string): void => {
  const users = safeJSONParse(KEYS.USERS, []);
  users.push({
    id: `USR-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
    name, email: normalizeEmail(email), role, companyId, password: password || 'marm123'
  });
  localStorage.setItem(KEYS.USERS, JSON.stringify(users));
};

export const updateTeamMemberCredentials = (id: string, companyId: string, updates: Partial<StoredUser>) => {
  const users: StoredUser[] = safeJSONParse(KEYS.USERS, []);
  const index = users.findIndex(u => u.id === id && u.companyId === companyId);
  if (index >= 0) {
    users[index] = { ...users[index], ...updates };
    localStorage.setItem(KEYS.USERS, JSON.stringify(users));
  }
};

export const deleteTeamMember = (id: string, companyId: string) => {
  const users: StoredUser[] = safeJSONParse(KEYS.USERS, []);
  localStorage.setItem(KEYS.USERS, JSON.stringify(users.filter(u => !(u.id === id && u.companyId === companyId))));
};
