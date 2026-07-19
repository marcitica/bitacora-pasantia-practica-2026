const Bitacora = require("../models/Bitacora");

function calcularTotalHoras(horaEntrada, horaSalida) {
  const [horaInicio, minutoInicio] = horaEntrada.split(":").map(Number);
  const [horaFin, minutoFin] = horaSalida.split(":").map(Number);

  const inicioEnMinutos = horaInicio * 60 + minutoInicio;
  const finEnMinutos = horaFin * 60 + minutoFin;

  const diferencia = finEnMinutos - inicioEnMinutos;

  if (diferencia <= 0) {
    throw new Error(
      "La hora de salida debe ser posterior a la hora de entrada."
    );
  }

  return Number((diferencia / 60).toFixed(2));
}

async function crearRegistro(req, res) {
  try {
    const {
      fecha,
      tarea,
      horaEntrada,
      horaSalida,
      firmaSupervisor
    } = req.body;

    const totalHoras = calcularTotalHoras(
      horaEntrada,
      horaSalida
    );

    const registro = await Bitacora.create({
      estudianteId: req.usuario.id,
      fecha,
      tarea,
      horaEntrada,
      horaSalida,
      totalHoras,
      firmaSupervisor
    });

    res.status(201).json(registro);
  } catch (error) {
    res.status(400).json({
      mensaje: "No se pudo guardar la bitácora.",
      error: error.message
    });
  }
}

async function listarMisRegistros(req, res) {
  try {
    const registros = await Bitacora.find({
      estudianteId: req.usuario.id
    }).sort({
      fecha: -1
    });

    res.json(registros);
  } catch (error) {
    res.status(500).json({
      mensaje: "Error al consultar la bitácora.",
      error: error.message
    });
  }
}

async function actualizarMiRegistro(req, res) {
  try {
    const registro = await Bitacora.findOne({
      _id: req.params.id,
      estudianteId: req.usuario.id
    });

    if (!registro) {
      return res.status(404).json({
        mensaje: "Registro no encontrado."
      });
    }

    if (registro.estado !== "Pendiente") {
      return res.status(403).json({
        mensaje: "Solo puede modificar registros pendientes."
      });
    }

    const {
      fecha,
      tarea,
      horaEntrada,
      horaSalida,
      firmaSupervisor
    } = req.body;

    registro.fecha = fecha;
    registro.tarea = tarea;
    registro.horaEntrada = horaEntrada;
    registro.horaSalida = horaSalida;
    registro.totalHoras = calcularTotalHoras(
      horaEntrada,
      horaSalida
    );
    registro.firmaSupervisor = firmaSupervisor;

    await registro.save();

    res.json(registro);
  } catch (error) {
    res.status(400).json({
      mensaje: "No se pudo actualizar el registro.",
      error: error.message
    });
  }
}

async function listarTodasLasBitacoras(req, res) {
  try {
    const filtro = {};

    if (req.query.estado) {
      filtro.estado = req.query.estado;
    }

    if (req.query.estudianteId) {
      filtro.estudianteId = req.query.estudianteId;
    }

    const registros = await Bitacora.find(filtro)
      .populate({
        path: "estudianteId",
        select: "cedula nombreCompleto",
        populate: [
          {
            path: "especialidadId",
            select: "nombre"
          },
          {
            path: "empresaId",
            select: "nombreEmpresa"
          },
          {
            path: "supervisorId",
            select: "nombreCompleto"
          }
        ]
      })
      .sort({
        fecha: -1
      });

    res.json(registros);
  } catch (error) {
    res.status(500).json({
      mensaje: "Error al consultar las bitácoras.",
      error: error.message
    });
  }
}

async function revisarRegistro(req, res) {
  try {
    const {
      estado,
      observacionesDocente
    } = req.body;

    const estadosPermitidos = [
      "Revisada",
      "Aprobada",
      "Rechazada"
    ];

    if (!estadosPermitidos.includes(estado)) {
      return res.status(400).json({
        mensaje: "Estado de revisión no permitido."
      });
    }

    const registro = await Bitacora.findByIdAndUpdate(
      req.params.id,
      {
        estado,
        observacionesDocente,
        fechaRevision: new Date(),
        revisadoPor: req.usuario.id
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!registro) {
      return res.status(404).json({
        mensaje: "Registro no encontrado."
      });
    }

    res.json(registro);
  } catch (error) {
    res.status(400).json({
      mensaje: "No se pudo revisar la bitácora.",
      error: error.message
    });
  }
}

async function eliminarMiRegistro(req, res) {
  try {
    const registro = await Bitacora.findOne({
      _id: req.params.id,
      estudianteId: req.usuario.id
    });

    if (!registro) {
      return res.status(404).json({
        mensaje: "Registro no encontrado."
      });
    }

    if (registro.estado !== "Pendiente") {
      return res.status(403).json({
        mensaje: "Solo puede eliminar registros pendientes."
      });
    }

    await registro.deleteOne();

    res.json({
      mensaje: "Registro eliminado correctamente."
    });
  } catch (error) {
    res.status(500).json({
      mensaje: "No se pudo eliminar el registro.",
      error: error.message
    });
  }
}

module.exports = {
  crearRegistro,
  listarMisRegistros,
  actualizarMiRegistro,
  listarTodasLasBitacoras,
  revisarRegistro,
  eliminarMiRegistro
};