
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
 * Normalização rigorosa para evitar erros de digitação, espaços ou caixa alta/baixa.
 */
const normalizeString = (str: string | undefined) => str ? str.trim().toLowerCase() : '';

export const getCurrentUser = (): User | null => {
  const session = localStorage.getItem(KEYS.SESSION);
  return session ? JSON.parse(session) : null;
};

export const login = (email: string, password?: string): User | null => {
  const cleanEmail = normalizeString(email);
  const cleanPassword = (password || '').trim();
  
  // Login de Super Admin da plataforma
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
  
  // LOG DE DEPURAÇÃO: Mostra no console do navegador (F12) o que está acontecendo
  console.group("Depuração de Login");
  console.log("E-mail digitado:", cleanEmail);
  console.log("Banco de dados local (Usuários):");
  console.table(users.map(u => ({ nome: u.name, email_original: u.email, email_normalizado: normalizeString(u.email) })));
  console.groupEnd();

  // Busca o usuário comparando os e-mails normalizados
  const user = users.find(u => normalizeString(u.email) === cleanEmail);
  
  if (!user) {
    throw new Error("E-MAIL NÃO ENCONTRADO. Verifique se o cadastro foi finalizado ou consulte o Administrador.");
  }

  // Comparação de senha (sensível a maiúsculas/minúsculas conforme padrão de segurança)
  if (user.password !== cleanPassword) {
    throw new Error("SENHA INCORRETA. Verifique o preenchimento.");
  }

  const companies: Company[] = JSON.parse(localStorage.getItem(KEYS.COMPANIES) || '[]');
  const company = companies.find(c => c.id === user.companyId);

  if (!company && user.role !== UserRole.SUPER_ADMIN) {
    throw new Error("Empresa não vinculada a este usuário.");
  }

  if (company && company.status === CompanyStatus.SUSPENDED) {
    throw new Error("Acesso suspenso. Entre em contato com o suporte.");
  }

  const { password: _, ...userWithoutPassword } = user;
  localStorage.setItem(KEYS.SESSION, JSON.stringify(userWithoutPassword));
  return userWithoutPassword;
};

export const createCompanyAccount = (adminName: string, email: string, companyName: string, password?: string): void => {
  const cleanEmail = normalizeString(email);
  const companies = JSON.parse(localStorage.getItem(KEYS.COMPANIES) || '[]');
  const users = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');

  if (users.some((u: StoredUser) => normalizeString(u.email) === cleanEmail)) {
    throw new Error("Este e-mail já está sendo utilizado por outro cadastro.");
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
    email: cleanEmail, // Salva o e-mail já limpo
    role: UserRole.ADMIN, 
    companyId,
    password: (password || 'joao123').trim()
  };

  companies.push(newCompany);
  users.push(newUser);

  localStorage.setItem(KEYS.COMPANIES, JSON.stringify(companies));
  localStorage.setItem(KEYS.USERS, JSON.stringify(users));
};

export const addTeamMember = (name: string, email: string, role: UserRole, companyId: string, password?: string): void => {
  const cleanEmail = normalizeString(email);
  const users = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
  
  if (users.some((u: StoredUser) => normalizeString(u.email) === cleanEmail)) {
    throw new Error("E-mail já cadastrado na equipe.");
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
