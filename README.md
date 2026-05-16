Sal-On 🏟️
-------------------------------------------------------------------------------

Plataforma distribuida estilo Airbnb para la renta de salones de eventos.

Este proyecto ha sido diseñado bajo una arquitectura de Sistemas Distribuidos, separando las responsabilidades en microservicios independientes para garantizar escalabilidad y tolerancia a fallos.

Estructura del Proyecto
El repositorio está organizado en un monorepo que separa el cliente del servidor:


Frontend
-------------------------------------------------------------------------------
/frontend: Aplicación de cliente desarrollada en React + Vite. Se encarga de la interfaz de usuario, gestión de estados y la comunicación eficiente con el API Gateway.


Backend (Arquitectura Distribuida)
-------------------------------------------------------------------------------
/backend/gateway: El "Entry Point" del sistema. Actúa como un proxy reverso que recibe las peticiones del frontend y las redirige al microservicio correspondiente.

/backend/service-catalogo: Microservicio encargado de la gestión y consulta de salones disponibles. Maneja su propio nodo de datos conectado a Supabase.

/backend/service-reservas: Microservicio especializado en la lógica de reservaciones y disponibilidad de fechas.

/backend/service-usuarios: Microservicio encargado de la gestión del Inicio de Sesión y Registro de usuarios, tanto de clientes, como de anfitriones.


Requisitos Previos
-------------------------------------------------------------------------------
Node.js (v16 o superior)

npm o yarn

Git


Instalación y Uso
-------------------------------------------------------------------------------
Para trabajar en el proyecto localmente, sigue estos pasos:

1. Clonar el repositorio:

git clone https://github.com/HenryC31/Sal-On.git
cd Sal-On

2. Instalar dependencias:
Debes instalar las dependencias en cada carpeta, ya que cada servicio es independiente:

Frontend:

cd frontend && npm install && cd ..

Gateway:

cd backend/gateway && npm install && cd ..

Servicio Catálogo:

cd backend/service-catalogo && npm install && cd ..

Servicio Reservas:

cd backend/service-reservas && npm install && cd ..

Servicio Usuarios

cd backend/service-usuarios && npm install && cd ..


Ejecución
-------------------------------------------------------------------------------
Para que el sistema funcione completo, debes iniciar cada servicio en una terminal diferente:

Gateway:

node backend/gateway/index.js 
(Puerto 3000)

Catálogo:

node backend/service-catalogo/index.js 
(Puerto 3001)

Reservas:

node backend/service-reservas/index.js 
(Puerto 3002)

Usuarios:

node backend/service-usuarios/index.js 
(Puerto 3003)

React App (Vite):

cd frontend | 
npm run dev
(Puerto 5173 por defecto)


Notas de Seguridad
-------------------------------------------------------------------------------
El archivo .env está excluido del repositorio por seguridad. Asegúrate de configurar tus variables de entorno locales con las credenciales de Supabase necesarias para la conexión a la base de datos.