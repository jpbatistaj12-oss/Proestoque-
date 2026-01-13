
import { InventoryItem, User, Company, UserRole, CompanyStatus, MaterialCategory } from '../types';

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
  USERS: 'marm_users_v2',
  COMPANIES: 'marm_companies_v2',
  SESSION: 'marm_active_session',
  GLOBAL_MATERIALS: 'marm_global_materials_v2',
  GLOBAL_CATEGORIES: 'marm_global_categories_v2'
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

// --- GESTÃO GLOBAL DE CATÁLOGO ---

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

// --- AUTH & SESSION ---

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

  if (!company && user.role !== UserRole.SUPER_ADMIN) throw new Error("EMPRESA NÃO VINCULADA.");
  if (company && company.status === CompanyStatus.SUSPENDED) throw new Error("ACESSO SUSPENSO.");

  const { password: _, ...userWithoutPassword } = user;
  localStorage.setItem(KEYS.SESSION, JSON.stringify(userWithoutPassword));
  return userWithoutPassword;
};

// --- INVENTORY ---

export const getInventory = (companyId: string): InventoryItem[] => {
  const allItems: InventoryItem[] = safeJSONParse(KEYS.INVENTORY, []);
  return allItems.filter(item => item && item.companyId === companyId);
};

export const logout = () => { localStorage.removeItem(KEYS.SESSION); };

export const saveItem = (item: InventoryItem): void => {
  const inventory: InventoryItem[] = safeJSONParse(KEYS.INVENTORY, []);
  const index = inventory.findIndex(i => i.uid === item.uid);
  if (index >= 0) inventory[index] = item; else inventory.push(item);
  localStorage.setItem(KEYS.INVENTORY, JSON.stringify(inventory));
};

export const getItemByUid = (uid: string, companyId: string): InventoryItem | undefined => {
  return getInventory(companyId).find(i => i.uid === uid);
};

export const getItemById = (id: string, companyId: string): InventoryItem | undefined => {
  return getInventory(companyId).find(i => i.id === id);
};

// --- PLATFORM MGMT ---

export const getAllCompanies = (): Company[] => safeJSONParse(KEYS.COMPANIES, []);

export const createCompanyAccount = (adminName: string, email: string, companyName: string, password?: string): void => {
  const companies = getAllCompanies();
  const users = safeJSONParse(KEYS.USERS, []);
  const companyId = `COMP-${Date.now()}`;
  const adminId = `USR-${Math.random().toString(36).substr(2, 5)}`;
  
  companies.push({ 
    id: companyId, 
    name: companyName, 
    adminId, 
    status: CompanyStatus.ACTIVE, 
    createdAt: new Date().toISOString(), 
    monthlyFee: 299 
  });
  
  users.push({ 
    id: adminId, 
    name: adminName, 
    email: normalizeEmail(email), 
    role: UserRole.ADMIN, 
    companyId, 
    password: password || 'marm123' 
  });
  
  localStorage.setItem(KEYS.COMPANIES, JSON.stringify(companies));
  localStorage.setItem(KEYS.USERS, JSON.stringify(users));
};

export const getTeamMembers = (companyId: string): StoredUser[] => {
  const users: StoredUser[] = safeJSONParse(KEYS.USERS, []);
  return users.filter(u => u.companyId === companyId);
};

export const addTeamMember = (name: string, email: string, role: UserRole, companyId: string, password?: string): void => {
  const users = safeJSONParse(KEYS.USERS, []);
  const newUser: StoredUser = {
    id: `USR-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
    name, email: normalizeEmail(email), role, companyId, password: password || 'marm123'
  };
  users.push(newUser);
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
  const filtered = users.filter(u => !(u.id === id && u.companyId === companyId));
  localStorage.setItem(KEYS.USERS, JSON.stringify(filtered));
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
