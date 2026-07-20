protegerPagina("estudiante");

const formBitacora =
  document.getElementById("formBitacora");

let registrosActuales = [];

async function cargarRegistros() {
  try {
    registrosActuales = await solicitud(
      "/bitacoras/mis-registros"
    );

    const tabla =
      document.getElementById("tablaBitacoras");

    tabla.innerHTML = "";

    let totalAcumulado = 0;

    registrosActuales.forEach(registro => {
      totalAcumulado += registro.totalHoras;

      const fila = document.createElement("tr");

      fila.innerHTML = `
        <td>
          ${new Date(
            registro.fecha
          ).toLocaleDateString("es-CR")}
        </td>

        <td>${registro.tarea}</td>

        <td>${registro.horaEntrada}</td>

        <td>${registro.horaSalida}</td>

        <td>${registro.totalHoras}</td>

        <td>${registro.estado}</td>

        <td>
          ${registro.observacionesDocente || ""}
        </td>

        <td>
          ${
            registro.estado === "Pendiente"
              ? `
                <button
                  onclick="editarRegistro('${registro._id}')"
                >
                  Editar
                </button>

                <button
                  class="boton-peligro"
                  onclick="eliminarRegistro('${registro._id}')"
                >
                  Eliminar
                </button>
              `
              : "Sin acciones"
          }
        </td>
      `;

      tabla.appendChild(fila);
    });

    document.getElementById(
      "totalHoras"
    ).textContent = totalAcumulado.toFixed(2);
  } catch (error) {
    alert(error.message);
  }
}

formBitacora.addEventListener(
  "submit",
  async event => {
    event.preventDefault();

    const id =
      document.getElementById("registroId").value;

    const datos = {
      fecha:
        document.getElementById("fecha").value,

      tarea:
        document.getElementById("tarea").value,

      horaEntrada:
        document.getElementById(
          "horaEntrada"
        ).value,

      horaSalida:
        document.getElementById(
          "horaSalida"
        ).value,

      firmaSupervisor:
        document.getElementById(
          "firmaSupervisor"
        ).value
    };

    try {
      if (id) {
        await solicitud(
          `/bitacoras/${id}`,
          {
            method: "PUT",

            body: JSON.stringify(datos)
          }
        );

        alert("Registro actualizado.");
      } else {
        await solicitud(
          "/bitacoras",
          {
            method: "POST",

            body: JSON.stringify(datos)
          }
        );

        alert("Actividad guardada.");
      }

      limpiarFormulario();

      cargarRegistros();
    } catch (error) {
      alert(error.message);
    }
  }
);

function editarRegistro(id) {
  const registro = registrosActuales.find(
    item => item._id === id
  );

  if (!registro) {
    return;
  }

  document.getElementById(
    "registroId"
  ).value = registro._id;

  document.getElementById(
    "fecha"
  ).value = registro.fecha.substring(0, 10);

  document.getElementById(
    "tarea"
  ).value = registro.tarea;

  document.getElementById(
    "horaEntrada"
  ).value = registro.horaEntrada;

  document.getElementById(
    "horaSalida"
  ).value = registro.horaSalida;

  document.getElementById(
    "firmaSupervisor"
  ).value = registro.firmaSupervisor || "";

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

async function eliminarRegistro(id) {
  const confirmado = confirm(
    "¿Desea eliminar este registro?"
  );

  if (!confirmado) {
    return;
  }

  try {
    await solicitud(
      `/bitacoras/${id}`,
      {
        method: "DELETE"
      }
    );

    cargarRegistros();
  } catch (error) {
    alert(error.message);
  }
}

function limpiarFormulario() {
  formBitacora.reset();

  document.getElementById(
    "registroId"
  ).value = "";
}

const btnImprimirSemana =
  document.getElementById("btnImprimirSemana");

const semanaImprimir =
  document.getElementById("semanaImprimir");

const reporteSemana =
  document.getElementById("reporteSemana");

btnImprimirSemana.addEventListener(
  "click",
  imprimirBitacoraSemanal
);

/**
 * Devuelve la fecha del lunes correspondiente
 * al año y número de semana seleccionados.
 */
function obtenerInicioSemana(valorSemana) {
  const [anioTexto, semanaTexto] =
    valorSemana.split("-W");

  const anio = Number(anioTexto);
  const numeroSemana = Number(semanaTexto);

  const fechaReferencia =
    new Date(anio, 0, 4);

  const diaSemana =
    fechaReferencia.getDay() || 7;

  fechaReferencia.setDate(
    fechaReferencia.getDate() -
    diaSemana +
    1
  );

  fechaReferencia.setDate(
    fechaReferencia.getDate() +
    (numeroSemana - 1) * 7
  );

  fechaReferencia.setHours(
    0,
    0,
    0,
    0
  );

  return fechaReferencia;
}

/**
 * Formatea una fecha en español.
 */
function formatearFechaImpresion(fecha) {
  return new Date(fecha).toLocaleDateString(
    "es-CR",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }
  );
}

