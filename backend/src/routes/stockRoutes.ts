import { Router, Request, Response } from 'express';
import { addStockEntry, removeStockExit } from '../services/stockService';

const router = Router();

// Route d'entrée en stock (Réception d'une commande d'achat fournisseur)
router.post('/entry', async (req: Request, res: Response) => {
  try {
    const { productId, quantity, purchasePriceHT } = req.body;

    if (!productId || !quantity || purchasePriceHT === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'Champs requis manquants (productId, quantity, purchasePriceHT)' 
      });
    }

    const result = await addStockEntry(Number(productId), Number(quantity), Number(purchasePriceHT));
    return res.status(200).json({ 
      success: true, 
      message: 'Entrée de stock enregistrée et PUMP mis à jour', 
      data: result 
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: (error as Error).message || 'Erreur lors de l\'entrée en stock' 
    });
  }
});

// Route de sortie de stock (Vente ou ajustement)
router.post('/exit', async (req: Request, res: Response) => {
  try {
    const { productId, quantity } = req.body;

    if (!productId || !quantity) {
      return res.status(400).json({ 
        success: false, 
        message: 'Champs requis manquants (productId, quantity)' 
      });
    }

    const result = await removeStockExit(Number(productId), Number(quantity));
    return res.status(200).json({ 
      success: true, 
      message: 'Sortie de stock enregistrée', 
      data: result 
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: (error as Error).message || 'Erreur lors de la sortie de stock' 
    });
  }
});

export default router;
