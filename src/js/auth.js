document.addEventListener("DOMContentLoaded", function () { 
  const rol = localStorage.getItem("rol");

  if (!rol) {
    window.location.href = "login.html";
    return;
  }

  const items = [
    "liDashboard", "liUsuarios", "liPacientes", "liDoctores", "liExamenes", "liCotizador",
    "liNuevaOrden", "liRecepcion", "liProcesamiento", "liValidacion",
    "liRemision", "liArchivo", "liEstadisticas", "liAuditoria", "liCerrarSesion"
  ];

  const titulos = {
    liTituloSistema: ["liUsuarios", "liPacientes", "liDoctores", "liExamenes", "liCotizador"],
    liTituloOrdenes: ["liNuevaOrden", "liRecepcion", "liProcesamiento", "liValidacion", "liRemision", "liArchivo"],
    liTituloClinico: ["liEstadisticas", "liAuditoria"],
    liTituloSesion: ["liCerrarSesion"]
  };

  // Oculta todo inicialmente
  [...items, ...Object.keys(titulos)].forEach(id => {
    document.getElementById(id)?.classList.add("d-none");
  });

  function mostrar(ids) {
    ids.forEach(id => document.getElementById(id)?.classList.remove("d-none"));

    Object.entries(titulos).forEach(([titulo, hijos]) => {
      const mostrarTitulo = hijos.some(id => ids.includes(id));
      if (mostrarTitulo) {
        document.getElementById(titulo)?.classList.remove("d-none");
      }
    });
  }

  // Obtener el div que tiene la clase scroll-wrapper (puede que la tenga ya puesta)
  const menu = document.querySelector(".scroll-wrapper");

  if (rol === "1") {
    mostrar([...items]);
    menu?.classList.add("scroll-wrapper");
  }

  if (rol === "2") {
    mostrar(["liDashboard", "liProcesamiento", "liArchivo", "liCerrarSesion"]);
    menu?.classList.remove("scroll-wrapper");
  }

  if (rol === "3") {
    mostrar(["liDashboard", "liPacientes", "liDoctores", "liCotizador", "liNuevaOrden", "liRecepcion", "liRemision", "liArchivo", "liCerrarSesion"]);
    menu?.classList.remove("scroll-wrapper");
  }
});

