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
  
  // --- NUEVO: Estado para el carrusel ---
  const [imgIndex, setImgIndex] = useState(0);

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
    fetchSalon();
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
    // Extraemos el string del local storage
    const usuarioString = localStorage.getItem('salonUser');
    
    // Validamos si no hay sesión
    if (!usuarioString) {
      Swal.fire({
        icon: 'warning',
        title: '¡Alto ahí!',
        text: 'Necesitas iniciar sesión para poder apartar una fecha.',
        confirmButtonColor: '#a855f7'
      }).then(() => {
        navigate('/login');
      });
      return;
    }

    // Validamos si no puso fecha
    if (!fecha) {
      Swal.fire({
        icon: 'error',
        title: 'Falta la fecha',
        text: 'Por favor selecciona el día de tu evento en el calendario.',
        confirmButtonColor: '#a855f7'
      });
      return;
    }

    // Convertimos el string a un objeto de JavaScript para sacar el ID
    const usuarioLogueado = JSON.parse(usuarioString);

    try {
      // Mostramos una alerta bonita de "Cargando" mientras el microservicio hace lo suyo
      Swal.fire({
        title: 'Procesando reservación...',
        text: 'Estamos validando la disponibilidad de tu fecha.',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      // Conectamos al API Gateway con los datos estructurados
      const respuesta = await axios.post('http://localhost:3000/api/reservas', {
        salon_id: salon.id,
        cliente_id: usuarioLogueado.id, // Sacamos el ID del usuario de la sesión
        fecha_evento: fecha,
        monto_total: salon.precio_evento
      });

      // Si el backend nos responde 201 es que todo salió bien y mostramos la alerta de éxito
      if (respuesta.status === 201) {
        Swal.fire({
          icon: 'success',
          title: '¡Reservación Exitosa!',
          text: `Ya quedó apartado el salón para el ${fecha}. ¡A mandar las invitaciones!`,
          confirmButtonColor: '#a855f7'
        }).then(() => {
          navigate('/'); // Lo regresamos al Home
        });
      }
      
    } catch (error) {
      console.error("Error al reservar:", error);
      
      // Si la fecha ya estaba ocupada, el backend mandará error 400 y lo atrapamos aquí
      Swal.fire({
        icon: 'error',
        title: 'Fecha no disponible',
        text: error.response?.data?.error || 'Hubo un problema al procesar la reserva. Intenta de nuevo.',
        confirmButtonColor: '#a855f7'
      });
    }
  };

return (
    <div className="detalle-container">
      <div className="detalle-izq">
        
        {/* --- NUEVO: Renderizado del Carrusel Visual --- */}
        <div className="carrusel-container">
          <img src={fotos[imgIndex]} alt={`Foto de ${salon.nombre}`} className="carrusel-img" />
          
          {/* Solo mostramos las flechas si hay más de 1 foto */}
          {fotos.length > 1 && (
            <>
              <button className="carrusel-btn left" onClick={prevImg}>‹</button>
              <button className="carrusel-btn right" onClick={nextImg}>›</button>
              <div className="carrusel-indicadores">
                {fotos.map((_, i) => (
                  <span 
                    key={i} 
                    className={`punto ${i === imgIndex ? 'activo' : ''}`} 
                    onClick={() => setImgIndex(i)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
        <h1 className="detalle-titulo">{salon.nombre}</h1>
        <p className="detalle-ubicacion">📍 {salon.direccion}, {salon.ciudad}</p>
        
        <div className="detalle-descripcion">
          <h3>Acerca de este lugar</h3>
          <p>{salon.descripcion}</p>
          <p><strong>Capacidad máxima:</strong> {salon.capacidad} personas.</p>
        </div>

        <h3>Amenidades incluidas</h3>
        <ul className="amenidades-lista">
          {salon.amenidades && salon.amenidades.map((amenidad, index) => (
            <li key={index}>✨ {amenidad}</li>
          ))}
        </ul>
      </div>

      {/*Tarjeta de reservación */}
      <div className="detalle-der">
        <div className="reserva-card">
          <h2 className="precio-grande">${salon.precio_evento} <span style={{fontSize: '1rem', color: '#666', fontWeight: 'normal'}}>MXN / evento</span></h2>
          
          <div className="form-reserva">
            <label style={{fontWeight: 'bold', color: '#555'}}>Selecciona tu fecha</label>
            <input 
              type="date" 
              className="input-reserva"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
            
            <button className="btn-confirmar" onClick={handleReservar}>
              Confirmar Reservación
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalonDetalle;