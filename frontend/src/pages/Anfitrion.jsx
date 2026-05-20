import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { supabase } from '../supabaseClient';
import { ESTADO_SIMULADO, CIUDAD_SIMULADA } from '../config';
import { db } from '../localDb'; // Réplica local de IndexedDB
import './Perfil.css'; 

const Anfitrion = () => {
  const [usuario] = useState(() => JSON.parse(localStorage.getItem('salonUser')));
  
  const [misSalones, setMisSalones] = useState([]);
  const [misReservas, setMisReservas] = useState([]);
  const [archivos, setArchivos] = useState([]);
  
  const [modoEdicion, setModoEdicion] = useState(false);
  const [salonEditandoId, setSalonEditandoId] = useState(null);
  const [imagenesExistentes, setImagenesExistentes] = useState([]);
  const [modoOffline, setModoOffline] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false); // Estado para controlar el acordeón

  const opcionesAmenidades = ['Aire libre', 'Alberca', 'Aire acondicionado', 'Asador', 'Área de juegos'];
  
  const ubicacionesMexico = {
    "Baja California Sur": ["La Paz"],
    "Nuevo León": ["Monterrey"],
    "Jalisco": ["Guadalajara"]
  };
  const listaEstados = Object.keys(ubicacionesMexico);
  
  const [formSalon, setFormSalon] = useState({
    nombre: '', 
    direccion: '', 
    estado: ESTADO_SIMULADO,
    ciudad: CIUDAD_SIMULADA, 
    descripcion: '', 
    capacidad_max: '', 
    precio_evento: '', 
    amenidades: [] 
  });

  const handleEstadoChange = (e) => {
    const nuevoEstado = e.target.value;
    setFormSalon({
      ...formSalon,
      estado: nuevoEstado,
      ciudad: ubicacionesMexico[nuevoEstado][0] 
    });
  };

  useEffect(() => {
    if (!usuario) return;
    
    const cargarDatos = async () => {
      try {
        const resSalones = await axios.get('http://localhost:3000/api/salones');
        const resReservas = await axios.get(`http://localhost:3000/api/reservas/anfitrion/${usuario.id}`);

        const misSalonesFiltrados = resSalones.data.filter(s => s.anfitrion_id === usuario.id);

        setMisSalones(misSalonesFiltrados);
        setMisReservas(resReservas.data);
        setModoOffline(false);

        const salonesLimpios = misSalonesFiltrados.filter(s => s && s.id);
        await db.salones.bulkPut(salonesLimpios);

        const reservasLimpias = resReservas.data.filter(r => r && r.id);
        await db.mis_reservas.bulkPut(reservasLimpias);

      } catch (error) {
        console.error("Modo Offline activado:", error);
        setModoOffline(true);

        const salonesLocales = await db.salones.toArray();
        setMisSalones(salonesLocales.filter(s => s.anfitrion_id === usuario.id));

        const reservasLocales = await db.mis_reservas.toArray();
        setMisReservas(reservasLocales);

        Swal.fire({
          icon: 'warning',
          title: 'Conexión Perdida',
          text: 'Trabajando con caché local (Solo Lectura).',
          toast: true, position: 'top-end', showConfirmButton: false, timer: 4000
        });
      }
    };

    cargarDatos();
  }, [usuario]);

  const handleInputChange = (e) => {
    setFormSalon({ ...formSalon, [e.target.name]: e.target.value });
  };

  const handleCheckboxChange = (e) => {
    const { value, checked } = e.target;
    if (checked) {
      setFormSalon({ ...formSalon, amenidades: [...formSalon.amenidades, value] });
    } else {
      setFormSalon({ ...formSalon, amenidades: formSalon.amenidades.filter(a => a !== value) });
    }
  };

  const activarEdicion = (salon) => {
    setMostrarFormulario(true); // Se despliega automáticamente al presionar editar
    setModoEdicion(true);
    setSalonEditandoId(salon.id);
    setImagenesExistentes(salon.imagenes || []);
    
    let estadoEncontrado = ESTADO_SIMULADO;
    for (const [estado, ciudades] of Object.entries(ubicacionesMexico)) {
      if (ciudades.includes(salon.ciudad)) {
        estadoEncontrado = estado;
        break;
      }
    }

    setFormSalon({
      nombre: salon.nombre,
      estado: estadoEncontrado,
      ciudad: salon.ciudad,
      direccion: salon.direccion,
      descripcion: salon.descripcion,
      capacidad_max: salon.capacidad_max,
      precio_evento: salon.precio_evento,
      amenidades: salon.amenidades || []
    });
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelarEdicion = () => {
    setModoEdicion(false);
    setSalonEditandoId(null);
    setImagenesExistentes([]);
    setFormSalon({ nombre: '', direccion: '', estado: ESTADO_SIMULADO, ciudad: CIUDAD_SIMULADA, descripcion: '', capacidad_max: '', precio_evento: '', amenidades: [] });
    setMostrarFormulario(false); // Se vuelve a colapsar
  };

  const handleEliminarImagenExistente = (urlEliminar) => {
    setImagenesExistentes(imagenesExistentes.filter(url => url !== urlEliminar));
  };

  const handleRegistrarSalon = async (e) => {
    e.preventDefault();
    
    if (!modoEdicion && archivos.length === 0) {
      return Swal.fire('Faltan fotos', 'Sube al menos una foto de tu salón.', 'warning');
    }
    if (modoEdicion && imagenesExistentes.length === 0 && archivos.length === 0) {
      return Swal.fire('Sin fotos', 'El salón no puede quedarse sin imágenes.', 'warning');
    }

    try {
      Swal.fire({ title: modoEdicion ? 'Actualizando salón...' : 'Registrando salón...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

      const linksImagenes = [];
      for (const archivo of archivos) {
        const fileExt = archivo.name.split('.').pop();
        const fileName = `salon_${usuario.id}_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `public/${fileName}`;

        const { error: uploadError } = await supabase.storage.from('salones').upload(filePath, archivo);
        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('salones').getPublicUrl(filePath);
        linksImagenes.push(data.publicUrl);
      }

      if (modoEdicion) {
        const respuesta = await axios.put(`http://localhost:3000/api/salones/${salonEditandoId}`, {
          ...formSalon,
          capacidad_max: Number(formSalon.capacidad_max),
          precio_evento: Number(formSalon.precio_evento),
          imagenes: [...imagenesExistentes, ...linksImagenes]
        });

        if (respuesta.status === 200) {
          setMisSalones(misSalones.map(s => s.id === salonEditandoId ? respuesta.data.salon : s));
          cancelarEdicion();
          setArchivos([]);
          Swal.fire({ icon: 'success', title: 'Actualizado', text: 'Tus cambios e imágenes se han guardado.' });
        }
      } else {
        const nuevoSalon = {
          ...formSalon,
          capacidad_max: Number(formSalon.capacidad_max),
          precio_evento: Number(formSalon.precio_evento),
          anfitrion_id: usuario.id,
          imagenes: linksImagenes
        };

        const respuesta = await axios.post('http://localhost:3000/api/salones', nuevoSalon);

        if (respuesta.status === 201) {
          setMisSalones([...misSalones, respuesta.data.salon]);
          cancelarEdicion();
          setArchivos([]);
          Swal.fire({ icon: 'success', title: '¡Éxito!', text: 'Tu salón ya está en el catálogo.' });
        }
      }
    } catch (error) {
      console.error(error);
      Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo procesar la solicitud.' });
    }
  };

  const handleEliminarSalon = async (salon) => {
    const confirmacion = await Swal.fire({
      title: '¿Estás seguro?',
      text: `Vas a eliminar "${salon.nombre}". Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#9ca3af',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (confirmacion.isConfirmed) {
      try {
        Swal.fire({ title: 'Eliminando...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        
        const respuesta = await axios.delete(`http://localhost:3000/api/salones/${salon.id}?ciudad=${salon.ciudad}`);
        
        if (respuesta.status === 200) {
          setMisSalones(misSalones.filter(s => s.id !== salon.id));
          Swal.fire('¡Eliminado!', 'El salón ha sido borrado del sistema distribuido.', 'success');
        }
      } catch (error) {
        console.error(error);
        Swal.fire('Error', 'No se pudo eliminar el salón.', 'error');
      }
    }
  };

  if (!usuario || (usuario.rol !== 'arrendador' && usuario.rol !== 'admin')) {
    return <h2 style={{textAlign: 'center', marginTop: '50px', color: '#dc2626'}}>Acceso denegado. Solo para anfitriones.</h2>;
  }

  return (
    <div className="perfil-container">
      <h1 style={{color: '#1e1b4b'}}>Panel de Anfitrión</h1>

      {modoOffline && (
        <div style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '10px', textAlign: 'center', borderRadius: '8px', marginBottom: '15px', fontWeight: 'bold' }}>
          ⚠️ MODO OFFLINE ACTIVADO: Viendo caché local. Las funciones de edición están pausadas.
        </div>
      )}
      
      {/* CARD DEL FORMULARIO CON ACORDEÓN INTEGRADO */}
      <div className="perfil-card">
        <div 
          onClick={() => setMostrarFormulario(!mostrarFormulario)}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', paddingBottom: mostrarFormulario ? '15px' : '0', borderBottom: mostrarFormulario ? '1px solid #eee' : 'none' }}
        >
          <h3 style={{ margin: 0, color: '#4338ca' }}>
            {modoEdicion ? 'Editar Salón' : 'Registrar Nuevo Salón'}
          </h3>
          <span style={{ fontSize: '1.2rem', color: '#a855f7', transform: mostrarFormulario ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}>
            ▼
          </span>
        </div>

        {/* El formulario solo se renderiza si mostrarFormulario es true */}
        {mostrarFormulario && (
          <form onSubmit={handleRegistrarSalon} className="form-editar-perfil" style={{maxWidth: '100%', marginTop: '20px'}}>
            <div style={{display: 'flex', gap: '15px', flexWrap: 'wrap'}}>
              <div className="campo-edicion" style={{flex: '1 1 45%'}}>
                <label>Nombre del Salón</label>
                <input name="nombre" value={formSalon.nombre} onChange={handleInputChange} required />
              </div>
              <div className="campo-edicion" style={{flex: '1 1 20%'}}>
                <label>Estado</label>
                <select 
                  value={formSalon.estado} 
                  onChange={handleEstadoChange} 
                  required
                  disabled={modoEdicion}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontFamily: 'inherit', color: '#555', backgroundColor: modoEdicion ? '#f3f4f6' : 'white' }}
                >
                  {listaEstados.map((estado) => (
                    <option key={estado} value={estado}>{estado}</option>
                  ))}
                </select>
              </div>
              <div className="campo-edicion" style={{flex: '1 1 20%'}}>
                <label>Ciudad</label>
                <select 
                  name="ciudad" 
                  value={formSalon.ciudad} 
                  onChange={handleInputChange} 
                  required
                  disabled={modoEdicion}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontFamily: 'inherit', color: '#555', backgroundColor: modoEdicion ? '#f3f4f6' : 'white' }}
                >
                {ubicacionesMexico[formSalon.estado].map((ciudad) => (
                  <option key={ciudad} value={ciudad}>{ciudad}</option>
                ))}
                </select>
              </div>

              <div className="campo-edicion" style={{flex: '1 1 45%'}}>
                <label>Dirección</label>
                <input name="direccion" value={formSalon.direccion} onChange={handleInputChange} required />
              </div>
              <div className="campo-edicion" style={{flex: '1 1 100%'}}>
                <label>Descripción</label>
                <input name="descripcion" value={formSalon.descripcion} onChange={handleInputChange} required />
              </div>
              <div className="campo-edicion" style={{flex: '1 1 30%'}}>
                <label>Capacidad Máxima</label>
                <input type="number" name="capacidad_max" value={formSalon.capacidad_max} onChange={handleInputChange} required />
              </div>
              <div className="campo-edicion" style={{flex: '1 1 30%'}}>
                <label>Precio por Evento (MXN)</label>
                <input type="number" name="precio_evento" value={formSalon.precio_evento} onChange={handleInputChange} required />
              </div>
              <div className="campo-edicion" style={{flex: '1 1 100%'}}>
              <label style={{ marginBottom: '10px', display: 'block' }}>Amenidades Incluidas</label>
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                  {opcionesAmenidades.map((amenidad) => (
                    <label key={amenidad} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'normal' }}>
                      <input
                        type="checkbox"
                        value={amenidad}
                        checked={formSalon.amenidades.includes(amenidad)}
                        onChange={handleCheckboxChange}
                        style={{ width: 'auto', margin: 0, cursor: 'pointer' }}
                      />
                      {amenidad}
                    </label>
                  ))}
                </div>
              </div>

              {/* Panel de fotos existentes */}
              {modoEdicion && imagenesExistentes.length > 0 && (
                <div className="campo-edicion" style={{ flex: '1 1 100%', marginBottom: '15px' }}>
                  <label style={{ fontWeight: '600', color: '#4338ca' }}>Fotos actuales del salón (Haz clic en la ✕ para eliminar)</label>
                  <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginTop: '10px' }}>
                    {imagenesExistentes.map((url, idx) => (
                      <div key={idx} style={{ position: 'relative', width: '110px', height: '110px', boxShadow: '0 2px 5px rgba(0,0,0,0.15)', borderRadius: '8px' }}>
                        <img 
                          src={url} 
                          alt="Vista previa" 
                          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} 
                        />
                        <button
                          type="button"
                          onClick={() => handleEliminarImagenExistente(url)}
                          style={{
                            position: 'absolute', top: '-6px', right: '-6px',
                            backgroundColor: '#ef4444', color: 'white', border: 'none',
                            borderRadius: '50%', width: '22px', height: '22px',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '11px', fontWeight: 'bold', boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="campo-edicion" style={{flex: '1 1 100%'}}>
                <label>{modoEdicion ? "Agregar más fotos al salón" : "Fotos del Salón"}</label>
                <input type="file" multiple accept="image/*" onChange={(e) => setArchivos(Array.from(e.target.files))} />
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '30px', width: '100%', display: 'flex', justifyContent: 'center', gap: '15px' }}>
              {modoEdicion && (
                <button type="button" onClick={cancelarEdicion} style={{ padding: '12px 20px', borderRadius: '25px', backgroundColor: '#9ca3af', color: 'white', border: 'none', cursor: 'pointer' }}>
                  Cancelar
                </button>
              )}
              <button type="submit" className="btn-guardar-edicion" style={{ padding: '12px 40px', fontSize: '1rem', borderRadius: '25px' }}>
                {modoEdicion ? 'Guardar Cambios' : 'Publicar Salón'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Mis Salones */}
      <div className="perfil-card">
        <h3>Mis Salones Publicados</h3>
        {misSalones.length === 0 ? <p>No has publicado locales aún.</p> : (
          <ul style={{listStyle: 'none', padding: 0}}>
            {misSalones.map(s => (
              <li key={s.id} style={{padding: '15px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <div>
                  <strong>{s.nombre}</strong> - ${s.precio_evento} MXN <br/>
                  <small style={{color: '#666'}}>📍 {s.ciudad} | 👥 Capacidad: {s.capacidad_max}</small>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    onClick={() => activarEdicion(s)}
                    style={{ padding: '8px 15px', borderRadius: '15px', backgroundColor: '#e2e8f0', border: 'none', cursor: 'pointer' }}
                  >
                    ✏️ Editar
                  </button>
                  <button 
                    type="button"
                    onClick={() => handleEliminarSalon(s)}
                    style={{ padding: '8px 15px', borderRadius: '15px', backgroundColor: '#fee2e2', color: '#ef4444', border: 'none', cursor: 'pointer' }}
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Mis Reservas recibidas */}
      <div className="reservas-seccion">
        <h3>Calendario de Clientes (Reservas Recibidas)</h3>
        {misReservas.length === 0 ? <p className="no-reservas">Aún no tienes reservaciones.</p> : (
          <div className="tabla-contenedor">
            <table className="tabla-reservas">
              <thead>
                <tr>
                  <th>Salón</th>
                  <th>Fecha Solicitada</th>
                  <th>Monto a Recibir</th>
                  <th>Estado del Pago</th>
                </tr>
              </thead>
              <tbody>
                {misReservas.map((res) => (
                  <tr key={res.id}>
                    <td><strong>{res.salon_nombre}</strong></td>
                    <td>{new Date(res.fecha_evento).toLocaleDateString('es-MX', { timeZone: 'UTC' })}</td>
                    <td>${res.monto_total.toLocaleString('es-MX')}</td>
                    <td><span className={`estado-badge ${res.estado}`}>{res.estado}</span></td>
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

export default Anfitrion;