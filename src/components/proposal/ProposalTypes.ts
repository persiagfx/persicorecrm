export type ProposalStatus = "draft" | "sent" | "viewed" | "accepted" | "rejected";
export type ProjectType = "website" | "app" | "crm" | "ecommerce" | "other";

export interface ProposalGoal {
  id: string;
  text: string;
  icon?: string;
}

export interface Deliverable {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  category?: string;
}

export interface Phase {
  id: string;
  title: string;
  description?: string;
  duration: string;
  tasks: string[];
}

export interface PricingPackage {
  id: string;
  name: string;
  price: string;
  priceNote?: string;
  description?: string;
  features: string[];
  highlighted: boolean;
  color?: string;
}

export interface PortfolioItem {
  id: string;
  title: string;
  description?: string;
  url?: string;
  image?: string;
  tags: string[];
}

export interface Advantage {
  id: string;
  title: string;
  description: string;
  icon?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  bio?: string;
}

export interface Testimonial {
  id: string;
  name: string;
  company?: string;
  role?: string;
  text: string;
  avatar?: string;
  rating?: number;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
}

export interface ProcessStep {
  id: string;
  step: number;
  title: string;
  description: string;
  icon?: string;
  duration?: string;
}

export interface StatItem {
  id: string;
  value: string;
  label: string;
  icon?: string;
}

export interface ProposalData {
  id: string;
  slug: string;
  isPublished: boolean;
  status: ProposalStatus;

  clientName: string;
  clientCompany?: string | null;
  clientEmail?: string | null;
  clientPhone?: string | null;

  primaryColor: string;
  secondaryColor: string;
  darkMode: boolean;
  agencyName: string;
  agencyLogo?: string | null;
  coverImage?: string | null;

  projectTitle: string;
  projectSubtitle?: string | null;
  projectType: ProjectType;
  projectSummary?: string | null;
  problemStatement?: string | null;
  ourSolution?: string | null;
  goals: ProposalGoal[];

  deliverables: Deliverable[];
  phases: Phase[];
  currency: string;
  packages: PricingPackage[];
  portfolioItems: PortfolioItem[];
  advantages: Advantage[];
  team: TeamMember[];
  testimonials: Testimonial[];
  faqs: FAQ[];
  process: ProcessStep[];
  stats: StatItem[];

  ctaTitle?: string | null;
  ctaText?: string | null;
  ctaButtonText?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  contactAddress?: string | null;

  validUntil?: string | null;
  terms?: string | null;
  notes?: string | null;
  seoTitle?: string | null;
  seoDesc?: string | null;

  sectionOrder: string[];
  views: number;
  viewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export const PROJECT_TYPE_LABEL: Record<ProjectType, string> = {
  website: "سایت",
  app: "اپلیکیشن",
  crm: "CRM",
  ecommerce: "فروشگاه آنلاین",
  other: "سایر",
};

export const STATUS_LABEL: Record<ProposalStatus, string> = {
  draft: "پیش‌نویس",
  sent: "ارسال‌شده",
  viewed: "مشاهده‌شده",
  accepted: "تأییدشده",
  rejected: "ردشده",
};

export const STATUS_COLOR: Record<ProposalStatus, string> = {
  draft: "text-white/40 bg-white/5 border-white/10",
  sent: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  viewed: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  accepted: "text-green-400 bg-green-500/10 border-green-500/20",
  rejected: "text-red-400 bg-red-500/10 border-red-500/20",
};
