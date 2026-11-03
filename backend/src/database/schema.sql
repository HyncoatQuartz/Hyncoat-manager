-- Suppression des tables si elles existent (pour réinitialisation propre si besoin)
DROP TABLE IF EXISTS invoice_items CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS stock_movements CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS clients CASCADE;

-- 1. Table des Clients
CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(50),
    ice VARCHAR(50), -- Identifiant Commun de l'Entreprise (Maroc)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Table des Produits (Négoce automobile : Peintures, vernis, consommables)
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    sku VARCHAR(100) UNIQUE NOT NULL, -- Référence produit / code article
    name VARCHAR(255) NOT NULL,
    cost_price_pump NUMERIC(12, 4) NOT NULL DEFAULT 0.0000, -- PUMP (Prix Unitaire Moyen Pondéré)
    selling_price_ht NUMERIC(12, 2) NOT NULL DEFAULT 0.00,  -- Prix de vente conseillé HT
    stock_real NUMERIC(12, 2) NOT NULL DEFAULT 0.00,        -- Stock actuel réel
    min_stock_alert NUMERIC(12, 2) NOT NULL DEFAULT 5.00,   -- Seuil d'alerte de stock bas
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Table des Mouvements de Stock (Traçabilité des Entrées/Sorties)
CREATE TABLE stock_movements (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    type VARCHAR(10) CHECK (type IN ('IN', 'OUT')) NOT NULL, -- 'IN' = Achat/Entrée, 'OUT' = Vente/Sortie
    quantity NUMERIC(12, 2) NOT NULL,
    unit_price NUMERIC(12, 4) NOT NULL, -- Prix d'achat unitaire pour les 'IN', ou PUMP figé pour les 'OUT'
    pump_after NUMERIC(12, 4) NOT NULL, -- Valeur du PUMP calculée après le mouvement
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Table des Factures (En-têtes)
CREATE TABLE invoices (
    id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
    total_ht NUMERIC(12, 2) NOT NULL,
    vat_rate NUMERIC(5, 2) DEFAULT 20.00, -- TVA par défaut (ex: 20%)
    total_ttc NUMERIC(12, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'PAID', -- 'PAID', 'PENDING', 'CANCELLED'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Table des Lignes de Facture
CREATE TABLE invoice_items (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER REFERENCES invoices(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    description VARCHAR(255) NOT NULL,
    quantity NUMERIC(12, 2) NOT NULL,
    unit_price_ht NUMERIC(12, 2) NOT NULL,
    total_ht NUMERIC(12, 2) NOT NULL
);

-- Insertion de quelques produits de test (Peintures & Vernis)
INSERT INTO products (sku, name, cost_price_pump, selling_price_ht, stock_real, min_stock_alert) VALUES
('HR-VER-01', 'Vernis Anti-Rayures High Solid 2K', 120.0000, 180.00, 25.00, 5.00),
('HR-PEINT-02', 'Base Teinte Noire Profonde 1L', 85.5000, 140.00, 18.00, 4.00),
('HR-DUR-03', 'Durcisseur Rapide Standard 0.5L', 45.0000, 75.00, 30.00, 10.00);
