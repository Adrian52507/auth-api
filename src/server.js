import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { register, login, me, logout } from "./auth.js";

dotenv.config();
const app = express();

app.use(cors({
  origin: process.env.ORIGIN_FRONTEND,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

app.post("/api/register", register);
app.post("/api/login", login);
app.get("/api/me", me);
app.post("/api/logout", logout);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API local en http://localhost:${PORT}`));
