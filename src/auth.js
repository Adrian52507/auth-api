import { pool } from "./db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const TOKEN_COOKIE = "token";

export async function register(req, res) {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: "Faltan campos" });

    const [exists] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (exists.length) return res.status(409).json({ error: "Correo ya registrado" });

    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
      [name, email, hash]
    );
    return res.status(201).json({ message: "Usuario registrado" });
  } catch (e) {
    return res.status(500).json({ error: "Error en registro" });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    if (!rows.length) return res.status(404).json({ error: "Usuario no encontrado" });
    const user = rows[0];

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: "Credenciales inválidas" });

    const token = jwt.sign({ id: user.id, name: user.name, email: user.email }, process.env.JWT_SECRET, { expiresIn: "7d" });

    // Cookie httpOnly para mayor seguridad
    res.cookie(TOKEN_COOKIE, token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.json({ message: "Login correcto" });
  } catch (e) {
    return res.status(500).json({ error: "Error en login" });
  }
}

export async function me(req, res) {
  try {
    const token = req.cookies?.token;
    if (!token) return res.status(401).json({ error: "No autenticado" });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    return res.json({ user: { id: payload.id, name: payload.name, email: payload.email } });
  } catch {
    return res.status(401).json({ error: "Token inválido" });
  }
}

export async function logout(req, res) {
  res.clearCookie("token", { httpOnly: true, secure: true, sameSite: "none" });
  return res.json({ message: "Sesión cerrada" });
}
