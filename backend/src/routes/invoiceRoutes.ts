import { Router, Request, Response } from 'express';
import { pool } from '../server';
import { removeStockExit } from '../services/stockService';
import { generateInvoicePDF, InvoiceData } from '../services/pdfService';

const router = Router();

interface InvoiceItemPayload {
  productId: number;
  quantity: number;
  unitPriceHT: number;
  description: string;
}

interface CreateInvoicePayload {
  clientId?: number;
  clientName: string;
  clientAddress: string;
  invoiceNumber: string;
  vatRate?: number;
  items: InvoiceItemPayload[];
}

// Route de création de facture (Enregistrement BDD + Déduction Stock + Génération PDF)
router.post('/create', async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const { clientId, clientName, clientAddress, invoiceNumber, vatRate = 20, items }: CreateInvoicePayload = req.body;

    if (!invoiceNumber || !items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Numéro de facture et articles requis.' });
    }

    await client.query('BEGIN');

    // 1. Calcul des totaux
    let totalHT = 0;
    const formattedItems = items.map(item => {
      const total = item.quantity * item.unitPriceHT;
      totalHT += total;
      return {
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPriceHT,
        total: total
      };
    });

    const vatMultiplier = 1 + (vatRate / 100);
    const totalTTC = totalHT * vatMultiplier;

    // 2. Insérer ou récupérer le client si nécessaire (simplifié ici avec client_id ou null)
    let finalClientId = clientId || null;

    // 3. Enregistrer l'en-tête de la facture
    const invoiceQuery = `
      INSERT INTO invoices (invoice_number, client_id, total_ht, vat_rate, total_ttc, status)
      VALUES ($1, $2, $3, $4, $5, 'PAID')
      RETURNING id, created_at
    `;
    const invoiceRes = await client.query(invoiceQuery, [invoiceNumber, finalClientId, totalHT, vatRate, totalTTC]);
    const invoiceId = invoiceRes.rows[0].id;

    // 4. Enregistrer les lignes de facture et déduire le stock pour chaque article
    for (const item of items) {
      await client.query(
        `INSERT INTO invoice_items (invoice_id, product_id, description, quantity, unit_price_ht, total_ht)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [invoiceId, item.productId, item.description, item.quantity, item.unitPriceHT, item.quantity * item.unitPriceHT]
      );

      // Déduction automatique du stock physique
      await removeStockExit(item.productId, item.quantity);
    }

    await client.query('COMMIT');

    // 5. Génération optionnelle du PDF pour retour direct en buffer/base64 si besoin
    const pdfData: InvoiceData = {
      invoiceNumber,
      date: new Date().toLocaleDateString('fr-FR'),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR'), // +30 jours
      clientName,
      clientAddress,
      items: formattedItems,
      totalHT,
      vatRate,
      totalTTC
    };

    const pdfBuffer = await generateInvoicePDF(pdfData);

    return res.status(201).json({
      success: true,
      message: 'Facture créée avec succès, stock mis à jour.',
      data: {
        invoiceId,
        invoiceNumber,
        totalHT,
        totalTTC,
        pdfBase64: pdfBuffer.toString('base64') // Permet de télécharger le PDF directement côté front
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Erreur Facturation]', error);
    return res.status(500).json({ success: false, message: (error as Error).message || 'Erreur lors de la création de la facture.' });
  } finally {
    client.release();
  }
});

export default router;
