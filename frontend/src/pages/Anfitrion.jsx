import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { supabase } from '../supabaseClient';
import './Perfil.css'; 

const Anfitrion = () => {
  const [usuario] = useState(() => JSON.parse(localStorage.getItem('salonUser')));
  
  const [misSalones, setMisSalones] = useState([]);
  const [misReservas, setMisReservas] = useState([]);
  // El catálogo oficial de amenidades de Sal-ON
  const opcionesAmenidades = ['Aire libre', 'Alberca', 'Aire acondicionado', 'Asador', 'Área de juegos'];
  // Estados para el formulario de nuevo salón
  const [formSalon, setFormSalon] = useState({
    nombre: '', direccion: '', descripcion: '', capacidad_max: '', precio_evento: '', amenidades: [] 
  });
  const [archivos, setArchivos] = useState([]);

  useEffect(() => {
    if (!usuario) return;
    
    // Traer los salones de este anfitrión
    const fetchMisSalones = async () => {
      try {
        const respuesta = await axios.get('http://localhost:3000/api/salones');
        const filtrados = respuesta.data.filter(s => s.anfitrion_id === usuario.id);
        setMisSalones(filtrados);
      } catch (error) {
        console.error("Error trayendo mis salones:", error);
      }
    };

    // Traer las reservaciones hechas a los salones de este anfitrión
    const fetchMisReservas = async () => {
      try {
        const respuesta = await axios.get(`http://localhost:3000/api/reservas/anfitrion/${usuario.id}`);
        setMisReservas(respuesta.data);
      } catch (error) {
        console.error("Error trayendo mis reservas:", error);
      }
    };

    fetchMisSalones();
    fetchMisReservas();
  }, [usuario]);

  const handleInputChange = (e) => {
    setFormSalon({ ...formSalon, [e.target.name]: e.target.value });
  };

  const handleCheckboxChange = (e) => {
    const { value, checked } = e.target;
    if (checked) {
      // Si lo marca, lo agregamos al arreglo
      setFormSalon({ ...formSalon, amenidades: [...formSalon.amenidades, value] });
    } else {
      // Si lo desmarca, lo sacamos del arreglo
      setFormSalon({ ...formSalon, amenidades: formSalon.amenidades.filter(a => a !== value) });
    }
  };

  const handleRegistrarSalon = async (e) => {
    e.preventDefault();
    
    if (archivos.length === 0) {
      return Swal.fire('Faltan fotos', 'Sube al menos una foto de tu salón.', 'warning');
    }

    try {
      Swal.fire({ title: 'Registrando salón...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

      // Subir las fotos a Supabase Storage
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

      const nuevoSalon = {
        ...formSalon,
        capacidad_max: Number(formSalon.capacidad_max),
        precio_evento: Number(formSalon.precio_evento),
        anfitrion_id: usuario.id,
        imagenes: linksImagenes
      };

      // API Gateway 
      const respuesta = await axios.post('http://localhost:3000/api/salones', nuevoSalon);

      if (respuesta.status === 201) {
        setMisSalones([...misSalones, respuesta.data.salon]);
        setFormSalon({ nombre: '', direccion: '', descripcion: '', capacidad_max: '', precio_evento: '', amenidades: '' });
        setArchivos([]);
        
        Swal.fire({ icon: 'success', title: '¡Éxito!', text: 'Tu salón ya está en el catálogo.' });
      }
    } catch (error) {
      console.error(error);
      Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo registrar el salón.' });
    }
  };

  if (!usuario || (usuario.rol !== 'arrendador' && usuario.rol !== 'admin')) {
    return <h2 style={{textAlign: 'center', marginTop: '50px', color: '#dc2626'}}>Acceso denegado. Solo para anfitriones.</h2>;
  }

  return (
    <div className="perfil-container">
      <h1 style={{color: '#1e1b4b'}}>Panel de Anfitrión</h1>
      
      {/* Formulario para agregar salón */}
      <div className="perfil-card">
        <h3>Registrar Nuevo Salón</h3>
        <form onSubmit={handleRegistrarSalon} className="form-editar-perfil" style={{maxWidth: '100%'}}>
          <div style={{display: 'flex', gap: '15px', flexWrap: 'wrap'}}>
            <div className="campo-edicion" style={{flex: '1 1 45%'}}>
              <label>Nombre del Salón</label>
              <input name="nombre" value={formSalon.nombre} onChange={handleInputChange} required />
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
            <div className="campo-edicion" style={{flex: '1 1 100%'}}>
              <label>Fotos del Salón</label>
              <input type="file" multiple accept="image/*" onChange={(e) => setArchivos(Array.from(e.target.files))} required />
            </div>
          </div>
          <button type="submit" className="btn-guardar-edicion" style={{marginTop: '20px'}}>Publicar Salón</button>
        </form>
      </div>

      {/* Mis Salones */}
      <div className="perfil-card">
        <h3>Mis Salones Publicados</h3>
        {misSalones.length === 0 ? <p>No has publicado locales aún.</p> : (
          <ul style={{listStyle: 'none', padding: 0}}>
            {misSalones.map(s => (
              <li key={s.id} style={{padding: '10px', borderBottom: '1px solid #eee'}}>
                <strong>{s.nombre}</strong> - ${s.precio_evento} MXN (Capacidad: {s.capacidad_max})
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