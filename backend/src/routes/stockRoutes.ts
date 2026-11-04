import { Router, Request, Response } from 'express';
import { pool } from '../db';

export const stockRouter = Router();

// Route de base pour récupérer les mouvements ou gérer le stock
stockRouter.get('/', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM products ORDER BY name ASC');
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
});
