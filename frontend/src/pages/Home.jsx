import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Filtros from '../components/Filtros';
import SalonCard from '../components/SalonCard';

const Home = () => {
  const [salones, setSalones] = useState([]);
  const [busqueda, setBusqueda] = useState(''); 


  useEffect(() => {
    const fetchSalones = async () => {
      try {
        const respuesta = await axios.get('http://localhost:3000/api/salones');
        setSalones(respuesta.data);
      } catch (error) {
        console.error("Error trayendo los salones:", error);
      }
    };
    fetchSalones();
  }, []);

  const [filtrosActivos, setFiltrosActivos] = useState({
    precioMax: 20000,
    personasMin: 0,
    fecha: '',
    amenidades: [] // Agregamos este valor inicial
  });

  const aplicarFiltros = (nuevosFiltros) => {
    setFiltrosActivos(nuevosFiltros);
  };

const salonesFiltrados = salones.filter(salon => {
    // Filtro de búsqueda por texto
    const cumpleBusqueda = salon.nombre.toLowerCase().includes(busqueda.toLowerCase());
    
    // Filtro de precio (forzando números)
    const precioSalon = Number(salon.precio_evento) || 0;
    const precioMax = Number(filtrosActivos.precioMax) || 20000;
    const cumplePrecio = precioSalon <= precioMax;
    
    // Filtro de personas
    const capacidadSalon = Number(salon.capacidad_max) || 0;
    const personasBuscadas = Number(filtrosActivos.personasMin) || 0;
    const cumplePersonas = capacidadSalon >= personasBuscadas;
    
    // Filtro de amenidades
    const cumpleAmenidades = filtrosActivos.amenidades.length === 0 || 
      filtrosActivos.amenidades.every(amenidad => salon.amenidades && salon.amenidades.includes(amenidad));

    return cumpleBusqueda && cumplePrecio && cumplePersonas && cumpleAmenidades;
  });


  return (
    <div className="container">
      {/* Le pasamos la función a Filtros por medio del prop onBuscar */}
      <Filtros onBuscar={aplicarFiltros} />
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
        <h2 style={{ color: '#8A2BE2', margin: 0 }}>Salones disponibles</h2>
        
        <input 
          type="text" 
          placeholder="🔍 Buscar salón por nombre..." 
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{
            padding: '10px 20px',
            borderRadius: '20px',
            border: '1px solid #ddd',
            width: '280px',
            outline: 'none',
            fontFamily: 'inherit',
            color: '#555',
            boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
          }}
        />
      </div>
    
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '30px', marginTop: '20px' }}>
        {salonesFiltrados.length > 0 ? (
          salonesFiltrados.map((salon) => (
            <SalonCard key={salon.id} salon={salon} />
          ))
        ) : (
          <p style={{ color: '#666', marginTop: '20px' }}>
            No se encontraron salones con esos requisitos. 😢
          </p>
        )}
      </div>
    </div>
  );
};

export default Home;