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