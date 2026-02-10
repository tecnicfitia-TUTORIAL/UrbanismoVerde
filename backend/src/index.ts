/**
 * EcoUrbe AI - Backend Entry Point
 * Node.js + Express + TypeScript
 * Clean Architecture - Presentation Layer
 */

import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 4000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ruta de salud
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'ecourbe-backend'
  });
});

// Ruta raíz
app.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'EcoUrbe AI Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api/*'
    }
  });
});

// Placeholder para rutas API
app.get('/api/zonas', (_req: Request, res: Response) => {
  res.json({
    message: 'Endpoint de zonas verdes - Por implementar',
    data: []
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🌱 EcoUrbe AI Backend escuchando en puerto ${PORT}`);
  console.log(`📍 http://localhost:${PORT}`);
});

export default app;
