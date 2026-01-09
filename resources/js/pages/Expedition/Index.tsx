import React, { useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, router, useForm } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import Modal from '@/components/Modal';
import { FiEye, FiEdit, FiTrash2, FiPlus, FiX, FiCheck, FiLoader } from 'react-icons/fi';

type Medicament = {
  id_medoc: number;
  nom_medoc: string;
  mesure?: string | number | null;
  unite?: string | null; // dosage unit (mg/ml)
  unite_stock?: string | null; // inventory unit (blister, bottle, tube)
  forme?: string | null;
  categorie?: string | null;
  full_nom?: string;
};

type ExpeditionDetail = {
  id_medoc: number;
  nom_medoc: string;
  full_nom?: string;
  forme?: string | null;
  categorie?: string | null;
  mesure?: string | number | null;
  unite?: string | null;
  unite_stock?: string | null;
  inventory_unit?: string | null;
  inventory_unit_display?: string | null;
  quantite: number;
  dosage_display?: string | null;
};

type ExpeditionRow = {
  id_expedition: number;
  village: string;
  zone: string;
  duree: number;
  date_expedition: string;
  total_medicaments: number;
  total_items?: number;
  details?: ExpeditionDetail[];
};

interface Props {
  expeditions: ExpeditionRow[];
  medicaments: Medicament[]; // for create/edit modal
}

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Expeditions', href: '/expeditions' }];

