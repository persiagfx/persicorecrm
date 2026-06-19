// ─── Tenant ─────────────────────────────────────────────────────────
export type IndustryType =
  | "GENERAL" | "RESTAURANT" | "IT" | "MANUFACTURING"
  | "TRADING" | "SERVICE" | "EDUCATION" | "ECOMMERCE";

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: "trial" | "starter" | "pro" | "enterprise";
  status: "active" | "suspended" | "cancelled";
  trialEndsAt: string | null;
  maxUsers: number;
  maxClients: number;
  industryType?: IndustryType;
}

// ─── User & Auth ───────────────────────────────────────────────────
export type UserRole =
  | "admin"
  | "sales_manager"
  | "sales_rep"
  | "project_manager"
  | "designer"
  | "developer"
  | "accountant"
  | "hr"
  | "marketing"
  | "legal";

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  color: string;
  walletBalance: number;
  joinedAt: string;
  isActive: boolean;
  tenantId?: string | null;
  tenant?: Tenant | null;
}

// ─── Lead ───────────────────────────────────────────────────────────
export type LeadStatus =
  | "new"
  | "contacted"
  | "meeting"
  | "proposal"
  | "negotiation"
  | "won"
  | "lost";

export interface Lead {
  id: string;
  companyName: string;
  contactName: string;
  contactPhone: string;
  contactEmail?: string;
  estimatedValue: number;
  conversionProbability: number;
  status: LeadStatus;
  columnId: string;
  assigneeId?: string;
  tags: string[];
  dueDate?: string;
  notes?: string;
  source?: string;
  createdAt: string;
  updatedAt: string;
  activities: Activity[];
  winLossReason?: WinLossReason;
}

export interface LeadColumn {
  id: string;
  title: string;
  order: number;
  color?: string;
}

// ─── Client ─────────────────────────────────────────────────────────
export type ClientStatus = "vip" | "active" | "at_risk" | "inactive";

export interface Client {
  id: string;
  companyName: string;
  contactName: string;
  contactPhone: string;
  contactEmail?: string;
  address?: string;
  website?: string;
  status: ClientStatus;
  tags: string[];
  totalRevenue: number;
  projectCount: number;
  lastInteractionAt?: string;
  anniversaryDate?: string;
  notes?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Project ─────────────────────────────────────────────────────────
export type ProjectStatus =
  | "planning"
  | "in_progress"
  | "review"
  | "completed"
  | "on_hold"
  | "cancelled";

export interface Project {
  id: string;
  name: string;
  clientId: string;
  description?: string;
  status: ProjectStatus;
  progress: number;
  budget: number;
  spent: number;
  startDate: string;
  deadline: string;
  completedAt?: string;
  memberIds: string[];
  tags: string[];
  colorHash: string;
  createdAt: string;
  updatedAt: string;
  repoUrl?: string;
  techDocs?: TechDoc[];
  servers?: ServerInfo[];
  deployChecklists?: DeployChecklist[];
  milestones?: Milestone[];
}

// ─── Task ────────────────────────────────────────────────────────────
export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type TaskStatus = "backlog" | "todo" | "in_progress" | "review" | "done";

export interface Task {
  id: string;
  projectId: string;
  parentId?: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeIds: string[];
  tags: string[];
  dueDate?: string;
  startDate?: string;
  estimatedHours?: number;
  trackedSeconds: number;
  order: number;
  columnId?: string;
  subtaskIds: string[];
  dependencyIds: string[];
  attachments: Attachment[];
  comments: Comment[];
  createdAt: string;
  updatedAt: string;
}

// ─── Time Tracking ───────────────────────────────────────────────────
export interface TimeEntry {
  id: string;
  taskId: string;
  projectId: string;
  userId: string;
  startedAt: string;
  endedAt?: string;
  durationSeconds: number;
  notes?: string;
  isRunning: boolean;
}

// ─── Invoice ─────────────────────────────────────────────────────────
export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled";
export type InvoiceType = "quote" | "invoice";

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Installment {
  id: string;
  invoiceId: string;
  amount: number;
  dueDate: string;
  paidAt?: string;
  paidAmount?: number;
  paymentMethod?: string;
  reference?: string;
  notes?: string;
  status: "pending" | "paid" | "overdue";
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  type: InvoiceType;
  clientId: string;
  projectId?: string;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discount: number;
  total: number;
  status: InvoiceStatus;
  issuedAt: string;
  dueDate: string;
  paidAt?: string;
  notes?: string;
  installments: Installment[];
  createdAt: string;
  updatedAt: string;
  isRecurring?: boolean;
  recurringInterval?: "monthly" | "quarterly" | "yearly";
  nextInvoiceDate?: string;
}

// ─── Expense ─────────────────────────────────────────────────────────
export type ExpenseCategory =
  | "rent"
  | "internet"
  | "tools"
  | "ads"
  | "salary"
  | "other";

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
  paidById: string;
  receipt?: string;
  notes?: string;
  createdAt: string;
  approvalStatus: "pending" | "approved" | "rejected";
  approvedById?: string;
  approvedAt?: string;
}

