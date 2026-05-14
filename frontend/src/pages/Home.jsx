import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Filtros from '../components/Filtros';
import SalonCard from '../components/SalonCard';

const Home = () => {
  const [salones, setSalones] = useState([]);
  const [busqueda, setBusqueda] = useState(''); // <-- Estado para tu barra de texto

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

  // Magia pura: Filtramos el arreglo en tiempo real según lo que escribas
  const salonesFiltrados = salones.filter(salon => 
    salon.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="container">
      <Filtros />
      
      {/* Encabezado y Barra de Búsqueda juntos */}
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
    
      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        justifyContent: 'center',
        gap: '30px', 
        marginTop: '20px' 
      }}>
        {salonesFiltrados.length > 0 ? (
          salonesFiltrados.map((salon) => (
            <SalonCard key={salon.id} salon={salon} />
          ))
        ) : (
          <p style={{ color: '#666', marginTop: '20px' }}>
            No se encontraron salones que coincidan con tu búsqueda.
          </p>
        )}
      </div>
    </div>
  );
};

export default Home;