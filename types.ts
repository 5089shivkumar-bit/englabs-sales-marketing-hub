
export enum TechCategory {
  SLS_PA2200 = "SLS Nylon PA2200",
  SLS_PA3200 = "SLS PA3200",
  MJF_PA12 = "MJF Nylon PA12",
  SLA_ABS = "SLA ABS",
  SLA_TRANS = "SLA Transparent",
  FDM_TPU = "FDM TPU",
  FDM_ABS = "FDM ABS",
  FDM_PLA = "FDM PLA",
  FDM_CF = "FDM Carbon Fibre",
  CNC_VMC = "CNC / VMC Machining",
  METAL_3D = "Metal 3D Printing",
  VACUUM_CAST = "Vacuum Casting"
}

export const normalizeTechCategory = (val: string): TechCategory => {
  const search = val.toLowerCase().trim();
  if (search.includes("pa2200")) return TechCategory.SLS_PA2200;
  if (search.includes("pa3200")) return TechCategory.SLS_PA3200;
  if (search.includes("mjf") || search.includes("pa12")) return TechCategory.MJF_PA12;
  if (search.includes("sla") && search.includes("abs")) return TechCategory.SLA_ABS;
  if (search.includes("transparent")) return TechCategory.SLA_TRANS;
  if (search.includes("tpu")) return TechCategory.FDM_TPU;
  if (search.includes("carbon")) return TechCategory.FDM_CF;
  if (search.includes("fdm") && search.includes("abs")) return TechCategory.FDM_ABS;
  if (search.includes("pla")) return TechCategory.FDM_PLA;
  if (search.includes("cnc") || search.includes("vmc")) return TechCategory.CNC_VMC;
  if (search.includes("metal")) return TechCategory.METAL_3D;
  if (search.includes("vacuum") || search.includes("casting")) return TechCategory.VACUUM_CAST;
  return TechCategory.FDM_PLA; // Default fallback
};

export interface ContactPerson {
  id: string;
  name: string;
  designation: string;
  email: string;
  phone: string;
}

export interface PricingRecord {
  id: string;
  customerId: string;
  tech: TechCategory;
  rate: number;
  unit: string;
  date: string;
}

export interface Customer {
  id: string;
  name: string;
  city: string;
  state: string;
  country: string;
  annualTurnover: number;
  projectTurnover: number;
  industry: string;
  contacts: ContactPerson[];
  pricingHistory: PricingRecord[];
  lastModifiedBy?: string; // Audit field
  updatedAt?: string; // Audit field
}

export interface Expo {
  id: string;
  name: string;
  date: string;
  location: string;
  industry: string;
  region: string;
  link?: string;
}

export enum VisitStatus {
  PLANNED = "Planned",
  COMPLETED = "Completed",
  CANCELLED = "Cancelled",
  RESCHEDULED = "Rescheduled"
}

export interface Visit {
  id: string;
  customerId: string;
  customerName: string;
  date: string;
  purpose: string;
  assignedTo: string;
  status: VisitStatus;
  notes?: string;
  // New fields
  location?: string;
  expenseAmount?: number;
  expenseNote?: string;
  visitResult?: string;
  nextFollowUpDate?: string;
  reminderEnabled?: boolean;
}

export type UserRole = 'Admin' | 'Sales' | 'Marketing';

export interface User {
  name: string;
  role: UserRole;
  avatar?: string;
}

export type ProjectStatus = 'Active' | 'Completed' | 'On Hold';

export interface Project {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: ProjectStatus;
  createdBy: string;
  companyName: string;
  updatedAt?: string;
}

export interface Expense {
  id: string;
  projectId: string;
  name: string;
  amount: number;
  category: 'Raw Material' | 'Machining/Production' | 'Labor' | 'Packaging & Transport' | 'Overheads' | 'Other';
  date: string;
  paidBy: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  notes?: string;
  createdAt?: string;
}

export interface Income {
  id: string;
  projectId: string;
  clientName: string;
  amount: number;
  invoiceNumber: string;
  receivedDate: string;
  status: 'Pending' | 'Received';
  createdAt?: string;
}