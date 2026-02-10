# Frontend Dockerfile
# Node.js 18 + Vite + React

FROM node:18-alpine

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar código fuente
COPY . .

# Exponer puerto
EXPOSE 3000

# Comando por defecto (desarrollo)
CMD ["npm", "run", "dev"]
