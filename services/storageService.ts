
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

// Normalização ultra-robusta
const normalize = (str: string | undefined) => str ? str.trim().toLowerCase().replace(/\s/g, '') : '';

export const getCurrentUser = (): User | null => {
  const session = localStorage.getItem(KEYS.SESSION);
  return session ? JSON.parse(session) : null;
};

export const login = (email: string, password?: string): User | null => {
  const cleanEmail = normalize(email);
  const cleanPassword = (password || '').trim();
  
  // Login de Super Admin
  if (cleanEmail === normalize('admin@marmoraria.control') && cleanPassword === 'marm@2025') {
    const superAdmin: User = {
      id: 'SUPER-001',
      name: 'Administrador Central',
      email: email.trim().toLowerCase(),
      role: UserRole.SUPER_ADMIN,
      companyId: 'PLATFORM_OWNER'
    };
    localStorage.setItem(KEYS.SESSION, JSON.stringify(superAdmin));
    return superAdmin;
  }

  const users: StoredUser[] = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
  
  // Debug para o desenvolvedor no console
  console.log("Tentativa de login:", cleanEmail);
  console.log("Usuários cadastrados no sistema:", users.map(u => ({ nome: u.name, email: u.email, email_normalizado: normalize(u.email) })));

  const user = users.find(u => normalize(u.email) === cleanEmail);
  
  if (!user) {
    throw new Error("E-mail não encontrado. Verifique se o cadastro foi finalizado ou se há espaços extras.");
  }

  if (user.password !== cleanPassword) {
    throw new Error("Senha incorreta. Verifique o Caps Lock.");
  }

  const companies: Company[] = JSON.parse(localStorage.getItem(KEYS.COMPANIES) || '[]');
  const company = companies.find(c => c.id === user.companyId);

  if (!company) throw new Error("Empresa não encontrada para este usuário.");
  if (company.status === CompanyStatus.SUSPENDED) throw new Error("Acesso suspenso por falta de pagamento.");

  const { password: _, ...userWithoutPassword } = user;
  localStorage.setItem(KEYS.SESSION, JSON.stringify(userWithoutPassword));
  return userWithoutPassword;
};

export const createCompanyAccount = (adminName: string, email: string, companyName: string, password?: string): void => {
  const companies = JSON.parse(localStorage.getItem(KEYS.COMPANIES) || '[]');
  const users = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');

  const cleanEmail = email.trim().toLowerCase();
  
  if (users.some((u: StoredUser) => normalize(u.email) === normalize(cleanEmail))) {
    throw new Error("Este e-mail já possui um cadastro ativo.");
  }

  const companyId = `COMP-${Date.now().toString(36).toUpperCase()}`;
  const adminId = `USR-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
  
  const newCompany: Company = { 
    id: companyId, 
    name: companyName.trim(), 
    adminId,
    status: CompanyStatus.ACTIVE,
    createdAt: new Date().toISOString(),
    monthlyFee: 299
  };

  const newUser: StoredUser = { 
    id: adminId, 
    name: adminName.trim(), 
    email: cleanEmail, 
    role: UserRole.ADMIN, 
    companyId,
    password: (password || 'joao123').trim()
  };

  companies.push(newCompany);
  users.push(newUser);

  localStorage.setItem(KEYS.COMPANIES, JSON.stringify(companies));
  localStorage.setItem(KEYS.USERS, JSON.stringify(users));
};

export const logout = () => {
  localStorage.removeItem(KEYS.SESSION);
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

export const getTeamMembers = (companyId: string): User[] => {
  const users: StoredUser[] = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
  return users.filter(u => u.companyId === companyId).map(({ password, ...rest }) => rest);
};

export const addTeamMember = (name: string, email: string, role: UserRole, companyId: string, password?: string): void => {
  const users = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
  const cleanEmail = email.trim().toLowerCase();

  if (users.some((u: StoredUser) => normalize(u.email) === normalize(cleanEmail))) {
    throw new Error("E-mail já cadastrado na equipe.");
  }

  const newUser: StoredUser = {
    id: `USR-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
    name: name.trim(), email: cleanEmail, role, companyId, password: (password || 'marm123').trim()
  };
  users.push(newUser);
  localStorage.setItem(KEYS.USERS, JSON.stringify(users));
};

export const getAllCompanies = (): Company[] => {
  return JSON.parse(localStorage.getItem(KEYS.COMPANIES) || '[]');
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
  const users: StoredUser[] = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
  return users.find(u => u.companyId === companyId && u.role === UserRole.ADMIN) || null;
};
