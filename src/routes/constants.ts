/*
 * One place for the paths, like `@app-structure/routes` in cure-plus-fe.
 * Internal portal and client portal are two separate path groups so a client
 * user can never land on a staff screen by typing a URL.
 */
export const PAGES_PATH_NAMES = {
  login: "/login",
  changePassword: "/change-password",
  // internal portal (staff)
  home: "/home",
  tickets: "/tickets",
  ticketDetails: "/tickets/:ticketId",
  escalation: "/escalation",
  notifications: "/notifications",
  clients: "/clients",
  // 23-11-2026 (script ETKT_13): guide, repeated problems, FAQ
  guide: "/guide",
  problems: "/problems",
  faq: "/faq",
  // setup (management only)
  setupClients: "/setup/clients",
  setupUsers: "/setup/users",
  setupTeams: "/setup/teams",
  setupSla: "/setup/sla",
  setupWorkflow: "/setup/workflow",
  setupGeneral: "/setup/general",
  setupUserRequests: "/setup/user-requests",
  // client portal
  clientHome: "/portal",
  clientNewTicket: "/portal/new",
  clientMyTickets: "/portal/tickets",
  clientTicketDetails: "/portal/tickets/:ticketId",
  clientUserRequests: "/portal/user-requests",
  clientFaq: "/portal/faq",
  // 23-11-2026 (script ETKT_14)
  clientDashboard: "/portal/dashboard",
  // 24-11-2026 (script ETKT_15): reports
  reports: "/reports",
  clientReports: "/portal/reports",
  // 24-11-2026 (v2.2.2) NEW: the client reads his notifications too
  clientNotifications: "/portal/notifications",
};

export const ticketPath = (ticketId: number | string, isClient?: boolean) =>
  isClient ? `/portal/tickets/${ticketId}` : `/tickets/${ticketId}`;
