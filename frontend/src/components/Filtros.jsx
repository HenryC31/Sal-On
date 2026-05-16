import React, { useState } from 'react';
import './Filtros.css';

const Filtros = ({ onBuscar }) => {
  const [precio, setPrecio] = useState(20000); 
  const [personas, setPersonas] = useState('');
  const [fecha, setFecha] = useState('');
  const [amenidadesSel, setAmenidadesSel] = useState([]);

  const amenidadesLista = ['Aire libre', 'Alberca', 'Aire acondicionado', 'Asador', 'Area de juegos'];

  const handleCheckbox = (amenidad) => {
    if (amenidadesSel.includes(amenidad)) {
      setAmenidadesSel(amenidadesSel.filter(a => a !== amenidad)); 
    } else {
      setAmenidadesSel([...amenidadesSel, amenidad]); 
    }
  };

  const handleBuscar = () => {
    onBuscar({
      precioMax: precio,
      personasMin: personas ? parseInt(personas) : 0,
      fecha: fecha,
      amenidades: amenidadesSel
    });
  };

  // Resetear Filtros
  const handleLimpiar = () => {
    // Limpiamos los estados visuales (la barra, las palomitas, etc)
    setPrecio(20000);
    setPersonas('');
    setFecha('');
    setAmenidadesSel([]);

    // Le mandamos los valores por defecto al Home para que vuelva a mostrar todo
    onBuscar({
      precioMax: 20000,
      personasMin: 0,
      fecha: '',
      amenidades: []
    });
  };

  return (
    <div className="filtros-wrapper">
      <div className="filtros-bar">
        <div className="filtro-item">
          <label>Fecha del evento</label>
          <input type="date" className="filtro-input" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </div>
        
        <div className="filtro-item">
          <label>No. Personas</label>
          <input type="number" min="10" placeholder="Ej. 50" className="filtro-input num-input" value={personas} onChange={(e) => setPersonas(e.target.value)} />
        </div>
        
        <div className="filtro-item rango-container">
          <label>Presupuesto máx: <span className="precio-dinamico">${precio}</span></label>
          <input type="range" min="2500" max="20000" step="500" value={precio} onChange={(e) => setPrecio(e.target.value)} className="rango-slider" />
        </div>

        {/* Agrupamos los botones para que se vean ordenados */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-limpiar" onClick={handleLimpiar}>Limpiar</button>
          <button className="btn-buscar" onClick={handleBuscar}>Buscar</button>
        </div>
      </div>

      <div className="amenidades-bar">
        {amenidadesLista.map((amenidad) => (
          <label key={amenidad} className="checkbox-label">
            <input 
              type="checkbox" 
              className="custom-checkbox" 
              checked={amenidadesSel.includes(amenidad)}
              onChange={() => handleCheckbox(amenidad)}
            />
            {amenidad}
          </label>
        ))}
      </div>
    </div>
  );
};

export default Filtros;