
import { InventoryItem, User, Company, UserRole } from '../types';

const KEYS = {
  INVENTORY: 'marm_inventory_v2',
  USERS: 'marm_users_v2',
  COMPANIES: 'marm_companies_v2',
  SESSION: 'marm_active_session'
};

// --- AUTH & SESSION ---
export const getCurrentUser = (): User | null => {
  const session = localStorage.getItem(KEYS.SESSION);
  return session ? JSON.parse(session) : null;
};

export const login = (email: string): User | null => {
  const users: User[] = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
  const user = users.find(u => u.email === email);
  if (user) {
    localStorage.setItem(KEYS.SESSION, JSON.stringify(user));
    return user;
  }
  return null;
};

export const registerCompany = (adminName: string, email: string, companyName: string): User => {
  const companyId = `COMP-${Math.random().toString(36).substr(2, 9)}`;
  const adminId = `USR-${Math.random().toString(36).substr(2, 9)}`;
  
  const newCompany: Company = { id: companyId, name: companyName, adminId };
  const newUser: User = { id: adminId, name: adminName, email, role: UserRole.ADMIN, companyId };

  const companies = JSON.parse(localStorage.getItem(KEYS.COMPANIES) || '[]');
  const users = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');

  companies.push(newCompany);
  users.push(newUser);

  localStorage.setItem(KEYS.COMPANIES, JSON.stringify(companies));
  localStorage.setItem(KEYS.USERS, JSON.stringify(users));
  localStorage.setItem(KEYS.SESSION, JSON.stringify(newUser));

  return newUser;
};

export const logout = () => localStorage.removeItem(KEYS.SESSION);

// --- TEAM MANAGEMENT ---
export const getTeamMembers = (companyId: string): User[] => {
  const users: User[] = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
  return users.filter(u => u.companyId === companyId);
};

export const addTeamMember = (name: string, email: string, role: UserRole, companyId: string): void => {
  const users = JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
  const newUser: User = {
    id: `USR-${Math.random().toString(36).substr(2, 9)}`,
    name, email, role, companyId
  };
  users.push(newUser);
  localStorage.setItem(KEYS.USERS, JSON.stringify(users));
};

// --- INVENTORY (Scoped by Company) ---
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
