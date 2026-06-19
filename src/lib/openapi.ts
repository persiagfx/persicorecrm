const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Persicore CRM API",
    version: "1.0.0",
    description:
      "REST API for Persicore CRM — a multi-tenant SaaS CRM platform. All protected endpoints require a Bearer JWT token obtained from `/api/auth/login`.",
    contact: { email: "support@persicore.ir" },
  },
  servers: [{ url: `${APP_URL}/api`, description: "Production" }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "JWT token obtained from POST /auth/login",
      },
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          error: { type: "string", description: "Human-readable error message" },
        },
      },
      Meta: {
        type: "object",
        properties: {
          total: { type: "integer" },
          page: { type: "integer" },
          perPage: { type: "integer" },
        },
      },
      User: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          email: { type: "string", format: "email" },
          role: { type: "string", enum: ["admin", "manager", "sales", "support", "viewer"] },
          avatar: { type: "string", nullable: true },
          color: { type: "string", nullable: true },
          tenantId: { type: "string", nullable: true },
          isActive: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      Client: {
        type: "object",
        properties: {
          id: { type: "string" },
          companyName: { type: "string" },
          contactName: { type: "string", nullable: true },
          contactEmail: { type: "string", format: "email", nullable: true },
          contactPhone: { type: "string", nullable: true },
          status: { type: "string", enum: ["active", "inactive", "prospect"] },
          tags: { type: "array", items: { type: "string" } },
          tenantId: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Lead: {
        type: "object",
        properties: {
          id: { type: "string" },
          companyName: { type: "string", nullable: true },
          contactName: { type: "string" },
          contactPhone: { type: "string", nullable: true },
          contactEmail: { type: "string", nullable: true },
          status: { type: "string", enum: ["new", "contacted", "qualified", "proposal", "negotiation", "won", "lost"] },
          source: { type: "string", nullable: true },
          value: { type: "number", nullable: true },
          assigneeId: { type: "string", nullable: true },
          tenantId: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Invoice: {
        type: "object",
        properties: {
          id: { type: "string" },
          number: { type: "string" },
          clientId: { type: "string" },
          status: { type: "string", enum: ["draft", "sent", "paid", "overdue", "cancelled"] },
          total: { type: "number" },
          dueDate: { type: "string", format: "date-time", nullable: true },
          tenantId: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      Project: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          clientId: { type: "string", nullable: true },
          status: { type: "string", enum: ["planning", "active", "on_hold", "completed", "cancelled"] },
          startDate: { type: "string", format: "date-time", nullable: true },
          endDate: { type: "string", format: "date-time", nullable: true },
          tenantId: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      Ticket: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          description: { type: "string", nullable: true },
          status: { type: "string", enum: ["open", "in_progress", "resolved", "closed"] },
          priority: { type: "string", enum: ["low", "medium", "high", "urgent"] },
          clientId: { type: "string", nullable: true },
          assigneeId: { type: "string", nullable: true },
          tenantId: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "admin@company.com" },
          password: { type: "string", format: "password", example: "securepassword" },
        },
      },
      LoginResponse: {
        type: "object",
        properties: {
          data: {
            type: "object",
            properties: {
              token: { type: "string" },
              user: { $ref: "#/components/schemas/User" },
            },
          },
        },
      },
      PaginatedClients: {
        type: "object",
        properties: {
          data: { type: "array", items: { $ref: "#/components/schemas/Client" } },
          meta: { $ref: "#/components/schemas/Meta" },
        },
      },
      PaginatedLeads: {
        type: "object",
        properties: {
          data: { type: "array", items: { $ref: "#/components/schemas/Lead" } },
          meta: { $ref: "#/components/schemas/Meta" },
        },
      },
    },
    responses: {
      Unauthorized: {
        description: "Missing or invalid JWT token",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
      },
      BadRequest: {
        description: "Validation error",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
      },
      NotFound: {
        description: "Resource not found",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
      },
      TooManyRequests: {
        description: "Rate limit exceeded",
        content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    // ── Auth ──────────────────────────────────────────────────────────────────
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login",
        security: [],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/LoginRequest" } } },
        },
        responses: {
          200: {
            description: "Login successful — sets `auth_token` HttpOnly cookie and returns JWT",
            content: { "application/json": { schema: { $ref: "#/components/schemas/LoginResponse" } } },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          429: { $ref: "#/components/responses/TooManyRequests" },
        },
      },
    },
    "/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register new user",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password"],
                properties: {
                  name: { type: "string" },
                  email: { type: "string", format: "email" },
                  password: { type: "string", minLength: 8 },
                  tenantName: { type: "string", description: "Creates a new workspace" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "User registered" },
          400: { $ref: "#/components/responses/BadRequest" },
        },
      },
    },
    "/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Get current user profile",
        responses: {
          200: { description: "Current user", content: { "application/json": { schema: { type: "object", properties: { data: { $ref: "#/components/schemas/User" } } } } } },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Logout — clears auth_token cookie and invalidates session",
        responses: { 200: { description: "Logged out" } },
      },
    },
    "/auth/forgot-password": {
      post: {
        tags: ["Auth"],
        summary: "Request password reset email",
        security: [],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", required: ["email"], properties: { email: { type: "string", format: "email" } } } } },
        },
        responses: {
          200: { description: "Reset email sent (always 200 to prevent enumeration)" },
          429: { $ref: "#/components/responses/TooManyRequests" },
        },
      },
    },
    "/auth/reset-password": {
      post: {
        tags: ["Auth"],
        summary: "Reset password using token from email",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["token", "password"],
                properties: { token: { type: "string" }, password: { type: "string", minLength: 8 } },
              },
            },
          },
        },
        responses: {
          200: { description: "Password reset successful" },
          400: { $ref: "#/components/responses/BadRequest" },
        },
      },
    },
    "/auth/2fa": {
      post: {
        tags: ["Auth"],
        summary: "Verify TOTP code (2FA)",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", required: ["code"], properties: { code: { type: "string", description: "6-digit TOTP code" } } } } },
        },
        responses: {
          200: { description: "2FA verified" },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },

    // ── Clients ──────────────────────────────────────────────────────────────
    "/clients": {
      get: {
        tags: ["Clients"],
        summary: "List clients",
        parameters: [
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "status", in: "query", schema: { type: "string", enum: ["active", "inactive", "prospect"] } },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "perPage", in: "query", schema: { type: "integer", default: 20, maximum: 100 } },
        ],
        responses: {
          200: { description: "Paginated client list", content: { "application/json": { schema: { $ref: "#/components/schemas/PaginatedClients" } } } },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
      post: {
        tags: ["Clients"],
        summary: "Create client",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["companyName"],
                properties: {
                  companyName: { type: "string" },
                  contactName: { type: "string" },
                  contactEmail: { type: "string", format: "email" },
                  contactPhone: { type: "string" },
                  status: { type: "string", enum: ["active", "inactive", "prospect"] },
                  tags: { type: "array", items: { type: "string" } },
                  address: { type: "string" },
                  notes: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Client created", content: { "application/json": { schema: { type: "object", properties: { data: { $ref: "#/components/schemas/Client" } } } } } },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/clients/{id}": {
      get: {
        tags: ["Clients"],
        summary: "Get client by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Client detail" },
          401: { $ref: "#/components/responses/Unauthorized" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
      put: {
        tags: ["Clients"],
        summary: "Update client",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/Client" } } } },
        responses: {
          200: { description: "Client updated" },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
      delete: {
        tags: ["Clients"],
        summary: "Delete client",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Client deleted" },
          401: { $ref: "#/components/responses/Unauthorized" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
    },

    // ── Leads ────────────────────────────────────────────────────────────────
    "/leads": {
      get: {
        tags: ["Leads"],
        summary: "List leads",
        parameters: [
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "status", in: "query", schema: { type: "string" } },
          { name: "assigneeId", in: "query", schema: { type: "string" } },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "perPage", in: "query", schema: { type: "integer", default: 50, maximum: 100 } },
        ],
        responses: {
          200: { description: "Paginated leads", content: { "application/json": { schema: { $ref: "#/components/schemas/PaginatedLeads" } } } },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
      post: {
        tags: ["Leads"],
        summary: "Create lead",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["contactName"],
                properties: {
                  contactName: { type: "string" },
                  companyName: { type: "string" },
                  contactEmail: { type: "string", format: "email" },
                  contactPhone: { type: "string" },
                  status: { type: "string", enum: ["new", "contacted", "qualified", "proposal", "negotiation", "won", "lost"] },
                  source: { type: "string" },
                  value: { type: "number" },
                  assigneeId: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Lead created" },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/leads/{id}": {
      get: {
        tags: ["Leads"],
        summary: "Get lead by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Lead detail" },
          401: { $ref: "#/components/responses/Unauthorized" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
      put: {
        tags: ["Leads"],
        summary: "Update lead",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/Lead" } } } },
        responses: {
          200: { description: "Lead updated" },
          401: { $ref: "#/components/responses/Unauthorized" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
      delete: {
        tags: ["Leads"],
        summary: "Delete lead",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Lead deleted" },
          401: { $ref: "#/components/responses/Unauthorized" },
          404: { $ref: "#/components/responses/NotFound" },
        },
      },
    },

    // ── Invoices ─────────────────────────────────────────────────────────────
    "/invoices": {
      get: {
        tags: ["Invoices"],
        summary: "List invoices",
        parameters: [
          { name: "status", in: "query", schema: { type: "string", enum: ["draft", "sent", "paid", "overdue", "cancelled"] } },
          { name: "clientId", in: "query", schema: { type: "string" } },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "perPage", in: "query", schema: { type: "integer", default: 20 } },
        ],
        responses: {
          200: { description: "Paginated invoice list" },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
      post: {
        tags: ["Invoices"],
        summary: "Create invoice",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["clientId"],
                properties: {
                  clientId: { type: "string" },
                  items: { type: "array", items: { type: "object", properties: { description: { type: "string" }, quantity: { type: "number" }, unitPrice: { type: "number" } } } },
                  dueDate: { type: "string", format: "date-time" },
                  notes: { type: "string" },
                  taxRate: { type: "number" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "Invoice created" },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/invoices/{id}": {
      get: { tags: ["Invoices"], summary: "Get invoice by ID", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Invoice detail" }, 401: { $ref: "#/components/responses/Unauthorized" }, 404: { $ref: "#/components/responses/NotFound" } } },
      put: { tags: ["Invoices"], summary: "Update invoice", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/Invoice" } } } }, responses: { 200: { description: "Invoice updated" }, 401: { $ref: "#/components/responses/Unauthorized" } } },
      delete: { tags: ["Invoices"], summary: "Delete invoice", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Invoice deleted" }, 401: { $ref: "#/components/responses/Unauthorized" } } },
    },

    // ── Projects ─────────────────────────────────────────────────────────────
    "/projects": {
      get: {
        tags: ["Projects"],
        summary: "List projects",
        parameters: [
          { name: "clientId", in: "query", schema: { type: "string" } },
          { name: "status", in: "query", schema: { type: "string" } },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
        ],
        responses: { 200: { description: "Paginated projects" }, 401: { $ref: "#/components/responses/Unauthorized" } },
      },
      post: {
        tags: ["Projects"],
        summary: "Create project",
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["name"], properties: { name: { type: "string" }, clientId: { type: "string" }, status: { type: "string" }, startDate: { type: "string", format: "date-time" }, endDate: { type: "string", format: "date-time" } } } } } },
        responses: { 201: { description: "Project created" }, 400: { $ref: "#/components/responses/BadRequest" }, 401: { $ref: "#/components/responses/Unauthorized" } },
      },
    },
    "/projects/{id}": {
      get: { tags: ["Projects"], summary: "Get project by ID", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Project detail" }, 401: { $ref: "#/components/responses/Unauthorized" }, 404: { $ref: "#/components/responses/NotFound" } } },
      put: { tags: ["Projects"], summary: "Update project", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/Project" } } } }, responses: { 200: { description: "Project updated" }, 401: { $ref: "#/components/responses/Unauthorized" } } },
      delete: { tags: ["Projects"], summary: "Delete project", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Project deleted" }, 401: { $ref: "#/components/responses/Unauthorized" } } },
    },

    // ── Tickets ──────────────────────────────────────────────────────────────
    "/tickets": {
      get: {
        tags: ["Tickets"],
        summary: "List support tickets",
        parameters: [
          { name: "status", in: "query", schema: { type: "string", enum: ["open", "in_progress", "resolved", "closed"] } },
          { name: "priority", in: "query", schema: { type: "string", enum: ["low", "medium", "high", "urgent"] } },
          { name: "assigneeId", in: "query", schema: { type: "string" } },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
        ],
        responses: { 200: { description: "Paginated tickets" }, 401: { $ref: "#/components/responses/Unauthorized" } },
      },
      post: {
        tags: ["Tickets"],
        summary: "Create ticket",
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["title"], properties: { title: { type: "string" }, description: { type: "string" }, priority: { type: "string", enum: ["low", "medium", "high", "urgent"] }, clientId: { type: "string" }, assigneeId: { type: "string" } } } } } },
        responses: { 201: { description: "Ticket created" }, 400: { $ref: "#/components/responses/BadRequest" }, 401: { $ref: "#/components/responses/Unauthorized" } },
      },
    },
    "/tickets/{id}": {
      get: { tags: ["Tickets"], summary: "Get ticket by ID", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Ticket detail" }, 401: { $ref: "#/components/responses/Unauthorized" }, 404: { $ref: "#/components/responses/NotFound" } } },
      put: { tags: ["Tickets"], summary: "Update ticket", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/Ticket" } } } }, responses: { 200: { description: "Ticket updated" }, 401: { $ref: "#/components/responses/Unauthorized" } } },
      delete: { tags: ["Tickets"], summary: "Delete ticket", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Ticket deleted" }, 401: { $ref: "#/components/responses/Unauthorized" } } },
    },

    // ── Users ────────────────────────────────────────────────────────────────
    "/users": {
      get: {
        tags: ["Users"],
        summary: "List workspace users (admin only)",
        parameters: [{ name: "page", in: "query", schema: { type: "integer", default: 1 } }, { name: "perPage", in: "query", schema: { type: "integer", default: 20 } }],
        responses: { 200: { description: "User list" }, 401: { $ref: "#/components/responses/Unauthorized" } },
      },
      post: {
        tags: ["Users"],
        summary: "Invite / create user (admin only)",
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["name", "email", "password", "role"], properties: { name: { type: "string" }, email: { type: "string", format: "email" }, password: { type: "string", minLength: 8 }, role: { type: "string", enum: ["admin", "manager", "sales", "support", "viewer"] } } } } } },
        responses: { 201: { description: "User created" }, 400: { $ref: "#/components/responses/BadRequest" }, 401: { $ref: "#/components/responses/Unauthorized" } },
      },
    },
    "/users/{id}": {
      get: { tags: ["Users"], summary: "Get user by ID", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "User detail" }, 401: { $ref: "#/components/responses/Unauthorized" } } },
      put: { tags: ["Users"], summary: "Update user", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } } }, responses: { 200: { description: "User updated" }, 401: { $ref: "#/components/responses/Unauthorized" } } },
      delete: { tags: ["Users"], summary: "Delete user", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "User deleted" }, 401: { $ref: "#/components/responses/Unauthorized" } } },
    },

    // ── Dashboard ────────────────────────────────────────────────────────────
    "/dashboard": {
      get: {
        tags: ["Dashboard"],
        summary: "Get dashboard analytics summary",
        responses: {
          200: {
            description: "KPIs, recent activity, chart data",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "object",
                      properties: {
                        stats: { type: "object" },
                        recentClients: { type: "array", items: { $ref: "#/components/schemas/Client" } },
                        recentLeads: { type: "array", items: { $ref: "#/components/schemas/Lead" } },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },

    // ── Reports ──────────────────────────────────────────────────────────────
    "/reports": {
      get: {
        tags: ["Reports"],
        summary: "Generate report",
        parameters: [
          { name: "type", in: "query", required: true, schema: { type: "string", enum: ["sales", "clients", "invoices", "leads", "projects"] } },
          { name: "from", in: "query", schema: { type: "string", format: "date" } },
          { name: "to", in: "query", schema: { type: "string", format: "date" } },
        ],
        responses: { 200: { description: "Report data" }, 400: { $ref: "#/components/responses/BadRequest" }, 401: { $ref: "#/components/responses/Unauthorized" } },
      },
    },

    // ── Notifications ────────────────────────────────────────────────────────
    "/notifications": {
      get: {
        tags: ["Notifications"],
        summary: "List notifications for current user",
        parameters: [{ name: "unreadOnly", in: "query", schema: { type: "boolean" } }],
        responses: { 200: { description: "Notification list" }, 401: { $ref: "#/components/responses/Unauthorized" } },
      },
    },
    "/notifications/{id}/read": {
      put: {
        tags: ["Notifications"],
        summary: "Mark notification as read",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Marked as read" }, 401: { $ref: "#/components/responses/Unauthorized" } },
      },
    },

    // ── Webhooks ─────────────────────────────────────────────────────────────
    "/webhooks": {
      get: {
        tags: ["Webhooks"],
        summary: "List webhook endpoints",
        responses: { 200: { description: "Webhook list" }, 401: { $ref: "#/components/responses/Unauthorized" } },
      },
      post: {
        tags: ["Webhooks"],
        summary: "Create webhook endpoint",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["url", "events"],
                properties: {
                  url: { type: "string", format: "uri" },
                  events: { type: "array", items: { type: "string" }, description: "e.g. ['client.created', 'lead.updated']" },
                  secret: { type: "string", description: "HMAC signing secret" },
                },
              },
            },
          },
        },
        responses: { 201: { description: "Webhook created" }, 400: { $ref: "#/components/responses/BadRequest" }, 401: { $ref: "#/components/responses/Unauthorized" } },
      },
    },
    "/webhooks/{id}": {
      delete: { tags: ["Webhooks"], summary: "Delete webhook", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Webhook deleted" }, 401: { $ref: "#/components/responses/Unauthorized" } } },
    },

    // ── Settings ─────────────────────────────────────────────────────────────
    "/settings": {
      get: { tags: ["Settings"], summary: "Get company settings", responses: { 200: { description: "Settings object" }, 401: { $ref: "#/components/responses/Unauthorized" } } },
      put: {
        tags: ["Settings"],
        summary: "Update company settings",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  companyName: { type: "string" },
                  timezone: { type: "string", example: "Asia/Tehran" },
                  currency: { type: "string", example: "IRR" },
                  primaryColor: { type: "string", example: "#6366f1" },
                },
              },
            },
          },
        },
        responses: { 200: { description: "Settings updated" }, 401: { $ref: "#/components/responses/Unauthorized" } },
      },
    },

    // ── Stream (SSE) ─────────────────────────────────────────────────────────
    "/stream": {
      get: {
        tags: ["Realtime"],
        summary: "Server-Sent Events stream for real-time notifications",
        description: "Returns an SSE stream. Connect with `EventSource`. Events include: `notification`, `ping`.",
        responses: {
          200: {
            description: "SSE stream",
            content: { "text/event-stream": { schema: { type: "string" } } },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },

    // ── Export ───────────────────────────────────────────────────────────────
    "/export": {
      get: {
        tags: ["Export"],
        summary: "Export data as CSV/XLSX",
        parameters: [
          { name: "type", in: "query", required: true, schema: { type: "string", enum: ["clients", "leads", "invoices", "projects"] } },
          { name: "format", in: "query", schema: { type: "string", enum: ["csv", "xlsx"], default: "csv" } },
        ],
        responses: {
          200: { description: "File download", content: { "text/csv": {}, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {} } },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
  },
  tags: [
    { name: "Auth", description: "Authentication and session management" },
    { name: "Clients", description: "Client (customer) management" },
    { name: "Leads", description: "Sales lead pipeline" },
    { name: "Invoices", description: "Invoice creation and billing" },
    { name: "Projects", description: "Project tracking" },
    { name: "Tickets", description: "Support ticket system" },
    { name: "Users", description: "User and team management" },
    { name: "Dashboard", description: "Analytics and KPI summary" },
    { name: "Reports", description: "Business reports" },
    { name: "Notifications", description: "In-app notifications" },
    { name: "Webhooks", description: "Outbound webhook endpoints" },
    { name: "Settings", description: "Workspace configuration" },
    { name: "Realtime", description: "SSE real-time events" },
    { name: "Export", description: "Data export" },
  ],
};
