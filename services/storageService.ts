
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

const normalizeString = (str: string | undefined) => str ? str.trim().toLowerCase() : '';

export const getCurrentUser = (): User | null => {
  const session = localStorage.getItem(KEYS.SESSION);
  return session ? JSON.parse(session) : null;
};

export const login = (email: string, password?: string): User | null => {
  const cleanEmail = normalizeString(email);
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

  const users: StoredUser[] = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
  const user = users.find(u => normalizeString(u.email) === cleanEmail);
  
  if (!user) throw new Error("E-MAIL NÃO ENCONTRADO.");
  if (user.password !== cleanPassword) throw new Error("SENHA INCORRETA.");

  const companies: Company[] = JSON.parse(localStorage.getItem(KEYS.COMPANIES) || '[]');
  const company = companies.find(c => c.id === user.companyId);

  if (!company && user.role !== UserRole.SUPER_ADMIN) throw new Error("Empresa não vinculada.");
  if (company && company.status === CompanyStatus.SUSPENDED) throw new Error("Acesso suspenso.");

  const { password: _, ...userWithoutPassword } = user;
  localStorage.setItem(KEYS.SESSION, JSON.stringify(userWithoutPassword));
  return userWithoutPassword;
};

export const getTeamMembers = (companyId: string): StoredUser[] => {
  const users: StoredUser[] = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
  return users.filter(u => u.companyId === companyId);
};

export const addTeamMember = (name: string, email: string, role: UserRole, companyId: string, password?: string): void => {
  const cleanEmail = normalizeString(email);
  const users = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
  
  if (users.some((u: StoredUser) => normalizeString(u.email) === cleanEmail)) {
    throw new Error("E-mail já cadastrado na equipe.");
  }

  const newUser: StoredUser = {
    id: `USR-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
    name: name.trim(), email: cleanEmail, role, companyId, password: (password || 'marm123').trim()
  };
  users.push(newUser);
  localStorage.setItem(KEYS.USERS, JSON.stringify(users));
};

export const updateTeamMemberCredentials = (userId: string, companyId: string, updates: Partial<StoredUser>): void => {
  const users: StoredUser[] = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
  const index = users.findIndex(u => u.id === userId && u.companyId === companyId);
  
  if (index >= 0) {
    // Se estiver alterando e-mail, verifica se já existe em outro usuário
    if (updates.email) {
      const cleanEmail = normalizeString(updates.email);
      if (users.some((u, i) => i !== index && normalizeString(u.email) === cleanEmail)) {
        throw new Error("Este novo e-mail já está sendo usado por outra pessoa.");
      }
    }
    
    users[index] = { ...users[index], ...updates };
    localStorage.setItem(KEYS.USERS, JSON.stringify(users));
  } else {
    throw new Error("Colaborador não encontrado.");
  }
};

export const deleteTeamMember = (userId: string, companyId: string): void => {
  const users: StoredUser[] = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
  const filtered = users.filter(u => !(u.id === userId && u.companyId === companyId));
  localStorage.setItem(KEYS.USERS, JSON.stringify(filtered));
};

export const logout = () => { localStorage.removeItem(KEYS.SESSION); };
export const getInventory = (companyId: string): InventoryItem[] => {
  const data = localStorage.getItem(KEYS.INVENTORY);
  const allItems: InventoryItem[] = data ? JSON.parse(data) : [];
  return allItems.filter(item => item.companyId === companyId);
};
export const saveItem = (item: InventoryItem): void => {
  const data = localStorage.getItem(KEYS.INVENTORY);
  const inventory: InventoryItem[] = data ? JSON.parse(data) : [];
  const index = inventory.findIndex(i => i.id === item.id);
  if (index >= 0) inventory[index] = item; else inventory.push(item);
  localStorage.setItem(KEYS.INVENTORY, JSON.stringify(inventory));
};
export const getItemById = (id: string, companyId: string): InventoryItem | undefined => {
  return getInventory(companyId).find(i => i.id === id);
};
export const getAllCompanies = (): Company[] => JSON.parse(localStorage.getItem(KEYS.COMPANIES) || '[]');
export const updateCompanyStatus = (id: string, status: CompanyStatus) => {
  const companies = getAllCompanies();
  const index = companies.findIndex(c => c.id === id);
  if (index >= 0) { companies[index].status = status; localStorage.setItem(KEYS.COMPANIES, JSON.stringify(companies)); }
};
export const createCompanyAccount = (adminName: string, email: string, companyName: string, password?: string): void => {
  const cleanEmail = normalizeString(email);
  const companies = getAllCompanies();
  const users = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
  if (users.some((u: StoredUser) => normalizeString(u.email) === cleanEmail)) throw new Error("E-mail já utilizado.");
  const companyId = `COMP-${Date.now().toString(36).toUpperCase()}`;
  const adminId = `USR-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
  companies.push({ id: companyId, name: companyName.trim(), adminId, status: CompanyStatus.ACTIVE, createdAt: new Date().toISOString(), monthlyFee: 299 });
  users.push({ id: adminId, name: adminName.trim(), email: cleanEmail, role: UserRole.ADMIN, companyId, password: (password || 'joao123').trim() });
  localStorage.setItem(KEYS.COMPANIES, JSON.stringify(companies));
  localStorage.setItem(KEYS.USERS, JSON.stringify(users));
};
export const updateCompanyFee = (id: string, fee: number) => {
  const companies = getAllCompanies();
  const index = companies.findIndex(c => c.id === id);
  if (index >= 0) { companies[index].monthlyFee = fee; localStorage.setItem(KEYS.COMPANIES, JSON.stringify(companies)); }
};
export const getCompanyAdminCredentials = (companyId: string): StoredUser | null => {
  const users: StoredUser[] = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
  return users.find(u => u.companyId === companyId && u.role === UserRole.ADMIN) || null;
};
