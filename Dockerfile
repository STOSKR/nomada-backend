# Usar Node.js 20 que es compatible con todas las dependencias
FROM node:20-alpine

# Crear directorio de la aplicación
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
COPY .npmrc ./

# Instalar dependencias
RUN npm install --legacy-peer-deps --force

# Copiar código fuente
COPY . .

# Exponer puerto
EXPOSE 3000

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=3000

# Comando de inicio
CMD ["npm", "start"]