/**
 * Calcula las horas trabajadas.
 */
function calcularHorasSemana(
  horaEntrada,
  horaSalida
) {
  if (!horaEntrada || !horaSalida) {
    return 0;
  }

  const [horaInicio, minutoInicio] =
    horaEntrada.split(":").map(Number);

  const [horaFin, minutoFin] =
    horaSalida.split(":").map(Number);

  const minutosEntrada =
    horaInicio * 60 + minutoInicio;

  const minutosSalida =
    horaFin * 60 + minutoFin;

  const diferencia =
    minutosSalida - minutosEntrada;

  if (diferencia <= 0) {
    return 0;
  }

  return diferencia / 60;
}

/**
 * Obtiene los registros guardados desde la API.
 */
async function obtenerRegistrosParaImprimir() {
  const token =
    localStorage.getItem("token");

  const respuesta = await fetch(
    "/api/bitacoras/mis-registros",
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  const datos = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(
      datos.mensaje ||
      "No fue posible obtener los registros."
    );
  }

  /*
   * Permite trabajar si la API devuelve:
   * - un arreglo directamente
   * - { bitacoras: [] }
   * - { registros: [] }
   */
  return (
    datos.bitacoras ||
    datos.registros ||
    datos
  );
}

/**
 * Imprime solamente los registros de la semana
 * seleccionada.
 */
