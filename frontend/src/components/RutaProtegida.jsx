import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import Swal from 'sweetalert2';

const RutaProtegida = () => {
  const usuarioGuardado = localStorage.getItem('salonUser');

  // Si no hay sesión, redirigimos al login y mostramos una alerta
  if (!usuarioGuardado) {
    Swal.fire({
      icon: 'warning',
      title: '¡Acceso Restringido!',
      text: 'Debes iniciar sesión para acceder a esta sección.',
      confirmButtonColor: '#a855f7',
      timer: 3000,
      toast: true,
      position: 'top-end',
      showConfirmButton: false
    });

    return <Navigate to="/login" replace />;
  }

  // Si hay sesión, dejamos pasar a la ruta protegida
  return <Outlet />;
};

export default RutaProtegida;