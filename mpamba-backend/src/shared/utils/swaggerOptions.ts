import swaggerJSDoc from "swagger-jsdoc";

const swaggerOptions: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Mpamba - Business Management API",
      version: "1.0.0",
      description: "Mpamba é uma plataforma SaaS modular de gestão empresarial que integra tesouraria, faturação e stock. A API permite operação independente ou integrada dos módulos, oferecendo escalabilidade e flexibilidade para diferentes tipos de negócio.",
      contact: {
        name: "Mpamba Team",
        email: "api@mpamba.com"
      }
    },
    servers: [
      {
        url: "http://localhost:4000",
        description: "🟡 Servidor de Desenvolvimento Local",
      },
      {
        url: "https://api.mpamba.com",
        description: "🟢 Servidor de Produção"
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT Access Token (válido por 15 minutos)"
        },
        refreshToken: {
          type: "apiKey",
          in: "header",
          name: "X-Refresh-Token",
          description: "Refresh Token (válido por 30 minutos)"
        }
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            status: {
              type: "string",
              enum: ["error"]
            },
            message: {
              type: "string"
            },
            code: {
              type: "string"
            }
          }
        },
        Success: {
          type: "object",
          properties: {
            status: {
              type: "string",
              enum: ["success"]
            },
            data: {
              type: "object"
            },
            message: {
              type: "string"
            }
          }
        },
        User: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid"
            },
            name: {
              type: "string"
            },
            email: {
              type: "string",
              format: "email"
            },
            role: {
              type: "string"
            },
            permissions: {
              type: "array",
              items: {
                type: "string"
              }
            },
            isActive: {
              type: "boolean"
            },
            createdAt: {
              type: "string",
              format: "date-time"
            }
          }
        },
        LoginResponse: {
          type: "object",
          properties: {
            accessToken: {
              type: "string"
            },
            refreshToken: {
              type: "string"
            },
            user: {
              $ref: "#/components/schemas/User"
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ],
    tags: [
      {
        name: "Auth",
        description: "🔐 Autenticação e Autorização - Endpoints de login, registro e gerenciamento de tokens"
      },
      {
        name: "Billing",
        description: "🧾 Faturação e Cobrança - Gestão de faturas, séries e emissão de documentos fiscais"
      },
      {
        name: "Stock",
        description: "📦 Gestão de Stock - Resumos e insights do inventário"
      },
      {
        name: "Stock Products",
        description: "📦 Gestão de Produtos - Cadastro e listagem de itens do inventário"
      },
      {
        name: "Stock Categories",
        description: "📂 Categorias de Stock - Organização lógica de produtos"
      },
      {
        name: "Stock Suppliers",
        description: "🚚 Fornecedores de Stock - Gestão de entidades parceiras"
      },
      {
        name: "Stock Movements",
        description: "🔄 Movimentações de Stock - Entradas, saídas e ajustes de inventário"
      }
    ]
  },
  apis: [
    "./src/routes/**/*.ts",
    "./src/routes/**/*.js"
  ]
};

export default swaggerOptions;