// ─── Contract ────────────────────────────────────────────────────────
export type ContractStatus = "draft" | "sent" | "signed" | "expired" | "cancelled";

export interface ContractTemplate {
  id: string;
  name: string;
  content: string;
  variables: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Contract {
  id: string;
  templateId: string;
  clientId: string;
  projectId?: string;
  title: string;
  content: string;
  status: ContractStatus;
  signToken?: string;
  signedAt?: string;
  signedIp?: string;
  signatureDataUrl?: string;
  sentAt?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Ticket ──────────────────────────────────────────────────────────
export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
export type TicketPriority = "low" | "medium" | "high" | "urgent";

export interface Ticket {
  id: string;
  title: string;
  description?: string;
  status: TicketStatus;
  priority: TicketPriority;
  reporterId: string;
  assigneeId?: string;
  projectId?: string;
  tags: string[];
  comments: Comment[];
  attachments: Attachment[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

// ─── Wiki ────────────────────────────────────────────────────────────
export interface WikiFolder {
  id: string;
  name: string;
  parentId?: string;
  order: number;
  createdAt: string;
}

export interface WikiReaction { emoji: string; userIds: string[]; }
export interface WikiComment { id: string; authorId: string; authorName?: string; content: string; createdAt: string; parentId?: string; }
export interface WikiVersion { id: string; title: string; content: string; savedAt: string; savedById: string; }

export interface WikiArticle {
  id: string;
  folderId: string;
  title: string;
  content: string;
  authorId: string;
  isPinned: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  // Optional rich fields (not in DB — populated locally or from future API)
  status?: "draft" | "published";
  visibility?: "all" | string;
  isStarred?: boolean;
  viewCount?: number;
  reactions?: WikiReaction[];
  comments?: WikiComment[];
  versions?: WikiVersion[];
  author?: { id: string; name: string; avatar?: string };
}

// ─── File Manager ────────────────────────────────────────────────────
export interface FileItem {
  id: string;
  name: string;
  type: string;
  size: number;
  folderId?: string;
  projectId?: string;
  uploadedById: string;
  url: string;
  thumbnailUrl?: string;
  version: number;
  createdAt: string;
  approvalStatus?: DesignApprovalStatus;
  designComments?: DesignComment[];
}

export interface FileFolder {
  id: string;
  name: string;
  parentId?: string;
  projectId?: string;
  createdAt: string;
}

// ─── Activity Log ────────────────────────────────────────────────────
export type ActivityEntityType =
  | "lead"
  | "client"
  | "project"
  | "task"
  | "invoice"
  | "contract"
  | "ticket"
  | "file"
  | "user"
  | "expense";

export interface ActivityLog {
  id: string;
  actorId: string;
  action: string;
  entityType: ActivityEntityType;
  entityId: string;
  entityName: string;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

// ─── Activity (inline, for leads/clients) ────────────────────────────
export interface Activity {
  id: string;
  type: "note" | "call" | "email" | "meeting" | "task";
  content: string;
  authorId: string;
  createdAt: string;
}

// ─── Revenue Share ───────────────────────────────────────────────────
export interface RevenueShare {
  projectId: string;
  shares: { userId: string; percentage: number }[];
}

// ─── Wallet ──────────────────────────────────────────────────────────
export interface WalletTransaction {
  id: string;
  userId: string;
  type: "credit" | "debit";
  amount: number;
  description: string;
  projectId?: string;
  invoiceId?: string;
  createdAt: string;
}

// ─── Message ─────────────────────────────────────────────────────────
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  attachments?: Attachment[];
  readBy: string[];
  createdAt: string;
}

export interface Conversation {
  id: string;
  participantIds: string[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Notification ────────────────────────────────────────────────────
export type NotificationType =
  | "task_assigned"
  | "invoice_overdue"
  | "deadline_near"
  | "contract_signed"
  | "new_message"
  | "lead_updated"
  | "wallet_credited";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  entityId?: string;
  entityType?: ActivityEntityType;
  isRead: boolean;
  createdAt: string;
}

// ─── Shared ──────────────────────────────────────────────────────────
export interface Comment {
  id: string;
  content: string;
  authorId: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedById: string;
  uploadedAt: string;
}

// ─── Dashboard Widget ────────────────────────────────────────────────
export type WidgetType =
  | "stats"
  | "revenue_chart"
  | "recent_activity"
  | "active_timer"
  | "pending_tasks"
  | "sales_pipeline"
  | "calendar_week"
  | "top_clients"
  | "recent_files"
  | "pinned_wiki";

export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
}

// ─── API Response ────────────────────────────────────────────────────
export interface ApiResponse<T> {
  data: T;
  meta?: {
    total?: number;
    page?: number;
    perPage?: number;
  };
  error?: string;
}

// ─── Company Settings ────────────────────────────────────────────────
export interface CompanySettings {
  name: string;
  legalName: string;
  taxId: string;
  registrationNumber: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  logoUrl?: string;
  invoiceFooter?: string;
  invoiceColor?: string;
  timezone?: string;
  currency?: string;
  primaryColor?: string;
  selectedModules?: string[]; // hrefs of enabled nav items for GENERAL industry
}

// ─── Milestone ───────────────────────────────────────────────────────
export interface Milestone {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  dueDate: string;
  completedAt?: string;
  color?: string;
}

// ─── Reminder (Follow-up) ────────────────────────────────────────────
export interface Reminder {
  id: string;
  userId: string;
  leadId?: string;
  clientId?: string;
  title: string;
  notes?: string;
  dueDate: string;
  isCompleted: boolean;
  createdAt: string;
}

// ─── Commission ──────────────────────────────────────────────────────
export interface Commission {
  id: string;
  userId: string;
  period: string;
  invoiceIds: string[];
  totalRevenue: number;
  percentage: number;
  amount: number;
  status: "pending" | "paid";
  paidAt?: string;
}

// ─── Payroll ─────────────────────────────────────────────────────────
export interface PayrollRecord {
  id: string;
  userId: string;
  period: string;
  baseSalary: number;
  bonus: number;
  deductions: number;
  netPay: number;
  status: "draft" | "approved" | "paid";
  paidAt?: string;
  notes?: string;
  createdAt: string;
}

// ─── Server Info (Developer) ─────────────────────────────────────────
export interface ServerInfo {
  id: string;
  environment: "development" | "staging" | "production";
  url: string;
  username?: string;
  notes?: string;
}

// ─── Deploy Checklist ────────────────────────────────────────────────
export interface DeployChecklistItem {
  id: string;
  title: string;
  isChecked: boolean;
}

export interface DeployChecklist {
  id: string;
  projectId: string;
  environment: "staging" | "production";
  items: DeployChecklistItem[];
  deployedAt?: string;
  deployedById?: string;
}

// ─── Technical Documentation ─────────────────────────────────────────
export interface TechDoc {
  id: string;
  category: "env" | "tech_stack" | "architecture" | "api" | "other";
  title: string;
  content: string;
  updatedAt: string;
}

// ─── Design Feedback ─────────────────────────────────────────────────
export type DesignApprovalStatus = "pending" | "in_review" | "approved" | "revision_needed";

export interface DesignVersion {
  id: string;
  fileId: string;
  versionNumber: number;
  url: string;
  uploadedById: string;
  uploadedAt: string;
  notes?: string;
  approvalStatus: DesignApprovalStatus;
}

export interface DesignComment {
  id: string;
  fileId: string;
  authorId: string;
  content: string;
  createdAt: string;
}

// ─── Win/Loss Reason ─────────────────────────────────────────────────
export type WinLossCategory =
  | "price" | "quality" | "competitor" | "timing"
  | "budget" | "trust" | "features" | "other";

export interface WinLossReason {
  id: string;
  leadId: string;
  outcome: "won" | "lost";
  category: WinLossCategory;
  description?: string;
  competitorName?: string;
  recordedById: string;
  recordedAt: string;
}

// ─── Legal ───────────────────────────────────────────────────────────
export type CaseStatus = "open" | "in_progress" | "suspended" | "closed" | "won" | "lost";
export type CaseType = "contract" | "dispute" | "labor" | "ip" | "regulatory" | "other";

export interface LegalAction {
  id: string;
  date: string;
  type: string;
  description: string;
  performedById: string;
  nextDate?: string;
}

export interface LegalCase {
  id: string;
  caseNumber: string;
  title: string;
  type: CaseType;
  status: CaseStatus;
  plaintiff: string;
  defendant: string;
  court?: string;
  lawyerId: string;
  clientId?: string;
  nextHearing?: string;
  description?: string;
  actions: LegalAction[];
  documents: string[];
  createdAt: string;
  updatedAt: string;
}

export interface LegalContract {
  id: string;
  title: string;
  type: "employment" | "service" | "nda" | "partnership" | "vendor" | "other";
  parties: string[];
  startDate: string;
  endDate?: string;
  status: "draft" | "review" | "signed" | "expired" | "terminated";
  fileUrl?: string;
  notes?: string;
  createdById: string;
  createdAt: string;
}

// ─── Meeting ─────────────────────────────────────────────────────────
export type MeetingStatus = "scheduled" | "ongoing" | "completed" | "cancelled";
export type MeetingType = "internal" | "client" | "board" | "sales" | "review" | "other";

export interface MeetingActionItem {
  id: string;
  title: string;
  assigneeId: string;
  dueDate?: string;
  isCompleted: boolean;
}

export interface Meeting {
  id: string;
  title: string;
  type: MeetingType;
  status: MeetingStatus;
  startAt: string;
  endAt: string;
  location?: string;
  meetingUrl?: string;
  attendeeIds: string[];
  agenda?: string;
  minutes?: string;
  relatedProjectId?: string;
  relatedClientId?: string;
  isPrivate: boolean;
  createdById: string;
  actionItems: MeetingActionItem[];
  createdAt: string;
}

// ─── Salary Advance ──────────────────────────────────────────────────
export type AdvanceStatus = "pending" | "approved" | "rejected" | "paid";

export interface SalaryAdvance {
  id: string;
  userId: string;
  amount: number;
  reason: string;
  description?: string;
  neededAt: string;
  status: AdvanceStatus;
  reviewedById?: string;
  reviewNote?: string;
  reviewedAt?: string;
  paidAt?: string;
  createdAt: string;
}

// ─── Services / Products ─────────────────────────────────────────────
export type ServiceUnit = "hour" | "project" | "month" | "piece" | "word" | "page";

export interface ServiceItem {
  id: string;
  code: string;
  name: string;
  category: "design" | "development" | "marketing" | "consulting" | "support" | "other";
  defaultPrice: number;
  unit: ServiceUnit;
  taxRate: number;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

// ─── Form Builder ────────────────────────────────────────────────────
export type QuestionType =
  | "short_text" | "long_text" | "single_choice" | "multiple_choice"
  | "rating" | "scale" | "yes_no" | "date" | "file_upload";

export interface FormQuestion {
  id: string;
  type: QuestionType;
  title: string;
  description?: string;
  isRequired: boolean;
  options?: string[];
  minValue?: number;
  maxValue?: number;
}

export interface FormResponse {
  id: string;
  formId: string;
  respondentId?: string;
  answers: Record<string, string | string[] | number>;
  submittedAt: string;
}

export interface SurveyForm {
  id: string;
  title: string;
  description?: string;
  type: "internal" | "client" | "exit_interview" | "performance" | "custom";
  questions: FormQuestion[];
  status: "draft" | "active" | "closed";
  createdById: string;
  createdAt: string;
  closedAt?: string;
  responses: FormResponse[];
}

// ─── Marketing ───────────────────────────────────────────────────────
export type CampaignStatus = "draft" | "active" | "paused" | "completed";
export type CampaignChannel = "google" | "instagram" | "linkedin" | "email" | "sms" | "content" | "other";

export interface CampaignMetric {
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  revenue: number;
}

export type CampaignProgressPhase = "planning" | "running" | "optimizing" | "completed";

export interface CampaignProgressNote {
  id: string;
  text: string;
  phase: CampaignProgressPhase;
  authorId: string;
  createdAt: string;
}

export interface Campaign {
  id: string;
  title: string;
  channel: CampaignChannel;
  status: CampaignStatus;
  budget: number;
  startDate: string;
  endDate?: string;
  metrics: CampaignMetric;
  targetAudience?: string;
  description?: string;
  progressNotes?: CampaignProgressNote[];
  targetROI?: number;
  targetConversions?: number;
  createdById: string;
  createdAt: string;
}

export interface ContentPiece {
  id: string;
  title: string;
  type: "blog" | "social" | "email" | "video" | "infographic" | "other";
  channel: CampaignChannel;
  status: "idea" | "writing" | "review" | "scheduled" | "published" | "archived";
  scheduledAt?: string;
  publishedAt?: string;
  assigneeId: string;
  campaignId?: string;
  url?: string;
  notes?: string;
  body?: string;
  archivedAt?: string;
  createdAt: string;
}

export interface MarketingBudget {
  id: string;
  period: string;
  totalBudget: number;
  spent: number;
  byChannel: Partial<Record<CampaignChannel, number>>;
}

export interface BudgetLineItem {
  id: string;
  channel: CampaignChannel;
  name: string;
  allocatedAmount: number;
  notes?: string;
  startDate?: string;
  endDate?: string;
  campaignId?: string;
  createdAt: string;
}

export interface PeriodBudget {
  id: string;
  period: string;
  totalBudget: number;
  lineItems: BudgetLineItem[];
  notes?: string;
  createdById: string;
  createdAt: string;
}

// ─── CRM Guide ───────────────────────────────────────────────────────
export interface CRMGuideSection {
  id: string;
  role: UserRole | "all";
  title: string;
  content: string;
  icon?: string;
  order: number;
}

// ─── Portal (Customer Portal) ────────────────────────────────────────
export interface PortalUser {
  id: string;
  clientId: string;
  name: string;
  email: string;
  password: string;
  role: "admin" | "viewer";
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export interface PortalMessage {
  id: string;
  clientId: string;
  authorId: string;
  authorType: "client" | "team";
  authorName: string;
  content: string;
  attachments?: string[];
  isRead: boolean;
  createdAt: string;
}

export interface PortalTicketReply {
  id: string;
  authorName: string;
  authorType: "client" | "team";
  content: string;
  createdAt: string;
}

export interface PortalTicket {
  id: string;
  clientId: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  status: "open" | "in_progress" | "resolved" | "closed";
  createdByName: string;
  replies: PortalTicketReply[];
  satisfactionScore?: number;
  createdAt: string;
  resolvedAt?: string;
}

// ─── Sales Competition ────────────────────────────────────────────────
export interface CompetitionReward {
  rank: number;
  title: string;
  badgeEmoji: string;
  bonusAmount?: number;
  bonusPercent?: number;
  description?: string;
}

export type CompetitionMetric = "revenue" | "deals_count" | "conversion_rate";

export interface SalesCompetition {
  id: string;
  title: string;
  period: string;
  metric: CompetitionMetric;
  startDate: string;
  endDate: string;
  rewards: CompetitionReward[];
  createdById: string;
  isActive: boolean;
  createdAt: string;
}
