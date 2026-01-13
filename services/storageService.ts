
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
  SUPPLIES: 'marm_supplies_v2', // Novo: Estoque de Insumos
  USERS: 'marm_users_v2',
  COMPANIES: 'marm_companies_v2',
  SESSION: 'marm_active_session',
  GLOBAL_MATERIALS: 'marm_global_materials_v2',
  GLOBAL_CATEGORIES: 'marm_global_categories_v2',
  GLOBAL_SUPPLY_MATERIALS: 'marm_global_supply_materials_v2', // Novo: Catálogo Global Insumos
  GLOBAL_SUPPLY_CATEGORIES: 'marm_global_supply_categories_v2' // Novo: Categorias Global Insumos
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

// --- GESTÃO GLOBAL DE CATÁLOGO (CHAPAS) ---

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

// --- GESTÃO GLOBAL DE CATÁLOGO (INSUMOS) ---

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

// --- INVENTORY (CHAPAS) ---

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

// --- INVENTORY (INSUMOS) ---

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

export const deleteCompany = (id: string): void => {
  // 1. Remover a empresa
  const companies = getAllCompanies();
  const filteredCompanies = companies.filter(c => c.id !== id);
  localStorage.setItem(KEYS.COMPANIES, JSON.stringify(filteredCompanies));

  // 2. Remover todos os usuários da empresa
  const users: StoredUser[] = safeJSONParse(KEYS.USERS, []);
  const filteredUsers = users.filter(u => u.companyId !== id);
  localStorage.setItem(KEYS.USERS, JSON.stringify(filteredUsers));

  // 3. Limpar estoque de chapas da empresa
  const inventory: InventoryItem[] = safeJSONParse(KEYS.INVENTORY, []);
  const filteredInventory = inventory.filter(i => i.companyId !== id);
  localStorage.setItem(KEYS.INVENTORY, JSON.stringify(filteredInventory));

  // 4. Limpar estoque de insumos da empresa
  const supplies: SupplyItem[] = safeJSONParse(KEYS.SUPPLIES, []);
  const filteredSupplies = supplies.filter(s => s.companyId !== id);
  localStorage.setItem(KEYS.SUPPLIES, JSON.stringify(filteredSupplies));
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
