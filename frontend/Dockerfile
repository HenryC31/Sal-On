
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Expone el puerto de Vite
EXPOSE 5173

# Comando para arrancar el servidor de desarrollo de Vite
CMD ["npm", "run", "dev"]