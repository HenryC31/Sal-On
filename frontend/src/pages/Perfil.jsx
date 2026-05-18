import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { supabase } from '../supabaseClient';
import './Perfil.css';

const Perfil = ({ onUserUpdate }) => { 
  const [usuario, setUsuario] = useState(() => {
    const sesion = localStorage.getItem('salonUser');
    return sesion ? JSON.parse(sesion) : null;
  });

  const [reservas, setReservas] = useState([]);
  const [cargandoReservas, setCargandoReservas] = useState(true);

  // Estados para el modo edición
  const [editando, setEditando] = useState(false);
  const [editCorreo, setEditCorreo] = useState(usuario?.correo || '');
  const [editTelefono, setEditTelefono] = useState(usuario?.telefono || '');
  const [editFoto, setEditFoto] = useState(usuario?.foto_url || '');

  // Efecto para traer las reservas reales del microservicio
  useEffect(() => {
    if (!usuario) return;
    
    const cargarReservasBD = async () => {
      try {
        const respuesta = await axios.get(`http://localhost:3000/api/reservas/cliente/${usuario.id}`);
        setReservas(respuesta.data);
      } catch (error) {
        console.error("Error al traer reservas reales:", error);
      } finally {
        setCargandoReservas(false);
      }
    };

    cargarReservasBD();
  }, [usuario]);

// Función para subir la foto a Supabase Storage
  const handleSubirFoto = async (e) => {
    const archivo = e.target.files[0];
    if (!archivo) return;

    try {
      Swal.fire({ title: 'Subiendo foto...', didOpen: () => Swal.showLoading() });

      // Creamos un nombre único para que no se sobreescriba
      const fileExt = archivo.name.split('.').pop();
      const fileName = `${usuario.id}_${Date.now()}.${fileExt}`;
      const filePath = `public/${fileName}`;

      // Subimos el archivo al bucket "avatares"
      const { error: uploadError } = await supabase.storage
        .from('avatares')
        .upload(filePath, archivo);

      if (uploadError) throw uploadError;

      // Obtenemos el Link Público de la imagen que acabamos de subir
      const { data } = supabase.storage.from('avatares').getPublicUrl(filePath);
      
      // Lo guardamos en el estado temporal para que se vea antes de guardar el perfil
      setEditFoto(data.publicUrl);

      Swal.fire({
        icon: 'success',
        title: '¡Foto cargada!',
        text: 'No olvides darle a "Guardar Cambios" para actualizar tu perfil.',
        confirmButtonColor: '#a855f7',
        timer: 3000
      });

    } catch (error) {
      console.error('Error subiendo imagen:', error);
      Swal.fire({ icon: 'error', title: 'Ups...', text: 'Hubo un error al subir la foto.' });
    }
  };


  // Guardar cambios del perfil
  const handleGuardarPerfil = async (e) => {
    e.preventDefault();
    try {
      Swal.fire({ title: 'Actualizando perfil...', didOpen: () => Swal.showLoading() });

      const respuesta = await axios.put('http://localhost:3000/api/usuarios/actualizar', {
        id: usuario.id,
        correo: editCorreo,
        telefono: editTelefono,
        foto_url: editFoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(usuario.nombre_completo)}&background=fff&color=a855f7&rounded=true`
      });

      if (respuesta.status === 200) {
        const usuarioActualizado = respuesta.data.usuario;
        
        // Actualizamos el localStorage
        localStorage.setItem('salonUser', JSON.stringify(usuarioActualizado));
        
        // Actualizamos el estado local de esta pantalla
        setUsuario(usuarioActualizado);
        
        // Le avisamos a App.jsx para que el Header se entere de inmediato
        if (onUserUpdate) {
          onUserUpdate(usuarioActualizado);
        }
        
        setEditando(false);

        Swal.fire({
          icon: 'success',
          title: '¡Cambios Guardados!',
          text: 'Tus datos de perfil se actualizaron correctamente.',
          confirmButtonColor: '#a855f7'
        });
      }
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.error || 'No se pudieron guardar los cambios.',
        confirmButtonColor: '#a855f7'
      });
    }
  };

  // Cancelar reserva
  const handleCancelarReserva = async (id, nombreSalon) => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `Vas a cancelar tu reservación en ${nombreSalon}.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'Regresar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          Swal.fire({ title: 'Cancelando...', didOpen: () => Swal.showLoading() });
          
          const respuesta = await axios.patch(`http://localhost:3000/api/reservas/${id}/cancelar`);
          
          if (respuesta.status === 200) {
            // Modificamos el estado local de la tabla para ver el cambio reflejado de inmediato
            setReservas(prev => 
              prev.map(res => res.id === id ? { ...res, estado: 'cancelada' } : res)
            );

            Swal.fire({
              icon: 'success',
              title: 'Cancelada',
              text: 'Tu reservación ha sido cancelada.',
              confirmButtonColor: '#a855f7'
            });
          }
        } catch (error) {
          console.error(error);
          Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo cancelar el evento.' });
        }
      }
    });
  };

  if (!usuario) return null;

  return (
    <div className="perfil-container">
      {/* Tarjeta de Información con Foto Actual */}
      <div className="perfil-card">
        <div className="perfil-layout">
          <div className="perfil-avatar-seccion">
            <img 
              src={usuario.foto_url || `https://ui-avatars.com/api/?name=${usuario.nombre_completo.replace(' ', '+')}&background=fff&color=a855f7&rounded=true`} 
              alt="Foto de perfil" 
              className="perfil-foto-grande"
            />
          </div>
          
          <div className="perfil-info">
            {!editando ? (
              <>
                <h2>{usuario.nombre_completo}</h2>
                <p><strong>Correo:</strong> {usuario.correo || 'Sin registrar'}</p>
                <p><strong>Teléfono:</strong> {usuario.telefono}</p>
                <p><strong>Tipo de Cuenta:</strong> <span className="badge-rol">{usuario.role || usuario.rol}</span></p>
                <button className="btn-editar-perfil" onClick={() => setEditando(true)}>Editar Perfil</button>
              </>
            ) : (
              <form onSubmit={handleGuardarPerfil} className="form-editar-perfil">
                <h3>Editar mis datos</h3>
                <div className="campo-edicion">
                  <label>Correo Electrónico</label>
                  <input type="email" value={editCorreo} onChange={(e) => setEditCorreo(e.target.value)} required />
                </div>
                <div className="campo-edicion">
                  <label>Teléfono Celular</label>
                  <input type="tel" value={editTelefono} onChange={(e) => setEditTelefono(e.target.value)} required />
                </div>
                <div className="campo-edicion">
                  <label>Foto de Perfil</label>
                  {editFoto && (
                    <img src={editFoto} alt="Vista previa" style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', marginBottom: '10px' }} />
                  )}
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleSubirFoto} 
                    style={{ padding: '5px', border: 'none' }}
                  />
                </div>
                <div className="botones-edicion">
                  <button type="button" className="btn-cancelar-edicion" onClick={() => setEditando(false)}>Cancelar</button>
                  <button type="submit" className="btn-guardar-edicion">Guardar Cambios</button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Tabla de Reservaciones Conectada */}
      <div className="reservas-seccion">
        <h3>Mis Salones Reservados</h3>
        
        {cargandoReservas ? (
          <p style={{ color: '#a855f7' }}>Cargando reservaciones reales...</p>
        ) : reservas.length === 0 ? (
          <p className="no-reservas">Aún no tienes ninguna reservación registrada.</p>
        ) : (
          <div className="tabla-contenedor">
            <table className="tabla-reservas">
              <thead>
                <tr>
                  <th>Salón</th>
                  <th>Fecha del Evento</th>
                  <th>Monto Total</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {reservas.map((res) => (
                  <tr key={res.id}>
                    <td><strong>{res.salon_nombre}</strong></td>
                    <td>{new Date(res.fecha_evento).toLocaleDateString('es-MX', { timeZone: 'UTC' })}</td>
                    <td>${res.monto_total.toLocaleString('es-MX')} MXN</td>
                    <td>
                      <span className={`estado-badge ${res.estado}`}>
                        {res.estado}
                      </span>
                    </td>
                    <td>
                      {res.estado !== 'cancelada' ? (
                        <button 
                          className="btn-cancelar"
                          onClick={() => handleCancelarReserva(res.id, res.salon_nombre)}
                        >
                          Cancelar
                        </button>
                      ) : (
                        <span style={{ color: '#9ca3af', fontSize: '0.9rem' }}>Ninguna</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Perfil;