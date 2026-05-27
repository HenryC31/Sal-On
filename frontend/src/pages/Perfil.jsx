import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { supabase } from '../supabaseClient';
import { db } from '../localDb';
import './Perfil.css';

const Perfil = ({ onUserUpdate }) => { 
  const [usuario, setUsuario] = useState(() => {
    const sesion = localStorage.getItem('salonUser');
    return sesion ? JSON.parse(sesion) : null;
  });

  const [reservas, setReservas] = useState([]);
  const [cargandoReservas, setCargandoReservas] = useState(true);

  const [editando, setEditando] = useState(false);
  const [editNombre, setEditNombre] = useState(usuario?.nombre_completo || '');
  const [editCorreo, setEditCorreo] = useState(usuario?.correo || '');
  const [editTelefono, setEditTelefono] = useState(usuario?.telefono || '');
  const [editPassword, setEditPassword] = useState('');
  const [editFoto, setEditFoto] = useState(usuario?.foto_url || '');

  const hoy = new Date();
  const fechaHoyStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;

  useEffect(() => {
    const intentarSincronizarPerfil = async () => {
      const pendientes = await db.sync_queue.toArray();
      if (pendientes.length === 0) return;

      try {
        await axios.get('http://localhost:3000/api/salones'); 
        
        for (const tarea of pendientes) {
          if (tarea.tipo === 'ACTUALIZAR_PERFIL') {
            const res = await axios({ method: tarea.metodo, url: tarea.url, data: tarea.datos });
            if (res.status === 200) {
              localStorage.setItem('salonUser', JSON.stringify(res.data.usuario));
            }
            await db.sync_queue.delete(tarea.id);
          }
        }
        Swal.fire({ icon: 'success', title: '¡Datos sincronizados!', text: 'Tu perfil se ha actualizado en el servidor central.', toast: true, position: 'top-end', timer: 3000 });
        
        // Refrescamos los datos locales limpios
        setUsuario(JSON.parse(localStorage.getItem('salonUser')));
      } catch {
        console.warn("Servidor caído. Conservando cambios de perfil locales.");
      }
    };

    intentarSincronizarPerfil();
  }, []);

  useEffect(() => {
    if (!usuario) return;
    const cargarReservasBD = async () => {
      try {
        const respuesta = await axios.get(`http://localhost:3000/api/reservas/cliente/${usuario.id}`);
        setReservas(respuesta.data);
      } catch (error) {
        console.error("Error al traer reservas:", error);
      } finally {
        setCargandoReservas(false);
      }
    };
    cargarReservasBD();
  }, [usuario]);

  const handleSubirFoto = async (e) => {
    const archivo = e.target.files[0];
    if (!archivo) return;
    try {
      Swal.fire({ title: 'Subiendo foto...', didOpen: () => Swal.showLoading() });
      const fileExt = archivo.name.split('.').pop();
      const fileName = `${usuario.id}_${Date.now()}.${fileExt}`;
      const filePath = `public/${fileName}`;
      const { error: uploadError } = await supabase.storage.from('avatares').upload(filePath, archivo);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('avatares').getPublicUrl(filePath);
      setEditFoto(data.publicUrl);
      Swal.fire({ icon: 'success', title: '¡Foto cargada!', text: 'Dale a "Guardar Cambios".', timer: 2000 });
    } catch {
      Swal.fire({ icon: 'error', title: 'Ups...', text: 'Hubo un error al subir la foto.' });
    }
  };

  const handleGuardarPerfil = async (e) => {
    e.preventDefault();
    
    const datosActualizados = {
      id: usuario.id,
      nombre_completo: editNombre,
      correo: editCorreo,
      telefono: editTelefono,
      foto_url: editFoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(editNombre)}&background=fff&color=a855f7&rounded=true`
    };

    // Solo mandamos la contraseña si escribió una nueva
    if (editPassword.trim() !== '') {
      datosActualizados.password = editPassword;
    }

    try {
      Swal.fire({ title: 'Actualizando perfil...', didOpen: () => Swal.showLoading() });
      const respuesta = await axios.put('http://localhost:3000/api/usuarios/actualizar', datosActualizados);

      if (respuesta.status === 200) {
        const usuarioActualizado = respuesta.data.usuario;
        localStorage.setItem('salonUser', JSON.stringify(usuarioActualizado));
        setUsuario(usuarioActualizado);
        if (onUserUpdate) onUserUpdate(usuarioActualizado);
        setEditando(false);
        setEditPassword('');
        Swal.fire('¡Cambios Guardados!', 'Tu perfil se actualizó.', 'success');
      }
    } catch (error) {
      if (error.code === 'ERR_NETWORK' || !error.response || error.response.status >= 500) {
        // Tolerancia a fallos SOLO para el perfil
        await db.sync_queue.add({
          tipo: 'ACTUALIZAR_PERFIL',
          url: 'http://localhost:3000/api/usuarios/actualizar',
          metodo: 'PUT',
          datos: datosActualizados
        });

        const usuarioLocal = { ...usuario, ...datosActualizados };
        delete usuarioLocal.password; // Nunca guardamos el string literal en localStorage
        
        localStorage.setItem('salonUser', JSON.stringify(usuarioLocal));
        setUsuario(usuarioLocal);
        if (onUserUpdate) onUserUpdate(usuarioLocal);
        setEditando(false);
        setEditPassword('');

        Swal.fire({ icon: 'warning', title: 'Servidor Inaccesible', text: 'Tus cambios de perfil se guardaron localmente. Se subirán al servidor en cuanto recargues con conexión.' });
      } else {
        Swal.fire('Error', 'No se pudieron guardar los cambios. ' + (error.response?.data?.error || ''), 'error');
      }
    }
  };

  // PAGOS: Exige conexión, si falla el Axios, simplemente lanza error, NO se guarda localmente.
  const handlePagarPendiente = async (res) => {
    const { value: pagoConfirmado } = await Swal.fire({
      title: 'Completar pago pendiente',
      html: `
        <div style="text-align: left; margin-bottom: 15px;">
          <p style="margin: 0; color: #666;">Total a pagar por <b>${res.salon_nombre}</b>:</p>
          <h2 style="margin: 5px 0; color: #a855f7;">$${res.monto_total} MXN</h2>
        </div>
        <input id="swal-tarjeta" class="swal2-input" placeholder="Número de Tarjeta (16 dígitos)" type="text" maxlength="16" style="width: 85%;">
        <div style="display: flex; justify-content: center; gap: 10px;">
          <input id="swal-fecha" class="swal2-input" placeholder="MM/AA" type="text" maxlength="5" style="width: 40%;">
          <input id="swal-cvc" class="swal2-input" placeholder="CVC" type="password" maxlength="3" style="width: 40%;">
        </div>
      `,
      focusConfirm: false, showCancelButton: true, confirmButtonText: 'Pagar ahora', confirmButtonColor: '#a855f7',
      preConfirm: () => {
        const tarjeta = document.getElementById('swal-tarjeta').value;
        if (!tarjeta || tarjeta.length < 16) { Swal.showValidationMessage('Ingresa una tarjeta válida'); return false; }
        return true;
      }
    });

    if (pagoConfirmado) {
      try {
        Swal.fire({ title: 'Procesando...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        await axios.patch(`http://localhost:3000/api/reservas/${res.id}/pagar`);
        Swal.fire('¡Pago Exitoso!', 'Tu evento ha sido pagado correctamente.', 'success');
        setReservas(prev => prev.map(r => r.id === res.id ? { ...r, estado: 'pagada' } : r));
      } catch{
        Swal.fire('Error', 'El servidor no está disponible. No se pudo procesar el pago.', 'error');
      }
    }
  };

  // CANCELACIONES: Exige conexión, si falla, NO se guarda localmente.
  const handleCancelarReserva = async (id, nombreSalon) => {
    Swal.fire({
      title: '¿Estás seguro?', text: `Vas a cancelar tu reservación en ${nombreSalon}.`, icon: 'warning',
      showCancelButton: true, confirmButtonColor: '#dc2626', cancelButtonColor: '#6b7280', confirmButtonText: 'Sí, cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          Swal.fire({ title: 'Cancelando...', didOpen: () => Swal.showLoading() });
          const respuesta = await axios.patch(`http://localhost:3000/api/reservas/${id}/cancelar`);
          if (respuesta.status === 200) {
            setReservas(prev => prev.map(res => res.id === id ? { ...res, estado: 'cancelada' } : res));
            Swal.fire('Cancelada', 'Tu reservación ha sido cancelada.', 'success');
          }
        } catch { 
          Swal.fire('Error', 'El servidor no está disponible para procesar cancelaciones.', 'error'); 
        }
      }
    });
  };

  if (!usuario) return null;
  return (
    <div className="perfil-container">
      <div className="perfil-card">
        <div className="perfil-layout">
          <div className="perfil-avatar-seccion">
            <img src={usuario.foto_url || `https://ui-avatars.com/api/?name=${usuario.nombre_completo.replace(' ', '+')}&background=fff&color=a855f7&rounded=true`} alt="Foto" className="perfil-foto-grande" />
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
                  <label>Nombre Completo</label>
                  <input type="text" value={editNombre} onChange={(e)=>setEditNombre(e.target.value)} required />
                </div>
                <div className="campo-edicion">
                  <label>Correo Electrónico</label>
                  <input type="email" value={editCorreo} onChange={(e)=>setEditCorreo(e.target.value)} required />
                </div>
                <div className="campo-edicion">
                  <label>Teléfono</label>
                  <input type="tel" value={editTelefono} onChange={(e)=>setEditTelefono(e.target.value)} required />
                </div>
                <div className="campo-edicion">
                  <label>Nueva Contraseña (Opcional)</label>
                  <input type="password" placeholder="Déjalo en blanco para no cambiarla" value={editPassword} onChange={(e)=>setEditPassword(e.target.value)} />
                </div>
                <div className="campo-edicion">
                  <label>Foto de Perfil</label>
                  <input type="file" accept="image/*" onChange={handleSubirFoto} style={{ padding: '5px' }} />
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

      <div className="reservas-seccion">
        <h3>Mis Salones Reservados</h3>
        {cargandoReservas ? <p style={{ color: '#a855f7' }}>Cargando reservaciones reales...</p> : reservas.length === 0 ? <p className="no-reservas">No tienes reservas.</p> : (
          <div className="tabla-contenedor">
            <table className="tabla-reservas">
              <thead><tr><th>Salón</th><th>Fecha del Evento</th><th>Monto Total</th><th>Estado</th><th>Acciones</th></tr></thead>
              <tbody>
                {reservas.map((res) => {
                  const fechaEventoPura = res.fecha_evento.split('T')[0];
                  const eventoYaPaso = fechaEventoPura < fechaHoyStr;
                  return (
                    <tr key={res.id}>
                      <td><strong>{res.salon_nombre}</strong></td>
                      <td>{new Date(res.fecha_evento).toLocaleDateString('es-MX', { timeZone: 'UTC' })}</td>
                      <td>${res.monto_total.toLocaleString('es-MX')} MXN</td>
                      <td><span className={`estado-badge ${res.estado}`}>{res.estado}</span></td>
                      <td>
                        {eventoYaPaso ? (
                          <span style={{ color: '#6b7280', fontStyle: 'italic', fontSize: '0.9rem' }}>
                            {res.estado === 'pagada' ? '✅ Evento Finalizado' : '⏳ Caducada'}
                          </span>
                        ) : (
                          <>
                            {res.estado === 'pendiente' && (
                              <div style={{ display: 'flex', gap: '10px' }}>
                                <button onClick={() => handlePagarPendiente(res)} style={{ padding: '8px 15px', backgroundColor: '#a855f7', color: 'white', border: 'none', borderRadius: '15px', cursor: 'pointer', fontWeight: 'bold' }}>💳 Pagar</button>
                                <button onClick={() => handleCancelarReserva(res.id, res.salon_nombre)} style={{ padding: '8px 15px', backgroundColor: '#fee2e2', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '15px', cursor: 'pointer' }}>Cancelar</button>
                              </div>
                            )}
                            {res.estado === 'pagada' && (
                              <button onClick={() => handleCancelarReserva(res.id, res.salon_nombre)} style={{ padding: '8px 15px', backgroundColor: '#f3f4f6', color: '#666', border: '1px solid #ccc', borderRadius: '15px', cursor: 'pointer' }}>Cancelar Evento</button>
                            )}
                            {res.estado === 'cancelada' && <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Sin acciones</span>}
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Perfil;