'use client';

import React, { useState, useEffect } from 'react';

interface Product {
  id: number;
  sku: string;
  name: string;
  cost_price_pump: number;
  selling_price_ht: number;
  stock_real: number;
  min_stock_alert: number;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Charger les produits depuis le back-end API
  useEffect(() => {
    fetch('http://localhost:5000/api/v1/products')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setProducts(data.data);
        } else {
          setError('Erreur lors du chargement du catalogue');
        }
        setLoading(false);
      })
      .catch((err) => {
        setError('Impossible de joindre le serveur API');
        setLoading(false);
      });
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="flex justify-between items-center bg-white shadow rounded-lg p-6 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Catalogue & Stocks</h1>
            <p className="text-sm text-gray-500">Gestion des prix PUMP et des stocks (Négoce Automobile)</p>
          </div>
          <a
            href="/"
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded text-sm font-medium hover:bg-gray-300"
          >
            ← Retour au Tableau de bord
          </a>
        </div>

        {/* Gestion des états de chargement / erreur */}
        {loading && <p className="text-gray-500">Chargement du catalogue...</p>}
        {error && <div className="bg-red-100 text-red-700 p-4 rounded mb-4">{error}</div>}

        {/* Tableau des produits */}
        {!loading && !error && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU / Référence</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Désignation Produit</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Réel</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">PUMP (HT)</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Prix Vente (HT)</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => {
                  const isLowStock = Number(product.stock_real) <= Number(product.min_stock_alert);
                  return (
                    <tr key={product.id} className={isLowStock ? 'bg-red-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.sku}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {product.name}
                        {isLowStock && (
                          <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            Stock bas
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-900">
                        {Number(product.stock_real).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                        {Number(product.cost_price_pump).toFixed(2)} MAD
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-blue-600">
                        {Number(product.selling_price_ht).toFixed(2)} MAD
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
