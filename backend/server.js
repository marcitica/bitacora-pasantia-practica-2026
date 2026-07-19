const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const conectarDB = require("./config/db");

const app = express();

conectarDB();

const dominiosPermitidos = [
  "http://localhost:3000",
  "http://127.0.0.1:5500",
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || dominiosPermitidos.includes(origin)) {
        callback(null, true);
      } else {
        callback(
          new Error("Origen no autorizado por CORS")
        );
      }
    },
    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS"
    ],
    allowedHeaders: [
      "Content-Type",
      "Authorization"
    ]
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  "/api/auth",
  require("./routes/auth.routes")
);

app.use(
  "/api/empresas",
  require("./routes/empresa.routes")
);

app.use(
  "/api/especialidades",
  require("./routes/especialidad.routes")
);

app.use(
  "/api/supervisores",
  require("./routes/supervisor.routes")
);

app.use(
  "/api/estudiantes",
  require("./routes/estudiante.routes")
);

app.use(
  "/api/bitacoras",
  require("./routes/bitacora.routes")
);

app.get("/api", (req, res) => {
  res.json({
    mensaje:
      "API del Sistema de Bitácoras de Pasantía 2026 funcionando correctamente."
  });
});

app.get("/", (req, res) => {
  res.json({
    mensaje: "Backend funcionando correctamente."
  });
});

app.use((error, req, res, next) => {
  console.error(error);

  res.status(500).json({
    mensaje:
      error.message ||
      "Error interno del servidor."
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `Servidor funcionando en el puerto ${PORT}`
  );
});