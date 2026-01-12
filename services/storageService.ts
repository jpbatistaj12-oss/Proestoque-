
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

/**
 * Normaliza e-mails: remove espaços e coloca tudo em minúsculo.
 */
const normalizeString = (str: string | undefined) => str ? str.trim().toLowerCase() : '';

export const getCurrentUser = (): User | null => {
  const session = localStorage.getItem(KEYS.SESSION);
  return session ? JSON.parse(session) : null;
};

export const login = (email: string, password?: string, preferredRole?: UserRole): User | null => {
  const cleanEmail = normalizeString(email);
  const cleanPassword = (password || '').trim();
  
  // 1. Login Super Admin
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
  
  // 2. Busca o usuário sem filtrar por cargo primeiro para dar erro específico
  const user = users.find(u => normalizeString(u.email) === cleanEmail);
  
  if (!user) {
    // DIAGNÓSTICO PARA O USUÁRIO (Console F12)
    console.group("ERRO DE LOGIN: CONFIGURE O ACESSO ABAIXO");
    console.log("Tentativa de e-mail:", cleanEmail);
    console.log("Usuários cadastrados no sistema:");
    console.table(users.map(u => ({ nome: u.name, e_mail: u.email, cargo: u.role, senha: u.password })));
    console.groupEnd();
    
    throw new Error("E-MAIL NÃO ENCONTRADO. Certifique-se de que o e-mail foi cadastrado no menu 'Equipe' ou na 'Plataforma'.");
  }

  // 3. Validação de aba selecionada (Admin vs Colaborador)
  if (preferredRole && user.role !== preferredRole && user.role !== UserRole.SUPER_ADMIN) {
    const roleDigitada = preferredRole === UserRole.ADMIN ? 'ADMINISTRADOR' : 'COLABORADOR';
    const roleReal = user.role === UserRole.ADMIN ? 'ADMINISTRADOR' : 'COLABORADOR';
    throw new Error(`ESTE E-MAIL É DE UM ${roleReal}. Selecione a aba "${roleReal}" acima para entrar.`);
  }

  // 4. Comparação de senha
  if (user.password !== cleanPassword) {
    throw new Error("SENHA INCORRETA. Verifique maiúsculas e minúsculas.");
  }

  // 5. Validação de Empresa
  const companies: Company[] = JSON.parse(localStorage.getItem(KEYS.COMPANIES) || '[]');
  const company = companies.find(c => c.id === user.companyId);

  if (!company && user.role !== UserRole.SUPER_ADMIN) {
    throw new Error("Empresa não vinculada.");
  }

  if (company && company.status === CompanyStatus.SUSPENDED) {
    throw new Error("Acesso suspenso pelo administrador.");
  }

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
    throw new Error("E-mail já cadastrado.");
  }

  const newUser: StoredUser = {
    id: `USR-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
    name: name.trim(), 
    email: cleanEmail, 
    role, 
    companyId, 
    password: (password || 'marm123').trim()
  };
  users.push(newUser);
  localStorage.setItem(KEYS.USERS, JSON.stringify(users));
};

export const updateTeamMemberCredentials = (userId: string, companyId: string, updates: Partial<StoredUser>): void => {
  const users: StoredUser[] = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
  const index = users.findIndex(u => u.id === userId && u.companyId === companyId);
  
  if (index >= 0) {
    if (updates.email) {
      const cleanEmail = normalizeString(updates.email);
      if (users.some((u, i) => i !== index && normalizeString(u.email) === cleanEmail)) {
        throw new Error("E-mail já está em uso.");
      }
      updates.email = cleanEmail;
    }
    
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
