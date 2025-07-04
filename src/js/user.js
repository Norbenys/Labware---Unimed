(() => {
let paginaActual = 1;
const registrosPorPagina = 5;

// =================== Cargar títulos (para el modal de agregar usuario) ===================
async function cargarTitulos() {
  const response = await fetch('http://localhost:3000/api/usuarios/titles');
  const data = await response.json();

  if (data.success) {
    const selectTitulo = document.getElementById('titulo');
    selectTitulo.innerHTML = '';
    data.titles.forEach(titulo => {
      const option = document.createElement('option');
      option.value = titulo.id;
      option.textContent = titulo.nombre;
      selectTitulo.appendChild(option);
    });
  } else {
    console.error('Error al cargar los títulos.');
  }
}
// =================== Cargar títulos para el modal de editar/ver usuario ===================
async function cargarTitulosEdit() {
  const response = await fetch('http://localhost:3000/api/usuarios/titles');
  const data = await response.json();

  if (data.success) {
    const selectTitulo = document.getElementById('edit_titulo');
    selectTitulo.innerHTML = '';
    data.titles.forEach(titulo => {
      const option = document.createElement('option');
      option.value = titulo.id;
      option.textContent = titulo.nombre;
      selectTitulo.appendChild(option);
    });
  } else {
    console.error('Error al cargar los títulos para edición.');
  }
}

// =================== Cargar roles para el modal de editar/ver usuario ===================
async function cargarRolesEdit() {
  const response = await fetch('http://localhost:3000/api/usuarios/roles');
  const data = await response.json();

  if (data.success) {
    const selectRol = document.getElementById('edit_rol');
    selectRol.innerHTML = '';
    data.roles.forEach(rol => {
      const option = document.createElement('option');
      option.value = rol.id;
      option.textContent = rol.nombre;
      selectRol.appendChild(option);
    });
  } else {
    console.error('Error al cargar los roles para edición.');
  }
}


// =================== Cargar roles ===================
async function cargarRoles() {
  const response = await fetch('http://localhost:3000/api/usuarios/roles');
  const data = await response.json();

  if (data.success) {
    const selectRol = document.getElementById('rol');
    selectRol.innerHTML = '';
    data.roles.forEach(rol => {
      const option = document.createElement('option');
      option.value = rol.id;
      option.textContent = rol.nombre;
      selectRol.appendChild(option);
    });
  } else {
    console.error('Error al cargar los roles.');
  }
}

// =================== Cargar usuarios ===================
async function cargarUsuarios() {
  try {
    const response = await fetch('http://localhost:3000/api/usuarios/users');
    const data = await response.json();

    if (data.success) {
      const tableBody = document.getElementById('userTableBody');
      tableBody.innerHTML = '';

      data.users.forEach(usuario => {
        const fila = document.createElement('tr');
        fila.setAttribute('data-userid', usuario.id);
        fila.innerHTML = `
          <td class="text-sm text-center">${usuario.nombres}</td>
          <td class="text-sm text-center">${usuario.apellidos}</td>
          <td class="text-sm text-center">${usuario.telefono}</td>
          <td class="text-sm text-center">${usuario.correo}</td>
          <td class="text-sm text-center">${usuario.rol}</td>
       <td class="align-middle text-center">
  <div class="dropdown">
    <a href="#" class="text-secondary p-0 mb-0" id="dropdownMenuButton${usuario.id}" data-bs-toggle="dropdown" aria-expanded="false">
      <i class="material-icons">more_vert</i>
    </a>
    <ul class="dropdown-menu dropdown-menu-end shadow-sm border-0 rounded-3" aria-labelledby="dropdownMenuButton${usuario.id}">
      <li>
        <a class="dropdown-item d-flex align-items-center gap-2" href="#" onclick="verUsuario(${usuario.id})">
          <i class="material-icons text-sm">visibility</i> Ver
        </a>
      </li>
      <li>
        <a class="dropdown-item d-flex align-items-center gap-2" href="#" onclick="editarUsuario(${usuario.id})">
          <i class="material-icons text-sm">edit</i> Editar
        </a>
      </li>
      <li>
        <a class="dropdown-item d-flex align-items-center gap-2 text-danger btn-eliminar-usuario" href="#" data-userid="${usuario.id}">
          <i class="material-icons text-sm">delete</i> Eliminar
        </a>
      </li>
    </ul>
  </div>
</td>

        `;
        tableBody.appendChild(fila);
      });

      aplicarFiltroYPaginar(); // ✅ Filtrar y paginar normalmente
    } else {
      console.error('Error al cargar los usuarios.');
    }
  } catch (err) {
    console.error('Error inesperado al cargar usuarios:', err);
  }
}


// =================== Ver usuario ===================
async function verUsuario(id) {
  try {
    await cargarTitulosEdit();
    await cargarRolesEdit();
    const response = await fetch(`http://localhost:3000/api/usuarios/${id}`);
    const data = await response.json();

    if (data.success) {
      const u = data.usuario;

      // Título del modal
      document.getElementById('viewEditTitle').textContent = 'Información';

      // Cargar datos
      document.getElementById('edit_id_usuario').value = u.id;
      document.getElementById('edit_cedula').value = u.cedula;
      document.getElementById('edit_nombres').value = u.nombres;
      document.getElementById('edit_apellidos').value = u.apellidos;
      document.getElementById('edit_fecha_nacimiento').value = u.fecha_nacimiento?.split('T')[0] || '';
      document.getElementById('edit_telefono').value = u.telefono;
      document.getElementById('edit_email').value = u.correo;
      document.getElementById('edit_titulo').value = u.id_titulo;
      document.getElementById('edit_usuario').value = u.usuario;
      document.getElementById('edit_password').value = u.contraseña;
      document.getElementById('edit_rol').value = u.id_rol;

      // Deshabilitar todos los campos
      document.querySelectorAll('#editUserForm input, #editUserForm select').forEach(el => el.setAttribute('disabled', true));
      document.getElementById('btnGuardarCambiosContainer').style.display = 'none';

      new bootstrap.Modal(document.getElementById('viewEditUserModal')).show();
    } else {
      console.error('Usuario no encontrado.');
    }
  } catch (err) {
    console.error('Error al cargar usuario:', err);
  }
}

// =================== Editar usuario ===================
async function editarUsuario(id) {
  try {
    await cargarTitulosEdit();
    await cargarRolesEdit();
    const response = await fetch(`http://localhost:3000/api/usuarios/${id}`);
    const data = await response.json();

    if (data.success) {
      const u = data.usuario;

      // Título del modal
      document.getElementById('viewEditTitle').textContent = 'Actualizar';

      // Cargar datos
      document.getElementById('edit_id_usuario').value = u.id;
      document.getElementById('edit_cedula').value = u.cedula;
      document.getElementById('edit_nombres').value = u.nombres;
      document.getElementById('edit_apellidos').value = u.apellidos;
      document.getElementById('edit_fecha_nacimiento').value = u.fecha_nacimiento?.split('T')[0] || '';
      document.getElementById('edit_telefono').value = u.telefono;
      document.getElementById('edit_email').value = u.correo;
      document.getElementById('edit_titulo').value = u.id_titulo;
      document.getElementById('edit_usuario').value = u.usuario;
      document.getElementById('edit_password').value = u.contraseña;
      document.getElementById('edit_rol').value = u.id_rol;

      // Habilitar todos los campos excepto ID y usuario si deseas
      document.querySelectorAll('#editUserForm input, #editUserForm select').forEach(el => el.removeAttribute('disabled'));
      document.getElementById('btnGuardarCambiosContainer').style.display = 'block';

      new bootstrap.Modal(document.getElementById('viewEditUserModal')).show();
    } else {
      console.error('Usuario no encontrado.');
    }
  } catch (err) {
    console.error('Error al cargar usuario:', err);
  }
}

// =================== Guardar cambios del usuario ===================
document.getElementById('editUserForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const id = document.getElementById('edit_id_usuario').value;

  const datos = {
    cedula: document.getElementById('edit_cedula').value,
    nombres: document.getElementById('edit_nombres').value,
    apellidos: document.getElementById('edit_apellidos').value,
    fecha_nacimiento: document.getElementById('edit_fecha_nacimiento').value,
    telefono: document.getElementById('edit_telefono').value,
    correo: document.getElementById('edit_email').value,
    id_titulo: document.getElementById('edit_titulo').value,
    usuario: document.getElementById('edit_usuario').value,
    contraseña: document.getElementById('edit_password').value,
    id_rol: document.getElementById('edit_rol').value
  };

  try {
    const response = await fetch(`http://localhost:3000/api/usuarios/update/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });

    const result = await response.json();

    if (result.success) {
      Swal.fire({
        icon: 'success',
        title: '¡Éxito!',
        text: 'Usuario actualizado correctamente.',
        confirmButtonText: 'Aceptar'
      }).then(() => {
        const modal = bootstrap.Modal.getInstance(document.getElementById('viewEditUserModal'));
        modal.hide();
        cargarUsuarios(); // ✅ Refresca la tabla
      });
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: result.message || 'No se pudo actualizar el usuario.',
        confirmButtonText: 'Aceptar'
      });
    }
  } catch (error) {
    console.error('Error al actualizar el usuario:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Ocurrió un error inesperado.',
      confirmButtonText: 'Aceptar'
    });
  }
});

// =================== Enviar formulario nuevo usuario ===================
document.getElementById('addUserForm').addEventListener('submit', async function (event) {
  event.preventDefault();

  const datos = {
    cedula: document.getElementById('cedula').value,
    nombres: document.getElementById('nombres').value,
    apellidos: document.getElementById('apellidos').value,
    fecha_nacimiento: document.getElementById('fecha_nacimiento').value,
    telefono: document.getElementById('telefono').value,
    email: document.getElementById('email').value,
    titulo: document.getElementById('titulo').value,
    usuario: document.getElementById('usuario').value,
    password: document.getElementById('password').value,
    rol: document.getElementById('rol').value
  };

  try {
    const response = await fetch('http://localhost:3000/api/usuarios/addUser', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });

    const data = await response.json();

    if (data.success) {
      Swal.fire({
        icon: 'success',
        title: '¡Éxito!',
        text: 'Usuario agregado correctamente.',
        confirmButtonText: 'Aceptar'
      }).then(() => {
        document.getElementById('addUserForm').reset();
        const modal = bootstrap.Modal.getInstance(document.getElementById('addUserModal'));
        modal.hide();
        cargarUsuarios(); // ✅ Actualiza la tabla visualmente
      });
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: data.message || 'No se pudo agregar el usuario.',
        confirmButtonText: 'Aceptar'
      });
    }
  } catch (error) {
    console.error('Error al agregar el usuario:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Ocurrió un error inesperado.',
      confirmButtonText: 'Aceptar'
    });
  }
});


// =================== Evento al cargar ===================
document.addEventListener('DOMContentLoaded', () => {
  cargarTitulos();
  cargarRoles();
  cargarUsuarios();
});

// =================== Eliminar usuario con SweetAlert ===================
document.addEventListener('click', async (e) => {
  if (e.target.classList.contains('btn-eliminar-usuario')) {
    e.preventDefault();
    const userId = e.target.getAttribute('data-userid');

    const confirmacion = await Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción eliminará el usuario permanentemente.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6'
    });

    if (confirmacion.isConfirmed) {
      try {
        const response = await fetch(`http://localhost:3000/api/usuarios/delete/${userId}`, {
          method: 'DELETE'
        });

        const result = await response.json();

        if (result.success) {
          // ❌ Eliminar directamente la fila del DOM
          const fila = document.querySelector(`tr[data-userid="${userId}"]`);
          if (fila) fila.remove();

          await Swal.fire('Eliminado', result.message, 'success');

          // ✅ Si deseas actualizar toda la tabla, descomenta esta línea:
          // cargarUsuarios();
        } else {
          Swal.fire('Error', result.message || 'No se pudo eliminar el usuario.', 'error');
        }
      } catch (err) {
        console.error(err);
        Swal.fire('Error', 'Hubo un problema al intentar eliminar.', 'error');
      }
    }
  }
});


