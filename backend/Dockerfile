
FROM node:18-alpine

# Carpeta de trabajo dentro de la máquina virtual de Docker
WORKDIR /app

COPY package*.json ./

RUN npm install

# Copia todo el código del backend
COPY . .

# Ejecuta script que instala dependencias dentro de cada microservicio
RUN npm run install:all

# los puertos del Gateway y de los 3 microservicios
EXPOSE 3000 3001 3002 3003

# Comandos para arrancar todos los servicios
CMD ["npm", "start"]