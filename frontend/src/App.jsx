import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import Header from './components/Header'; 
import Home from './pages/Home';


function App() {
  // Estado simulado para jugar con los roles después
  const [user, setUser] = useState(null);

  return (
    <Router>
      <Header user={user} />
      
      {/* El contenedor donde cambiarán las pantallas */}
      <div style={{ padding: '20px' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<h2>Pantalla de Login</h2>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;