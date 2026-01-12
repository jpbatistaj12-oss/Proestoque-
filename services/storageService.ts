
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

// Limpa espaços e coloca em minúsculo
const normalizeEmail = (email: string) => email ? email.trim().toLowerCase() : '';
// Limpa apenas espaços da senha
const normalizePassword = (pass: string) => pass ? pass.trim() : '';

export const getCurrentUser = (): User | null => {
  const session = localStorage.getItem(KEYS.SESSION);
  return session ? JSON.parse(session) : null;
};

export const login = (email: string, password?: string): User | null => {
  const cleanEmail = normalizeEmail(email);
  const cleanPassword = normalizePassword(password || '');
  
  // Login especial de Super Admin
  if (cleanEmail === 'admin@marmoraria.control' && cleanPassword === 'marm@2025') {
    const superAdmin: User = {
      id: 'SUPER-001',
      name: 'Administrador Central',
      email: cleanEmail,
      role: UserRole.SUPER_ADMIN,
      companyId: 'PLATFORM_OWNER'
    };
    localStorage.setItem(KEYS.SESSION, JSON.stringify(superAdmin));
    return superAdmin;
  }

  const users: StoredUser[] = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
  const user = users.find(u => normalizeEmail(u.email) === cleanEmail);
  
  // Comparação estrita de senha para evitar login com campos vazios
  if (user && user.password && user.password === cleanPassword) {
    const companies: Company[] = JSON.parse(localStorage.getItem(KEYS.COMPANIES) || '[]');
    const company = companies.find(c => c.id === user.companyId);

    if (company && company.status === CompanyStatus.SUSPENDED) {
      throw new Error("Sua conta está suspensa. Entre em contato com o suporte financeiro.");
    }

    const { password: _, ...userWithoutPassword } = user;
    localStorage.setItem(KEYS.SESSION, JSON.stringify(userWithoutPassword));
    return userWithoutPassword;
  }
  return null;
};

export const createCompanyAccount = (adminName: string, email: string, companyName: string, password?: string): void => {
  const cleanEmail = normalizeEmail(email);
  const cleanPassword = normalizePassword(password || 'marm123'); // Senha padrão se estiver vazio
  const companyId = `COMP-${Math.random().toString(36).substr(2, 9)}`;
  const adminId = `USR-${Math.random().toString(36).substr(2, 9)}`;
  
  const newCompany: Company = { 
    id: companyId, 
    name: companyName, 
    adminId,
    status: CompanyStatus.ACTIVE,
    createdAt: new Date().toISOString(),
    monthlyFee: 299
  };

  const newUser: StoredUser = { 
    id: adminId, 
    name: adminName, 
    email: cleanEmail, 
    role: UserRole.ADMIN, 
    companyId,
    password: cleanPassword
  };

  const companies = JSON.parse(localStorage.getItem(KEYS.COMPANIES) || '[]');
  const users = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');

  if (users.some((u: StoredUser) => normalizeEmail(u.email) === cleanEmail)) {
    throw new Error("Este e-mail já está cadastrado em outra conta.");
  }

  companies.push(newCompany);
  users.push(newUser);

  localStorage.setItem(KEYS.COMPANIES, JSON.stringify(companies));
  localStorage.setItem(KEYS.USERS, JSON.stringify(users));
};

export const getCompanyAdminCredentials = (companyId: string): StoredUser | null => {
  const users: StoredUser[] = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
  return users.find(u => u.companyId === companyId && u.role === UserRole.ADMIN) || null;
};

export const updateCompanyFee = (companyId: string, fee: number): void => {
  const companies = getAllCompanies();
  const index = companies.findIndex(c => c.id === companyId);
  if (index >= 0) {
    companies[index].monthlyFee = fee;
    localStorage.setItem(KEYS.COMPANIES, JSON.stringify(companies));
  }
};

export const logout = () => localStorage.removeItem(KEYS.SESSION);

export const getAllCompanies = (): Company[] => {
  const companies = JSON.parse(localStorage.getItem(KEYS.COMPANIES) || '[]');
  return companies.map((c: any) => ({ ...c, monthlyFee: c.monthlyFee || 299 }));
};

export const updateCompanyStatus = (companyId: string, status: CompanyStatus): void => {
  const companies = getAllCompanies();
  const index = companies.findIndex(c => c.id === companyId);
  if (index >= 0) {
    companies[index].status = status;
    localStorage.setItem(KEYS.COMPANIES, JSON.stringify(companies));
  }
};

export const getTeamMembers = (companyId: string): User[] => {
  const users: StoredUser[] = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
  return users.filter(u => u.companyId === companyId).map(({ password, ...rest }) => rest);
};

export const addTeamMember = (name: string, email: string, role: UserRole, companyId: string, password?: string): void => {
  const cleanEmail = normalizeEmail(email);
  const cleanPassword = normalizePassword(password || 'marm123');
  const users = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
  
  if (users.some((u: StoredUser) => normalizeEmail(u.email) === cleanEmail)) {
    throw new Error("Este e-mail já está em uso por outro colaborador.");
  }

  const newUser: StoredUser = {
    id: `USR-${Math.random().toString(36).substr(2, 9)}`,
    name, email: cleanEmail, role, companyId, password: cleanPassword
  };
  users.push(newUser);
  localStorage.setItem(KEYS.USERS, JSON.stringify(users));
};

export const getInventory = (companyId: string): InventoryItem[] => {
  const data = localStorage.getItem(KEYS.INVENTORY);
  const allItems: InventoryItem[] = data ? JSON.parse(data) : [];
  return allItems.filter(item => item.companyId === companyId);
};

export const saveItem = (item: InventoryItem): void => {
  const data = localStorage.getItem(KEYS.INVENTORY);
  const inventory: InventoryItem[] = data ? JSON.parse(data) : [];
  const index = inventory.findIndex(i => i.id === item.id);
  
  if (index >= 0) {
    inventory[index] = item;
  } else {
    inventory.push(item);
  }
  localStorage.setItem(KEYS.INVENTORY, JSON.stringify(inventory));
};

export const getItemById = (id: string, companyId: string): InventoryItem | undefined => {
  return getInventory(companyId).find(i => i.id === id);
};
