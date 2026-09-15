import "dotenv/config";
import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import swaggerUi from "swagger-ui-express";
import { initChat } from "./chat.js";
import userRoutes from "./routes/users.js";
import { authorize, verifyAccessToken } from "./middleware/authentication.js";
import cors from "cors";
import boardRoutes from "./routes/boards.js";
import listRoutes from "./routes/lists.js";
import cardRoutes from "./routes/cards.js";
import { connectDB } from "./config/connection.js";
import { buildOpenApiSpec } from "./config/openapi.js";

const openApiSpec = buildOpenApiSpec();

const PORT = Number(process.env.PORT) || 3001;

const app = express();
app.use(express.json());

// Connect to MongoDB
await connectDB();

app.use(
  cors({
    origin: process.env.CORS_ORIGINS || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

/**
 * @openapi
 * /:
 *   get:
 *     tags:
 *       - Health
 *     summary: Message de bienvenue
 *     responses:
 *       200:
 *         description: Texte brut
 */
app.get("/", (_req, res) => {
  res.type("text/plain; charset=utf-8").send("Hello World");
});

/**
 * @openapi
 * /health:
 *   get:
 *     tags:
 *       - Health
 *     summary: Santé du serveur
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 */
app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/openapi.json", (_req, res) => {
  res.json(openApiSpec);
});

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(openApiSpec, { customSiteTitle: "uTask API — Swagger" }),
);

app.use("/api/users", userRoutes);
app.use("/api/boards", authorize, boardRoutes);
app.use("/api/lists", authorize, listRoutes);
app.use("/api/cards", authorize, cardRoutes);

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGINS || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  const auth = verifyAccessToken(token);
  if (!auth) {
    return next(new Error("Unauthorized"));
  }
  socket.data.userId = auth.userId;
  next();
});

io.on("connection", (socket) => {
  initChat(socket).catch(() => socket.disconnect(true));
});

httpServer.listen(PORT, () => {
  console.log(`Express + Socket.IO sur http://localhost:${PORT}`);
});
