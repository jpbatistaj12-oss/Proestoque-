
import React from 'react';
import { 
  LayoutDashboard, 
  Package, 
  PlusCircle, 
  QrCode, 
  History, 
  Users,
  Search,
  Settings
} from 'lucide-react';

export const APP_NAME = "Marmoraria Control";

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, roles: ['ADMIN', 'OPERATOR'] },
  { id: 'inventory', label: 'Estoque', icon: <Package size={20} />, roles: ['ADMIN', 'OPERATOR'] },
  { id: 'projects', label: 'Projetos', icon: <Search size={20} />, roles: ['ADMIN', 'OPERATOR'] },
  { id: 'add', label: 'Cadastrar', icon: <PlusCircle size={20} />, roles: ['ADMIN'] },
  { id: 'scanner', label: 'Scanner', icon: <QrCode size={20} />, roles: ['ADMIN', 'OPERATOR'] },
  { id: 'team', label: 'Equipe', icon: <Users size={20} />, roles: ['ADMIN'] },
  { id: 'history', label: 'Histórico', icon: <History size={20} />, roles: ['ADMIN', 'OPERATOR'] },
  { id: 'platform', label: 'Plataforma', icon: <Settings size={20} />, roles: ['SUPER_ADMIN'] },
];

export const STATUS_COLORS: Record<string, string> = {
  'Inteira': 'bg-green-100 text-green-800 border-green-200',
  'Em Uso': 'bg-blue-100 text-blue-800 border-blue-200',
  'Com Sobra': 'bg-amber-100 text-amber-800 border-amber-200',
  'Finalizada': 'bg-red-100 text-red-800 border-red-200',
};
