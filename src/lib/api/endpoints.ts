/**
 * Centralized API endpoint constants.
 * Swap NEXT_PUBLIC_API_URL env var to point at a real backend.
 */

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

export const ENDPOINTS = {
  // Auth
  auth: {
    login: `${BASE}/api/auth/login`,
    logout: `${BASE}/api/auth/logout`,
    me: `${BASE}/api/auth/me`,
    refresh: `${BASE}/api/auth/refresh`,
  },

  // Leads
  leads: {
    list: `${BASE}/api/leads`,
    detail: (id: string) => `${BASE}/api/leads/${id}`,
    columns: `${BASE}/api/leads/columns`,
    move: (id: string) => `${BASE}/api/leads/${id}/move`,
    activities: (id: string) => `${BASE}/api/leads/${id}/activities`,
  },

  // Clients
  clients: {
    list: `${BASE}/api/clients`,
    detail: (id: string) => `${BASE}/api/clients/${id}`,
    timeline: (id: string) => `${BASE}/api/clients/${id}/timeline`,
    projects: (id: string) => `${BASE}/api/clients/${id}/projects`,
  },

  // Projects
  projects: {
    list: `${BASE}/api/projects`,
    detail: (id: string) => `${BASE}/api/projects/${id}`,
  },

  // Tasks
  tasks: {
    list: `${BASE}/api/tasks`,
    detail: (id: string) => `${BASE}/api/tasks/${id}`,
    byProject: (projectId: string) => `${BASE}/api/tasks?projectId=${projectId}`,
    comments: (id: string) => `${BASE}/api/tasks/${id}/comments`,
    attachments: (id: string) => `${BASE}/api/tasks/${id}/attachments`,
    startTimer: (id: string) => `${BASE}/api/tasks/${id}/timer/start`,
    stopTimer: (id: string) => `${BASE}/api/tasks/${id}/timer/stop`,
  },

  // Invoices
  invoices: {
    list: `${BASE}/api/invoices`,
    detail: (id: string) => `${BASE}/api/invoices/${id}`,
    markPaid: (id: string) => `${BASE}/api/invoices/${id}/mark-paid`,
    send: (id: string) => `${BASE}/api/invoices/${id}/send`,
    pdf: (id: string) => `${BASE}/api/invoices/${id}/pdf`,
  },

  // Time entries
  timeEntries: {
    list: `${BASE}/api/time-entries`,
    detail: (id: string) => `${BASE}/api/time-entries/${id}`,
    start: `${BASE}/api/time-entries/start`,
    stop: (id: string) => `${BASE}/api/time-entries/${id}/stop`,
    running: `${BASE}/api/time-entries/running`,
  },

  // Expenses
  expenses: {
    list: `${BASE}/api/expenses`,
    detail: (id: string) => `${BASE}/api/expenses/${id}`,
  },

  // Contracts
  contracts: {
    list: `${BASE}/api/contracts`,
    detail: (id: string) => `${BASE}/api/contracts/${id}`,
    send: (id: string) => `${BASE}/api/contracts/${id}/send`,
    byToken: (token: string) => `${BASE}/api/contracts/sign/${token}`,
    sign: (token: string) => `${BASE}/api/contracts/sign/${token}`,
    templates: `${BASE}/api/contract-templates`,
  },

  // Tickets
  tickets: {
    list: `${BASE}/api/tickets`,
    detail: (id: string) => `${BASE}/api/tickets/${id}`,
    comments: (id: string) => `${BASE}/api/tickets/${id}/comments`,
  },

  // Wiki
  wiki: {
    folders: `${BASE}/api/wiki/folders`,
    articles: `${BASE}/api/wiki/articles`,
    article: (id: string) => `${BASE}/api/wiki/articles/${id}`,
  },

  // Team
  team: {
    members: `${BASE}/api/team`,
    member: (id: string) => `${BASE}/api/team/${id}`,
    revenueShares: `${BASE}/api/team/revenue-shares`,
    wallet: (userId: string) => `${BASE}/api/team/${userId}/wallet`,
  },

  // Notifications
  notifications: {
    list: `${BASE}/api/notifications`,
    markRead: (id: string) => `${BASE}/api/notifications/${id}/read`,
    markAllRead: `${BASE}/api/notifications/read-all`,
  },

  // Activity log
  activity: {
    list: `${BASE}/api/activity`,
  },

  // Files
  files: {
    list: `${BASE}/api/files`,
    folders: `${BASE}/api/files/folders`,
    upload: `${BASE}/api/files/upload`,
    detail: (id: string) => `${BASE}/api/files/${id}`,
  },

  // Messages / Conversations
  messages: {
    conversations: `${BASE}/api/conversations`,
    conversation: (id: string) => `${BASE}/api/conversations/${id}`,
    messages: (conversationId: string) => `${BASE}/api/conversations/${conversationId}/messages`,
    send: (conversationId: string) => `${BASE}/api/conversations/${conversationId}/messages`,
  },

  // Reports
  reports: {
    revenue: `${BASE}/api/reports/revenue`,
    leads: `${BASE}/api/reports/leads`,
    team: `${BASE}/api/reports/team`,
    projects: `${BASE}/api/reports/projects`,
  },
} as const;
