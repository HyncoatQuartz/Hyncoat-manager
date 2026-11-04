import { Router, Request, Response } from 'express';
import { pool } from '../db';
import { generateInvoicePDF, InvoiceData } from '../services/pdfService';

export const invoiceRouter = Router();

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

invoiceRouter.post('/create', async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const { clientId, clientName, clientAddress, invoiceNumber, vatRate = 20, items }: CreateInvoicePayload = req.body;

    if (!invoiceNumber || !items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Numéro de facture et articles requis.' });
    }

    await client.query('BEGIN');

    let totalHT = 0;
    const formattedItems = items.map(item => {
      const total = item.quantity * item.unitPriceHT;
      totalHT += total;
      return {
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPriceHT,
        total: total,
      };
    });

    const vatMultiplier = 1 + (vatRate / 100);
    const totalTTC = totalHT * vatMultiplier;

    const invoiceQuery = `
      INSERT INTO invoices (invoice_number, client_id, total_ht, vat_rate, total_ttc, status)
      VALUES ($1, $2, $3, $4, $5, 'PAID')
      RETURNING id, created_at
    `;
    const invoiceRes = await client.query(invoiceQuery, [invoiceNumber, clientId || null, totalHT, vatRate, totalTTC]);
    const invoiceId = invoiceRes.rows[0].id;

    for (const item of items) {
      const itemQuery = `
        INSERT INTO invoice_items (invoice_id, product_id, description, quantity, unit_price_ht, total_ht)
        VALUES ($1, $2, $3, $4, $5, $6)
      `;
      await client.query(itemQuery, [
        invoiceId,
        item.productId,
        item.description,
        item.quantity,
        item.unitPriceHT,
        item.quantity * item.unitPriceHT,
      ]);

      const updateStockQuery = `
        UPDATE products 
        SET stock_real = stock_real - $1 
        WHERE id = $2
      `;
      await client.query(updateStockQuery, [item.quantity, item.productId]);
    }

    await client.query('COMMIT');

    const pdfData: InvoiceData = {
      invoiceNumber,
      date: new Date().toLocaleDateString('fr-FR'),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR'),
      clientName,
      clientAddress,
      items: formattedItems,
      totalHT,
      vatRate,
      totalTTC,
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
        pdfBase64: pdfBuffer.toString('base64'),
      },
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Erreur Facturation]', error);
    return res.status(500).json({ success: false, message: (error as Error).message || 'Erreur lors de la création de la facture.' });
  } finally {
    client.release();
  }
});
