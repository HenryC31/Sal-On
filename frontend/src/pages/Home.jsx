import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import Filtros from '../components/Filtros';
import SalonCard from '../components/SalonCard';
import { CIUDAD_SIMULADA } from '../config';
import { db } from '../localDb';

const Home = () => {
  const [salones, setSalones] = useState([]);
  const [busqueda, setBusqueda] = useState(''); 
  const [modoOffline, setModoOffline] = useState(false);
  const [filtrosActivos, setFiltrosActivos] = useState({
    precioMax: 20000,
    personasMin: 0,
    fecha: '',
    amenidades: [] 
  });

  useEffect(() => {
    const fetchSalones = async () => {
      let datosServer = null;

      // 1. Intentamos consultar al servidor (Líder)
      try {
        const respuesta = await axios.get('http://localhost:3000/api/salones');
        datosServer = respuesta.data;
        setSalones(datosServer);
        setModoOffline(false);
      } catch (errorRed) {
        console.error("Error conectando al Gateway:", errorRed);
        // Falló el servidor, leemos del Seguidor (IndexedDB)
        setModoOffline(true);
        const salonesLocales = await db.salones.toArray();
        setSalones(salonesLocales);
        
        Swal.fire({
          icon: 'warning',
          title: 'Conexión Perdida',
          text: 'El servidor principal está caído. Estás viendo una copia local de solo lectura.',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 4000
        });
        return; // Salimos para no ejecutar Dexie
      }

      // 2. Si el servidor respondió, actualizamos la réplica local (Seguidor)
      if (datosServer) {
        try {
          const datosLimpios = datosServer.filter(salon => salon && salon.id);
          await db.salones.bulkPut(datosLimpios);
        } catch (errorDexie) {
          console.error("Error guardando en la caché local (Dexie):", errorDexie);
        }
      }
    };
    
    fetchSalones();
  }, []);

  const aplicarFiltros = (nuevosFiltros) => {
    setFiltrosActivos(nuevosFiltros);
  };

  const salonesFiltrados = salones.filter(salon => {
    const cumpleBusqueda = salon.nombre.toLowerCase().includes(busqueda.toLowerCase());
    const precioSalon = Number(salon.precio_evento) || 0;
    const precioMax = Number(filtrosActivos.precioMax) || 20000;
    const cumplePrecio = precioSalon <= precioMax;
    const capacidadSalon = Number(salon.capacidad_max) || 0;
    const personasBuscadas = Number(filtrosActivos.personasMin) || 0;
    const cumplePersonas = capacidadSalon >= personasBuscadas;
    const cumpleAmenidades = filtrosActivos.amenidades.length === 0 || 
      filtrosActivos.amenidades.every(amenidad => salon.amenidades && salon.amenidades.includes(amenidad));

    return cumpleBusqueda && cumplePrecio && cumplePersonas && cumpleAmenidades;
  }).sort((a, b) => {
    // MAGIA DE GEOLOCALIZACIÓN SIMULADA
    if (a.ciudad === CIUDAD_SIMULADA && b.ciudad !== CIUDAD_SIMULADA) return -1;
    if (a.ciudad !== CIUDAD_SIMULADA && b.ciudad === CIUDAD_SIMULADA) return 1;
    return 0; 
  });

  return (
    <div className="container">
      {/* --- BANNER DE MODO OFFLINE --- */}
      {modoOffline && (
        <div style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '10px', textAlign: 'center', borderRadius: '8px', marginBottom: '15px', fontWeight: 'bold' }}>
          ⚠️ MODO OFFLINE ACTIVADO: Sistema trabajando con réplica local (Solo Lectura). Las reservaciones están pausadas.
        </div>
      )}

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