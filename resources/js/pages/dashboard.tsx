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

/**
 * Breadcrumbs affichés par le layout.
 * Permet d'indiquer à l'utilisateur où il se trouve dans l'application.
 */
const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Dashboard', href: dashboard().url },
];

/**
 * Palette de couleurs réutilisée pour les graphiques.
 * On garde un tableauiste pour avoir des couleurs constantes entre les charts.
 */
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

/**
 * Composant principal Dashboard
 * - lit les données fournies par Inertia (usePage().props)
 * - calcule des vues dérivées (useMemo) pour les graphiques et tableaux
 * - propose des filtres côté client pour l'inventaire
 * - affiche plusieurs widgets : pies, bar chart et table d'inventaire
 */
export default function Dashboard() {
  // Récupère les props envoyées depuis le contrôleur Laravel via Inertia.
  const props = usePage().props as any;

  // Valeurs par défaut si la backend n'envoie rien — évite les erreurs.
  const totals = props.totals ?? { medicaments: 0, entrees: 0, sorties: 0, stock: 0 };
  const stockPerMedicament = props.stockPerMedicament ?? [];
  const mostUsed = props.mostUsed ?? [];
  const villageUsage = props.villageUsage ?? [];
  const inventoryData = props.inventoryData ?? [];

  // --- États UI locaux (filtres côté client uniquement) ---
  const [searchName, setSearchName] = useState('');       // recherche texte pour l'inventaire
  const [filterCategory, setFilterCategory] = useState(''); // filtre catégorie
  const [filterForm, setFilterForm] = useState('');       // filtre forme (ex: Tablet, Syrup)

  // ---------------------------------------------------------------------
  // Helper général : pickFirst
  // But : rendre le code robuste aux différents noms de champs renvoyés par le backend.
  // Ex : certains endpoints renvoient "nom_medoc", d'autres "medicine_name" ou "name".
  // pickFirst(obj, ['nom_medoc','name']) renvoie la première valeur non nulle/non vide.
  // ---------------------------------------------------------------------
  const pickFirst = (obj: any, keys: string[]) => {
    if (!obj) return undefined;
    for (const k of keys) {
      if (obj[k] !== undefined && obj[k] !== null && String(obj[k]).toString().trim() !== '') return obj[k];
    }
    return undefined;
  };

  // -------------------------
  // Getters / extracteurs
  // -------------------------
  // Obtenir le nom (compatible plusieurs clés)
  const getName = (m: any) => String(pickFirst(m, ['nom_medoc', 'medicine_name', 'name']) ?? `Med #${m?.id_medoc ?? ''}`).trim();

  // Obtenir la "forme" / description (tablet, syrup, etc.)
  const getForm = (m: any) => String(pickFirst(m, ['description', 'forme', 'form']) ?? '').trim();

  // Obtenir dosage + unité de façon concis (ex: "500mg" ou "12.5ml")
  const getDosage = (m: any) => {
    const mesure = pickFirst(m, ['mesure', 'measure', 'strength']);
    const unite = pickFirst(m, ['unite', 'unit', 'dosage_unit']);
    if (mesure && unite) return `${mesure}${unite}`;
    return String(mesure ?? unite ?? '').trim();
  };

  // Obtenir l'unité d'inventaire (blister, bottle, units, etc.) avec fallback 'units'
  const getInventoryUnit = (m: any) => String(pickFirst(m, ['unite_mesure', 'unite', 'unit', 'unit_label', 'inventory_unit']) ?? 'units');

  // Concatène nom + forme + dosage pour afficher une chaîne lisible
  const getFullLabel = (m: any) => {
    const name = getName(m);
    const form = getForm(m);
    const dosage = getDosage(m);
    return `${name}${form ? ` ${form}` : ''}${dosage ? ` ${dosage}` : ''}`.trim();
  };

  /**
   * Obtenir le nombre de jours restants avant expiration.
   * - retourne 999 si aucune date fournie (privilégie l'affichage plutôt que l'erreur)
   * - arrondit vers le haut (Math.ceil)
   */
  const getDaysUntilExpiry = (dateStr: string | null) => {
    if (!dateStr) return 999;
    const today = new Date();
    const expiry = new Date(dateStr);
    const diff = expiry.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  /**
   * Pluralization simple pour l'unité (anglais)
   * - ajoute 's' si qty != 1
   * - retire 's' si qty == 1 et unité fournie au pluriel
   * Note: intention : UX lisible sur les tooltips / badges.
   */
  const pluralizeUnit = (unit: string, qty: number) => {
    if (!unit) return '';
    const u = String(unit).trim();
    if (qty === 1) {
      return u.endsWith('s') && u.length > 1 ? u.slice(0, -1) : u;
    }
    return u.endsWith('s') ? u : `${u}s`;
  };

  // -------------------------
  // Transformations de données (useMemo pour perf)
  // -------------------------
  // Village consumption => données pour le pie chart
  const villagesData = useMemo(() => {
    if (!Array.isArray(villageUsage) || villageUsage.length === 0) return [];
    return villageUsage.slice(0, 8).map((v: any) => ({
      name: v.village ?? 'Unknown',
      // utilise plusieurs clés possibles pour la valeur (robustesse backend)
      value: Number(pickFirst(v, ['med_count', 'total_medicaments', 'total', 'distinct_meds']) ?? 0),
    }));
  }, [villageUsage]);

  // Top medicines => format pour le bar chart "Most Used"
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

  // Stock distribution => données pour le pie chart stock
  const stockDistributionData = useMemo(() => {
    if (!Array.isArray(stockPerMedicament) || stockPerMedicament.length === 0) return [];
    return stockPerMedicament
      // filtre uniquement les produits avec un stock > 0
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

  // -------------------------
  // Dériver listes pour les filtres (catégories / formes)
  // -------------------------
  // categories : prend les valeurs uniques trouvées dans inventoryData
  const categories = useMemo(() => {
    const set = new Set<string>();
    (inventoryData || []).forEach((m: any) => {
      const cat = pickFirst(m, ['category', 'categorie', 'type']);
      if (cat) set.add(String(cat));
    });
    // trie avec locale 'fr' pour mieux gérer accents et casse
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));
  }, [inventoryData]);

  // forms : forme (description) collectée et triée
  const forms = useMemo(() => {
    const set = new Set<string>();
    (inventoryData || []).forEach((m: any) => {
      const f = getForm(m);
      if (f) set.add(String(f));
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));
  }, [inventoryData]);

  // -------------------------
  // Filtres locaux sur l'inventaire
  // - combine recherche texte + select category + select form
  // - renvoie une liste triée alphabétiquement par label complet
  // -------------------------
  const filteredInventoryData = useMemo(() => {
    if (!Array.isArray(inventoryData)) return [];
    const term = (searchName || '').trim().toLowerCase();

    const filtered = inventoryData.filter((m: any) => {
      // recherche sur le label complet (nom + forme + dosage)
      const label = getFullLabel(m).toLowerCase();
      if (term) {
        if (!label.includes(term)) return false;
      }

      // filtre catégorie (si sélectionnée)
      if (filterCategory) {
        const cat = String(pickFirst(m, ['category', 'categorie', 'type']) ?? '').trim();
        if (!cat) return false;
        if (cat.toLowerCase() !== filterCategory.toLowerCase()) return false;
      }

      // filtre forme (si sélectionnée)
      if (filterForm) {
        const f = getForm(m) || '';
        if (!f) return false;
        if (f.toLowerCase() !== filterForm.toLowerCase()) return false;
      }

      return true;
    });

    // tri alphabétique par label complet (locale-aware)
    return filtered.sort((a: any, b: any) => getFullLabel(a).localeCompare(getFullLabel(b), 'fr', { sensitivity: 'base' }));
  }, [inventoryData, searchName, filterCategory, filterForm]);

  // Placeholder pour label *dans* le pie (nous affichons les labels via tooltip seulement)
  const renderLabelPlaceholder = (_: any) => '';

  // -------------------------
  // Rendu JSX
  // -------------------------
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      {/* Head (titre de la page) */}
      <Head title="Dashboard" />

      <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
        {/* ---------- Header ---------- */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Dashboard</h1>
          </div>

          {/* Date actuelle (affichage lisible) */}
          <div className="text-xs lg:text-sm text-gray-500">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>

        {/* ---------- Charts Row (3 colonnes sur large écran) ---------- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Village Consumption (Pie) */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-5">
            <div className="flex items-center justify-between mb-3 lg:mb-4">
              <h3 className="text-sm lg:text-base font-bold text-gray-900">Village Consumption</h3>
              <Link href="/expeditions" className="text-xs text-blue-600 hover:underline">View all</Link>
            </div>

            <div style={{ width: '100%', height: 240 }}>
              {/* Affiche message si pas de données */}
              {villagesData.length === 0 ? (
                <div className="flex items-center justify-center h-full"><p className="text-sm text-gray-400">No data available</p></div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    {/* Pie sans labels extérieurs (design choisi) */}
                    <Pie
                      data={villagesData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={false}
                      labelLine={false}
                    >
                      {villagesData.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                    </Pie>

                    {/* Tooltip custom pour afficher nom + nombre */}
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

          {/* Most Used Medicines (Bar chart) */}
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
                    {/* Bar simple avec rayon arrondi */}
                    <Bar dataKey="quantity" name="Quantity" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Stock Distribution (Pie) */}
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
                      label={false}
                      labelLine={false}
                    >
                      {stockDistributionData.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                    </Pie>

                    {/* Tooltip détaillé (stock, entrées, sorties) */}
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

        {/* ---------- Inventory Table ---------- */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {/* Header table */}
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
                {/* Alerte "expiring soon" si des produits arrivent à expiration dans 30 jours */}
                {filteredInventoryData.filter((m: any) => getDaysUntilExpiry(m.expiry_date) <= 30).length > 0 && (
                  <span className="px-2 lg:px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold">
                    ⚠️ {filteredInventoryData.filter((m: any) => getDaysUntilExpiry(m.expiry_date) <= 30).length} expiring soon
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Barre recherche + selects */}
          <div className="px-4 lg:px-6 py-3 border-b">
            <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
              <div className="flex items-center gap-2 w-full lg:w-2/3">
                <input
                  type="text"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  placeholder="Search by name, dosage..."
                  className="w-full lg:w-2/3 px-3 py-2 border rounded-md text-sm focus:outline-none"
                />

                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-3 py-2 border rounded-md text-sm"
                >
                  <option value="">All categories</option>
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>

                {/* Reset des filtres côté client */}
                <button
                  type="button"
                  onClick={() => { setSearchName(''); setFilterCategory(''); setFilterForm(''); }}
                  className="px-3 py-2 bg-gray-100 border rounded-md text-sm"
                >
                  Clear
                </button>
              </div>

              <div className="text-xs lg:text-sm text-gray-600">Showing <span className="font-semibold">{filteredInventoryData.length}</span> medicine{filteredInventoryData.length !== 1 ? 's' : ''}</div>
            </div>
          </div>

          {/* Table body */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Medicine</th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Category</th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Stock</th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Expiry Date</th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {/* Message si inventaire vide */}
                {filteredInventoryData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 lg:px-6 py-12 text-center"><p className="text-gray-500">No medicines in inventory</p></td>
                  </tr>
                ) : (
                  filteredInventoryData.map((med: any, idx: number) => {
                    // Calculs d'état d'expiration et de stock pour chaque ligne
                    const daysLeft = getDaysUntilExpiry(med.expiry_date);
                    const isCritical = daysLeft <= 30;
                    const isWarning = daysLeft > 30 && daysLeft <= 60;
                    const unit = getInventoryUnit(med);
                    const fullLabel = getFullLabel(med);
                    const stockVal = Number(pickFirst(med, ['stock','qty','quantity']) ?? 0);

                    return (
                      <tr key={idx} className={`${isCritical ? 'bg-red-50' : isWarning ? 'bg-yellow-50' : 'hover:bg-gray-50'} transition`}>
                        <td className="px-4 lg:px-6 py-3 lg:py-4">
                          <div>
                            <p className="font-semibold text-sm lg:text-base text-gray-900">{fullLabel}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-xs text-gray-500">ID: {pickFirst(med, ['medicine_id','id_medoc','id']) ?? '—'}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 lg:px-6 py-3 lg:py-4">
                          {pickFirst(med, ['category','categorie','type']) ? (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">{pickFirst(med, ['category','categorie','type'])}</span>
                          ) : (
                            <span className="text-gray-400 text-xs">Uncategorized</span>
                          )}
                        </td>

                        <td className="px-4 lg:px-6 py-3 lg:py-4">
                          <span className={`px-2 lg:px-3 py-1 rounded-full text-xs lg:text-sm font-bold whitespace-nowrap ${stockVal > 20 ? 'bg-green-100 text-green-800' : stockVal > 5 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                            {stockVal} {pluralizeUnit(unit, stockVal)}
                          </span>
                        </td>

                        <td className="px-4 lg:px-6 py-3 lg:py-4">
                          <div className="flex flex-col">
                            <span className={`font-semibold text-xs lg:text-sm ${isCritical ? 'text-red-600' : isWarning ? 'text-yellow-600' : 'text-gray-900'}`}>
                              {med.expiry_date ? new Date(med.expiry_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                            </span>
                            {med.expiry_date && (
                              <span className={`text-xs mt-1 ${isCritical ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                                {daysLeft < 0 ? 'Expired' : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-4 lg:px-6 py-3 lg:py-4">
                          {isCritical ? (
                            <span className="px-2 lg:px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold whitespace-nowrap">🚨 URGENT</span>
                          ) : isWarning ? (
                            <span className="px-2 lg:px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold whitespace-nowrap">⚠️ Warning</span>
                          ) : (
                            <span className="px-2 lg:px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold whitespace-nowrap">✓ OK</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer table : résumé et légendes */}
          {filteredInventoryData.length > 0 && (
            <div className="px-4 lg:px-6 py-3 lg:py-4 bg-gray-50 border-t rounded-b-xl">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 text-xs lg:text-sm">
                <span className="text-gray-600">Showing <span className="font-semibold">{filteredInventoryData.length}</span> medicine{filteredInventoryData.length !== 1 ? 's' : ''}</span>
                <div className="flex flex-wrap items-center gap-3 lg:gap-4">
                  <div className="flex items-center gap-2"><span className="w-3 h-3 bg-red-100 rounded-full"></span><span className="text-xs text-gray-600">Critical (≤30d)</span></div>
                  <div className="flex items-center gap-2"><span className="w-3 h-3 bg-yellow-100 rounded-full"></span><span className="text-xs text-gray-600">Warning (≤60d)</span></div>
                  <div className="flex items-center gap-2"><span className="w-3 h-3 bg-green-100 rounded-full"></span><span className="text-xs text-gray-600">OK (+60d)</span></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
