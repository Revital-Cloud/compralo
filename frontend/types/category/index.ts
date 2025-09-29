export interface Category {
  id_categoria: number;
  nom_categoria: string;
  ind_activo: boolean;
  usr_insert?: string;
  fec_insert?: string;
  usr_update?: string;
  fec_update?: string;
}

export interface CategoryDisplay {
  id: string;
  name: string;
  icon: string;
  color: string;
  bgGradient: string;
  iconBg: string;
  isActive: boolean;
}
