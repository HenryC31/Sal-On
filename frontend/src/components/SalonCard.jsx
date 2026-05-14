import React from 'react';

const SalonCard = ({ salon }) => {
  return (
    <div className="salon-card">
      <div className="card-image-placeholder">
        {/* Aquí irá la imagen real después */}
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
        
        <button className="btn-reserve">Reservar</button>
      </div>
    </div>
  );
};

export default SalonCard;