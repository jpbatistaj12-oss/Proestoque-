
import { InventoryItem, User, Company, UserRole, CompanyStatus } from '../types';

export interface StoredUser extends User {
  password?: string;
}

const KEYS = {
  INVENTORY: 'marm_inventory_v2',
  USERS: 'marm_users_v2',
  COMPANIES: 'marm_companies_v2',
  SESSION: 'marm_active_session'
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

export const getInventory = (companyId: string): InventoryItem[] => {
  const allItems: InventoryItem[] = safeJSONParse(KEYS.INVENTORY, []);
  return allItems.filter(item => item && item.companyId === companyId);
};

export const logout = () => { localStorage.removeItem(KEYS.SESSION); };

export const saveItem = (item: InventoryItem): void => {
  const inventory: InventoryItem[] = safeJSONParse(KEYS.INVENTORY, []);
  const index = inventory.findIndex(i => i.id === item.id);
  if (index >= 0) inventory[index] = item; else inventory.push(item);
  localStorage.setItem(KEYS.INVENTORY, JSON.stringify(inventory));
};

export const getItemById = (id: string, companyId: string): InventoryItem | undefined => {
  return getInventory(companyId).find(i => i.id === id);
};

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
