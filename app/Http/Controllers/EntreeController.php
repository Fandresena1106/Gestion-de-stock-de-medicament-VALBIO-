<?php

namespace App\Http\Controllers;

use App\Models\Entree;
use App\Models\Medicament;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EntreeController extends Controller
{
    public function index(Request $request)
    {
        // Récupère toutes les entrées + leur médicament (évite les requêtes N+1)
        $entrees = Entree::with('medicament')->orderByDesc('date_entree')->get();

        // Liste des médicaments pour alimenter un select côté front
        // On sélectionne les champs utiles pour alléger la requête
        $medicaments = Medicament::orderBy('nom_medoc')
            ->get(['id_medoc', 'nom_medoc', 'mesure', 'unite', 'categorie', 'description']);

        // Liste d’unités standards utilisée côté front (choix centralisé)
        $unites = [
            'Tablet', 'Bottle', 'Blister', 'Box', 'Ampoule',
            'Tube', 'Sachet', 'Capsule', 'Vial', 'Pack',
        ];

        // Envoi des données à la page Inertia
        return Inertia::render('Entree/Index', [
            'entrees' => $entrees,
            'medicaments' => $medicaments,
            'unites' => $unites,
        ]);
    }

    public function create(Request $request)
    {
        // Génère un nom formaté plus clair pour le select (ex : Paracétamol 500mg)
        $medicaments = Medicament::orderBy('nom_medoc')->get()->map(function ($medoc) {
            $medoc->display_name = trim(
                $medoc->nom_medoc . ' ' .
                ucfirst($medoc->description) . ' ' .
                $medoc->mesure . $medoc->unite
            );
            return $medoc;
        });

        return Inertia::render('Entree/Create', ['medicaments' => $medicaments]);
    }

    public function store(Request $request)
    {
        // Validation des données — protège la base et garantit les valeurs cohérentes
        $validated = $request->validate([
            'id_medoc'=> 'required|exists:medicaments,id_medoc',
            'fournisseur'=>'nullable|string|max:200',
            'quantite'=>'required|integer|min:1',
            'date_entree'=>'required|date',
            'date_expiration' => 'nullable|date|after_or_equal:date_entree',
            'unite_mesure' => 'required|string|max:50',   // unité d’inventaire obligatoire
            'lot' => 'nullable|string|max:100',
        ]);

        // Création de l'entrée dans la base
        Entree::create($validated);

        return redirect()->route('entrees.index')->with('success', 'Entry created.');
    }

    public function show(Request $request, Entree $entree)
    {
        // Charge le médicament associé pour l’affichage détaillé
        $entree->load('medicament');

        return Inertia::render('Entree/Show', ['entree' => $entree]);
    }

    public function edit(Request $request, Entree $entree)
    {
        // Charge le médicament lié pour pré-remplir le formulaire
        $entree->load('medicament');

        // Même logique que dans create() : nom formaté pour un select lisible
        $medicaments = Medicament::orderBy('nom_medoc')->get()->map(function ($medoc) {
            $medoc->display_name = trim(
                $medoc->nom_medoc . ' ' .
                ucfirst($medoc->description) . ' ' .
                $medoc->mesure . $medoc->unite
            );
            return $medoc;
        });

        return Inertia::render('Entree/Edit', [
            'entree' => $entree,
            'medicaments' => $medicaments
        ]);
    }

    public function update(Request $request, Entree $entree)
    {
        // Validation identique à store() — assure la cohérence
        $validated = $request->validate([
            'id_medoc'=> 'required|exists:medicaments,id_medoc',
            'fournisseur'=>'nullable|string|max:200',
            'quantite'=>'required|integer|min:1',
            'date_entree'=>'required|date',
            'date_expiration' => 'nullable|date|after_or_equal:date_entree',
            'unite_mesure' => 'required|string|max:50',
            'lot' => 'nullable|string|max:100',
        ]);

        // Mise à jour de l'entrée
        $entree->update($validated);

        return redirect()->route('entrees.index')->with('success', 'Entry updated.');
    }

    public function destroy(Request $request, Entree $entree)
    {
        // Suppression simple avec message de confirmation
        $entree->delete();

        return redirect()->route('entrees.index')->with('success', 'Entry deleted.');
    }
}
