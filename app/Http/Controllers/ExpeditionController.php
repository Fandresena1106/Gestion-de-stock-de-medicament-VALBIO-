<?php

namespace App\Http\Controllers;

use App\Models\Expedition;
use App\Models\Medicament;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ExpeditionController extends Controller
{
    /**
     * Rend l’unité d’inventaire au pluriel selon la quantité.
     * Utilisé pour afficher correctement les unités (Box → Boxs, sauf unités invariables).
     */
    protected function pluralizeInventoryUnit(?string $unit, int $qty): ?string
    {
        if (!$unit) return null;

        $lower = mb_strtolower($unit);
        $invariables = ['mg', 'ml', 'g', 'µg', 'ug']; // jamais au pluriel

        if (in_array($lower, $invariables, true)) return $unit;

        return ($qty > 1 && mb_substr($unit, -1) !== 's') ? $unit . 's' : $unit;
    }

    /**
     * Liste toutes les expéditions + reformatage pour l'affichage dans Inertia.
     * Charge aussi la liste des médicaments pour le formulaire de création.
     */
    public function index(Request $request)
    {
        // Charge la relation pivot (quantité) + tri par date
        $expeditions = Expedition::with('medicaments')->orderByDesc('date_expedition')->get();

        // Construction d'un affichage complet pour chaque médicament (nom + forme + dosage)
        $medicaments = Medicament::orderBy('nom_medoc')->get()->map(function ($m) {
            $forme = $m->forme ?? $m->description ?? null;
            $dosage = trim(($m->mesure ?? '') . ($m->unite ?? ''));
            $fullNom = $m->nom_medoc
                . ($forme ? " - {$forme}" : '')
                . ($dosage ? " {$dosage}" : '');

            return [
                'id_medoc' => (int) $m->id_medoc,
                'nom_medoc' => $m->nom_medoc,
                'forme' => $forme,
                'mesure' => $m->mesure ?? null,
                'unite' => $m->unite ?? null,
                'unite_stock' => $m->unite_stock ?? null,
                'categorie' => $m->categorie ?? null,
                'full_nom' => $fullNom,
            ];
        })->values();

        // Préparation des lignes pour la table du front-end
        $rows = $expeditions->map(function ($exp) {
            $totalMedicaments = $exp->medicaments->count();
            $totalItems = $exp->medicaments->reduce(fn ($carry, $m) =>
                $carry + (int) ($m->pivot->quantite ?? 0),
            0);

            // Formatage détaillé des médicaments contenus dans l’expédition
            $details = $exp->medicaments->map(function ($m) {

                $qty = (int) ($m->pivot->quantite ?? 0);
                $forme = $m->forme ?? $m->description ?? null;

                // Reconstitution du dosage
                $dosage = trim(($m->mesure ?? '') . ($m->unite ?? ''));

                // Pluralisation du dosage pour l'affichage
                $dosageDisplay = $dosage;
                if ($dosage && $qty > 1 && !empty($m->unite)) {
                    $unitPart = $m->unite;
                    $pluralUnit = (mb_substr($unitPart, -1) !== 's') ? ($unitPart . 's') : $unitPart;
                    $dosageDisplay = trim(($m->mesure ?? '') . $pluralUnit);
                }

                // Récupération de l’unité d’inventaire → soit dans medicaments, soit dans la dernière entrée
                $inventoryUnit = $m->unite_stock
                    ?? DB::table('entrees')->where('id_medoc', $m->id_medoc)
                        ->orderByDesc('date_entree')->value('unite_mesure');

                // Formatage avec pluriel
                $inventoryDisplay = $this->pluralizeInventoryUnit($inventoryUnit, $qty);

                // Construction du nom complet
                $fullNom = $m->nom_medoc
                    . ($forme ? " - {$forme}" : '')
                    . ($dosage ? " {$dosage}" : '');

                return [
                    'id_medoc' => (int) $m->id_medoc,
                    'nom_medoc' => $m->nom_medoc,
                    'full_nom' => $fullNom,
                    'forme' => $forme,
                    'categorie' => $m->categorie ?? null,
                    'mesure' => $m->mesure ?? null,
                    'unite' => $m->unite ?? null,
                    'unite_stock' => $m->unite_stock ?? null,
                    'inventory_unit' => $inventoryUnit,
                    'inventory_unit_display' => $inventoryDisplay,
                    'quantite' => $qty,
                    'dosage_display' => $dosageDisplay,
                ];
            })->values();

            return [
                'id_expedition' => (int) $exp->id_expedition,
                'village' => $exp->village,
                'zone' => $exp->zone,
                'duree' => (int) $exp->duree,
                'date_expedition' => $exp->date_expedition,
                'total_medicaments' => $totalMedicaments,
                'total_items' => $totalItems,
                'details' => $details,
            ];
        })->values();

        return Inertia::render('Expedition/Index', [
            'expeditions' => $rows,
            'medicaments' => $medicaments,
        ]);
    }

    /**
     * Page formulaire création d’expédition.
     * Charge la liste complète des médicaments.
     */
    public function create(Request $request)
    {
        $medicaments = Medicament::orderBy('nom_medoc')->get()->map(function ($m) {
            $forme = $m->forme ?? $m->description ?? null;
            $dosage = trim(($m->mesure ?? '') . ($m->unite ?? ''));
            $fullNom = $m->nom_medoc
                . ($forme ? " - {$forme}" : '')
                . ($dosage ? " {$dosage}" : '');

            return [
                'id_medoc' => (int) $m->id_medoc,
                'nom_medoc' => $m->nom_medoc,
                'forme' => $forme,
                'mesure' => $m->mesure ?? null,
                'unite' => $m->unite ?? null,
                'unite_stock' => $m->unite_stock ?? null,
                'categorie' => $m->categorie ?? null,
                'full_nom' => $fullNom,
            ];
        })->values();

        return Inertia::render('Expedition/Create', ['medicaments' => $medicaments]);
    }

    /**
     * Combine les quantités des médicaments sélectionnés dans le formulaire.
     * Permet de regrouper les doublons.
     */
    protected function aggregateRequested(array $medicamentsRequest): array
    {
        $agg = [];
        foreach ($medicamentsRequest as $m) {
            $id = (int) ($m['id_medoc'] ?? 0);
            $q = (int) ($m['quantite'] ?? 0);
            if (!isset($agg[$id])) $agg[$id] = 0;
            $agg[$id] += $q;
        }
        return $agg;
    }

    /**
     * Enregistre une nouvelle expédition après validation
     * + vérification du stock disponible.
     */
    public function store(Request $request)
    {
        // Messages personnalisés pour retour front
        $messages = [
            'village.required' => 'The village field is required.',
            // ...
        ];

        // Validation des champs + tableau des médicaments
        $validated = $request->validate([
            'village' => 'required|string',
            'zone' => 'required|in:nord,sud,est,ouest',
            'date_expedition' => 'required|date',
            'duree' => 'required|integer|min:1',
            'medicaments' => 'required|array|min:1',
            'medicaments.*.id_medoc' => 'required|exists:medicaments,id_medoc',
            'medicaments.*.quantite' => 'required|integer|min:1',
        ], $messages);

        // Agrégation des quantités pour détecter les doublons
        $requested = $this->aggregateRequested($validated['medicaments']);

        // Vérification du stock disponible
        $insufficient = [];
        foreach ($requested as $id => $qty) {
            $med = Medicament::find($id);
            if (!$med) { 
                $insufficient[] = "Medicine #{$id} not found."; 
                continue; 
            }

            $available = method_exists($med, 'availableStock')
                ? $med->availableStock()
                : PHP_INT_MAX;

            if ($qty > $available) {
                $insufficient[] = "{$med->nom_medoc} (requested: {$qty}, available: {$available})";
            }
        }

        if (!empty($insufficient)) {
            return back()->withErrors([
                'medicaments' => 'Insufficient stock for: ' . implode('; ', $insufficient)
            ]);
        }

        // Création + liaison pivot dans une transaction
        DB::transaction(function () use ($validated) {
            $expedition = Expedition::create([
                'village' => $validated['village'],
                'zone' => $validated['zone'],
                'date_expedition' => $validated['date_expedition'],
                'duree' => $validated['duree'],
            ]);

            foreach ($validated['medicaments'] as $m) {
                $expedition->medicaments()->attach($m['id_medoc'], [
                    'quantite' => $m['quantite']
                ]);
            }
        });

        return redirect()->route('expeditions.index')->with('success', 'Expedition created successfully.');
    }

    /**
     * Affiche les détails d’une expédition.
     * Même logique de formatage que index(), mais pour une seule ligne.
     */
    public function show(Request $request, string $id)
    {
        $expedition = Expedition::with('medicaments')->findOrFail($id);

        $details = $expedition->medicaments->map(function ($m) {

            // (exactement comme dans index)
            // formatage quantité, forme, unité, dosage, etc.

            $qty = (int) ($m->pivot->quantite ?? 0);
            $forme = $m->forme ?? $m->description ?? null;

            $dosage = trim(($m->mesure ?? '') . ($m->unite ?? ''));
            $dosageDisplay = $dosage;

            if ($dosage && $qty > 1 && !empty($m->unite)) {
                $unitPart = $m->unite;
                $pluralUnit = (mb_substr($unitPart, -1) !== 's') ? ($unitPart . 's') : $unitPart;
                $dosageDisplay = trim(($m->mesure ?? '') . $pluralUnit);
            }

            $inventoryUnit = $m->unite_stock
                ?? DB::table('entrees')
                    ->where('id_medoc', $m->id_medoc)
                    ->orderByDesc('date_entree')
                    ->value('unite_mesure');

            $inventoryDisplay = $this->pluralizeInventoryUnit($inventoryUnit, $qty);

            $fullNom = $m->nom_medoc
                . ($forme ? " - {$forme}" : '')
                . ($dosage ? " {$dosage}" : '');

            return [
                'id_medoc' => (int) $m->id_medoc,
                'nom_medoc' => $m->nom_medoc,
                'full_nom' => $fullNom,
                'forme' => $forme,
                'categorie' => $m->categorie ?? null,
                'mesure' => $m->mesure ?? null,
                'unite' => $m->unite ?? null,
                'unite_stock' => $m->unite_stock ?? null,
                'inventory_unit' => $inventoryUnit,
                'inventory_unit_display' => $inventoryDisplay,
                'quantite' => $qty,
                'dosage_display' => $dosageDisplay,
            ];
        })->values();

        return Inertia::render('Expedition/Show', [
            'expedition' => [
                'id_expedition' => (int) $expedition->id_expedition,
                'village' => $expedition->village,
                'zone' => $expedition->zone,
                'duree' => (int) $expedition->duree,
                'date_expedition' => $expedition->date_expedition,
                'details' => $details,
            ],
        ]);
    }

    /**
     * Page édition d’une expédition.
     */
    public function edit(Request $request, string $id)
    {
        $expedition = Expedition::with('medicaments')->findOrFail($id);

        // Liste formatée pour réafficher dans le select
        $medicaments = Medicament::orderBy('nom_medoc')->get()->map(function ($m) {
            $forme = $m->forme ?? $m->description ?? null;
            $dosage = trim(($m->mesure ?? '') . ($m->unite ?? ''));
            $fullNom = $m->nom_medoc
                . ($forme ? " - {$forme}" : '')
                . ($dosage ? " {$dosage}" : '');

            return [
                'id_medoc' => (int) $m->id_medoc,
                'nom_medoc' => $m->nom_medoc,
                'forme' => $forme,
                'mesure' => $m->mesure ?? null,
                'unite' => $m->unite ?? null,
                'unite_stock' => $m->unite_stock ?? null,
                'categorie' => $m->categorie ?? null,
                'full_nom' => $fullNom,
            ];
        })->values();

        return Inertia::render('Expedition/Edit', [
            'expedition' => $expedition,
            'medicaments' => $medicaments,
        ]);
    }

    /**
     * Mise à jour d’une expédition existante.
     * Vérifie aussi le stock, mais réintègre les quantités déjà réservées.
     */
    public function update(Request $request, string $id)
    {
        $expedition = Expedition::with('medicaments')->findOrFail($id);

        $messages = [
            'village.required' => 'The village field is required.',
            // ...
        ];

        // Validation
        $validated = $request->validate([
            'village' => 'required|string',
            'zone' => 'required|in:nord,sud,est,ouest',
            'date_expedition' => 'required|date',
            'duree' => 'required|integer|min:1',
            'medicaments' => 'required|array|min:1',
            'medicaments.*.id_medoc' => 'required|exists:medicaments,id_medoc',
            'medicaments.*.quantite' => 'required|integer|min:1',
        ], $messages);

        // Agrégation des quantités demandées
        $requested = $this->aggregateRequested($validated['medicaments']);

        // Quantités déjà réservées dans cette expédition (pivot)
        $currentPivot = $expedition->medicaments->pluck('pivot.quantite', 'id_medoc')->toArray();

        // Vérification du stock
        $insufficient = [];
        foreach ($requested as $idm => $qty) {
            $med = Medicament::find($idm);
            $currentlyReserved = $currentPivot[$idm] ?? 0;

            $available = method_exists($med, 'availableStock')
                ? $med->availableStock() + $currentlyReserved
                : PHP_INT_MAX;

            if ($qty > $available) {
                $insufficient[] = "{$med->nom_medoc} (requested: {$qty}, available: {$available})";
            }
        }

        if (!empty($insufficient)) {
            return back()->withErrors([
                'medicaments' => 'Insufficient stock for: ' . implode('; ', $insufficient)
            ]);
        }

        // Mise à jour dans une transaction
        DB::transaction(function () use ($expedition, $validated) {
            $expedition->update([
                'village' => $validated['village'],
                'zone' => $validated['zone'],
                'date_expedition' => $validated['date_expedition'],
                'duree' => $validated['duree'],
            ]);

            // Mise à jour pivot avec sync()
            $syncData = collect($validated['medicaments'])->mapWithKeys(function ($m) {
                return [$m['id_medoc'] => ['quantite' => $m['quantite']]];
            })->toArray();

            $expedition->medicaments()->sync($syncData);
        });

        return redirect()->route('expeditions.index')->with('success', 'Expedition updated successfully.');
    }

    /**
     * Supprime une expédition + détache tous les médicaments du pivot.
     */
    public function destroy(Request $request, string $id)
    {
        $expedition = Expedition::findOrFail($id);
        $expedition->medicaments()->detach(); // nettoyage pivot
        $expedition->delete();

        return redirect()->route('expeditions.index')->with('success', 'Expedition deleted successfully.');
    }
}
