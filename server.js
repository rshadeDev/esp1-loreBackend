const express = require("express");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const bodyParser = require("body-parser");
const { sequelize, User } = require("./database");

const app = express();
const PORT = 5555;

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(bodyParser.json());

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

app.post("/api/register", async (req, res) => {
    try {
        const { username, password } = req.body;

        const userExists = await User.findOne({ where: { username } });
        if (userExists) {
            return res.status(400).json({ message: "El nombre de usuario ya existe" });
        }

        const hashedPassword = await bcrypt.hash(password, 9);
        const newUser = await User.create({ username, password: hashedPassword });
        res.json({ message: "Usuario registrado exitosamente", user: newUser });
    } catch (error) {
        res.status(500).json({ message: "Error al registrar el usuario", error });
    }
});

app.post("/api/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ where: { username } });

        if (!user) {
            return res.status(401).json({ message: "Usuario no encontrado" });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ message: "Contraseña incorrecta" });
        }

        req.session.user = { username: user.username };
        res.json({ message: "Inicio de sesión exitoso" });
    } catch (error) {
        res.status(500).json({ message: "Error al iniciar sesión", error });
    }
});

app.post("/api/record", async (req, res) => {
    try {
        const { username, resultado } = req.body;
        const user = await User.findOne({ where: { username } });

        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        user.matches += 1;
        if (resultado === "victoria") {
            user.wins += 1;
        } else if (resultado === "derrota") {
            user.losses += 1;
        }

        await user.save();
        res.json({ message: "Registro actualizado", record: user });
    } catch (error) {
        res.status(500).json({ message: "Error al actualizar el registro", error });
    }
});

app.get("/api/records", async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: ["username", "matches", "wins", "losses"],
        });

        const records = users.map((user) => ({
            username: user.username,
            matches: user.matches,
            wins: user.wins,
            losses: user.losses,
            winrate: user.matches ? ((user.wins / user.matches) * 100).toFixed(2) : 0,
        }));

        res.json(records);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener los registros", error });
    }
});

app.delete("/api/users", async (req, res) => {
    try {
        const { username } = req.body;

        const user = await User.findOne({ where: { username } });
        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }

        await user.destroy();
        res.json({ message: `Usuario ${username} eliminado exitosamente` });
    } catch (error) {
        res.status(500).json({ message: "Error al eliminar el usuario", error });
    }
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

sequelize.sync().then(() => {
    app.listen(PORT, () => {
        console.log(`Servidor escuchando en http://localhost:${PORT}`);
    });
});
