import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import Header from './components/Header'; 
import Home from './pages/Home';
import Login from './pages/Login';
import Registro from './pages/Registro';
import SalonDetalle from './pages/SalonDetalle';
import Perfil from './pages/Perfil'; // <-- Importamos la nueva vista
import RutaProtegida from './components/RutaProtegida'; // <-- Importamos el escudo

function App() {
  const [user, setUser] = useState(() => {
    const usuarioGuardado = localStorage.getItem('salonUser');
    return usuarioGuardado ? JSON.parse(usuarioGuardado) : null;
  });

  const handleLogout = () => {
    localStorage.removeItem('salonUser');
    setUser(null);
  };

  return (
    <Router>
      <Header user={user} onLogout={handleLogout} />
      
      <div style={{ padding: '20px' }}>
        <Routes>
          {/* RUTAS PÚBLICAS */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login onLoginSuccess={setUser} />} /> 
          <Route path="/registro" element={<Registro />} />

          {/* RUTAS PROTEGIDAS */}
          <Route element={<RutaProtegida />}>
            <Route path="/salon/:id" element={<SalonDetalle />} />
            <Route path="/perfil" element={<Perfil />} /> {/* <-- Protegida al 100% */}
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;