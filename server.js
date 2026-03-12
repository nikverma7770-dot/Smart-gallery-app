const path = require("path");
const fs = require("fs");
const express = require("express");
const session = require("express-session");
const SQLiteStore = require("connect-sqlite3")(session);
const bcrypt = require("bcryptjs");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

const app = express();
const PORT = process.env.PORT || 3000;
const dataDir = path.join(__dirname, "data");
const dbPath = path.join(dataDir, "gallery.db");

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const galleryData = [
  {
    id: 1,
    title: "Golden Hour Runway",
    category: "Fashion",
    location: "Barcelona",
    year: 2025,
    tags: ["editorial", "sunset", "movement"],
    image:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: 2,
    title: "Concrete Geometry",
    category: "Architecture",
    location: "Tokyo",
    year: 2024,
    tags: ["minimal", "lines", "urban"],
    image:
      "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: 3,
    title: "Neon Afterglow",
    category: "Street",
    location: "Seoul",
    year: 2025,
    tags: ["night", "neon", "rain"],
    image:
      "https://images.unsplash.com/photo-1519817914152-22f90e0b1520?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: 4,
    title: "Driftwood Coast",
    category: "Nature",
    location: "Oregon",
    year: 2023,
    tags: ["coastal", "fog", "calm"],
    image:
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: 5,
    title: "Studio Light Sweep",
    category: "Portrait",
    location: "London",
    year: 2024,
    tags: ["studio", "portrait", "soft"],
    image:
      "https://images.unsplash.com/photo-1500917293891-ef795e70e1f6?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: 6,
    title: "Signal Ridge",
    category: "Nature",
    location: "Alps",
    year: 2025,
    tags: ["mountain", "hike", "sky"],
    image:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: 7,
    title: "Baked Clay Story",
    category: "Food",
    location: "Marrakesh",
    year: 2023,
    tags: ["artisan", "texture", "warm"],
    image:
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: 8,
    title: "Morning Market Lines",
    category: "Street",
    location: "Bangkok",
    year: 2024,
    tags: ["crowd", "light", "grid"],
    image:
      "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: 9,
    title: "Product Stilllife",
    category: "Product",
    location: "New York",
    year: 2025,
    tags: ["studio", "branding", "clean"],
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: 10,
    title: "Terracotta Homes",
    category: "Architecture",
    location: "Lisbon",
    year: 2024,
    tags: ["color", "pattern", "tiles"],
    image:
      "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: 11,
    title: "Quiet Composition",
    category: "Portrait",
    location: "Copenhagen",
    year: 2023,
    tags: ["profile", "shadow", "minimal"],
    image:
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: 12,
    title: "Saffron Table",
    category: "Food",
    location: "Jaipur",
    year: 2025,
    tags: ["color", "spice", "ceramic"],
    image:
      "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?auto=format&fit=crop&w=1200&q=80"
  }
];

const start = async () => {
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL
    );
  `);

  const existingUser = await db.get("SELECT * FROM users LIMIT 1");
  if (!existingUser) {
    const passwordHash = await bcrypt.hash("gallery123", 10);
    await db.run(
      "INSERT INTO users (email, password_hash, display_name) VALUES (?, ?, ?)",
      "demo@smart.gallery",
      passwordHash,
      "Demo Curator"
    );
  }

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use(
    session({
      store: new SQLiteStore({
        db: "sessions.db",
        dir: dataDir
      }),
      secret: process.env.SESSION_SECRET || "smart-gallery-secret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: "lax"
      }
    })
  );

  app.use(express.static(__dirname));

  const requireAuth = (req, res, next) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    return next();
  };

  app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }
    const user = await db.get("SELECT * FROM users WHERE email = ?", email);
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    req.session.userId = user.id;
    req.session.displayName = user.display_name;
    return res.json({
      id: user.id,
      email: user.email,
      displayName: user.display_name
    });
  });

  app.post("/api/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ ok: true });
    });
  });

  app.get("/api/me", (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    return res.json({
      id: req.session.userId,
      displayName: req.session.displayName
    });
  });

  app.get("/api/gallery", requireAuth, (req, res) => {
    res.json(galleryData);
  });

  app.listen(PORT, () => {
    console.log(`Smart Gallery running at http://localhost:${PORT}`);
  });
};

start().catch((err) => {
  console.error("Failed to start server", err);
  process.exit(1);
});
