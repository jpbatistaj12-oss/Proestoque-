
import React from 'react';
import { 
  LayoutDashboard, 
  Package, 
  PlusCircle, 
  QrCode, 
  History, 
  Users,
  Search,
  Settings,
  Database,
  FileText
} from 'lucide-react';
import { MaterialCategory } from './types';

export const APP_NAME = "Marmoraria Control";

export const PREDEFINED_MATERIALS = [
  { name: 'Preto São Gabriel', category: MaterialCategory.GRANITO },
  { name: 'Verde Ubatuba', category: MaterialCategory.GRANITO },
  { name: 'Branco Siena', category: MaterialCategory.GRANITO },
  { name: 'Ouro Brasil', category: MaterialCategory.GRANITO },
  { name: 'Branco Prime', category: MaterialCategory.QUARTZO },
  { name: 'Cinza Absoluto', category: MaterialCategory.QUARTZO },
  { name: 'Mármore Carrara', category: MaterialCategory.MARMORE },
  { name: 'Mármore Travertino', category: MaterialCategory.MARMORE },
  { name: 'Calacatta Gold', category: MaterialCategory.DEKTON },
  { name: 'Estatuário', category: MaterialCategory.MARMORE },
  { name: 'Preto Absoluto', category: MaterialCategory.GRANITO },
  { name: 'Branco Itaúnas', category: MaterialCategory.GRANITO }
];

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, roles: ['ADMIN', 'OPERATOR'] },
  { id: 'inventory', label: 'Estoque', icon: <Package size={20} />, roles: ['ADMIN', 'OPERATOR'] },
  { id: 'projects', label: 'Projetos (Busca)', icon: <Search size={20} />, roles: ['ADMIN', 'OPERATOR'] },
  { id: 'add', label: 'Gerenciar Material', icon: <PlusCircle size={20} />, roles: ['ADMIN'] },
  { id: 'scanner', label: 'Scanner', icon: <QrCode size={20} />, roles: ['ADMIN', 'OPERATOR'] },
  { id: 'team', label: 'Equipe', icon: <Users size={20} />, roles: ['ADMIN'] },
  { id: 'history', label: 'Movimentações', icon: <History size={20} />, roles: ['ADMIN', 'OPERATOR'] },
  { id: 'platform', label: 'Plataforma', icon: <Settings size={20} />, roles: ['SUPER_ADMIN'] },
];

export const STATUS_COLORS: Record<string, string> = {
  'Disponível': 'bg-green-100 text-green-800 border-green-200',
  'Baixo Estoque': 'bg-amber-100 text-amber-800 border-amber-200',
  'Esgotado': 'bg-red-100 text-red-800 border-red-200',
  'Em Uso': 'bg-blue-100 text-blue-800 border-blue-200',
  'Com Sobra': 'bg-purple-100 text-purple-800 border-purple-200',
  'Inteira': 'bg-green-100 text-green-800 border-green-200',
};
