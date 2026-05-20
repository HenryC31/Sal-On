Sal-On 🏟️
-------------------------------------------------------------------------------

Plataforma distribuida estilo Airbnb para la renta de salones de eventos.

Este proyecto ha sido diseñado bajo una arquitectura de Sistemas Distribuidos, separando las responsabilidades en microservicios independientes, implementando sharding y replicación local; para garantizar escalabilidad y tolerancia a fallos.


Frontend
-------------------------------------------------------------------------------
- /frontend: 

Aplicación de cliente desarrollada en React + Vite. Se encarga de la interfaz de usuario, gestión de estados y la comunicación eficiente con el API Gateway.


Backend 
-------------------------------------------------------------------------------
- /backend/gateway: 

El "Entry Point" del sistema. Actúa como un proxy reverso que recibe las peticiones del frontend y las redirige al microservicio correspondiente.


- /backend/service-catalogo: 

Microservicio encargado de la gestión y consulta de salones disponibles. Maneja su propio nodo de datos conectado a Supabase.



- /backend/service-reservas: 

Microservicio especializado en la lógica de reservaciones y disponibilidad de fechas.



- /backend/service-usuarios: 

Microservicio encargado de la gestión del Inicio de Sesión y Registro de usuarios, tanto de clientes, como de anfitriones.


Requisitos Previos
-------------------------------------------------------------------------------
Node.js (v16 o superior)

npm o yarn

Git


Instalación y Uso
-------------------------------------------------------------------------------
Para trabajar en el proyecto localmente, sigue estos pasos:

1. Clonar el repositorio:
```
git clone https://github.com/HenryC31/Sal-On.git
cd Sal-On
```
2. Instalar dependencias:
Debes instalar las dependencias en cada carpeta, ya que cada servicio es independiente:

Frontend:

Abre una terminal diferente en la ruta /frontend y ejecuta:
```
npm install
```

Backend:

Abre una terminal en la ruta /backend y ejecuta:
```
npm run install:all
```

// Nota:
Esto último ejecutará un script para instalar las dependencias dentro de cada micro servicio


Ejecución
-------------------------------------------------------------------------------
Para que el sistema funcione completo, se debe iniciar cada micro servicio. Para simplificar las cosas, hice un script para correr los servicios sólo en dos terminales. Sigue los pasos:

1.-
Abre una terminal en la ruta /backend y ejecuta:
```
npm start
```

2.- 
Abre una terminal diferente en la ruta /frontend y ejecuta:
```
npm run dev
```

Notas de Seguridad
-------------------------------------------------------------------------------
El archivo .env está excluido del repositorio por seguridad. Asegúrate de configurar tus variables de entorno locales con las credenciales de Supabase necesarias para la conexión a la base de datos.
