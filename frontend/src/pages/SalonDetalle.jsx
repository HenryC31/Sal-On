import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import './SalonDetalle.css';

const SalonDetalle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [salon, setSalon] = useState(null);
  const [fecha, setFecha] = useState('');
  const [imgIndex, setImgIndex] = useState(0);
  
  const [resenas, setResenas] = useState([]);
  const [nuevaResena, setNuevaResena] = useState({ calificacion: 5, comentario: '' });

  useEffect(() => {
    const fetchSalon = async () => {
      try {
        const respuesta = await axios.get('http://localhost:3000/api/salones');
        const encontrado = respuesta.data.find(s => s.id.toString() === id);
        setSalon(encontrado);
      } catch (error) {
        console.error("Error trayendo los detalles:", error);
      }
    };

    const fetchResenas = async () => {
      try {
        const resp = await axios.get(`http://localhost:3001/api/resenas/${id}`);
        setResenas(resp.data);
      } catch (err) { console.error("Error al cargar reseñas", err); }
    };

    fetchSalon();
    fetchResenas();
  }, [id]);

  if (!salon) {
    return <h2 style={{ textAlign: 'center', marginTop: '50px', color: '#a855f7' }}>Cargando salón...</h2>;
  }

  const fotos = salon.imagenes && salon.imagenes.length > 0 
    ? salon.imagenes.slice(0, 10) 
    : ['https://via.placeholder.com/800x400/e0d4fc/a855f7?text=Sin+Fotos+A%C3%BAn'];

  const nextImg = () => setImgIndex((prev) => (prev + 1) % fotos.length);
  const prevImg = () => setImgIndex((prev) => (prev === 0 ? fotos.length - 1 : prev - 1));

  const handleReservar = async () => {
    const usuarioString = localStorage.getItem('salonUser');
    if (!usuarioString) {
      Swal.fire({ icon: 'warning', title: '¡Alto ahí!', text: 'Inicia sesión para reservar.', confirmButtonColor: '#a855f7' })
        .then(() => navigate('/login'));
      return;
    }

    if (!fecha) {
      Swal.fire({ icon: 'error', title: 'Falta la fecha', text: 'Selecciona una fecha.', confirmButtonColor: '#a855f7' });
      return;
    }

    const usuarioLogueado = JSON.parse(usuarioString);

    try {
      Swal.fire({ title: 'Bloqueando fecha...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
      const respuesta = await axios.post('http://localhost:3000/api/reservas', {
        salon_id: salon.id,
        cliente_id: usuarioLogueado.id,
        salon_nombre: salon.nombre,
        fecha_evento: fecha,
        monto_total: salon.precio_evento
      });

      if (respuesta.status === 201) {
        Swal.fire({ icon: 'success', title: '¡Reserva creada!', confirmButtonColor: '#a855f7' });
      }
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.error || 'Error al reservar', confirmButtonColor: '#a855f7' });
    }
  };

  const handleEnviarResena = async () => {
    const user = JSON.parse(localStorage.getItem('salonUser'));
    if (!user) return Swal.fire('Error', 'Debes iniciar sesión para comentar', 'error');

    try {
        await axios.post('http://localhost:3001/api/resenas', {
            salon_id: id,
            id_cliente: user.id,
            calificacion: nuevaResena.calificacion,
            comentario: nuevaResena.comentario
        });
        Swal.fire('¡Éxito!', 'Reseña publicada', 'success');
        window.location.reload(); 
    } catch (err) {
        Swal.fire('Error', 'No se pudo publicar la reseña', 'error');
    }
  };

  return (
    <div className="detalle-container">
      <div className="detalle-izq">
        <div className="carrusel-container">
          <img src={fotos[imgIndex]} alt="Carrusel" className="carrusel-img" />
          {fotos.length > 1 && (
            <>
              <button className="carrusel-btn left" onClick={prevImg}>‹</button>
              <button className="carrusel-btn right" onClick={nextImg}>›</button>
            </>
          )}
        </div>
        <h1 className="detalle-titulo">{salon.nombre}</h1>
        <p className="detalle-ubicacion">📍 {salon.direccion}, {salon.ciudad}</p>
        
        <div className="detalle-descripcion">
          <h3>Acerca de este lugar</h3>
          <p>{salon.descripcion}</p>
          <p><strong>Capacidad máxima:</strong> {salon.capacidad_max} personas.</p>
        </div>

        <div className="seccion-reseñas" style={{ marginTop: '40px' }}>
          <h3>Opiniones de usuarios</h3>
          {resenas.map(r => (
            <div key={r.id} style={{ borderBottom: '1px solid #ccc', padding: '10px 0' }}>
              <p><strong>{r.calificacion}⭐</strong> - {r.comentario}</p>
            </div>
          ))}
          
          <div className="form-reseña" style={{ marginTop: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Elige tu calificación:</label>
            <div style={{ fontSize: '30px', cursor: 'pointer', marginBottom: '10px' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  onClick={() => setNuevaResena({ ...nuevaResena, calificacion: star })}
                  style={{ color: star <= nuevaResena.calificacion ? '#ffc107' : '#e4e5e9', transition: 'color 0.2s', marginRight: '5px' }}
                >
                  ★
                </span>
              ))}
            </div>
            <textarea 
              placeholder="Escribe tu opinión..." 
              value={nuevaResena.comentario}
              onChange={(e) => setNuevaResena({...nuevaResena, comentario: e.target.value})} 
              style={{ display: 'block', width: '100%', height: '80px', padding: '10px', borderRadius: '5px' }}>
            </textarea>
            <button className="btn-confirmar" onClick={handleEnviarResena} style={{ marginTop: '10px' }}>Publicar Reseña</button>
          </div>
        </div>
      </div>

      <div className="detalle-der">
        <div className="reserva-card">
          <h2 className="precio-grande">${salon.precio_evento} <span style={{fontSize: '1rem', color: '#666'}}>MXN</span></h2>
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          <button className="btn-confirmar" onClick={handleReservar}>Confirmar Reservación</button>
        </div>
      </div>
    </div>
  );
};

export default SalonDetalle;