// =================== Filtro y paginación ===================
function aplicarFiltroYPaginar() {
  const filtro = document.getElementById('buscadorUsuarios').value.trim().toLowerCase();
  const filas = Array.from(document.querySelectorAll('#userTableBody tr'));

  // Filtrar filas visibles
  const filasFiltradas = filas.filter(fila => {
    const nombre = fila.children[0]?.textContent.toLowerCase() || '';
    const apellido = fila.children[1]?.textContent.toLowerCase() || '';
    return nombre.includes(filtro) || apellido.includes(filtro);
  });

  // Calcular total de páginas
  const totalPaginas = Math.ceil(filasFiltradas.length / registrosPorPagina);
  if (paginaActual > totalPaginas) paginaActual = 1;

  // Ocultar todas las filas primero
  filas.forEach(fila => fila.style.display = 'none');

  // Mostrar solo las que correspondan en esta página
  const inicio = (paginaActual - 1) * registrosPorPagina;
  const fin = inicio + registrosPorPagina;
  filasFiltradas.slice(inicio, fin).forEach(fila => fila.style.display = '');

  // Crear los botones de paginación solo si hay más de una página
  const contenedor = document.getElementById('paginacionUsuarios');
  contenedor.innerHTML = '';

  if (totalPaginas > 1) {
    const maxVisible = 3;
    let start = Math.max(1, paginaActual - Math.floor(maxVisible / 2));
    let end = start + maxVisible - 1;
    if (end > totalPaginas) {
      end = totalPaginas;
      start = Math.max(1, end - maxVisible + 1);
    }

    if (paginaActual > 1) {
      const btnPrev = document.createElement('button');
      btnPrev.textContent = '«';
      btnPrev.className = 'btn btn-outline-dark btn-sm mx-1';
      btnPrev.onclick = () => {
        paginaActual--;
        aplicarFiltroYPaginar();
      };
      contenedor.appendChild(btnPrev);
    }

    for (let i = start; i <= end; i++) {
      const btn = document.createElement('button');
      btn.className = `btn btn-sm mx-1 ${i === paginaActual ? 'btn-dark' : 'btn-outline-dark'}`;
      btn.textContent = i;
      btn.onclick = () => {
        paginaActual = i;
        aplicarFiltroYPaginar();
      };
      contenedor.appendChild(btn);
    }

    if (paginaActual < totalPaginas) {
      const btnNext = document.createElement('button');
      btnNext.textContent = '»';
      btnNext.className = 'btn btn-outline-dark btn-sm mx-1';
      btnNext.onclick = () => {
        paginaActual++;
        aplicarFiltroYPaginar();
      };
      contenedor.appendChild(btnNext);
    }
  }
}

function initUser() {
  cargarTitulos();
  cargarRoles();
  cargarUsuarios();

  // Reinicia página actual y buscador
  paginaActual = 1;
  const buscador = document.getElementById('buscadorUsuarios');
  if (buscador) {
    buscador.addEventListener('input', () => {
      paginaActual = 1;
      aplicarFiltroYPaginar();
    });
  }
}

  window.initUser = initUser; // Exporta solo la función que necesitas
   window.verUsuario = verUsuario;
   window.editarUsuario = editarUsuario;
})();