async function imprimirBitacoraSemanal() {
  try {
    const valorSemana =
      semanaImprimir.value;

    if (!valorSemana) {
      alert(
        "Debe seleccionar una semana."
      );

      return;
    }

    const fechaInicio =
      obtenerInicioSemana(valorSemana);

    const fechaFin =
      new Date(fechaInicio);

    fechaFin.setDate(
      fechaFin.getDate() + 6
    );

    fechaFin.setHours(
      23,
      59,
      59,
      999
    );

    const registros =
      await obtenerRegistrosParaImprimir();

    const registrosSemana =
      registros.filter((registro) => {
        const fechaRegistro =
          new Date(registro.fecha);

        return (
          fechaRegistro >= fechaInicio &&
          fechaRegistro <= fechaFin
        );
      });

    if (registrosSemana.length === 0) {
      alert(
        "No existen registros para la semana seleccionada."
      );

      return;
    }

    const usuario = JSON.parse(
      localStorage.getItem("usuario") ||
      "{}"
    );

    let totalHorasSemana = 0;

    const filas =
      registrosSemana.map((registro) => {
        const horas =
          registro.totalHoras ??
          calcularHorasSemana(
            registro.horaEntrada,
            registro.horaSalida
          );

        totalHorasSemana +=
          Number(horas) || 0;

        return `
          <tr>
            <td>
              ${formatearFechaImpresion(
                registro.fecha
              )}
            </td>

            <td>
              ${
                registro.tarea ||
                registro.actividad ||
                ""
              }
            </td>

            <td>
              ${registro.horaEntrada || ""}
            </td>

            <td>
              ${registro.horaSalida || ""}
            </td>

            <td>
              ${
                Number(horas).toFixed(2)
              }
            </td>

            <td>
              ${registro.estado || "Pendiente"}
            </td>

            <td>
              ${
                registro.observaciones ||
                ""
              }
            </td>
          </tr>
        `;
      }).join("");

    reporteSemana.innerHTML = `
      <div class="encabezado-reporte">
        <h1>
          Colegio Técnico Profesional Cañas
        </h1>

        <h2>
          Bitácora semanal de pasantía 2026
        </h2>

        <div class="datos-reporte">
          <p>
            <strong>Estudiante:</strong>
            ${
              usuario.nombreCompleto ||
              usuario.nombre ||
              ""
            }
          </p>

          <p>
            <strong>Correo:</strong>
            ${usuario.correo || ""}
          </p>

          <p>
            <strong>Semana:</strong>
            ${formatearFechaImpresion(
              fechaInicio
            )}
            al
            ${formatearFechaImpresion(
              fechaFin
            )}
          </p>
        </div>
      </div>

      <table class="tabla-reporte">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Actividad realizada</th>
            <th>Entrada</th>
            <th>Salida</th>
            <th>Horas</th>
            <th>Estado</th>
            <th>Observaciones</th>
          </tr>
        </thead>

        <tbody>
          ${filas}
        </tbody>

        <tfoot>
          <tr>
            <td colspan="4">
              <strong>
                Total de horas de la semana
              </strong>
            </td>

            <td colspan="3">
              <strong>
                ${totalHorasSemana.toFixed(2)}
              </strong>
            </td>
          </tr>
        </tfoot>
      </table>

      <div class="seccion-firmas">

        <div class="firma">
          <div class="linea-firma"></div>

          <p>
            Firma del estudiante
          </p>
        </div>

        <div class="firma">
          <div class="linea-firma"></div>

          <p>
            Firma del supervisor
          </p>
        </div>

      </div>

      <div class="observaciones-supervisor">

        <h3>
          Observaciones del supervisor
        </h3>

        <div class="lineas-observaciones">
          ________________________________________________
          <br><br>
          ________________________________________________
          <br><br>
          ________________________________________________
        </div>

      </div>
    `;

    document.body.classList.add(
      "modo-impresion"
    );

    window.print();

    document.body.classList.remove(
      "modo-impresion"
    );
  } catch (error) {
    console.error(
      "Error al imprimir la semana:",
      error
    );

    alert(error.message);
  }
}

const btnImprimirSemana =
  document.getElementById("btnImprimirSemana");

const semanaImprimir =
  document.getElementById("semanaImprimir");

const reporteImpresion =
  document.getElementById("reporteImpresion");

btnImprimirSemana.addEventListener(
  "click",
  prepararImpresionSemanal
);

function obtenerLunesSemana(valorSemana) {
  const [anioTexto, numeroSemanaTexto] =
    valorSemana.split("-W");

  const anio = Number(anioTexto);
  const numeroSemana = Number(numeroSemanaTexto);

  const cuatroEnero = new Date(
    anio,
    0,
    4,
    12,
    0,
    0
  );

  const diaSemana =
    cuatroEnero.getDay() || 7;

  cuatroEnero.setDate(
    cuatroEnero.getDate() -
    diaSemana +
    1
  );

  cuatroEnero.setDate(
    cuatroEnero.getDate() +
    (numeroSemana - 1) * 7
  );

  cuatroEnero.setHours(0, 0, 0, 0);

  return cuatroEnero;
}

function formatearFecha(fecha) {
  return new Date(fecha).toLocaleDateString(
    "es-CR",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }
  );
}

function calcularHoras(
  horaEntrada,
  horaSalida
) {
  if (!horaEntrada || !horaSalida) {
    return 0;
  }

  const [hEntrada, mEntrada] =
    horaEntrada.split(":").map(Number);

  const [hSalida, mSalida] =
    horaSalida.split(":").map(Number);

  const minutosEntrada =
    hEntrada * 60 + mEntrada;

  const minutosSalida =
    hSalida * 60 + mSalida;

  const diferencia =
    minutosSalida - minutosEntrada;

  if (diferencia <= 0) {
    return 0;
  }

  return diferencia / 60;
}

