document.addEventListener("DOMContentLoaded", () => {
  const rol = localStorage.getItem("rol");

  const ids = {
    administrador: [
      "liDashboard", "liUsuarios", "liPacientes", "liDoctores",
      "liExamenes", "liEmpresa", "liNuevaOrden", "liOrdenes",
      "liValidados", "liSoporte", "liCerrarSesion",
      "seccionAdmin", "seccionOrdenes", "seccionConfig"
    ],
    asistente: [
        "liDashboard", "liPacientes", "liDoctores", "liNuevaOrden", "liValidados",
      "liSoporte", "liCerrarSesion", "seccionAdmin", "seccionOrdenes", "seccionConfig"
    ],
    tecnico: [
         "liDashboard", "liOrdenes", "liSoporte", "liCerrarSesion", "seccionOrdenes", "seccionConfig"
    ]
  };

  // Ocultar todos primero
  const allIds = new Set([...ids.administrador, ...ids.asistente, ...ids.tecnico]);
  allIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });

  // Mostrar según rol
  const mostrar = rol === "1" ? ids.administrador
                : rol === "2" ? ids.tecnico
                : rol === "3" ? ids.asistente
                : [];

  mostrar.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = "block";
  });
});
