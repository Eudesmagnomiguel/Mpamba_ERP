import type { Express } from "express";
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import swaggerOptions from "../shared/utils/swaggerOptions.js";

// Gera a especificação do Swagger ANTES de usá-la
const swaggerSpec = swaggerJSDoc(swaggerOptions);

export const swaggerDocs = (app: Express): void => {
  // Servir arquivos estáticos do Swagger UI
  app.use("/api-docs", swaggerUi.serve);
  
  // Rota para a página HTML do Swagger UI
  app.get("/api-docs", swaggerUi.setup(swaggerSpec, {
    explorer: true,
    swaggerOptions: {
      persistAuthorization: true,
      displayOperationId: false,
      filter: true,
      showRequestHeaders: true,
      layout: "BaseLayout",
      defaultModelsExpandDepth: 1,
      defaultModelExpandDepth: 1,
      docExpansion: "list"
    },
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .logo { display: none }
      .swagger-ui .info .title { color: #584BBD; font-weight: bold; font-size: 2em; }
      .swagger-ui .info .description { font-size: 1.1em; }
      .swagger-ui .btn { background-color: #584BBD; border-color: #584BBD; color: #fff; }
      .swagger-ui .btn:hover { background-color: #472694; border-color: #472694; }
      .swagger-ui .method.get { color: #61affe; }
      .swagger-ui .method.post { color: #49cc90; }
      .swagger-ui .method.put { color: #fca130; }
      .swagger-ui .method.patch { color: #50e3c2; }
      .swagger-ui .method.delete { color: #f93e3e; }
      .swagger-ui .opblock-tag { background: #fafafa; border: 1px solid #eee; }
      .swagger-ui .opblock-tag-section { border-bottom: 2px solid #ddd; }
      .swagger-ui .scheme-container { background: #fafafa; }
      .swagger-ui .model-container { border: 1px solid #e0e0e0; }
    `,
    customSiteTitle: "Mpamba API Documentation",
    swaggerUrl: "/api-docs"
  }));
};