async function obtenerBitacorasEstudiante() {
  const token =
    localStorage.getItem("token");

  const respuesta = await fetch(
    "/api/bitacoras/mis-registros",
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  const texto = await respuesta.text();

  const datos = texto
    ? JSON.parse(texto)
    : {};

  if (!respuesta.ok) {
    throw new Error(
      datos.mensaje ||
      "No fue posible obtener la bitácora."
    );
  }

  return (
    datos.bitacoras ||
    datos.registros ||
    datos
  );
}

async function prepararImpresionSemanal() {
  try {
    const semanaSeleccionada =
      semanaImprimir.value;

    if (!semanaSeleccionada) {
      alert(
        "Seleccione la semana que desea imprimir."
      );

      return;
    }

    const fechaInicio =
      obtenerLunesSemana(
        semanaSeleccionada
      );

    const fechaFin =
      new Date(fechaInicio);

    fechaFin.setDate(
      fechaFin.getDate() + 6
    );

    fechaFin.setHours(
      23,
      59,
      59,
      999
    );

    const registros =
      await obtenerBitacorasEstudiante();

    const registrosSemana =
      registros.filter((registro) => {
        const fechaRegistro =
          new Date(registro.fecha);

        return (
          fechaRegistro >= fechaInicio &&
          fechaRegistro <= fechaFin
        );
      });

    if (registrosSemana.length === 0) {
      alert(
        "No hay registros en la semana seleccionada."
      );

      return;
    }

    const usuario = JSON.parse(
      localStorage.getItem("usuario") ||
      "{}"
    );

    document.getElementById(
      "impEstudiante"
    ).textContent =
      usuario.nombreCompleto ||
      usuario.nombre ||
      "";

    document.getElementById(
      "impEspecialidad"
    ).textContent =
      usuario.especialidad?.nombre ||
      usuario.especialidad ||
      "Desarrollo Web";

    document.getElementById(
      "impEmpresa"
    ).textContent =
      usuario.empresa?.nombreEmpresa ||
      usuario.empresa ||
      "";

    document.getElementById(
      "impDepartamento"
    ).textContent =
      usuario.empresa?.departamento ||
      usuario.departamento ||
      "";

    document.getElementById(
      "impDireccion"
    ).textContent =
      usuario.empresa?.direccion ||
      usuario.direccionEmpresa ||
      "";

    document.getElementById(
      "impPeriodo"
    ).textContent =
      usuario.periodo ||
      "2026";

    document.getElementById(
      "impSemana"
    ).textContent =
      `${formatearFecha(fechaInicio)} al ` +
      `${formatearFecha(fechaFin)}`;

    const cuerpoTabla =
      document.getElementById(
        "cuerpoTablaImpresion"
      );

    cuerpoTabla.innerHTML = "";

    let totalHorasSemana = 0;

    registrosSemana
      .sort(
        (a, b) =>
          new Date(a.fecha) -
          new Date(b.fecha)
      )
      .forEach((registro) => {
        const horas =
          Number(
            registro.totalHoras
          ) ||
          calcularHoras(
            registro.horaEntrada,
            registro.horaSalida
          );

        totalHorasSemana += horas;

        const fila =
          document.createElement("tr");

        fila.innerHTML = `
          <td>
            ${formatearFecha(registro.fecha)}
          </td>

          <td class="celda-tarea">
            ${
              registro.tarea ||
              registro.actividad ||
              ""
            }
          </td>

          <td>
            ${registro.horaEntrada || ""}
          </td>

          <td>
            ${registro.horaSalida || ""}
          </td>

          <td>
            ${horas.toFixed(2)}
          </td>

          <td class="celda-firma"></td>
        `;

        cuerpoTabla.appendChild(fila);
      });

    document.getElementById(
      "totalHorasImpresion"
    ).textContent =
      totalHorasSemana.toFixed(2);

    document.body.classList.add(
      "imprimiendo-bitacora"
    );

    window.print();

    document.body.classList.remove(
      "imprimiendo-bitacora"
    );
  } catch (error) {
    console.error(
      "Error al imprimir:",
      error
    );

    alert(error.message);
  }
}
cargarRegistros();
