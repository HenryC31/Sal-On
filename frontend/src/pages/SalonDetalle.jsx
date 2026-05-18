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
    const usuarioString = localStorage.getItem('salonUser');
    if (!usuarioString) {
      Swal.fire({
        icon: 'warning',
        title: '¡Alto ahí!',
        text: 'Necesitas iniciar sesión para poder apartar una fecha.',
        confirmButtonColor: '#a855f7'
      }).then(() => navigate('/login'));
      return;
    }

    if (!fecha) {
      Swal.fire({
        icon: 'error',
        title: 'Falta la fecha',
        text: 'Por favor selecciona el día de tu evento en el calendario.',
        confirmButtonColor: '#a855f7'
      });
      return;
    }

    const usuarioLogueado = JSON.parse(usuarioString);

    try {
      Swal.fire({ title: 'Bloqueando fecha...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

      const respuesta = await axios.post('http://localhost:3000/api/reservas', {
        salon_id: salon.id,
        cliente_id: usuarioLogueado.id,
        fecha_evento: fecha,
        monto_total: salon.precio_evento
      });

      if (respuesta.status === 201) {
        const idReserva = respuesta.data.reserva_id;

        const { isConfirmed } = await Swal.fire({
          title: '💳 Pasarela de Pagos',
          html: `
            <div style="text-align: left; margin-bottom: 15px;">
              <p>Total a pagar: <strong style="font-size: 1.2rem; color: #10b981;">$${salon.precio_evento.toLocaleString('es-MX')} MXN</strong></p>
            </div>
            <input id="swal-tarjeta" class="swal2-input" placeholder="Número de Tarjeta (16 dígitos)" type="text" maxlength="16" style="margin-bottom: 10px; width: 85%;">
            <div style="display: flex; gap: 10px; justify-content: center;">
              <input id="swal-fecha" class="swal2-input" placeholder="MM/AA" type="text" maxlength="5" style="width: 40%; margin: 0;">
              <input id="swal-cvv" class="swal2-input" placeholder="CVV" type="password" maxlength="3" style="width: 40%; margin: 0;">
            </div>
          `,
          focusConfirm: false,
          showCancelButton: true,
          confirmButtonText: 'Pagar ahora',
          cancelButtonText: 'Pagar después',
          confirmButtonColor: '#10b981', // Verde para transmitir seguridad
          cancelButtonColor: '#6b7280',
          preConfirm: () => {
            const tarjeta = document.getElementById('swal-tarjeta').value;
            if (!tarjeta || tarjeta.length < 16) {
              Swal.showValidationMessage('Por favor ingresa una tarjeta válida de 16 dígitos');
              return false;
            }
            return true;
          }
        });

        // 3. Evaluar qué decidió el usuario
        if (isConfirmed) {
          // Simulamos el tiempo que tarda el banco en responder (2 segundos)
          Swal.fire({ 
            title: 'Procesando pago...', 
            text: 'Conectando con el banco, no cierres esta ventana',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading() 
          });
          
          await new Promise(resolve => setTimeout(resolve, 2000));
          await axios.patch(`http://localhost:3000/api/reservas/${idReserva}/pagar`);

          Swal.fire({
            icon: 'success',
            title: '¡Pago Aprobado!',
            text: 'Tu recibo ha sido generado y la fecha está 100% confirmada.',
            confirmButtonColor: '#a855f7'
          }).then(() => navigate('/perfil'));

        } else {
          // Si le dio a "Cancelar" o cerró el modal, se queda como 'pendiente'
          Swal.fire({
            icon: 'info',
            title: 'Reserva Pendiente',
            text: 'La fecha está apartada. Tienes 24 horas para realizar el pago desde tu Perfil antes de que se libere el salón.',
            confirmButtonColor: '#a855f7'
          }).then(() => navigate('/perfil'));
        }
      }
    } catch (error) {
      console.error("Error al reservar:", error);
      Swal.fire({
        icon: 'error',
        title: 'Fecha no disponible',
        text: error.response?.data?.error || 'Hubo un problema al procesar la reserva.',
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