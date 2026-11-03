import { pool } from '../server';

interface StockMovement {
  productId: number;
  quantity: number;
  unitCostPrice?: number; // Requis pour une entrée en stock (achat)
}

/**
 * Enregistre une entrée en stock (Achat fournisseur) et recalcule le PUMP
 */
export async function addStockEntry(productId: number, quantityToAdd: number, purchasePriceHT: number) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Récupérer le stock actuel et l'ancien PUMP du produit
    const res = await client.query(
      'SELECT stock_real, cost_price_pump FROM products WHERE id = $1 FOR UPDATE',
      [productId]
    );

    if (res.rows.length === 0) {
      throw new Error('Produit introuvable');
    }

    const currentStock = Number(res.rows[0].stock_real) || 0;
    const currentPump = Number(res.rows[0].cost_price_pump) || 0;

    // 2. Calcul du nouveau PUMP
    const totalCurrentValue = currentStock * currentPump;
    const totalNewValue = quantityToAdd * purchasePriceHT;
    const newTotalQuantity = currentStock + quantityToAdd;

    const newPump = newTotalQuantity > 0 
      ? (totalCurrentValue + totalNewValue) / newTotalQuantity 
      : purchasePriceHT;

    // 3. Mettre à jour le produit
    await client.query(
      'UPDATE products SET stock_real = $1, cost_price_pump = $2, updated_at = NOW() WHERE id = $3',
      [newTotalQuantity, newPump, productId]
    );

    // 4. Traçabilité (Historique du mouvement)
    await client.query(
      'INSERT INTO stock_movements (product_id, type, quantity, unit_price, pump_after) VALUES ($1, $2, $3, $4, $5)',
      [productId, 'IN', quantityToAdd, purchasePriceHT, newPump]
    );

    await client.query('COMMIT');
    return { success: true, newStock: newTotalQuantity, newPump };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Déduit le stock lors d'une vente (Sortie de stock)
 */
export async function removeStockExit(productId: number, quantityToDeduct: number) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const res = await client.query(
      'SELECT stock_real, cost_price_pump FROM products WHERE id = $1 FOR UPDATE',
      [productId]
    );

    if (res.rows.length === 0) throw new Error('Produit introuvable');

    const currentStock = Number(res.rows[0].stock_real) || 0;
    const currentPump = Number(res.rows[0].cost_price_pump) || 0;

    if (currentStock < quantityToDeduct) {
      console.warn(`[Alerte Stock] Produit ID ${productId} en déstockage négatif (Stock: ${currentStock}, Vente: ${quantityToDeduct})`);
    }

    const newStock = currentStock - quantityToDeduct;

    await client.query(
      'UPDATE products SET stock_real = $1, updated_at = NOW() WHERE id = $2',
      [newStock, productId]
    );

    // Historique du mouvement de sortie
    await client.query(
      'INSERT INTO stock_movements (product_id, type, quantity, unit_price, pump_after) VALUES ($1, $2, $3, $4, $5)',
      [productId, 'OUT', quantityToDeduct, currentPump, currentPump]
    );

    await client.query('COMMIT');
    return { success: true, newStock };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