export default function Index({ expeditions: initialList, medicaments: medicamentsProp }: Props) {
  const [list, setList] = useState<ExpeditionRow[]>(initialList ?? []);
  const [search, setSearch] = useState('');

  // modals state
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<ExpeditionRow | null>(null);
  const [showDetails, setShowDetails] = useState<ExpeditionRow | null>(null);

  useEffect(() => setList(initialList ?? []), [initialList]);

  // create form using useForm with nested array medicaments
  const createForm = useForm({
    village: '',
    zone: 'nord',
    date_expedition: new Date().toISOString().slice(0, 10),
    duree: 1,
    medicaments: [{ id_medoc: '', quantite: 1 }], // at least one line
  });

  const editForm = useForm({
    village: '',
    zone: 'nord',
    date_expedition: new Date().toISOString().slice(0, 10),
    duree: 1,
    medicaments: [{ id_medoc: '', quantite: 1 }],
  });

  // helper client-side pluralize (fallback if server didn't provide inventory_unit_display)
  function pluralizeUnit(unit: string | undefined | null, qty: number) {
    if (!unit) return '';
    const invariables = ['mg', 'ml', 'g', 'µg', 'ug'];
    if (invariables.includes(unit.toLowerCase())) return unit;
    if (qty > 1) return unit.endsWith('s') ? unit : unit + 's';
    return unit;
  }

  function buildFullLabelFromMed(m: Medicament) {
    if (m.full_nom) return m.full_nom;
    const parts = [m.nom_medoc];
    if (m.forme) parts.push(`- ${m.forme}`);
    if (m.mesure || m.unite) parts.push(`${m.mesure ?? ''}${m.unite ?? ''}`);
    return parts.filter(Boolean).join(' ');
  }

  // helper to flatten error messages object into array of strings
  const flattenErrors = (errorsObj: Record<string, any> | undefined) => {
    if (!errorsObj) return [] as string[];
    const vals: string[] = [];
    Object.values(errorsObj).forEach((v) => {
      if (Array.isArray(v)) v.forEach(x => vals.push(String(x)));
      else vals.push(String(v));
    });
    return vals;
  };

  // Create submit: keep modal open on server validation errors
  function createSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    createForm.post('/expeditions', {
      preserveScroll: true,
      onSuccess: () => {
        setShowCreate(false);
        createForm.reset('village', 'zone', 'date_expedition', 'duree');
        createForm.setData('medicaments', [{ id_medoc: '', quantite: 1 }]);
        createForm.clearErrors();
      },
      onError: () => {
        setShowCreate(true);
        // scroll to top of modal if needed
        const el = document.querySelector('[role="dialog"]');
        if (el) (el as HTMLElement).scrollTop = 0;
      },
    });
  }

  // add/remove medicament row in create form
  function addCreateRow() {
    const current = createForm.data.medicaments || [];
    createForm.setData('medicaments', [...current, { id_medoc: '', quantite: 1 }]);
  }
  function removeCreateRow(idx: number) {
    const current = [...(createForm.data.medicaments || [])];
    current.splice(idx,1);
    createForm.setData('medicaments', current);
  }

  // open edit modal and populate
  function openEdit(exp: ExpeditionRow) {
    setEditing(exp);
    editForm.setData({
      village: exp.village,
      zone: exp.zone,
      date_expedition: exp.date_expedition.slice(0,10),
      duree: exp.duree,
      medicaments: (exp.details && exp.details.length > 0)
        ? exp.details.map(d => ({ id_medoc: String(d.id_medoc), quantite: d.quantite }))
        : [{ id_medoc: '', quantite: 1 }],
    });
    editForm.clearErrors();
  }

  // edit add/remove rows
  function addEditRow() {
    const current = editForm.data.medicaments || [];
    editForm.setData('medicaments', [...current, { id_medoc: '', quantite: 1 }]);
  }
  function removeEditRow(idx: number) {
    const current = [...(editForm.data.medicaments || [])];
    current.splice(idx,1);
    editForm.setData('medicaments', current);
  }

  // submit edit
  function editSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    if (!editing) return;
    editForm.put(`/expeditions/${editing.id_expedition}`, {
      preserveScroll: true,
      onSuccess: () => {
        setEditing(null);
        editForm.clearErrors();
      },
      onError: () => {
        setEditing(editing);
        const el = document.querySelector('[role="dialog"]');
        if (el) (el as HTMLElement).scrollTop = 0;
      },
    });
  }

  // delete expedition
  function handleDelete(id: number) {
    if (!confirm('Are you sure you want to delete this expedition?')) return;
    router.delete(`/expeditions/${id}`, {
      onSuccess: () => setList(prev => prev.filter(p => p.id_expedition !== id))
    });
  }

  // filtering
  const filtered = list.filter(e => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return e.village.toLowerCase().includes(q) || e.zone.toLowerCase().includes(q) || String(e.id_expedition).includes(q);
  });

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Medicine Expeditions" />

      <div className="p-4 flex flex-col gap-4">
        {/* header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h1 className="text-2xl font-bold">Medicine Expeditions</h1>
          <div className="flex items-center gap-2">
            <input type="text" placeholder="Search by village, zone or id..." value={search} onChange={(e)=>setSearch(e.target.value)} className="rounded border border-gray-300 px-3 py-2 w-64" />
            <button onClick={()=>{ setShowCreate(true); createForm.clearErrors(); }} className="inline-flex items-center rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition">
              <FiPlus className="mr-2" /> Add
            </button>
          </div>
        </div>

        {/* stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
            <p className="text-sm text-gray-600">Total Expeditions</p>
            <p className="text-2xl font-bold">{list.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
            <p className="text-sm text-gray-600">Filtered Results</p>
            <p className="text-2xl font-bold">{filtered.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
            <p className="text-sm text-gray-600">Total Meds (sum)</p>
            <p className="text-2xl font-bold">{filtered.reduce((s, e) => s + (e.total_medicaments || 0), 0)}</p>
          </div>
        </div>

        {/* table */}
        <div className="relative overflow-x-auto rounded-xl border border-gray-200 shadow bg-white">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs uppercase text-gray-700 border-b">
              <tr>
                <th className="px-6 py-3 text-bleu ">Village</th>
                <th className="px-6 py-3">Zone</th>
                <th className="px-6 py-3">Total Meds</th>
                <th className="px-6 py-3">Duration</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center px-6 py-8 text-gray-500">{search ? 'No expeditions match your search.' : 'No expeditions found.'}</td></tr>
              ) : filtered.map(e => (
                <tr key={e.id_expedition} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-semibold">{e.village}</td>
                  <td className="px-6 py-4 font-semibold capitalize">{e.zone}</td>
                  <td className="px-6 py-4 font-semibold ">{e.total_medicaments} {e.total_medicaments === 1 ? 'Med' : 'Meds'} </td>
                  <td className="px-6 py-4 font-semibold ">{e.duree} {e.duree=== 1 ? 'Day' : 'Days'}</td>
                  <td className="px-6 py-4 font-semibold ">{new Date(e.date_expedition).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex gap-2 justify-center">
                      <button onClick={()=>setShowDetails(e)} className="text-blue-600 hover:text-blue-800 hover:underline">
                        <FiEye className="w-5 h-5" />
                      </button>
                      <button onClick={()=>openEdit(e)} className="text-green-600 hover:text-green-800 hover:underline">
                        <FiEdit className="w-5 h-5" />
                      </button>
                      <button onClick={()=>handleDelete(e.id_expedition)} className="text-red-600 hover:text-red-800 hover:underline">
                        <FiTrash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE modal (allows multiple medicaments) */}
      <Modal show={showCreate} onClose={() => { setShowCreate(false); createForm.clearErrors(); }} title="Create Expedition">
        <form onSubmit={createSubmit} className="space-y-4" role="form">
          {/* Global server errors (list) */}
          {Object.keys(createForm.errors || {}).length > 0 && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded">
              <p className="font-semibold mb-2">Please fix the following errors:</p>
              <ul className="list-disc pl-5 text-sm">
                {flattenErrors(createForm.errors).map((msg, i) => <li key={i}>{msg}</li>)}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Village</label>
              <input
                value={createForm.data.village}
                onChange={(e) => createForm.setData('village', e.target.value)}
                className="mt-1 block w-full rounded border px-3 py-2"
                required
              />
              {createForm.errors.village && <p className="text-sm text-red-600 mt-1">{createForm.errors.village}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium">Zone</label>
              <select
                value={createForm.data.zone}
                onChange={(e) => createForm.setData('zone', e.target.value)}
                className="mt-1 block w-full rounded border px-3 py-2"
              >
                <option value="nord">Nord</option>
                <option value="sud">Sud</option>
                <option value="est">Est</option>
                <option value="ouest">Ouest</option>
              </select>
              {createForm.errors.zone && <p className="text-sm text-red-600 mt-1">{createForm.errors.zone}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium">Date</label>
              <input
                type="date"
                value={createForm.data.date_expedition}
                onChange={(e) => createForm.setData('date_expedition', e.target.value)}
                className="mt-1 block w-full rounded border px-3 py-2"
              />
              {createForm.errors.date_expedition && <p className="text-sm text-red-600 mt-1">{createForm.errors.date_expedition}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium">Duration (days)</label>
              <input
                type="number"
                min={1}
                value={createForm.data.duree as any}
                onChange={(e) => createForm.setData('duree', Number(e.target.value))}
                className="mt-1 block w-full rounded border px-3 py-2"
              />
              {createForm.errors.duree && <p className="text-sm text-red-600 mt-1">{createForm.errors.duree}</p>}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Medicaments to ship</p>
            {(createForm.data.medicaments || []).map((row: any, idx: number) => (
              <div key={idx} className="grid grid-cols-12 gap-2 mb-2 items-center">
                <div className="col-span-7">
                  <select
                    value={String(row.id_medoc)}
                    onChange={(e) => {
                      const arr = [...(createForm.data.medicaments || [])];
                      arr[idx] = { ...arr[idx], id_medoc: e.target.value };
                      createForm.setData('medicaments', arr);
                    }}
                    className="w-full rounded border px-3 py-2"
                  >
                    <option value="">-- select medicine --</option>
                    {medicamentsProp.map((m) => (
                      <option key={m.id_medoc} value={m.id_medoc}>
                        {buildFullLabelFromMed(m)}
                      </option>
                    ))}
                  </select>
                  {/* per-row medicine select error */}
                  {createForm.errors[`medicaments.${idx}.id_medoc`] && (
                    <p className="text-sm text-red-600 mt-1">{createForm.errors[`medicaments.${idx}.id_medoc`]}</p>
                  )}
                </div>
                <div className="col-span-3">
                  <input type="number"
                    min={1}
                    value={row.quantite}
                    onChange={(e) => {
                      const arr = [...(createForm.data.medicaments || [])];
                      arr[idx] = { ...arr[idx], quantite: Number(e.target.value) };
                      createForm.setData('medicaments', arr);
                    }}
                    className="w-full rounded border px-3 py-2"
                  />
                  {/* per-row quantity error */}
                  {createForm.errors[`medicaments.${idx}.quantite`] && (
                    <p className="text-sm text-red-600 mt-1">{createForm.errors[`medicaments.${idx}.quantite`]}</p>
                  )}
                </div>
                <div className="col-span-2 flex items-center">
                  <button type="button" onClick={() => removeCreateRow(idx)} className="px-3 py-2 rounded border" > Remove </button>
                </div>
              </div>
            ))}

            {/* General error related to medicaments array (e.g. insufficient stock returned as key 'medicaments') */}
            {createForm.errors.medicaments && typeof createForm.errors.medicaments === 'string' && (
              <p className="text-sm text-red-700 mt-2">{createForm.errors.medicaments}</p>
            )}

            <div className="flex justify-center mt-4">
              <button type="button" onClick={addCreateRow} className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"> Add</button>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => { setShowCreate(false); createForm.clearErrors(); }} className="p-3 rounded-full border border-gray-300 hover:bg-gray-100" > <FiX /> </button>
            <button type="submit" className="p-3 rounded-full bg-green-600 text-white" disabled={createForm.processing} > {createForm.processing ? <FiLoader className="animate-spin" /> : <FiCheck />} </button>
          </div>
        </form>
      </Modal>

      {/* EDIT modal (similar structure) */}
      {editing && (
        <Modal show={!!editing} onClose={() => { setEditing(null); editForm.clearErrors(); }} title={`Edit expedition #${editing.id_expedition}`}>
          <form onSubmit={editSubmit} className="space-y-4" role="form">
            {/* Global server errors */}
            {Object.keys(editForm.errors || {}).length > 0 && (
              <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded">
                <p className="font-semibold mb-2">Please fix the following errors:</p>
                <ul className="list-disc pl-5 text-sm">
                  {flattenErrors(editForm.errors).map((msg, i) => <li key={i}>{msg}</li>)}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium">Village</label>
                <input value={editForm.data.village} onChange={(e)=>editForm.setData('village', e.target.value)} className="mt-1 block w-full rounded border px-3 py-2" required />
                {editForm.errors.village && <p className="text-sm text-red-600 mt-1">{editForm.errors.village}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium">Zone</label>
                <select value={editForm.data.zone} onChange={(e)=>editForm.setData('zone', e.target.value)} className="mt-1 block w-full rounded border px-3 py-2">
                  <option value="nord">nord</option>
                  <option value="sud">sud</option>
                  <option value="est">est</option>
                  <option value="ouest">ouest</option>
                </select>
                {editForm.errors.zone && <p className="text-sm text-red-600 mt-1">{editForm.errors.zone}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium">Date</label>
                <input type="date" value={editForm.data.date_expedition} onChange={(e)=>editForm.setData('date_expedition', e.target.value)} className="mt-1 block w-full rounded border px-3 py-2" />
                {editForm.errors.date_expedition && <p className="text-sm text-red-600 mt-1">{editForm.errors.date_expedition}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium">Duration</label>
                <input type="number" min={1} value={editForm.data.duree as any} onChange={(e)=>editForm.setData('duree', Number(e.target.value))} className="mt-1 block w-full rounded border px-3 py-2" />
                {editForm.errors.duree && <p className="text-sm text-red-600 mt-1">{editForm.errors.duree}</p>}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Medicaments to ship</p>
              {(editForm.data.medicaments || []).map((row:any, idx:number) => (
                <div key={idx} className="grid grid-cols-12 gap-2 mb-2 items-center">
                  <div className="col-span-7">
                    <select value={String(row.id_medoc)} onChange={(e)=> {
                      const arr = [...(editForm.data.medicaments || [])];
                      arr[idx] = { ...arr[idx], id_medoc: e.target.value };
                      editForm.setData('medicaments', arr);
                    }} className="w-full rounded border px-3 py-2">
                      <option value="">-- select medicine --</option>
                      {medicamentsProp.map(m => <option key={m.id_medoc} value={m.id_medoc}>{m.full_nom ?? buildFullLabelFromMed(m)}</option>)}
                    </select>
                    {editForm.errors[`medicaments.${idx}.id_medoc`] && <p className="text-sm text-red-600 mt-1">{editForm.errors[`medicaments.${idx}.id_medoc`]}</p>}
                  </div>
                  <div className="col-span-3">
                    <input type="number" min={1} value={row.quantite} onChange={(e)=> {
                      const arr = [...(editForm.data.medicaments || [])];
                      arr[idx] = { ...arr[idx], quantite: Number(e.target.value) };
                      editForm.setData('medicaments', arr);
                    }} className="w-full rounded border px-3 py-2" />
                    {editForm.errors[`medicaments.${idx}.quantite`] && <p className="text-sm text-red-600 mt-1">{editForm.errors[`medicaments.${idx}.quantite`]}</p>}
                  </div>
                  <div className="col-span-2 flex gap-2">
                    <button type="button" onClick={()=>removeEditRow(idx)} className="px-3 py-2 rounded border">Remove</button>
                  </div>
                </div>
              ))}
              {editForm.errors.medicaments && typeof editForm.errors.medicaments === 'string' && (
                <p className="text-sm text-red-700 mt-2">{editForm.errors.medicaments}</p>
              )}
              <div className="flex justify-center mt-4">
                  <button type="button" onClick={addEditRow} className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"> Add</button>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={()=>{ setEditing(null); editForm.clearErrors(); }} className="p-3 rounded-full border border-gray-300 hover:bg-gray-100"><FiX /></button>
              <button type="submit" className="p-3 rounded-full bg-green-600 text-white" disabled={editForm.processing}>
                {editForm.processing ? <FiLoader className="animate-spin" /> : <FiCheck />}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* DETAILS modal (uses the details included in index props) */}
      {showDetails && (
        <Modal show={!!showDetails} onClose={()=>setShowDetails(null)} title={`Expedition — ${showDetails.village}`}>
          <div className="space-y-3">
            <p><strong>Zone:</strong> {showDetails.zone}</p>
            <p><strong>Duration:</strong> {showDetails.duree} days</p>
            <p><strong>Date:</strong> {new Date(showDetails.date_expedition).toLocaleDateString()}</p>
            <p><strong>Total different meds:</strong> {showDetails.total_medicaments}</p>
            <p><strong>Total units:</strong> {showDetails.total_items}</p>

            <div className="relative overflow-x-auto rounded-xl border border-gray-200 shadow bg-white">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-xs uppercase text-gray-700 border-b">
                  <tr>
                    <th className="px-6 py-3">Medicine</th>
                    <th className="px-6 py-3">Forme</th>
                    <th className="px-6 py-3">Category</th>
                    <th className="px-6 py-3">Quantity</th>
                    <th className="px-6 py-3">Dosage</th>
                  </tr>
                </thead>
                <tbody>
                  {(showDetails.details || []).map(d => (
                    <tr key={d.id_medoc} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{d.full_nom ?? d.nom_medoc}</td>
                      <td className="px-6 py-4">{d.forme ?? '—'}</td>
                      <td className="px-6 py-4">{d.categorie ?? '—'}</td>
                      <td className="px-6 py-4 font-semibold">
                        {d.quantite} {d.inventory_unit_display ?? pluralizeUnit(d.inventory_unit ?? d.unite_stock ?? d.unite, d.quantite)}
                      </td>
                      <td className="px-6 py-4">
                        {d.dosage_display ?? `${d.mesure ?? ''}${d.unite ?? ''}`}
                      </td>
                    </tr>
                  ))}
                  {(!showDetails.details || showDetails.details.length === 0) && (
                    <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No medicaments recorded for this expedition.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-4">
              <button onClick={()=>setShowDetails(null)} className="px-4 py-2 rounded border">Close</button>
            </div>
          </div>
        </Modal>
      )}
    </AppLayout>
  );
}
