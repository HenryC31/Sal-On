import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import Filtros from '../components/Filtros';
import SalonCard from '../components/SalonCard';
import { CIUDAD_SIMULADA } from '../config';
import { db } from '../localDb';

const Home = () => {
  const [salones, setSalones] = useState([]);
  const [reservasActivas, setReservasActivas] = useState([]);
  const [busqueda, setBusqueda] = useState(''); 
  const [modoOffline, setModoOffline] = useState(false);
  const [filtrosActivos, setFiltrosActivos] = useState({
    precioMax: 20000,
    personasMin: 0,
    fecha: '',
    amenidades: [] 
  });

  useEffect(() => {
    const fetchSalonesYReservas = async () => {
      let datosServer;

      try {
        // Pedimos al mismo tiempo los salones y las fechas ocupadas
        const [resSalones, resReservas] = await Promise.all([
          axios.get('http://localhost:3000/api/salones'),
          axios.get('http://localhost:3000/api/reservas')
        ]);
        
        datosServer = resSalones.data;
        setSalones(datosServer);
        setReservasActivas(resReservas.data); 
        setModoOffline(false);

        const datosLimpios = datosServer.filter(salon => salon && salon.id);
        await db.salones.bulkPut(datosLimpios);

      } catch (errorRed) {
        console.error("Error conectando al Gateway:", errorRed);
        setModoOffline(true);
        const salonesLocales = await db.salones.toArray();
        setSalones(salonesLocales);
        
        Swal.fire({
          icon: 'warning', title: 'Conexión Perdida',
          text: 'El servidor principal está caído. Estás viendo una copia local de solo lectura.',
          toast: true, position: 'top-end', showConfirmButton: false, timer: 4000
        });
        return;
      }


      if (datosServer) {
        try {
          const datosLimpios = datosServer.filter(salon => salon && salon.id);
          await db.salones.bulkPut(datosLimpios);
        } catch (errorDexie) {
          console.error("Error guardando en la caché local (Dexie):", errorDexie);
        }
      }
    };
    
    fetchSalonesYReservas();
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

      let cumpleFecha = true;
        if (filtrosActivos.fecha) {
          const fechaFiltroStr = filtrosActivos.fecha;
  
          const estaOcupado = reservasActivas.some(r => {
            const fechaBD = r.fecha_evento.split('T')[0];
            return r.salon_id === salon.id && fechaBD === fechaFiltroStr;
         });

          cumpleFecha = !estaOcupado;
        }
        return cumpleBusqueda && cumplePrecio && cumplePersonas && cumpleAmenidades && cumpleFecha;
  }).sort((a, b) => {
    const esLocalA = a.ciudad === CIUDAD_SIMULADA ? 1 : 0;
    const esLocalB = b.ciudad === CIUDAD_SIMULADA ? 1 : 0;
    
    if (esLocalA !== esLocalB) {
      return esLocalB - esLocalA; 
    }

    const ratingA = a.promedio_calificacion || 0;
    const ratingB = b.promedio_calificacion || 0;
    return ratingB - ratingA;
  });

  return (
    <div className="container">
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