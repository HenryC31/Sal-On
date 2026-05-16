import React from 'react';
import { useNavigate } from 'react-router-dom'; // Importamos el hook

const SalonCard = ({ salon }) => {
  const navigate = useNavigate(); // Inicializamos la navegación

  return (
    <div className="salon-card">
      <div className="card-image-placeholder">
        <span>Foto del salón</span>
      </div>
      
      <div className="card-info">
        <h3 className="salon-name">{salon.nombre}</h3>
        <p className="salon-location">📍 {salon.ciudad}</p>
        <div className="salon-stats">
          <span>👥 {salon.capacidad} personas</span>
          <span className="salon-rating">⭐⭐⭐⭐⭐</span>
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