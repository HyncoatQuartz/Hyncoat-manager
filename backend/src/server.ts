import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { pool } from './db';
import stockRoutes from './routes/stockRoutes';
import invoiceRoutes from './routes/invoiceRoutes';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(express.json());

// Health Check
app.get('/health', async (req: Request, res: Response) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({ status: 'success', database: 'connected', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ status: 'error', database: 'disconnected', message: (error as Error).message });
  }
});

// Route Catalogue / Produits
app.get('/api/v1/products', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT id, sku, name, cost_price_pump, selling_price_ht, stock_real, min_stock_alert FROM products ORDER BY name ASC');
    res.status(200).json({ success: true, count: result.rows.length, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération du catalogue.' });
  }
});

// Branchement des routes de gestion de stock, PUMP et Facturation
app.use('/api/v1/stock', stockRoutes);
app.use('/api/v1/invoices', invoiceRoutes);

// Middleware d'erreurs globales
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(`[Erreur Interne] ${err.message}`);
  res.status(500).json({ success: false, error: 'Une erreur est survenue sur le serveur.' });
});

app.listen(PORT, () => {
  console.log(`🚀 API Hyncoat Manager en écoute sur le port ${PORT}`);
});
