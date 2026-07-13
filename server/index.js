import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "node:http";
import authRoutes from "./src/routes/auth.routes.js";
import tokenRoutes from "./src/routes/token.routes.js";
import dataRoutes from "./src/routes/data.routes.js";
import userRoutes from "./src/routes/user.routes.js";
import roomRoutes from "./src/routes/room.routes.js";
import { DbConnection } from "./src/config/db.js";
import { attachSocket } from "./src/socket.js";

const app = express();

app.use(cors({ origin: process.env.FRONTEND_ORIGIN ?? true }));
app.use(express.json());


app.use(authRoutes);
app.use(tokenRoutes);
app.use(dataRoutes);
app.use(userRoutes);
app.use(roomRoutes);

// Socket.IO needs a real http.Server to upgrade the connection. app.listen()
// makes one internally but never hands it back, so we create it ourselves.
const server = createServer(app);
attachSocket(server);

const port = 8080;
server.listen(port, async () => {
  console.log(`Server started on ${port}`);
  await DbConnection();
});
