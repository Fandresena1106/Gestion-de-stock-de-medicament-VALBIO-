// resources/js/Pages/Medicament/Index.tsx
import React, { useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout'; // Mise en page globale avec breadcrumbs
import { Head, Link, router, useForm, usePage } from '@inertiajs/react'; // Outils Inertia pour formulaires et navigation
import { type BreadcrumbItem } from '@/types'; // Typage personnalisé des breadcrumbs
import { FiEye, FiEdit, FiTrash2, FiPlus, FiX, FiCheck, FiLoader } from 'react-icons/fi'; // Icônes utilisées dans l'UI
import Modal from '@/components/Modal'; // Composant modal réutilisable

/**
 * Type TypeScript représentant la structure d’un médicament tel que reçu du backend
 */
type Medicament = {
  id_medoc: number;                 // Identifiant unique
  nom_medoc: string;               // Nom du médicament
  description?: string | null;     // Forme du médicament (ex: "Tablet"), stockée dans "description"
  categorie?: string | null;       // Catégorie (ex: Antibiotic, Vitamin)
  mesure?: number | string | null; // Dosage (ex: 500)
  unite?: string | null;           // Unité de mesure (ex: mg, ml)
  default_inventory_unit?: string | null; // Champ optionnel pour future unité par défaut d’inventaire
};

interface Props {
  medicaments: Medicament[];       // Liste initiale des médicaments reçue du backend
}

// Breadcrumbs utilisés dans AppLayout pour navigation
const breadcrumbs: BreadcrumbItem[] = [{ title: 'Medications', href: '/medicaments' }];

/**
 * Listes de catégories et formes usuelles pour faciliter la sélection utilisateur
 * Ces listes sont utilisées dans les select dropdowns
 */
const CATEGORIES_LIST = [
  { value: 'Antibiotic', label: 'Antibiotic' },
  { value: 'Analgesic', label: 'Analgesic' },
  { value: 'Vitamin', label: 'Vitamin' },
  { value: 'Antipyretic', label: 'Antipyretic' },
  { value: 'Other', label: 'Other' },
];

const FORMES_LIST = [
  { value: 'Tablet', label: 'Tablet' },
  { value: 'Capsule', label: 'Capsule' },
  { value: 'Syrup', label: 'Syrup / Liquid' },
  { value: 'Injection', label: 'Injection' },
  { value: 'Ointment', label: 'Ointment' },
  { value: 'Drops', label: 'Drops' },
  { value: 'Inhaler', label: 'Inhaler' },
  { value: 'Other', label: 'Other' },
];

/**
 * Mapping des unités autorisées en fonction de la forme choisie.
 * Permet d’afficher dynamiquement les unités compatibles dans le formulaire.
 */
const UNITS_MAP: Record<string, { value: string; label: string }[]> = {
  tablet: [{ value: 'Tablet', label: 'Tablet(s)' }, { value: 'mg', label: 'mg' }],
  capsule: [{ value: 'Capsule', label: 'Capsule(s)' }, { value: 'mg', label: 'mg' }],
  syrup: [{ value: 'ml', label: 'ml' }, { value: 'mg/5ml', label: 'mg/5ml' }],
  injection: [{ value: 'ml', label: 'ml' }, { value: 'iu', label: 'IU' }],
  ointment: [{ value: 'g', label: 'g' }],
  drops: [{ value: 'Drop', label: 'Drop(s)' }, { value: 'ml', label: 'ml' }],
  inhaler: [{ value: 'Puff', label: 'Puff(s)' }, { value: 'mcg', label: 'mcg' }],
  other: [{ value: 'units', label: 'units' }, { value: 'mg', label: 'mg' }, { value: 'ml', label: 'ml' }],
};

// Valeurs par défaut pour unités si forme inconnue
const DEFAULT_UNITS = [{ value: 'mg', label: 'mg' }, { value: 'ml', label: 'ml' }, { value: 'tablet', label: 'tablet(s)' }];

/**
 * Typage des champs du formulaire (création / édition)
 */
type FormFields = {
  nom_medoc: string;
  description: string; // Stocke la "forme"
  categorie: string;
  mesure: string;
  unite: string;
};

/**
 * Helper: capitalise chaque mot pour une meilleure présentation
 */
function capitalizeWords(s?: string | null) {
  if (!s) return s;
  return s
    .toString()
    .split(' ')
    .map(w => (w.length ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}

/**
 * Helper: formate la dose avec unité, gère les entiers, décimaux, et cas particuliers
 * Exemples : 500mg, 12.5 ml, 1/2 tablet
 */
function formatDosage(mesure?: string | number | null, unite?: string | null): string | null {
  if (mesure === undefined || mesure === null || mesure === '') return null;
  const n = Number(mesure);
  if (Number.isNaN(n)) {
    // Cas spécial : valeur non numérique (ex: "1/2"), on concatène avec unité
    return `${mesure}${unite ?? ''}`;
  }
  // Affiche sans décimales inutiles (ex: 12.50 -> 12.5, 500.00 -> 500)
  const value = Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, '');
  return `${value}${unite ?? ''}`;
}

/**
 * Composant principal de la page d’index des médicaments
 */
export default function Index({ medicaments: initialMedicaments }: Props) {
  // Données additionnelles envoyées par Inertia (ex: auth, flash messages)
  const page = usePage();

  // État local : liste affichée des médicaments
  const [list, setList] = useState<Medicament[]>(initialMedicaments ?? []);

  // Recherche locale
  const [search, setSearch] = useState('');

  // Gestion des modaux
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingMedicament, setEditingMedicament] = useState<Medicament | null>(null);
  const [showDetails, setShowDetails] = useState<Medicament | null>(null);

  /**
   * Synchronisation de l'état local avec les props
   * Utile quand les données changent après une requête (ex: création)
   */
  useEffect(() => {
    setList((initialMedicaments ?? []) as Medicament[]);
  }, [initialMedicaments]);

  /**
   * Formulaire création via useForm Inertia (état + validation + erreurs)
   */
  const createForm = useForm<FormFields>({
    nom_medoc: '',
    description: '',
    categorie: '',
    mesure: '',
    unite: '',
  });

  /**
   * Formulaire édition (similaire au formulaire création)
   */
  const editForm = useForm<FormFields>({
    nom_medoc: '',
    description: '',
    categorie: '',
    mesure: '',
    unite: '',
  });

  /**
   * Retourne la liste des unités autorisées en fonction de la forme sélectionnée
   * Si forme inconnue ou vide, renvoie les unités par défaut
   */
  function getUnitsForForm(forme?: string) {
    if (!forme) return DEFAULT_UNITS;
    return UNITS_MAP[forme.toLowerCase()] ?? DEFAULT_UNITS;
  }

  /**
   * Gestion du changement de forme dans le formulaire création
   * Met à jour la forme + vérifie que l'unité est compatible
   */
  function handleCreateFormeChange(value: string) {
    createForm.setData('description', value);
    const allowed = getUnitsForForm(value);
    if (!allowed.find(u => u.value === createForm.data.unite)) {
      // Unité incompatible => on sélectionne la première unité compatible
      createForm.setData('unite', allowed[0]?.value ?? '');
    }
  }

  /**
   * Même logique pour le formulaire édition
   */
  function handleEditFormeChange(value: string) {
    editForm.setData('description', value);
    const allowed = getUnitsForForm(value);
    if (!allowed.find(u => u.value === editForm.data.unite)) {
      editForm.setData('unite', allowed[0]?.value ?? '');
    }
  }

  /**
   * Soumission du formulaire création : envoie POST via Inertia
   */
  function createSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    createForm.post('/medicaments', {
      onSuccess: () => setShowCreateModal(false), // Ferme le modal si succès
    });
  }

  /**
   * Ouvre le modal édition et pré-remplit les champs avec le médicament sélectionné
   */
  function openEdit(med: Medicament) {
    setEditingMedicament(med);
    editForm.setData({
      nom_medoc: med.nom_medoc ?? '',
      description: med.description ?? '',
      categorie: med.categorie ?? '',
      mesure: med.mesure ? String(med.mesure) : '',
      unite: med.unite ?? '',
    });
    // Vérifie que l’unité est compatible avec la forme, sinon remplace
    const allowed = getUnitsForForm(med.description ?? '');
    if (!allowed.find(u => u.value === (med.unite ?? ''))) {
      editForm.setData('unite', allowed[0]?.value ?? '');
    }
  }

  /**
   * Soumission du formulaire édition : envoie PUT via Inertia
   */
  function editSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!editingMedicament) return;
    editForm.put(`/medicaments/${editingMedicament.id_medoc}`, {
      onSuccess: () => setEditingMedicament(null), // Ferme modal édition si succès
    });
  }

  /**
   * Suppression d’un médicament via Inertia (DELETE)
   * Confirmation simple avec window.confirm
   */
  function handleDelete(id: number) {
    if (!confirm('Confirm deletion of this medication?')) return;
    router.delete(`/medicaments/${id}`, {
      onSuccess: () => setList((prev) => prev.filter((m) => m.id_medoc !== id)), // Mise à jour liste locale
    });
  }

  /**
   * Filtrage côté client selon la recherche : nom, catégorie, forme
   */
  const filtered = list.filter((m) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (m.nom_medoc ?? '').toLowerCase().includes(q) ||
      (m.categorie ?? '').toLowerCase().includes(q) ||
      (m.description ?? '').toLowerCase().includes(q)
    );
  });

  // Rendu JSX principal
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Medications" />
      <div className="p-4 flex flex-col gap-4">
        {/* En-tête + barre recherche + bouton ajout */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h1 className="text-2xl font-bold">Medications</h1>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search by name, category or form"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded border border-gray-300 px-3 py-2 w-64 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700 transition font-medium"
            >
              <FiPlus className="mr-2" /> Add Medication
            </button>
          </div>
        </div>

        {/* Statistiques résumé */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
            <p className="text-sm text-gray-600">Total Medications</p>
            <p className="text-2xl font-bold">{list.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
            <p className="text-sm text-gray-600">Filtered Results</p>
            <p className="text-2xl font-bold">{filtered.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
            <p className="text-sm text-gray-600">Unique Categories</p>
            <p className="text-2xl font-bold">{new Set(list.map((m) => m.categorie).filter(Boolean)).size}</p>
          </div>
        </div>

        {/* Tableau des médicaments */}
        <div className="relative overflow-x-auto rounded-xl border border-gray-200 shadow bg-white">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs uppercase text-gray-700 border-b">
              <tr>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3">Form</th>
                <th className="px-6 py-3">Dosage</th>
                <th className="px-6 py-3 text-center">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center px-6 py-8 text-gray-500">
                    {search ? 'No medications match your search.' : 'No medications found.'}
                  </td>
                </tr>
              ) : (
                filtered.map((med) => (
                  <tr key={med.id_medoc} className="border-b hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-semibold">{med.nom_medoc}</td>
                    <td className="px-6 py-4 font-semibold">{med.categorie ? capitalizeWords(med.categorie) : '—'}</td>
                    <td className="px-6 py-4 font-semibold">{med.description ?? '—'}</td>
                    <td className="px-6 py-4 font-semibold">{formatDosage(med.mesure, med.unite) ?? '—'}</td>
                    <td className="px-6 py-4 font-semibold text-center">
                      <div className="flex gap-4 justify-center">
                        {/* Bouton voir détails */}
                        <button type="button" onClick={() => setShowDetails(med)} className="text-blue-600 hover:text-blue-800 transition" title="View">
                          <FiEye className="w-5 h-5" />
                        </button>
                        {/* Bouton édition */}
                        <button type="button" onClick={() => openEdit(med)} className="text-green-600 hover:text-green-800 transition" title="Edit">
                          <FiEdit className="w-5 h-5" />
                        </button>
                        {/* Bouton suppression */}
                        <button onClick={() => handleDelete(med.id_medoc)} className="text-red-600 hover:text-red-800 transition" type="button" title="Delete">
                          <FiTrash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal création */}
      <Modal show={showCreateModal} onClose={() => setShowCreateModal(false)} title="Add New Medicine">
        <form onSubmit={createSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">
              Medicine Name <span className="text-red-500">*</span>
            </label>
            {/* Input contrôlé via useForm */}
            <input
              value={createForm.data.nom_medoc}
              onChange={(e) => createForm.setData('nom_medoc', e.target.value)}
              className="mt-1 block w-full rounded border px-3 py-2"
              required
            />
            {createForm.errors.nom_medoc && <p className="text-sm text-red-600 mt-1">{createForm.errors.nom_medoc}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={createForm.data.categorie}
              onChange={(e) => createForm.setData('categorie', e.target.value)}
              className="mt-1 block w-full rounded border px-3 py-2"
              required
            >
              <option value="">-- Select category --</option>
              {CATEGORIES_LIST.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">
              Form <span className="text-red-500">*</span>
            </label>
            {/* Lors du changement on met à jour l’unité automatiquement */}
            <select
              value={createForm.data.description}
              onChange={(e) => handleCreateFormeChange(e.target.value)}
              className="mt-1 block w-full rounded border px-3 py-2"
              required
            >
              <option value="">-- Select form --</option>
              {FORMES_LIST.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          {/* Dosage + unité */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Dosage</label>
              <input
                type="text"
                value={createForm.data.mesure}
                onChange={(e) => createForm.setData('mesure', e.target.value)}
                className="mt-1 block w-full rounded border px-3 py-2"
                placeholder="e.g. 500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Unit</label>
              <select
                value={createForm.data.unite}
                onChange={(e) => createForm.setData('unite', e.target.value)}
                className="mt-1 block w-full rounded border px-3 py-2"
              >
                <option value="">-- Select unit --</option>
                {getUnitsForForm(createForm.data.description).map((unit) => (
                  <option key={unit.value} value={unit.value}>
                    {unit.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Boutons */}
          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="rounded border border-gray-300 px-4 py-2 hover:bg-gray-100 transition"
              disabled={createForm.processing}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createForm.processing}
              className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700 transition flex items-center justify-center gap-2"
            >
              {createForm.processing && <FiLoader className="animate-spin" />}
              Save
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal édition */}
      <Modal show={!!editingMedicament} onClose={() => setEditingMedicament(null)} title="Edit Medicine">
        <form onSubmit={editSubmit} className="space-y-4">
          {/* Même structure que modal création, avec données préremplies */}
          <div>
            <label className="block text-sm font-medium">
              Medicine Name <span className="text-red-500">*</span>
            </label>
            <input
              value={editForm.data.nom_medoc}
              onChange={(e) => editForm.setData('nom_medoc', e.target.value)}
              className="mt-1 block w-full rounded border px-3 py-2"
              required
            />
            {editForm.errors.nom_medoc && <p className="text-sm text-red-600 mt-1">{editForm.errors.nom_medoc}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={editForm.data.categorie}
              onChange={(e) => editForm.setData('categorie', e.target.value)}
              className="mt-1 block w-full rounded border px-3 py-2"
              required
            >
              <option value="">-- Select category --</option>
              {CATEGORIES_LIST.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">
              Form <span className="text-red-500">*</span>
            </label>
            <select
              value={editForm.data.description}
              onChange={(e) => handleEditFormeChange(e.target.value)}
              className="mt-1 block w-full rounded border px-3 py-2"
              required
            >
              <option value="">-- Select form --</option>
              {FORMES_LIST.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Dosage</label>
              <input
                type="text"
                value={editForm.data.mesure}
                onChange={(e) => editForm.setData('mesure', e.target.value)}
                className="mt-1 block w-full rounded border px-3 py-2"
                placeholder="e.g. 500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Unit</label>
              <select
                value={editForm.data.unite}
                onChange={(e) => editForm.setData('unite', e.target.value)}
                className="mt-1 block w-full rounded border px-3 py-2"
              >
                <option value="">-- Select unit --</option>
                {getUnitsForForm(editForm.data.description).map((unit) => (
                  <option key={unit.value} value={unit.value}>
                    {unit.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={() => setEditingMedicament(null)}
              className="rounded border border-gray-300 px-4 py-2 hover:bg-gray-100 transition"
              disabled={editForm.processing}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={editForm.processing}
              className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700 transition flex items-center justify-center gap-2"
            >
              {editForm.processing && <FiLoader className="animate-spin" />}
              Update
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal détails */}
      <Modal show={!!showDetails} onClose={() => setShowDetails(null)} title="Medication Details">
        {showDetails && (
          <div className="space-y-3">
            <p>
              <strong>Name:</strong> {showDetails.nom_medoc}
            </p>
            <p>
              <strong>Category:</strong> {capitalizeWords(showDetails.categorie) ?? '—'}
            </p>
            <p>
              <strong>Form:</strong> {showDetails.description ?? '—'}
            </p>
            <p>
              <strong>Dosage:</strong> {formatDosage(showDetails.mesure, showDetails.unite) ?? '—'}
            </p>
          </div>
        )}
      </Modal>
    </AppLayout>
  );
}
