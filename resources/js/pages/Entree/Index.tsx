// resources/js/Pages/Entree/Index.tsx
import React, { useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, router, useForm } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { FiEye, FiEdit, FiTrash2, FiPlus, FiX, FiCheck, FiLoader } from 'react-icons/fi';
import Modal from '@/components/Modal';

type Medicament = {
  id_medoc: number;
  nom_medoc: string;
  mesure?: string | number | null;
  unite?: string | null;
  description?: string | null;
  categorie?: string | null;
  [key: string]: any;
};

type Entree = {
  id_entree: number;
  id_medoc: number;
  fournisseur?: string | null;
  quantite: number;
  unite_mesure?: string | null;
  date_expiration?: string | null;
  date_entree: string;
  medicament?: Medicament | null;
};

interface Props {
  entrees: Entree[];
  medicaments?: Medicament[];
  unites?: string[];
}

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Entries', href: '/entrees' }];

type FormFields = {
  id_medoc: string;
  fournisseur: string;
  quantite: number | string;
  unite_mesure: string;
  date_entree: string;
  date_expiration: string;
};

/** Helpers **/

/** NEW: Plural rules */
function pluralize(unit: string, qty: number) {
  if (!unit) return '';
  return qty > 1 ? `${unit}s` : unit;
}

/** Format dosage */
function formatDosage(mesure?: string | number | null, unite?: string | null): string | null {
  if (mesure === undefined || mesure === null || mesure === '') return null;
  const raw = String(mesure).trim().replace(',', '.');
  const n = Number(raw);
  if (Number.isNaN(n)) return `${raw}${unite ?? ''}`;
  const value = Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, '');
  return `${value}${unite ?? ''}`;
}

/** Detect "form" field */
function getForm(m: Medicament): string {
  const candidates = [
    m.description,
    (m as any).type,
    (m as any).description_medoc,
  ];
  for (const c of candidates) {
    if (c !== undefined && c !== null && String(c).trim() !== '') {
      return String(c).trim().toLowerCase();
    }
  }
  return '';
}

/** Label for medicine selector */
function labelForSelect(m: Medicament) {
  const form = getForm(m);
  const dos = formatDosage(m.mesure, m.unite);
  return `${m.nom_medoc}${form ? ` ${form}` : ''}${dos ? ` ${dos}` : ''}`;
}

