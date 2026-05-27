import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { es } from 'date-fns/locale'; // <-- CORRECCIÓN DE IMPORTACIÓN
registerLocale('es', es);
import './SalonDetalle.css';

const SalonDetalle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [usuarioLogueado] = useState(() => JSON.parse(localStorage.getItem('salonUser')));
  
  const [salon, setSalon] = useState(null);
  const [fecha, setFecha] = useState(null);
  const [imgIndex, setImgIndex] = useState(0);
  
  const [resenas, setResenas] = useState([]);
  const [nuevaResena, setNuevaResena] = useState({ calificacion: 5, comentario: '' });

  const [haRentado, setHaRentado] = useState(false);
  const esAnfitrion = usuarioLogueado && salon && usuarioLogueado.id === salon.anfitrion_id;
  const yaComento = resenas.some(r => r.cliente_id === usuarioLogueado?.id);

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
        const resp = await axios.get(`http://localhost:3000/api/resenas/${id}`);
        setResenas(resp.data);
      } catch (err) { console.error("Error al cargar reseñas", err); }
    };

    const fetchReservasUsuario = async () => {
      if (usuarioLogueado && id) {
        try {
          const res = await axios.get(`http://localhost:3000/api/reservas/cliente/${usuarioLogueado.id}`);
          // Verificamos si el usuario tiene una reserva PAGADA en este salón
          const rentoEsteSalon = res.data.some(r => r.salon_id === id && r.estado === 'pagada');
          setHaRentado(rentoEsteSalon);
        } catch (err) {
          console.error("Error verificando reservas:", err);
        }
      }
    };

    fetchSalon();
    fetchResenas();
    fetchReservasUsuario();
    }, [id, usuarioLogueado?.id]);

  if (!salon) {
    return <h2 style={{ textAlign: 'center', marginTop: '50px', color: '#a855f7' }}>Cargando salón...</h2>;
  }

  const fotos = salon.imagenes && salon.imagenes.length > 0 
    ? salon.imagenes.slice(0, 10) 
    : ['https://via.placeholder.com/800x400/e0d4fc/a855f7?text=Sin+Fotos+A%C3%BAn'];

  const nextImg = () => setImgIndex((prev) => (prev + 1) % fotos.length);
  const prevImg = () => setImgIndex((prev) => (prev === 0 ? fotos.length - 1 : prev - 1));

  // --- FLUJO DE RESERVA Y PAGO SIMULADO ---
  const handleReservar = async () => {
    if (!usuarioLogueado) {
      Swal.fire({ icon: 'warning', title: '¡Alto ahí!', text: 'Inicia sesión para reservar.', confirmButtonColor: '#a855f7' })
        .then(() => navigate('/login'));
      return;
    }

    if (!fecha) {
      Swal.fire({ icon: 'error', title: 'Falta la fecha', text: 'Selecciona una fecha.', confirmButtonColor: '#a855f7' });
      return;
    }

    // CORRECCIÓN: Extracción de fecha local a prueba de balas para evitar desfases de Zona Horaria
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    const fechaFormateada = `${year}-${month}-${day}`;

    try {
      Swal.fire({ title: 'Bloqueando fecha...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
      
      // Creamos la reserva (Nace como 'pendiente')
      const resReserva = await axios.post('http://localhost:3000/api/reservas', {
        salon_id: salon.id,
        cliente_id: usuarioLogueado.id,
        salon_nombre: salon.nombre,
        fecha_evento: fechaFormateada,
        monto_total: salon.precio_evento
      });

      const reservaId = resReserva.data.reserva_id;

      // Simulador de Pago 
      const { value: pagoConfirmado } = await Swal.fire({
        title: 'Completa tu reservación',
        html: `
          <div style="text-align: left; margin-bottom: 15px;">
            <p style="margin: 0; color: #666;">Total a pagar:</p>
            <h2 style="margin: 5px 0; color: #a855f7;">$${salon.precio_evento} MXN</h2>
          </div>
          <input id="swal-tarjeta" class="swal2-input" placeholder="Número de Tarjeta (16 dígitos)" type="text" maxlength="16" style="width: 85%;">
          <div style="display: flex; justify-content: center; gap: 10px;">
            <input id="swal-fecha" class="swal2-input" placeholder="MM/AA" type="text" maxlength="5" style="width: 40%;">
            <input id="swal-cvc" class="swal2-input" placeholder="CVC" type="password" maxlength="3" style="width: 40%;">
          </div>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Pagar ahora',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#a855f7',
        preConfirm: () => {
          const tarjeta = document.getElementById('swal-tarjeta').value;
          if (!tarjeta || tarjeta.length < 16) {
            Swal.showValidationMessage('Por favor ingresa una tarjeta válida');
            return false;
          }
          return true;
        }
      });

      if (pagoConfirmado) {
        // Actualizamos a 'pagada'
        await axios.patch(`http://localhost:3000/api/reservas/${reservaId}/pagar`);
        Swal.fire('¡Pago Exitoso!', 'Tu evento ha sido reservado y pagado correctamente.', 'success');
        setHaRentado(true); // Se habilita la opción de reseñar automáticamente
      } else {
        Swal.fire('Reserva pendiente', 'No se completó el pago. Podrás completarlo desde tu perfil.', 'info');
      }

    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Escoge otra fecha', text: error.response?.data?.error || 'El salón ya está ocupado esa fecha.', confirmButtonColor: '#a855f7' });
    }
  };

const handleEnviarResena = async () => {
    if (!usuarioLogueado) return Swal.fire('Error', 'Debes iniciar sesión para comentar', 'error');

    try {
        await axios.post('http://localhost:3000/api/resenas', {
            salon_id: id,
            id_cliente: usuarioLogueado.id,
            calificacion: nuevaResena.calificacion,
            comentario: nuevaResena.comentario
        });
        Swal.fire('¡Éxito!', 'Reseña publicada', 'success');
        window.location.reload(); 
    } catch {
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
          {resenas.length === 0 ? (
            <p style={{ color: '#666' }}>Aún no hay reseñas para este salón.</p>
          ) : (
            resenas.map(r => (
              <div key={r.id} style={{ borderBottom: '1px solid #ccc', padding: '10px 0' }}>
                <p style={{ margin: '0 0 5px 0' }}>
                  <strong>{r.calificacion} ⭐ - {r.cliente_nombre || 'Cliente Anónimo'}</strong>
                </p>
                <p style={{ margin: 0, color: '#555' }}>{r.comentario}</p>
              </div>
            ))
          )}
          
          {/*Revisa que el anfitrión no vote su propio salón y que se haya rentado para mostrar el formulario de reseña.*/}
          {/*Sólo se permite una reseña por cliente por salón, si ya comentó no se muestra el formulario nuevamente.*/}
          {!esAnfitrion && haRentado ? (
            yaComento ? (
              <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#ecfdf5', borderRadius: '10px', color: '#059669', fontWeight: 'bold', textAlign: 'center', border: '1px solid #10b981' }}>
                ✅ Ya dejaste tu opinión sobre este salón. ¡Gracias por compartir tu experiencia!
              </div>
            ) : (
              <div className="form-reseña" style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f9fafb', borderRadius: '15px' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', color: '#1e1b4b' }}>Califica tu experiencia:</label>
                <div style={{ fontSize: '35px', cursor: 'pointer', marginBottom: '15px' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      onClick={() => setNuevaResena({ ...nuevaResena, calificacion: star })}
                      style={{ color: star <= nuevaResena.calificacion ? '#ffc107' : '#e5e7eb', transition: 'color 0.2s', marginRight: '5px' }}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <textarea 
                  placeholder="¿Cómo estuvo tu evento en este salón?" 
                  value={nuevaResena.comentario}
                  onChange={(e) => setNuevaResena({...nuevaResena, comentario: e.target.value})} 
                  style={{ display: 'block', width: '100%', height: '100px', padding: '15px', borderRadius: '10px', border: '1px solid #ddd', fontFamily: 'inherit', resize: 'none', outline: 'none' }}>
                </textarea>
                <button className="btn-confirmar" onClick={handleEnviarResena} style={{ marginTop: '15px' }}>Publicar Reseña</button>
              </div>
            )
          ) : (
            <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f3f4f6', borderRadius: '10px', color: '#666', fontStyle: 'italic', textAlign: 'center' }}>
              {esAnfitrion 
                ? "Como dueño del salón, no puedes calificar tu propio establecimiento." 
                : "Solo los clientes con una reservación pagada pueden dejar su opinión."}
            </div>
          )}
        </div>
      </div>

      <div className="detalle-der">
        {/* --- DISEÑO DEL CALENDARIO Y CARD --- */}
        <div className="reserva-card" style={{ position: 'sticky', top: '20px' }}>
          <h2 className="precio-grande" style={{ margin: '0 0 20px 0', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
            ${salon.precio_evento} <span style={{fontSize: '1rem', color: '#666', fontWeight: 'normal'}}>MXN / evento</span>
          </h2>
          
          <div style={{ marginBottom: '20px' }}>
            <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <label style={{ width: '100%', marginBottom: '10px', fontWeight: 'bold', color: '#a855f7', fontSize: '0.9rem', textTransform: 'uppercase' }}>
              Selecciona tu día
            </label>
          
            <DatePicker
              selected={fecha}
              onChange={(date) => setFecha(date)}
              locale="es"
              minDate={new Date()} 
              inline 
            />
            </div>
          </div>

          <button 
            onClick={handleReservar}
            style={{ width: '100%', padding: '15px', backgroundColor: '#a855f7', color: 'white', border: 'none', borderRadius: '10px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', transition: 'background-color 0.3s' }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#9333ea'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#a855f7'}
          >
            Reservar Salón
          </button>
        </div>
      </div>
    </div>
  );
};

export default SalonDetalle;