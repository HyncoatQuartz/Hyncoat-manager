'use client';

import React from 'react';

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* En-tête */}
        <div className="bg-white shadow rounded-lg p-6 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">HYNCOAT MANAGER</h1>
            <p className="text-sm text-gray-500 mt-1">Plateforme de Gestion Commerciale & Négoce Automobile</p>
          </div>
          <div className="mt-4 md:mt-0 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-semibold border border-blue-200">
            Système Opérationnel 🚀
          </div>
        </div>

        {/* Grille des actions rapides */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Carte 1 : Émettre une facture */}
          <div className="bg-white shadow rounded-lg p-6 border-t-4 border-blue-600 flex flex-col justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">📄 Facturation & Ventes</h2>
              <p className="text-gray-600 text-sm mb-4">
                Émettez de nouvelles factures, calculez les totaux TTC avec TVA, déduisez automatiquement les stocks et téléchargez les PDF instantanément.
              </p>
            </div>
            <a
              href="/invoices/new"
              className="inline-block bg-blue-600 text-white text-center py-2 px-4 rounded-md font-medium hover:bg-blue-700 transition"
            >
              Nouvelle Facture →
            </a>
          </div>

          {/* Carte 2 : Catalogue & Stocks (PUMP) */}
          <div className="bg-white shadow rounded-lg p-6 border-t-4 border-gray-800 flex flex-col justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">📦 Catalogue & Stocks (PUMP)</h2>
              <p className="text-gray-600 text-sm mb-4">
                Consultez l'état de vos stocks en temps réel (vernis, bases, durcisseurs), surveillez les seuils d'alerte et suivez l'évolution du PUMP.
              </p>
            </div>
            <a
              href="/products"
              className="inline-block bg-gray-800 text-white text-center py-2 px-4 rounded-md font-medium hover:bg-gray-900 transition"
            >
              Gérer le Catalogue →
            </a>
          </div>
        </div>

        {/* Section Informations rapides */}
        <div className="mt-8 bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-2">🛠️ État du Système</h3>
          <p className="text-sm text-gray-600">
            L'architecture complète (Next.js, Express, PostgreSQL, Calcul PUMP & Moteur PDF) est configurée et prête à l'emploi. 
          </p>
        </div>
      </div>
    </main>
  );
}
