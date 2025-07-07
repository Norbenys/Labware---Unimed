// ==================== Manejo del envío del formulario ====================
document.getElementById("loginForm").addEventListener("submit", async function (event) {
  event.preventDefault();
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  try {
    const response = await fetch('http://localhost:3000/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (data.success) {
      Swal.fire({
        icon: 'success',
        title: '¡Ingreso exitoso!',
        text: data.message,
        timer: 1500,
        showConfirmButton: false
      }).then(() => {
        window.location.href = 'index.html';
      });
    } else {
      Swal.fire({
        icon: 'error',
        title: '¡Acceso denegado!',
        text: data.message
      });
    }

  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'Error de conexión',
      text: 'No se pudo conectar con el servidor.'
    });
    console.error(error);
  }
});