export default function Index({ entrees: initialList, medicaments = [], unites = [] }: Props) {
  const [list, setList] = useState<Entree[]>(initialList ?? []);
  const [search, setSearch] = useState('');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Entree | null>(null);
  const [showDetails, setShowDetails] = useState<Entree | null>(null);

  useEffect(() => {
    setList(initialList ?? []);
  }, [initialList]);

  const createForm = useForm<FormFields>({
    id_medoc: '',
    fournisseur: '',
    quantite: 1,
    unite_mesure: '',
    date_entree: new Date().toISOString().slice(0, 10),
    date_expiration: '',
  });

  const editForm = useForm<FormFields>({
    id_medoc: '',
    fournisseur: '',
    quantite: 1,
    unite_mesure: '',
    date_entree: new Date().toISOString().slice(0, 10),
    date_expiration: '',
  });

  function createSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    createForm.post('/entrees', {
      onSuccess: () => {
        setShowCreateModal(false);
        createForm.reset();
      },
    });
  }

  function openEdit(entry: Entree) {
    setEditingEntry(entry);
    editForm.setData({
      id_medoc: String(entry.id_medoc),
      fournisseur: entry.fournisseur ?? '',
      quantite: entry.quantite,
      unite_mesure: entry.unite_mesure ?? '',
      date_entree: entry.date_entree ?? new Date().toISOString().slice(0, 10),
      date_expiration: entry.date_expiration ?? '',
    });
  }

  function editSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!editingEntry) return;
    editForm.put(`/entrees/${editingEntry.id_entree}`, {
      onSuccess: () => setEditingEntry(null),
    });
  }

  function handleDelete(id: number) {
    if (!confirm('Are you sure you want to delete this entry?')) return;
    router.delete(`/entrees/${id}`, {
      onSuccess: () => setList((prev) => prev.filter((e) => e.id_entree !== id)),
    });
  }

  const filtered = list.filter((e) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (e.medicament?.nom_medoc ?? '').toLowerCase().includes(q) ||
      (e.fournisseur ?? '').toLowerCase().includes(q) ||
      (e.medicament?.categorie ?? '').toLowerCase().includes(q)
    );
  });

  // Auto-fill unit if medicament has preference
  useEffect(() => {
    const sel = (medicaments ?? []).find((m) => String(m.id_medoc) === String(createForm.data.id_medoc));
    if (sel && (sel as any).default_inventory_unit) {
      if (!createForm.data.unite_mesure) createForm.setData('unite_mesure', (sel as any).default_inventory_unit);
    }
  }, [createForm.data.id_medoc, medicaments]);

  /** NEW: plural unit display */
  const displayUnit = (e: Entree) => {
    const base = e.unite_mesure || 'unit';
    return pluralize(base, e.quantite);
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Medicine Entries" />

      <div className="p-4 flex flex-col gap-4">
        {/* header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h1 className="text-2xl font-bold">Medicine Entries</h1>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search by medicine, category or supplier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded border border-gray-300 px-3 py-2 w-64 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700 transition font-medium"
            >
              <FiPlus className="mr-2" />Add Entry
            </button>
          </div>
        </div>

        {/* stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
            <p className="text-sm text-gray-600">Total Entries</p>
            <p className="text-2xl font-bold">{list.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
            <p className="text-sm text-gray-600">Filtered Results</p>
            <p className="text-2xl font-bold">{filtered.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
            <p className="text-sm text-gray-600">Unique Medicines</p>
            <p className="text-2xl font-bold">{new Set(list.map((e) => e.id_medoc)).size}</p>
          </div>
        </div>

        {/* table */}
        <div className="relative overflow-x-auto rounded-xl border border-gray-200 shadow bg-white">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs uppercase text-gray-700 border-b">
              <tr>
                {/* <th className="px-6 py-3">ID</th> */}
                <th className="px-6 py-3">Medicine</th>
                <th className="px-6 py-3">Form</th>
                <th className="px-6 py-3">Dosage</th>
                <th className="px-6 py-3">Supplier</th>
                <th className="px-6 py-3">Quantity</th>
                <th className="px-6 py-3">Entry Date</th>
                <th className="px-6 py-3">Expiration</th>
                <th className="px-6 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center px-6 py-8 text-gray-500">
                    {search ? 'No entries match your search.' : 'No entries found.'}
                  </td>
                </tr>
              ) : (
                filtered.map((e) => (
                  <tr key={e.id_entree} className="border-b hover:bg-gray-50 transition">
                    {/* <td className="px-6 py-4 font-medium text-gray-900">#{e.id_entree}</td> */}
                    <td className="px-6 py-4 font-semibold">
                      {e.medicament?.nom_medoc ?? `Medicine ID: ${e.id_medoc}`}
                    </td>
                    <td className="px-6 py-4 font-semibold">
                      {e.medicament?.description ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {String(e.medicament.description).replace(/^\w/, (c) => c.toUpperCase())}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-6 py-4 font-semibold">
                      {formatDosage(e.medicament?.mesure, e.medicament?.unite) ?? '—'}
                    </td>
                    <td className="px-6 py-4 font-semibold">{e.fournisseur ?? '—'}</td>
                    <td className="px-6 py-4 font-semibold">
                      {e.quantite} {displayUnit(e)}
                    </td>
                    <td className="px-6 py-4 font-semibold">
                      {new Date(e.date_entree).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 font-semibold">
                      {e.date_expiration ? (
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            new Date(e.date_expiration) < new Date()
                              ? 'bg-red-100 text-red-800'
                              : new Date(e.date_expiration) <
                                new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {new Date(e.date_expiration).toLocaleDateString()}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => setShowDetails(e)}
                          className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                        >
                          <FiEye className="w-5 h-5" />
                        </button>

                        <button
                          onClick={() => openEdit(e)}
                          className="text-green-600 hover:text-green-800 hover:underline font-medium"
                        >
                          <FiEdit className="w-5 h-5" />
                        </button>

                        <button
                          onClick={() => handleDelete(e.id_entree)}
                          className="text-red-600 hover:text-red-800 hover:underline font-medium"
                        >
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

      {/* Create Modal */}
      <Modal show={showCreateModal} onClose={() => setShowCreateModal(false)} title="Add Medicine Entry">
        <form onSubmit={createSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Medicine <span className="text-red-500">*</span>
            </label>

            <select
              value={String(createForm.data.id_medoc)}
              onChange={(e) => createForm.setData('id_medoc', e.target.value)}
              className={`mt-1 block w-full rounded border px-3 py-2 ${
                createForm.errors.id_medoc ? 'border-red-500' : 'border-gray-300'
              }`}
              required
            >
              <option value="">-- Select a medicine --</option>
              {(medicaments ?? []).map((m) => (
                <option key={m.id_medoc} value={m.id_medoc}>
                  {labelForSelect(m)}
                </option>
              ))}
            </select>

            {createForm.errors.id_medoc && (
              <p className="text-sm text-red-600 mt-1">{createForm.errors.id_medoc}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Supplier</label>
            <input
              value={createForm.data.fournisseur}
              onChange={(e) => createForm.setData('fournisseur', e.target.value)}
              className="mt-1 block w-full rounded border px-3 py-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Quantity <span className="text-red-500">*</span>
              </label>

              <input
                type="number"
                min={1}
                value={createForm.data.quantite as any}
                onChange={(e) =>
                  createForm.setData('quantite', Number(e.target.value))
                }
                className="mt-1 block w-full rounded border px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Inventory Unit <span className="text-red-500">*</span>
              </label>
              <select
                value={createForm.data.unite_mesure}
                onChange={(e) => createForm.setData('unite_mesure', e.target.value)}
                className="mt-1 block w-full rounded border px-3 py-2"
                required
              >
                <option value="">-- Select a unit --</option>
                {(unites ?? []).map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Entry Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={createForm.data.date_entree}
                onChange={(e) => createForm.setData('date_entree', e.target.value)}
                className="mt-1 block w-full rounded border px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Expiration Date</label>
              <input
                type="date"
                value={createForm.data.date_expiration}
                onChange={(e) =>
                  createForm.setData('date_expiration', e.target.value)
                }
                className="mt-1 block w-full rounded border px-3 py-2"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="p-3 rounded-full border border-gray-300 hover:bg-gray-100"
            >
              <FiX />
            </button>

            <button
              type="submit"
              className="p-3 rounded-full bg-green-600 text-white"
              disabled={createForm.processing}
            >
              {createForm.processing ? (
                <FiLoader className="animate-spin" />
              ) : (
                <FiCheck />
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      {editingEntry && (
        <Modal
          show={!!editingEntry}
          onClose={() => setEditingEntry(null)}
          title={`Edit Entry #${editingEntry.id_entree}`}
        >
          <form onSubmit={editSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Medicine <span className="text-red-500">*</span>
              </label>

              <select
                value={String(editForm.data.id_medoc)}
                onChange={(e) => editForm.setData('id_medoc', e.target.value)}
                className="mt-1 block w-full rounded border px-3 py-2"
                required
              >
                <option value="">-- Select a medicine --</option>
                {(medicaments ?? []).map((m) => (
                  <option key={m.id_medoc} value={m.id_medoc}>
                    {labelForSelect(m)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Supplier</label>
              <input
                value={editForm.data.fournisseur}
                onChange={(e) => editForm.setData('fournisseur', e.target.value)}
                className="mt-1 block w-full rounded border px-3 py-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Quantity <span className="text-red-500">*</span>
                </label>

                <input
                  type="number"
                  min={1}
                  value={editForm.data.quantite as any}
                  onChange={(e) =>
                    editForm.setData('quantite', Number(e.target.value))
                  }
                  className="mt-1 block w-full rounded border px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Inventory Unit <span className="text-red-500">*</span>
                </label>
                <select
                  value={editForm.data.unite_mesure}
                  onChange={(e) => editForm.setData('unite_mesure', e.target.value)}
                  className="mt-1 block w-full rounded border px-3 py-2"
                  required
                >
                  <option value="">-- Select a unit --</option>
                  {(unites ?? []).map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Entry Date <span className="text-red-500">*</span>
                </label>

                <input
                  type="date"
                  value={editForm.data.date_entree}
                  onChange={(e) => editForm.setData('date_entree', e.target.value)}
                  className="mt-1 block w-full rounded border px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Expiration Date</label>
                <input
                  type="date"
                  value={editForm.data.date_expiration}
                  onChange={(e) =>
                    editForm.setData('date_expiration', e.target.value)
                  }
                  className="mt-1 block w-full rounded border px-3 py-2"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => setEditingEntry(null)}
                className="p-3 rounded-full border border-gray-300 hover:bg-gray-100"
              >
                <FiX />
              </button>

              <button
                type="submit"
                className="p-3 rounded-full bg-green-600 text-white"
                disabled={editForm.processing}
              >
                {editForm.processing ? (
                  <FiLoader className="animate-spin" />
                ) : (
                  <FiCheck />
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Details Modal */}
      {showDetails && (
        <Modal
          show={!!showDetails}
          onClose={() => setShowDetails(null)}
          title={`Entry #${showDetails.id_entree}`}
        >
          <div className="space-y-3">
            <p>
              <strong>Medicine:</strong>{' '}
              {showDetails.medicament?.nom_medoc ?? `ID ${showDetails.id_medoc}`}
            </p>

            <p>
              <strong>Category:</strong>{' '}
              {showDetails.medicament?.categorie
                ? String(showDetails.medicament.categorie).replace(/^\w/, (c) =>
                    c.toUpperCase()
                  )
                : '—'}
            </p>

            <p>
              <strong>Form:</strong>{' '}
              {showDetails.medicament?.description
                ? String(showDetails.medicament.description).replace(
                    /^\w/,
                    (c) => c.toUpperCase()
                  )
                : '—'}
            </p>

            <p>
              <strong>Supplier:</strong> {showDetails.fournisseur ?? '—'}
            </p>

            <p>
              <strong>Quantity:</strong> {showDetails.quantite}{' '}
              {displayUnit(showDetails)}
            </p>

            <p>
              <strong>Entry Date:</strong>{' '}
              {new Date(showDetails.date_entree).toLocaleDateString()}
            </p>

            <p>
              <strong>Expiration:</strong>{' '}
              {showDetails.date_expiration
                ? new Intl.DateTimeFormat('fr-FR').format(
                    new Date(showDetails.date_expiration)
                  )
                : '—'}
            </p>

            <div className="flex justify-end pt-4">
              <button onClick={() => setShowDetails(null)} className="px-4 py-2 rounded border">
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </AppLayout>
  );
}
