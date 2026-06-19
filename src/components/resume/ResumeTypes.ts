// ─── انواع داده رزومه ─────────────────────────────────────────────────

export interface ExperienceItem {
  id: string;
  company: string; companyFa?: string;
  role: string; roleFa?: string;
  startDate: string; endDate?: string; current?: boolean;
  location?: string; remote?: boolean;
  description?: string; descriptionFa?: string;
  achievements?: string[]; achievementsFa?: string[];
  tags?: string[];
  companyLogo?: string;
  companyUrl?: string;
}

export interface EducationItem {
  id: string;
  institution: string; institutionFa?: string;
  degree: string; degreeFa?: string;
  field?: string; fieldFa?: string;
  startDate: string; endDate?: string; current?: boolean;
  gpa?: string;
  description?: string; descriptionFa?: string;
  achievements?: string[];
  logo?: string;
}

export interface SkillGroup {
  id: string;
  category: string; categoryFa?: string;
  items: SkillItem[];
}

export interface SkillItem {
  id: string;
  name: string; nameFa?: string;
  level?: number; // 0-100
  type?: "technical" | "soft" | "tool" | "language";
}

export interface ProjectItem {
  id: string;
  name: string; nameFa?: string;
  description?: string; descriptionFa?: string;
  url?: string; github?: string;
  image?: string;
  tags?: string[];
  featured?: boolean;
  startDate?: string; endDate?: string;
}

export interface CertificationItem {
  id: string;
  name: string; nameFa?: string;
  issuer: string; issuerFa?: string;
  date?: string;
  expiryDate?: string;
  credentialId?: string;
  url?: string;
  logo?: string;
}

export interface AwardItem {
  id: string;
  title: string; titleFa?: string;
  issuer?: string; issuerFa?: string;
  date?: string;
  description?: string; descriptionFa?: string;
}

export interface PublicationItem {
  id: string;
  title: string; titleFa?: string;
  publisher?: string;
  date?: string;
  url?: string;
  description?: string;
  type?: "article" | "book" | "paper" | "other";
}

export interface LanguageItem {
  id: string;
  name: string; nameFa?: string;
  level: "native" | "fluent" | "advanced" | "intermediate" | "basic";
  levelFa?: string;
  certificate?: string;
}

export interface VolunteerItem {
  id: string;
  organization: string; organizationFa?: string;
  role: string; roleFa?: string;
  startDate?: string; endDate?: string;
  description?: string; descriptionFa?: string;
}

export interface ReferenceItem {
  id: string;
  name: string;
  position?: string;
  company?: string;
  email?: string;
  phone?: string;
  relation?: string;
}

export interface CustomSection {
  id: string;
  title: string; titleFa?: string;
  type: "text" | "list" | "items";
  content?: string; contentFa?: string;
  items?: { id: string; title: string; titleFa?: string; description?: string; descriptionFa?: string; date?: string }[];
}

export interface ResumeData {
  id: string; slug: string;
  isPublished: boolean;
  theme: string; accentColor: string; lang: string;
  fullName: string; fullNameFa?: string | null;
  title: string; titleFa?: string | null;
  bio?: string | null; bioFa?: string | null;
  avatar?: string | null; coverImage?: string | null;
  location?: string | null; locationFa?: string | null;
  email?: string | null; phone?: string | null; website?: string | null;
  linkedin?: string | null; github?: string | null; twitter?: string | null;
  instagram?: string | null; behance?: string | null; dribbble?: string | null;
  telegram?: string | null; youtube?: string | null;
  experience: ExperienceItem[];
  education: EducationItem[];
  skills: SkillGroup[];
  projects: ProjectItem[];
  certifications: CertificationItem[];
  awards: AwardItem[];
  publications: PublicationItem[];
  languages: LanguageItem[];
  volunteering: VolunteerItem[];
  references: ReferenceItem[];
  customSections: CustomSection[];
  sectionOrder: string[];
  seoTitle?: string | null; seoDesc?: string | null; ogImage?: string | null;
  views: number;
  createdAt: string; updatedAt: string;
}
