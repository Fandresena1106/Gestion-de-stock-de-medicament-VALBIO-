import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

// Définition du fil d’Ariane (breadcrumbs) pour la navigation dans l'interface
const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Dashboard', href: dashboard().url },
];

// Couleurs utilisées dans les graphiques
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function Dashboard() {
  // Récupère les props envoyées par le backend via Inertia.js
  const props = usePage().props as any;

  // Données principales envoyées du backend avec valeurs par défaut
  const totals = props.totals ?? { medicaments: 0, entrees: 0, sorties: 0, stock: 0 };
  const stockPerMedicament = props.stockPerMedicament ?? [];
  const mostUsed = props.mostUsed ?? [];
  const villageUsage = props.villageUsage ?? [];
  const inventoryData = props.inventoryData ?? [];

  // Etats locaux pour les filtres côté client (UI uniquement)
  const [searchName, setSearchName] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterForm, setFilterForm] = useState('');

  // Fonction utilitaire pour récupérer la première clé non vide d'un objet parmi plusieurs possibles
  const pickFirst = (obj: any, keys: string[]) => {
    if (!obj) return undefined;
    for (const k of keys) {
      if (obj[k] !== undefined && obj[k] !== null && String(obj[k]).toString().trim() !== '') return obj[k];
    }
    return undefined;
  };

  // Fonctions pour extraire des informations des objets medicaments (robustes à différentes structures)
  const getName = (m: any) => String(pickFirst(m, ['nom_medoc', 'medicine_name', 'name']) ?? `Med #${m?.id_medoc ?? ''}`).trim();
  const getForm = (m: any) => String(pickFirst(m, ['description', 'forme', 'form']) ?? '').trim();
  const getDosage = (m: any) => {
    const mesure = pickFirst(m, ['mesure', 'measure', 'strength']);
    const unite = pickFirst(m, ['unite', 'unit', 'dosage_unit']);
    if (mesure && unite) return `${mesure}${unite}`;
    return String(mesure ?? unite ?? '').trim();
  };
  const getInventoryUnit = (m: any) => String(pickFirst(m, ['unite_mesure', 'unite', 'unit', 'unit_label', 'inventory_unit']) ?? 'units');

  // Combine nom, forme et dosage pour créer un libellé complet
  const getFullLabel = (m: any) => {
    const name = getName(m);
    const form = getForm(m);
    const dosage = getDosage(m);
    return `${name}${form ? ` ${form}` : ''}${dosage ? ` ${dosage}` : ''}`.trim();
  };

  // Calcule le nombre de jours restant avant la date d'expiration
  const getDaysUntilExpiry = (dateStr: string | null) => {
    if (!dateStr) return 999; // si pas de date, retourne un nombre très élevé
    const today = new Date();
    const expiry = new Date(dateStr);
    const diff = expiry.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  // Pluralise l'unité selon la quantité (anglais simple)
  const pluralizeUnit = (unit: string, qty: number) => {
    if (!unit) return '';
    const u = String(unit).trim();
    if (qty === 1) {
      return u.endsWith('s') && u.length > 1 ? u.slice(0, -1) : u;
    }
    return u.endsWith('s') ? u : `${u}s`;
  };

  // Prépare les données des villages pour le graphique camembert (limité à 8 items)
  const villagesData = useMemo(() => {
    if (!Array.isArray(villageUsage) || villageUsage.length === 0) return [];
    return villageUsage.slice(0, 8).map((v: any) => ({
      name: v.village ?? 'Unknown',
      value: Number(pickFirst(v, ['med_count', 'total_medicaments', 'total', 'distinct_meds']) ?? 0),
    }));
  }, [villageUsage]);

  // Prépare les données des médicaments les plus utilisés pour le graphique en barres
  const topMedicinesData = useMemo(() => {
    if (!Array.isArray(mostUsed) || mostUsed.length === 0) return [];
    return mostUsed.slice(0, 8).map((m: any) => {
      const quantity = Number(pickFirst(m, ['total', 'qty', 'quantity', 'count']) ?? 0);
      return {
        id: m.id_medoc ?? m.medicine_id,
        displayName: getFullLabel(m),
        quantity,
        unit: getInventoryUnit(m),
      };
    });
  }, [mostUsed]);

  // Prépare les données de distribution du stock pour le graphique camembert
  const stockDistributionData = useMemo(() => {
    if (!Array.isArray(stockPerMedicament) || stockPerMedicament.length === 0) return [];
    return stockPerMedicament
      .filter((m: any) => Number(pickFirst(m, ['stock', 'qty', 'quantity']) ?? 0) > 0)
      .slice(0, 8)
      .map((m: any) => ({
        id: m.id_medoc ?? m.medicine_id,
        name: getFullLabel(m),
        stock: Number(pickFirst(m, ['stock', 'qty', 'quantity']) ?? 0),
        entries: Number(pickFirst(m, ['total_entrees', 'entries']) ?? 0),
        exits: Number(pickFirst(m, ['total_sorties', 'exits']) ?? 0),
        unit: getInventoryUnit(m),
      }));
  }, [stockPerMedicament]);

  // --- Liste des catégories et formes distinctes utilisées pour les filtres ---
  const categories = useMemo(() => {
    const set = new Set<string>();
    (inventoryData || []).forEach((m: any) => {
      const cat = pickFirst(m, ['category', 'categorie', 'type']);
      if (cat) set.add(String(cat));
    });
    // Tri alphabétique sensible aux accents en français
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));
  }, [inventoryData]);

  const forms = useMemo(() => {
    const set = new Set<string>();
    (inventoryData || []).forEach((m: any) => {
      const f = getForm(m);
      if (f) set.add(String(f));
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));
  }, [inventoryData]);

  // --- Filtrage côté client selon recherche et filtres sélectionnés ---
  const filteredInventoryData = useMemo(() => {
    if (!Array.isArray(inventoryData)) return [];
    const term = (searchName || '').trim().toLowerCase();

    const filtered = inventoryData.filter((m: any) => {
      // Filtre par nom/label
      const label = getFullLabel(m).toLowerCase();
      if (term) {
        if (!label.includes(term)) return false;
      }

      // Filtre par catégorie
      if (filterCategory) {
        const cat = String(pickFirst(m, ['category', 'categorie', 'type']) ?? '').trim();
        if (!cat) return false;
        if (cat.toLowerCase() !== filterCategory.toLowerCase()) return false;
      }

      // Filtre par forme
      if (filterForm) {
        const f = getForm(m) || '';
        if (!f) return false;
        if (f.toLowerCase() !== filterForm.toLowerCase()) return false;
      }

      return true;
    });

    // Trie alphabétique des résultats filtrés (locale française)
    return filtered.sort((a: any, b: any) => getFullLabel(a).localeCompare(getFullLabel(b), 'fr', { sensitivity: 'base' }));
  }, [inventoryData, searchName, filterCategory, filterForm]);

  // Composant pour ne pas afficher les labels des parts de camembert
  const renderLabelPlaceholder = (_: any) => '';

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Dashboard" />

      <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
        {/* Entête principal */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Dashboard</h1>
          </div>
          <div className="text-xs lg:text-sm text-gray-500">
            {/* Affiche la date actuelle en format long anglais */}
            {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>

        {/* Section des graphiques */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">

          {/* Graphique camembert : consommation par village */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-5">
            <div className="flex items-center justify-between mb-3 lg:mb-4">
              <h3 className="text-sm lg:text-base font-bold text-gray-900">Village Consumption</h3>
              <Link href="/expeditions" className="text-xs text-blue-600 hover:underline">View all</Link>
            </div>

            <div style={{ width: '100%', height: 240 }}>
              {villagesData.length === 0 ? (
                <div className="flex items-center justify-center h-full"><p className="text-sm text-gray-400">No data available</p></div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={villagesData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={false}        // suppression labels hors du camembert
                      labelLine={false}    // suppression lignes de liaison
                    >
                      {/* Colorie chaque part du graphique */}
                      {villagesData.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                    </Pie>

                    {/* Tooltip personnalisé au survol */}
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const p = payload[0].payload;
                          const val = Number(p.value ?? 0);
                          return (
                            <div className="bg-white p-2 rounded shadow border text-sm" style={{ outline: 'none' }}>
                              <div className="font-semibold">{p.name}</div>
                              <div className="text-gray-600">{val} {val === 1 ? 'medicine' : 'medicines'}</div>
                            </div>
                          );
                        }
                        return null;
                      }}
                      cursor={false}
                      wrapperStyle={{ outline: 'none' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Graphique barres : médicaments les plus utilisés */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-5">
            <div className="flex items-center justify-between mb-3 lg:mb-4">
              <h3 className="text-sm lg:text-base font-bold text-gray-900">Most Used Medicines</h3>
              <Link href="/medicaments" className="text-xs text-blue-600 hover:underline">View all</Link>
            </div>

            <div style={{ width: '100%', height: 240 }}>
              {topMedicinesData.length === 0 ? (
                <div className="flex items-center justify-center h-full"><p className="text-sm text-gray-400">No data available</p></div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topMedicinesData} margin={{ top: 10, right: 5, left: -15, bottom: 50 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="displayName" interval={0} angle={-45} textAnchor="end" height={60} tick={{ fontSize: 9 }} stroke="#6b7280" />
                    <YAxis tick={{ fontSize: 9 }} stroke="#6b7280" />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload;
                          return (
                            <div className="bg-white p-3 rounded-lg shadow-lg border" style={{ outline: 'none' }}>
                              <p className="font-semibold text-gray-900">{d.displayName}</p>
                              <p className="text-sm text-blue-600">{d.quantity} {pluralizeUnit(d.unit, d.quantity)}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                      cursor={false}
                      wrapperStyle={{ outline: 'none' }}
                    />
                    <Bar dataKey="quantity" name="Quantity" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Graphique camembert : distribution du stock */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-5">
            <div className="flex items-center justify-between mb-3 lg:mb-4">
              <h3 className="text-sm lg:text-base font-bold text-gray-900">Stock Distribution</h3>
              <span className="text-xs text-gray-500 font-semibold">Total: {totals.medicaments} medicines</span>
            </div>

            <div style={{ width: '100%', height: 240 }}>
              {stockDistributionData.length === 0 ? (
                <div className="flex items-center justify-center h-full"><p className="text-sm text-gray-400">No data available</p></div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stockDistributionData}
                      dataKey="stock"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={false}        // suppression labels hors du camembert
                      labelLine={false}    // suppression lignes de liaison
                    >
                      {stockDistributionData.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                    </Pie>

                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-3 rounded-lg shadow-lg border" style={{ outline: 'none' }}>
                              <p className="font-semibold text-gray-900">{data.name}</p>
                              <p className="text-sm text-blue-600">Stock: {data.stock} {pluralizeUnit(data.unit, data.stock)}</p>
                              <p className="text-sm text-green-600">Entries: {data.entries} {pluralizeUnit(data.unit, data.entries)}</p>
                              <p className="text-sm text-orange-600">Exits: {data.exits} {pluralizeUnit(data.unit, data.exits)}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                      cursor={false}
                      wrapperStyle={{ outline: 'none' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <p className="text-xs text-center text-gray-500 mt-2">Hover for unit (e.g. "bottle", "blister").</p>
          </div>
        </div>

        {/* Tableau d'inventaire des médicaments */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {/* En-tête tableau */}
          <div className="px-4 lg:px-6 py-4 border-b bg-gray-50 rounded-t-xl">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              <div>
                <h3 className="text-base lg:text-lg font-bold text-gray-900">Medicine Inventory</h3>
                <p className="text-xs lg:text-sm text-gray-600 mt-1">Complete list with stock and expiration</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 lg:gap-3">
                <span className="text-xs lg:text-sm text-gray-600">
                  Total: <span className="font-bold text-gray-900">{totals.medicaments}</span> medicines
                </span>
                {/* Affiche nombre de médicaments qui expirent bientôt */}
                {filteredInventoryData.filter((m: any) => getDaysUntilExpiry(m.expiry_date) <= 30).length > 0 && (
                  <span className="px-2 lg:px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold">
                    ⚠️ {filteredInventoryData.filter((m: any) => getDaysUntilExpiry(m.expiry_date) <= 30).length} expiring soon
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Filtres et barre de recherche */}
          <div className="px-4 lg:px-6 py-3 border-b flex flex-wrap gap-2 items-center bg-gray-50">
            <input
              type="search"
              placeholder="Search medicine..."
              className="flex-grow max-w-xs rounded-md border border-gray-300 px-3 py-2 text-sm"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              spellCheck={false}
              autoComplete="off"
            />

            <select
              className="rounded-md border border-gray-300 text-sm px-3 py-2"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <select
              className="rounded-md border border-gray-300 text-sm px-3 py-2"
              value={filterForm}
              onChange={(e) => setFilterForm(e.target.value)}
            >
              <option value="">All Forms</option>
              {forms.map((form) => (
                <option key={form} value={form}>{form}</option>
              ))}
            </select>

            {/* Bouton de réinitialisation */}
            {(searchName || filterCategory || filterForm) && (
              <button
                className="text-gray-500 hover:text-gray-700 text-sm"
                title="Reset filters"
                onClick={() => {
                  setSearchName('');
                  setFilterCategory('');
                  setFilterForm('');
                }}
                type="button"
              >
                Reset
              </button>
            )}
          </div>

          {/* Table des données */}
          <div className="overflow-x-auto max-h-[400px]">
            <table className="w-full table-fixed border-collapse border border-gray-200 text-sm text-left text-gray-700">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  <th className="border border-gray-300 px-3 py-2 w-[32%]">Medicine</th>
                  <th className="border border-gray-300 px-3 py-2 w-[20%]">Stock</th>
                  <th className="border border-gray-300 px-3 py-2 w-[20%]">Entries</th>
                  <th className="border border-gray-300 px-3 py-2 w-[20%]">Exits</th>
                  <th className="border border-gray-300 px-3 py-2 w-[8%]">Expiry</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventoryData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center text-gray-500 py-4">No medicines found.</td>
                  </tr>
                ) : (
                  filteredInventoryData.map((m: any) => {
                    const stock = Number(pickFirst(m, ['stock', 'qty', 'quantity']) ?? 0);
                    const entries = Number(pickFirst(m, ['total_entrees', 'entries']) ?? 0);
                    const exits = Number(pickFirst(m, ['total_sorties', 'exits']) ?? 0);
                    const expiryDate = m.expiry_date;
                    const daysUntilExpiry = getDaysUntilExpiry(expiryDate);

                    // Coloration selon expiration
                    let expiryClass = 'text-gray-700';
                    if (daysUntilExpiry <= 0) expiryClass = 'text-red-600 font-bold';         // expiré
                    else if (daysUntilExpiry <= 30) expiryClass = 'text-orange-600 font-semibold'; // bientôt expiré

                    return (
                      <tr key={m.id_medoc ?? m.medicine_id} className="odd:bg-white even:bg-gray-50 hover:bg-gray-100">
                        <td className="border border-gray-300 px-3 py-2 font-semibold">{getFullLabel(m)}</td>
                        <td className="border border-gray-300 px-3 py-2">{stock} {pluralizeUnit(getInventoryUnit(m), stock)}</td>
                        <td className="border border-gray-300 px-3 py-2">{entries} {pluralizeUnit(getInventoryUnit(m), entries)}</td>
                        <td className="border border-gray-300 px-3 py-2">{exits} {pluralizeUnit(getInventoryUnit(m), exits)}</td>
                        <td className={`border border-gray-300 px-3 py-2 text-center ${expiryClass}`}>
                          {expiryDate ? new Date(expiryDate).toLocaleDateString('fr-FR') : '-'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
