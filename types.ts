
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

export enum PricingStatus {
  DRAFT = "Draft",
  SENT_TO_CLIENT = "Sent to Client",
  APPROVED = "Approved",
  REJECTED = "Rejected",
  REVISED = "Revised"
}

export interface PricingRecord {
  id: string;
  customerId: string;

  // Basic Details
  salesPerson?: string;
  industry?: string;
  city?: string;
  state?: string;
  date: string;

  // Product / Service Details
  productName?: string;
  drawingNo?: string;
  materialType?: string;
  machineType?: string;
  process?: string;
  moq?: number;
  quotedQty?: number;

  // Cost Breakup
  rawMaterialCost?: number;
  machiningCost?: number;
  laborCost?: number;
  overhead?: number;
  transportationCost?: number;
  otherCharges?: number;

  // Final Pricing
  tech: TechCategory;
  rate: number; // Quoted Price per piece
  unit: string;
  totalAmount?: number;
  marginPercent?: number;
  currency?: string;
  validTill?: string;

  // Payment Terms
  paymentMode?: string;
  creditDays?: number;
  advancePercent?: number;
  gstIncluded?: boolean;

  // Status
  status: PricingStatus;
}

export interface Customer {
  id: string;
  name: string;
  city: string;
  state: string;
  country: string;
  areaSector?: string;
  pincode?: string;
  annualTurnover: number;
  projectTurnover: number;
  industry: string;
  industryType?: 'Mechanical' | 'Automotive' | 'Fabrication' | 'Tool & Die' | 'Other';
  zone?: 'North' | 'South' | 'West' | 'East' | 'Central';
  machineTypes?: string[];
  companySize?: 'Small' | 'Medium' | 'Large';
  coords?: [number, number];
  isDiscovered?: boolean;
  industrialHub?: string;
  contacts: ContactPerson[];
  pricingHistory: PricingRecord[];
  status?: 'Open' | 'Closed';
  enquiryNo?: string;
  lastDate?: string;
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
  eventType?: string;
  organizerName?: string;
  website?: string;

  // Phase 2 Expansion
  startDate?: string;
  endDate?: string;
  city?: string;
  state?: string;
  venue?: string;
  zone?: 'North' | 'South' | 'West' | 'East' | 'Central';

  participationType?: 'Visitor' | 'Exhibitor';
  stallNo?: string;
  boothSize?: string;
  feeCost?: number;
  registrationStatus?: 'Applied' | 'Confirmed';

  assignedTeam?: string; // Comma separated or single name for now
  visitPlan?: string;
  transportMode?: string;
  hotelDetails?: string;
  budget?: number;

  // Phase 3 Expansion
  status?: 'upcoming' | 'live' | 'Completed' | 'canceled';

  // Leads & Business Outcome
  leadsGenerated?: number;
  hotLeads?: number;
  warmLeads?: number;
  coldLeads?: number;
  ordersReceived?: number;
  pipeLineInquiries?: number;
  newContacts?: number;

  // Documents (Links/Paths)
  brochureLink?: string;
  entryPassLink?: string;
  stallLayoutLink?: string;
  photosLink?: string;
  visitorListLink?: string;
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

  // Transport Details
  transportMode?: string;
  vehicleNo?: string;
  startLocation?: string;
  endLocation?: string;
  distance?: number;

  // Payment / Commercial
  paymentMode?: string;
  expectedAmount?: number;
  paymentStatus?: 'Received' | 'Pending' | 'Not Discussed';
  expectedPaymentDate?: string;

  // Call Logs
  callLogs?: CallLog[];

  // Phase 2 Fields
  metContacts?: MetContact[];
  checklist?: { [key: string]: boolean };
  attachments?: VisitAttachment[];
}

export interface MetContact {
  id: string;
  name: string;
  designation: string;
  phone?: string;
  email?: string;
  isDecisionMaker: boolean;
}

export interface VisitAttachment {
  id: string;
  name: string;
  type: 'Image' | 'Document' | 'Other';
  url: string;
}

export interface CallLog {
  id: string;
  type: 'Pre-Visit' | 'Post-Visit';
  date: string;
  contactPerson: string;
  purpose: string;
  notes?: string;
  completed: boolean;
}

export type UserRole = 'Admin' | 'Sales' | 'Marketing';

export interface User {
  name: string;
  role: UserRole;
  avatar?: string;
}

