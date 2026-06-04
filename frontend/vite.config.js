import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Configuración adaptada para que funcione dentro de un contenedor Docker en AWS
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Permite que la app sea visible desde el exterior del contenedor
    port: 5173  // El puerto estándar de Vite
  }
})
