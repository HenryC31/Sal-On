import React from 'react';
import { useNavigate } from 'react-router-dom'; // Importamos el hook

const SalonCard = ({ salon }) => {
  const navigate = useNavigate(); // Inicializamos la navegación

  return (
    <div className="salon-card">
      <div className="card-image-placeholder">
        <img src={salon.imagenes?.[0] || 'https://via.placeholder.com/300'} alt="Salón" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      </div>
      
      <div className="card-info">
        <h3 className="salon-name">{salon.nombre}</h3>
        <p className="salon-location">📍 {salon.ciudad}</p>
        <div className="salon-stats">
          <span>👥 {salon.capacidad_max} personas</span>
          <div style={{ margin: '10px 0', display: 'flex', alignItems: 'center', gap: '5px' }}>
            {salon.promedio_calificacion > 0 ? (
              <>
                <div style={{ color: '#ffc107', fontSize: '1.1rem' }}>
                  {'★'.repeat(Math.round(salon.promedio_calificacion))}
                  <span style={{ color: '#e5e7eb' }}>
                    {'★'.repeat(5 - Math.round(salon.promedio_calificacion))}
                  </span>
                </div>
                <strong style={{ fontSize: '0.9rem', color: '#333' }}>
                  {salon.promedio_calificacion}
                </strong>
                <span style={{ fontSize: '0.8rem', color: '#666' }}>
                  ({salon.total_resenas} {salon.total_resenas === 1 ? 'reseña' : 'reseñas'})
                </span>
              </>
            ) : (
              <>
                <div style={{ color: '#e5e7eb', fontSize: '1.1rem' }}>
                  {'★'.repeat(5)} {/* 5 estrellas grises/apagadas */}
                </div>
                <span style={{ fontSize: '0.8rem', color: '#9ca3af', fontStyle: 'italic' }}>
                  Sin calificaciones aún
                </span>
              </>
            )}
          </div>
        </div>
        <p className="salon-price">${salon.precio_evento} MXN / evento</p>
    
        <button 
          className="btn-reserve" 
          onClick={() => navigate(`/salon/${salon.id}`)}
        >
          Ver detalles
        </button>
      </div>
    </div>
  );
};

export default SalonCard;