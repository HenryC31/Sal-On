import React, { useState } from 'react';
import './Filtros.css';

const Filtros = () => {
  // Estado para el precio en tiempo real
  const [precio, setPrecio] = useState(10500);

  const amenidades = ['Aire libre', 'Alberca', 'Aire acondicionado', 'Asador', 'Area de juegos'];

  return (
    <div className="filtros-wrapper">
      <div className="filtros-bar">
        {/* Input de Fecha (Calendario) */}
        <div className="filtro-item">
          <label>Fecha del evento</label>
          <input type="date" className="filtro-input" />
        </div>
        
        {/* Input de Número de Personas */}
        <div className="filtro-item">
          <label>No. Personas</label>
          <input type="number" min="10" placeholder="Ej. 50" className="filtro-input num-input" />
        </div>
        
        {/* Barra de Rango de Precios */}
        <div className="filtro-item rango-container">
          <label>Presupuesto máx: <span className="precio-dinamico">${precio}</span></label>
          <input 
            type="range" 
            min="2500" 
            max="20000" 
            step="500"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            className="rango-slider" 
          />
        </div>

        <button className="btn-buscar">Buscar</button>
      </div>

      {/* Checkboxes de Amenidades */}
      <div className="amenidades-bar">
        {amenidades.map((amenidad) => (
          <label key={amenidad} className="checkbox-label">
            <input type="checkbox" className="custom-checkbox" />
            {amenidad}
          </label>
        ))}
      </div>
    </div>
  );
};

export default Filtros;