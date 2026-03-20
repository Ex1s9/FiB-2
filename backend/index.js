const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors({ origin: "http://localhost:5173" }));

const PORT = 3001;
const ACCESS_SECRET = "access_secret_2025";
const REFRESH_SECRET = "refresh_secret_2025";
const ACCESS_EXPIRES_IN = "15m";
const REFRESH_EXPIRES_IN = "7d";

// In-memory storage
// User: { id, email, first_name, last_name, passwordHash, role, blocked }
const users = [];
// Product: { id, title, category, description, price }
const products = [];
const refreshTokens = new Set();

let userIdCounter = 1;
let productIdCounter = 1;

// ─── Seed data (для тестирования) ────────────────────────────────────────────
// Пароль у всех: "password123"
// Хеш генерируется синхронно при старте
const bcryptSync = require("bcrypt");

users.push(
  { id: String(userIdCounter++), email: "admin@test.com",  first_name: "Админ",   last_name: "Тестов", passwordHash: bcryptSync.hashSync("password123", 10), role: "admin",  blocked: false },
  { id: String(userIdCounter++), email: "seller@test.com", first_name: "Продавец", last_name: "Тестов", passwordHash: bcryptSync.hashSync("password123", 10), role: "seller", blocked: false },
  { id: String(userIdCounter++), email: "user@test.com",   first_name: "Юзер",    last_name: "Тестов", passwordHash: bcryptSync.hashSync("password123", 10), role: "user",   blocked: false }
);

products.push(
  { id: String(productIdCounter++), title: "iPhone 15",      category: "Смартфоны",  description: "Флагман Apple 2023",        price: 89990 },
  { id: String(productIdCounter++), title: "MacBook Air M3", category: "Ноутбуки",   description: "Лёгкий ноутбук на чипе M3", price: 149990 },
  { id: String(productIdCounter++), title: "AirPods Pro 2",  category: "Аудио",      description: "Беспроводные наушники",      price: 24990 }
);

// ─── Helpers ────────────────────────────────────────────────────────────────

function generateAccessToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    ACCESS_SECRET,
    { expiresIn: ACCESS_EXPIRES_IN }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRES_IN }
  );
}

function safeUser(u) {
  return { id: u.id, email: u.email, first_name: u.first_name, last_name: u.last_name, role: u.role, blocked: u.blocked };
}

// Role hierarchy: user < seller < admin
const ROLE_LEVEL = { user: 1, seller: 2, admin: 3 };

function hasRole(userRole, requiredRole) {
  return (ROLE_LEVEL[userRole] || 0) >= (ROLE_LEVEL[requiredRole] || 0);
}

// ─── Middleware ──────────────────────────────────────────────────────────────

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }
  try {
    req.user = jwt.verify(token, ACCESS_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

// minRole("seller") — доступ seller и выше
function minRole(role) {
  return (req, res, next) => {
    if (!req.user || !hasRole(req.user.role, role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}

// exactRole("admin") — только конкретная роль
function exactRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}

// ─── Auth routes ─────────────────────────────────────────────────────────────

// POST /api/auth/register — практика 7
app.post("/api/auth/register", async (req, res) => {
  const { email, first_name, last_name, password } = req.body;
  if (!email || !first_name || !last_name || !password) {
    return res.status(400).json({ error: "email, first_name, last_name and password are required" });
  }
  if (users.find(u => u.email === email)) {
    return res.status(409).json({ error: "Email already registered" });
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = {
    id: String(userIdCounter++),
    email,
    first_name,
    last_name,
    passwordHash,
    role: "user",
    blocked: false,
  };
  users.push(user);
  res.status(201).json(safeUser(user));
});

// POST /api/auth/login — практика 7 + 8 (JWT) + 9 (refresh)
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }
  const user = users.find(u => u.email === email);
  if (!user) return res.status(401).json({ error: "Invalid credentials" });
  if (user.blocked) return res.status(403).json({ error: "Account is blocked" });

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) return res.status(401).json({ error: "Invalid credentials" });

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  refreshTokens.add(refreshToken);

  res.json({ accessToken, refreshToken });
});

// POST /api/auth/refresh — практика 9
app.post("/api/auth/refresh", (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: "refreshToken is required" });
  if (!refreshTokens.has(refreshToken)) return res.status(401).json({ error: "Invalid refresh token" });

  try {
    const payload = jwt.verify(refreshToken, REFRESH_SECRET);
    const user = users.find(u => u.id === payload.sub);
    if (!user) return res.status(401).json({ error: "User not found" });

    // Token rotation
    refreshTokens.delete(refreshToken);
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);
    refreshTokens.add(newRefreshToken);

    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch {
    res.status(401).json({ error: "Invalid or expired refresh token" });
  }
});

// GET /api/auth/me — практика 8
app.get("/api/auth/me", authMiddleware, (req, res) => {
  const user = users.find(u => u.id === req.user.sub);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(safeUser(user));
});

// ─── Users routes (admin only) — практика 11 ────────────────────────────────

app.get("/api/users", authMiddleware, exactRole("admin"), (req, res) => {
  res.json(users.map(safeUser));
});

app.get("/api/users/:id", authMiddleware, exactRole("admin"), (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(safeUser(user));
});

app.put("/api/users/:id", authMiddleware, exactRole("admin"), (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  const { first_name, last_name, role } = req.body;
  if (first_name) user.first_name = first_name;
  if (last_name) user.last_name = last_name;
  if (role && ROLE_LEVEL[role]) user.role = role;
  res.json(safeUser(user));
});

// DELETE /api/users/:id — блокировка (практика 11)
app.delete("/api/users/:id", authMiddleware, exactRole("admin"), (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  user.blocked = true;
  res.json({ message: "User blocked" });
});

// ─── Products routes — практика 7 + 8 (protected) + 11 (RBAC) ───────────────

// POST /api/products — seller+
app.post("/api/products", authMiddleware, minRole("seller"), (req, res) => {
  const { title, category, description, price } = req.body;
  if (!title || !category || !description || price === undefined) {
    return res.status(400).json({ error: "title, category, description and price are required" });
  }
  const product = {
    id: String(productIdCounter++),
    title,
    category,
    description,
    price: Number(price),
  };
  products.push(product);
  res.status(201).json(product);
});

// GET /api/products — user+
app.get("/api/products", authMiddleware, minRole("user"), (req, res) => {
  res.json(products);
});

// GET /api/products/:id — user+
app.get("/api/products/:id", authMiddleware, minRole("user"), (req, res) => {
  const product = products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json(product);
});

// PUT /api/products/:id — seller+
app.put("/api/products/:id", authMiddleware, minRole("seller"), (req, res) => {
  const product = products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: "Product not found" });
  const { title, category, description, price } = req.body;
  if (title) product.title = title;
  if (category) product.category = category;
  if (description) product.description = description;
  if (price !== undefined) product.price = Number(price);
  res.json(product);
});

// DELETE /api/products/:id — admin only
app.delete("/api/products/:id", authMiddleware, exactRole("admin"), (req, res) => {
  const idx = products.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Product not found" });
  products.splice(idx, 1);
  res.json({ message: "Product deleted" });
});

// ─── Start ───────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