export type ProjectStatus = 'Active' | 'Completed' | 'On Hold';
export enum ProjectType {
  IN_HOUSE = 'IN_HOUSE',
  VENDOR = 'VENDOR'
}

export type VendorType = 'CNC' | 'Fabrication' | 'Casting' | 'Painting' | 'Electrical';

export interface Vendor {
  id: string;
  name: string;
  type: VendorType;
  contactPerson: string;
  mobile: string;
  city: string;
  state: string;
  createdAt?: string;
}

export type RateType = 'Per Piece' | 'Job Work' | 'Hourly';
export type PaymentTerms = 'Advance' | 'Milestone' | 'After Delivery';

export interface ClientPayment {
  id: string;
  date: string;
  invoiceNo?: string;
  amount: number;
  mode: 'Cash' | 'Bank' | 'UPI';
  reference: string;
  addedBy: string;
  notes?: string;
}

export interface ClientCommercial {
  projectCost: number;
  advanceReceived: number;
  balanceReceivable: number;
  gstAmount: number;
  gstApplicable: 'Yes' | 'No';
  gstNumber?: string;
  paymentTerms?: PaymentTerms;
  payments?: ClientPayment[];
}

export interface VendorPayment {
  id: string;
  date: string;
  voucherNo: string;
  amount: number;
  mode: 'Cash' | 'Bank' | 'UPI';
  reference: string;
  paidBy: string;
  remarks?: string;
}

export interface VendorCommercial {
  totalCost: number;
  advancePaid: number;
  balancePayable: number;
  gstAmount: number;
  gstApplicable: 'Yes' | 'No';
  gstNumber?: string;
  paymentTerms: PaymentTerms;
  payments?: VendorPayment[];
}

export interface CommercialDetails {
  client: ClientCommercial;
  vendor: VendorCommercial;
  marginPercent: number;
  rateType?: RateType; // Keep for legacy/flexibility
}

export interface VendorDetails {
  vendorId?: string; // Link to master vendor if selected
  vendorName: string;
  vendorType: VendorType;
  vendorContact: string; // Contact Person Name
  vendorMobile: string;
  vendorCity: string;
  vendorState: string;
  timelineWeeks: number;
  trackingLink?: string;
  milestones?: string;
}

export interface Project {
  id: string;
  name: string;
  type: ProjectType;
  description: string;
  startDate: string;
  endDate: string;
  status: ProjectStatus;
  createdBy: string;
  companyName: string;
  location?: string;
  totalValue?: number;
  vendorDetails?: VendorDetails;
  commercialDetails?: CommercialDetails;
  updatedAt?: string;
}

export interface Expense {
  id: string;
  projectId: string;
  name: string;
  amount: number;
  category: 'Raw Material' | 'Labor' | 'Machine/Maintenance' | 'Power/Utility' | 'Other';
  date: string;
  paidBy?: string; // Optional now as per new flow might not use it or auto-set
  paymentMode: 'Cash' | 'UPI' | 'Bank';
  billPhoto?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  rejectionReason?: string;
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
  mode: 'Cash' | 'Bank' | 'UPI';
  linkedToCommercial?: boolean;
  createdAt?: string;
}

export interface ExtraExpense {
  id: string;
  projectId: string;
  date: string;
  type: string;
  amount: number;
  mode: 'Cash' | 'Bank' | 'UPI';
  reference: string;
  addedBy: string;
  createdAt?: string;
}

export type DocumentCategory = 'Client PO' | 'Vendor PO' | 'Vendor Invoice' | 'Client Invoice' | 'Delivery Challan' | 'Agreement / NDA' | 'Other';
export type DocumentTag = 'Client' | 'Vendor' | 'Internal';

export interface ProjectDocument {
  id: string;
  projectId: string;
  name: string;
  category: DocumentCategory;
  tags: DocumentTag[];
  fileUrl: string;
  fileType?: string; // MIME type or extension
  size?: number; // In bytes
  uploadedBy: string;
  createdAt?: string;
}

export type ActivityType = 'VENDOR_ASSIGNED' | 'PAYMENT_UPDATED' | 'COST_CHANGED' | 'STATUS_UPDATED' | 'DOCUMENT_ADDED' | 'PROJECT_CREATED';

export interface ActivityLog {
  id: string;
  projectId: string;
  type: ActivityType;
  description: string;
  metadata?: any;
  performedBy: string;
  createdAt?: string;
}