const express = require("express");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const PORT = 5555;

// Configuración de CORS para permitir el intercambio de cookies de sesión
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(bodyParser.json());

// Configuración de la sesión
app.use(
  session({
    secret: "miClaveSecreta",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

const users = [
  {
    username: "admin",
    password: bcrypt.hashSync("admin1234", 9),
  },
];

// Ruta de inicio de sesión
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  const user = users.find((user) => user.username === username);

  if (!user) {
    return res.status(401).json({ message: "Usuario no encontrado" });
  }

  const validPassword = bcrypt.compareSync(password, user.password);
  if (!validPassword) {
    return res.status(401).json({ message: "Contraseña incorrecta" });
  }

  req.session.user = { username: user.username };
  res.json({ message: "Inicio de sesión exitoso" });
});

app.post("/api/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ message: "Error al cerrar sesión" });
    res.json({ message: "Sesión cerrada" });
  });
});

app.get("/api/check-session", (req, res) => {
  if (req.session.user) {
    res.json({ loggedIn: true, user: req.session.user });
  } else {
    res.json({ loggedIn: false });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
