import swaggerJsdoc from "swagger-jsdoc";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const backendRoot = join(__dirname, "..");

const defaultPort = Number(process.env.PORT) || 3001;
const serverUrl =
  process.env.PUBLIC_API_URL || `http://localhost:${defaultPort}`;

/**
 * Métadonnées et schémas partagés. Les chemins d’API sont décrits par des blocs
 * `@openapi` dans `index.js` et `routes/*.js` (fusionnés par swagger-jsdoc).
 */
const swaggerDefinition = {
  openapi: "3.0.3",
  info: {
    title: "uTask API",
    version: "1.0.0",
    description:
      "API REST du serveur uTask (tableaux, listes, cartes, authentification par jeton Bearer).",
  },
  servers: [
    { url: serverUrl, description: "Instance (local ou PUBLIC_API_URL)" },
  ],
  tags: [
    { name: "Health" },
    { name: "Users" },
    { name: "Boards" },
    { name: "Lists" },
    { name: "Cards" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "hex",
        description:
          "Jeton retourné par POST /api/users/login (header Authorization: Bearer suivi du jeton).",
      },
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          errors: {
            type: "array",
            items: {
              type: "object",
              properties: {
                message: { type: "string" },
                field: { type: "string" },
              },
            },
          },
        },
      },
      LoginBody: {
        type: "object",
        required: ["username", "password"],
        properties: {
          username: { type: "string" },
          password: { type: "string" },
        },
      },
      RegisterBody: {
        type: "object",
        required: ["username", "password"],
        properties: {
          username: { type: "string" },
          password: { type: "string" },
        },
      },
      BoardCreate: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string", minLength: 3 },
          description: { type: "string" },
        },
      },
      BoardUpdate: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string", minLength: 3 },
          description: { type: "string" },
        },
      },
      ListCreate: {
        type: "object",
        required: ["name", "boardId", "order"],
        properties: {
          name: { type: "string" },
          boardId: { type: "string" },
          order: { type: "number" },
        },
      },
      ListUpdate: {
        type: "object",
        required: ["name", "order"],
        properties: {
          name: { type: "string" },
          order: { type: "number" },
        },
      },
      CardCreate: {
        type: "object",
        required: ["title", "description", "listId", "dueDate"],
        properties: {
          title: { type: "string", minLength: 3 },
          description: { type: "string" },
          listId: { type: "string" },
          dueDate: { type: "string", format: "date-time" },
          priority: { type: "number" },
        },
      },
      CardUpdate: {
        type: "object",
        required: ["title", "description", "listId", "dueDate"],
        properties: {
          title: { type: "string", minLength: 3 },
          description: { type: "string" },
          listId: { type: "string" },
          dueDate: { type: "string", format: "date-time" },
          priority: { type: "number" },
          isCompleted: { type: "boolean" },
        },
      },
    },
  },
};

/** Génère la spec OpenAPI à partir de la définition + annotations dans le code source. */
export function buildOpenApiSpec() {
  return swaggerJsdoc({
    definition: swaggerDefinition,
    apis: [join(backendRoot, "routes", "*.js"), join(backendRoot, "index.js")],
  });
}
