# Backend Dockerfile
# Node.js 18 + TypeScript + Express

FROM node:18-alpine

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar código fuente
COPY . .

# Compilar TypeScript
RUN npm run build

# Exponer puerto
EXPOSE 4000

# Comando por defecto (desarrollo)
CMD ["npm", "run", "dev"]
