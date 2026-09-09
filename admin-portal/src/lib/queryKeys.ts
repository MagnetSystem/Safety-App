export const queryKeys = {
  orgDashboard: ["org-dashboard"] as const,
  superAdminDashboard: ["super-admin-dashboard"] as const,

  reports: {
    all: ["reports"] as const,
    list: (params: { status?: string; page?: number; pageSize?: number } = {}) =>
      ["reports", "list", params.status ?? "all", params.page ?? 1, params.pageSize ?? 20] as const,
    detail: (id: string) => ["reports", "detail", id] as const,
    evidence: (id: string) => ["reports", "evidence", id] as const,
    messages: (id: string) => ["reports", "messages", id] as const,
  },

  members: {
    all: ["members"] as const,
    list: (params: { search?: string; page?: number; pageSize?: number } = {}) =>
      ["members", "list", params.search ?? "", params.page ?? 1, params.pageSize ?? 20] as const,
  },

  notifications: {
    all: ["notifications"] as const,
    list: (pageSize = 20, page = 1) => ["notifications", "list", pageSize, page] as const,
    unread: ["notifications", "unread"] as const,
  },

  departments: {
    all: ["departments"] as const,
  },

  staff: {
    all: ["staff"] as const,
    list: (params: { pageSize?: number; page?: number; organizationId?: string } = {}) =>
      ["staff", "list", params] as const,
  },

  organizations: {
    all: ["organizations"] as const,
    list: (params: { search?: string; pageSize?: number } = {}) =>
      ["organizations", "list", params.search ?? "", params.pageSize ?? 100] as const,
    detail: (id: string) => ["organizations", "detail", id] as const,
    me: ["organizations", "me"] as const,
    joinCode: ["organizations", "join-code"] as const,
  },

  organizationTypes: {
    all: ["organization-types"] as const,
  },

  industryCatalog: ["industry-catalog"] as const,

  auditLogs: {
    all: ["audit-logs"] as const,
    list: (page: number, collegeId?: string) => ["audit-logs", "list", page, collegeId ?? ""] as const,
  },

  search: (q: string) => ["search", q] as const,
};
