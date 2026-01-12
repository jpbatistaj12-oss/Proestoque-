
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

const normalizeEmail = (email: string | undefined): string => {
  if (!email) return '';
  return email.trim().toLowerCase();
};

export const getCurrentUser = (): User | null => {
  const session = localStorage.getItem(KEYS.SESSION);
  return session ? JSON.parse(session) : null;
};

export const login = (email: string, password?: string, preferredRole?: UserRole): User | null => {
  const cleanEmail = normalizeEmail(email);
  const cleanPassword = (password || '').trim();
  
  // 1. Login Especial Super Admin
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
  
  // 2. BUSCA GLOBAL (Ignora a aba selecionada por um instante para achar o usuário)
  const foundUser = users.find(u => normalizeEmail(u.email) === cleanEmail);
  
  if (!foundUser) {
    throw new Error("E-MAIL NÃO ENCONTRADO. Verifique se o cadastro foi feito corretamente.");
  }

  // 3. VALIDAÇÃO DE ABA (Verifica se o papel do usuário bate com a aba selecionada)
  if (preferredRole && foundUser.role !== preferredRole && foundUser.role !== UserRole.SUPER_ADMIN) {
    const targetLabel = preferredRole === UserRole.ADMIN ? 'Administrador' : 'Colaborador';
    const actualLabel = foundUser.role === UserRole.ADMIN ? 'Administrador' : 'Colaborador';
    throw new Error(`PERFIL INCORRETO. Este e-mail é de um ${actualLabel}. Por favor, mude para a aba "${actualLabel}" acima.`);
  }

  // 4. VALIDAÇÃO DE SENHA
  if (foundUser.password !== cleanPassword) {
    throw new Error("SENHA INCORRETA. Verifique maiúsculas e minúsculas.");
  }

  // 5. VALIDAÇÃO DE STATUS DA EMPRESA
  const companies: Company[] = JSON.parse(localStorage.getItem(KEYS.COMPANIES) || '[]');
  const company = companies.find(c => c.id === foundUser.companyId);

  if (!company && foundUser.role !== UserRole.SUPER_ADMIN) {
    throw new Error("EMPRESA NÃO ENCONTRADA.");
  }

  if (company && company.status === CompanyStatus.SUSPENDED) {
    throw new Error("ACESSO SUSPENSO. Verifique com a administração.");
  }

  // Sucesso
  const { password: _, ...userWithoutPassword } = foundUser;
  localStorage.setItem(KEYS.SESSION, JSON.stringify(userWithoutPassword));
  return userWithoutPassword;
};

export const addTeamMember = (name: string, email: string, role: UserRole, companyId: string, password?: string): void => {
  const cleanEmail = normalizeEmail(email);
  const users = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
  
  if (users.some((u: StoredUser) => normalizeEmail(u.email) === cleanEmail)) {
    throw new Error("Este e-mail já está sendo usado.");
  }

  const newUser: StoredUser = {
    id: `USR-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
    name: name.trim(), 
    email: cleanEmail, 
    role, // Pode ser ADMIN ou OPERATOR dependendo do que o dono escolher
    companyId, 
    password: (password || 'marm123').trim()
  };
  users.push(newUser);
  localStorage.setItem(KEYS.USERS, JSON.stringify(users));
};

export const createCompanyAccount = (adminName: string, email: string, companyName: string, password?: string): void => {
  const cleanEmail = normalizeEmail(email);
  const companies = JSON.parse(localStorage.getItem(KEYS.COMPANIES) || '[]');
  const users = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
  
  if (users.some((u: StoredUser) => normalizeEmail(u.email) === cleanEmail)) {
    throw new Error("E-mail de administrador já cadastrado.");
  }

  const companyId = `COMP-${Date.now().toString(36).toUpperCase()}`;
  const adminId = `USR-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
  
  companies.push({ 
    id: companyId, 
    name: companyName.trim(), 
    adminId, 
    status: CompanyStatus.ACTIVE, 
    createdAt: new Date().toISOString(), 
    monthlyFee: 299 
  });
  
  users.push({ 
    id: adminId, 
    name: adminName.trim(), 
    email: cleanEmail, 
    role: UserRole.ADMIN, // Clientes do Super Admin são sempre ADMINS
    companyId, 
    password: (password || 'joao123').trim() 
  });
  
  localStorage.setItem(KEYS.COMPANIES, JSON.stringify(companies));
  localStorage.setItem(KEYS.USERS, JSON.stringify(users));
};

export const getTeamMembers = (companyId: string): StoredUser[] => {
  const users: StoredUser[] = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
  return users.filter(u => u.companyId === companyId);
};

export const updateTeamMemberCredentials = (userId: string, companyId: string, updates: Partial<StoredUser>): void => {
  const users: StoredUser[] = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
  const index = users.findIndex(u => u.id === userId && u.companyId === companyId);
  if (index >= 0) {
    if (updates.email) updates.email = normalizeEmail(updates.email);
    users[index] = { ...users[index], ...updates };
    localStorage.setItem(KEYS.USERS, JSON.stringify(users));
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
export const updateCompanyFee = (id: string, fee: number) => {
  const companies = getAllCompanies();
  const index = companies.findIndex(c => c.id === id);
  if (index >= 0) { companies[index].monthlyFee = fee; localStorage.setItem(KEYS.COMPANIES, JSON.stringify(companies)); }
};
export const getCompanyAdminCredentials = (companyId: string): StoredUser | null => {
  const users: StoredUser[] = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
  return users.find(u => u.companyId === companyId && u.role === UserRole.ADMIN) || null;
};
