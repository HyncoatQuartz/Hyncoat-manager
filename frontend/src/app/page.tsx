'use client';

import React, { useState, useEffect } from 'react';

export default function Dashboard() {
  const [serverStatus, setServerStatus] = useState('Vérification...');
  const [productsCount, setProductsCount] = useState(0);

  useEffect(() => {
    // Test de connexion avec l'API Back-end
    fetch('http://localhost:5000/health')
      .then((res) => res.json())
      .then((data) => {
        setServerStatus(data.database === 'connected' ? 'En ligne (BDD Connectée)' : 'Attention (BDD déconnectée)');
      })
      .catch(() => {
        setServerStatus('Hors ligne (Serveur non joint)');
      });
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">HYNCOAT MANAGER</h1>
          <p className="text-sm text-gray-500">Gestion Commerciale & Négoce Automobile</p>
        </div>

        {/* Indicateurs / Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
            <h3 className="text-gray-500 text-sm font-medium">Statut du Système</h3>
            <p className="text-lg font-semibold text-gray-800 mt-1">{serverStatus}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
            <h3 className="text-gray-500 text-sm font-medium">Chiffre d'Affaires du Mois</h3>
            <p className="text-2xl font-bold text-gray-900 mt-1">0,00 MAD</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-500">
            <h3 className="text-gray-500 text-sm font-medium">Alertes Stock Bas</h3>
            <p className="text-2xl font-bold text-gray-900 mt-1">0 article</p>
          </div>
        </div>

        {/* Section rapide */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Accès Rapides</h2>
          <div className="flex gap-4">
            <button className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700">
              + Nouvelle Facture
            </button>
            <button className="bg-gray-800 text-white px-4 py-2 rounded shadow hover:bg-gray-900">
              Gérer le Catalogue
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
