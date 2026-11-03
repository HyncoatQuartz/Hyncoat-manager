'use client';

import React, { useState, useEffect } from 'react';

interface Product {
  id: number;
  sku: string;
  name: string;
  selling_price_ht: number;
  stock_real: number;
}

export default function NewInvoicePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [clientName, setClientName] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState(`FAC-${Date.now().toString().slice(-6)}`);
  
  // Ligne de facture en cours de saisie
  const [selectedProductId, setSelectedProductId] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [unitPriceHT, setUnitPriceHT] = useState<number>(0);
  
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Charger le catalogue pour les sélections
  useEffect(() => {
    fetch('http://localhost:5000/api/v1/products')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data.length > 0) {
          setProducts(data.data);
          setSelectedProductId(data.data[0].id);
          setUnitPriceHT(data.data[0].selling_price_ht);
        }
      })
      .catch(() => setErrorMsg('Erreur de connexion au serveur pour charger les produits.'));
  }, []);

  // Mettre à jour le prix unitaire par défaut quand on change de produit
  const handleProductChange = (productId: number) => {
    setSelectedProductId(productId);
    const prod = products.find(p => p.id === productId);
    if (prod) {
      setUnitPriceHT(prod.selling_price_ht);
    }
  };

  // Ajouter l'article à la liste de la facture
  const handleAddItem = () => {
    const prod = products.find(p => p.id === Number(selectedProductId));
    if (!prod) return;

    const newItem = {
      productId: prod.id,
      description: `${prod.sku} - ${prod.name}`,
      quantity: Number(quantity),
      unitPriceHT: Number(unitPriceHT)
    };

    setItems([...items, newItem]);
  };

  // Calcul des totaux
  const totalHT = items.reduce((acc, item) => acc + (item.quantity * item.unitPriceHT), 0);
  const vatRate = 20;
  const totalTTC = totalHT * (1 + vatRate / 100);

  // Soumission de la facture au back-end
  const handleSubmitInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      setErrorMsg('Veuillez ajouter au moins un article à la facture.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const response = await fetch('http://localhost:5000/api/v1/invoices/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName,
          clientAddress,
          invoiceNumber,
          vatRate,
          items
        })
      });

      const data = await response.json();
      if (data.success) {
        setSuccessMsg('Facture créée avec succès ! Stock mis à jour.');
        // Téléchargement automatique du PDF généré par le back-end
        if (data.data.pdfBase64) {
          const link = document.createElement('a');
          link.href = `data:application/pdf;base64,${data.data.pdfBase64}`;
          link.download = `${invoiceNumber}.pdf`;
          link.click();
        }
        setItems([]);
        setClientName('');
        setClientAddress('');
      } else {
        setErrorMsg(data.message || 'Erreur lors de la création de la facture.');
      }
    } catch (err) {
      setErrorMsg('Impossible de contacter le serveur.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center bg-white shadow rounded-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Émettre une Facture</h1>
          <a href="/" className="bg-gray-200 text-gray-700 px-4 py-2 rounded text-sm font-medium hover:bg-gray-300">
            ← Tableau de bord
          </a>
        </div>

        {successMsg && <div className="bg-green-100 text-green-700 p-4 rounded mb-4">{successMsg}</div>}
        {errorMsg && <div className="bg-red-100 text-red-700 p-4 rounded mb-4">{errorMsg}</div>}

        <form onSubmit={handleSubmitInvoice} className="bg-white shadow rounded-lg p-6 space-y-6">
          {/* Informations Client */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Numéro de Facture</label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Nom du Client / Garage</label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Ex: Garage Atlas Auto"
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Adresse du Client</label>
              <input
                type="text"
                value={clientAddress}
                onChange={(e) => setClientAddress(e.target.value)}
                placeholder="Ex: Boulevard Mohammed V, Salé"
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              />
            </div>
          </div>

          <hr className="my-4" />

          {/* Ajout d'articles */}
          <h3 className="text-lg font-medium text-gray-900">Ajouter un Article</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Produit</label>
              <select
                value={selectedProductId}
                onChange={(e) => handleProductChange(Number(e.target.value))}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Stock: {p.stock_real})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Quantité</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Prix Unit. HT (MAD)</label>
              <input
                type="number"
                step="0.01"
                value={unitPriceHT}
                onChange={(e) => setUnitPriceHT(Number(e.target.value))}
                className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={handleAddItem}
            className="mt-2 bg-gray-800 text-white px-4 py-2 rounded text-sm hover:bg-gray-900"
          >
            + Ajouter à la facture
          </button>

          {/* Liste des articles sélectionnés */}
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Lignes de la facture</h4>
            <table className="min-w-full divide-y divide-gray-200 border">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs text-gray-500">Description</th>
                  <th className="px-4 py-2 text-right text-xs text-gray-500">Qté</th>
                  <th className="px-4 py-2 text-right text-xs text-gray-500">P.U. HT</th>
                  <th className="px-4 py-2 text-right text-xs text-gray-500">Total HT</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-2 text-sm text-gray-800">{item.description}</td>
                    <td className="px-4 py-2 text-sm text-right">{item.quantity}</td>
                    <td className="px-4 py-2 text-sm text-right">{item.unitPriceHT.toFixed(2)} MAD</td>
                    <td className="px-4 py-2 text-sm text-right font-semibold">
                      {(item.quantity * item.unitPriceHT).toFixed(2)} MAD
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-4 text-center text-sm text-gray-400">
                      Aucun article ajouté pour le moment.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totaux */}
          <div className="bg-gray-50 p-4 rounded-lg flex flex-col items-end space-y-1">
            <p className="text-sm text-gray-600">Total HT : <span className="font-bold">{totalHT.toFixed(2)} MAD</span></p>
            <p className="text-sm text-gray-600">TVA (20%) : <span className="font-bold">{(totalHT * 0.20).toFixed(2)} MAD</span></p>
            <p className="text-lg font-bold text-gray-900">Total TTC : <span className="text-blue-600">{totalTTC.toFixed(2)} MAD</span></p>
          </div>

          <button
            type="submit"
            disabled={loading || items.length === 0}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300"
          >
            {loading ? 'Génération en cours...' : 'Valider la Facture & Télécharger le PDF'}
          </button>
        </form>
      </div>
    </main>
  );
}
