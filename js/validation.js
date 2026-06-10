/**
 * validation.js
 * Validación de formularios
 * DTW135 – GT02 · AutoInventario v2
 */

function validarVehiculo(datos, modoEdicion = false, idActual = null) {
  const errores = {};
  const vehiculos = Storage.getAll();
  const anioActual = new Date().getFullYear();

  if (!datos.marca || datos.marca.trim().length < 2)
    errores.marca = 'La marca debe tener al menos 2 caracteres.';

  if (!datos.modelo || datos.modelo.trim().length < 2)
    errores.modelo = 'El modelo debe tener al menos 2 caracteres.';

  if (!datos.anio || isNaN(datos.anio) || datos.anio < 1900 || datos.anio > anioActual + 1)
    errores.anio = `El año debe estar entre 1900 y ${anioActual + 1}.`;

  if (!datos.color || datos.color.trim().length < 2)
    errores.color = 'El color debe tener al menos 2 caracteres.';

  const placa = (datos.placa || '').trim().toUpperCase();
  if (!placa || placa.length < 3) {
    errores.placa = 'La placa debe tener al menos 3 caracteres.';
  } else {
    const duplicado = vehiculos.find(v => v.placa === placa && v.id !== idActual);
    if (duplicado) errores.placa = 'Esta placa ya está registrada.';
  }

  if (!datos.estado) errores.estado = 'Selecciona un estado.';

  if (!datos.precio || isNaN(datos.precio) || Number(datos.precio) <= 0)
    errores.precio = 'El precio debe ser mayor a $0.';

  if (!datos.departamento) errores.departamento = 'Selecciona el departamento.';

  return errores;
}

function mostrarErrores(errores, prefijo = '') {
  limpiarErrores(prefijo);
  Object.entries(errores).forEach(([campo, msg]) => {
    const el = document.getElementById(`${prefijo}Error_${campo}`);
    if (el) { el.textContent = msg; el.classList.add('show'); }
  });
}

function limpiarErrores(prefijo = '') {
  document.querySelectorAll(`.error-msg`).forEach(el => {
    if (!prefijo || el.id.startsWith(`${prefijo}Error_`)) {
      el.textContent = '';
      el.classList.remove('show');
    }
  });
}
