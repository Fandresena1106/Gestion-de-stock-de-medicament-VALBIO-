<?php

namespace App\Http\Controllers;

use App\Models\Medicament;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Validation\Rule;

class MedicamentController extends Controller
{
    /*
     |-----------------------------------------------------------------------
     | MedicamentController
     |-----------------------------------------------------------------------
     | Contrôleur responsable des opérations CRUD pour les médicaments.
     | Utilise Inertia pour rendre les pages frontend (Vue/React selon config).
     |
     | Remarque : Assurez-vous que le modèle Medicament a bien la propriété
     | $fillable ou $guarded configurée pour permettre l'assignement de masse
     | (Medicament::create($validated) / $medicament->update($validated)).
     */

    /**
     * Affiche la liste des médicaments.
     *
     * @param Request $request  Requête HTTP entrante (contient paramètres, filtre, etc.)
     * @return \Inertia\Response
     */
    public function index(Request $request)
    {
        // Récupère tous les médicaments triés par nom (ordre alphabétique).
        $medicaments = Medicament::orderBy('nom_medoc')->get();

        // Rend la page Inertia 'Medicament/Index' en passant la collection de médicaments.
        return Inertia::render('Medicament/Index', ['medicaments' => $medicaments]);
    }

    /**
     * Affiche le formulaire de création d'un médicament.
     *
     * @param Request $request
     * @return \Inertia\Response
     */
    public function create(Request $request)
    {
        // Rend la page Inertia qui contient le formulaire pour créer un nouveau médicament.
        return Inertia::render('Medicament/Create');
    }

    /**
     * Enregistre un nouveau médicament en base de données.
     *
     * @param Request $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function store(Request $request)
    {
        // Validation des données entrantes.
        // - nom_medoc : requis, chaîne, unique selon combinaison categorie+mesure+unite.
        // - description : optionnel, chaîne.
        // - categorie : requis, chaîne.
        // - mesure : optionnel, numérique.
        // - unite : optionnel, chaîne.
        // - date_expiration : optionnel, format date.
        $validated = $request->validate([
            'nom_medoc' => [
                'required', 'string',
                // Règle d'unicité personnalisée : on veut empêcher qu'il existe deux lignes
                // avec le même nom + même catégorie + même mesure + même unité.
                Rule::unique('medicaments')->where(function($query) use ($request) {
                    return $query->where('categorie', $request->input('categorie'))
                                 ->where('mesure', $request->input('mesure'))
                                 ->where('unite', $request->input('unite'));
                })
            ],
            'description' => 'nullable|string',
            'categorie' => 'required|string',
            'mesure' => 'nullable|numeric',
            'unite' => 'nullable|string',
            'date_expiration' => 'nullable|date',
        ]);

        // Création du médicament en base (assignement de masse).
        // Veillez à définir Medicament::$fillable = ['nom_medoc','description','categorie','mesure','unite','date_expiration'];
        $med = Medicament::create($validated);

        // Redirection vers la liste avec message flash de succès.
        return redirect()->route('medicaments.index')->with('success', 'Medicine created.');
    }

    /**
     * Affiche les détails d'un médicament spécifique.
     *
     * @param Request $request
     * @param Medicament $medicament  Le modèle résolu via route model binding
     * @return \Inertia\Response
     */
    public function show(Request $request, Medicament $medicament)
    {
        // Rend la page de détails en passant le médicament.
        return Inertia::render('Medicament/Show', ['medicament' => $medicament]);
    }

    /**
     * Affiche le formulaire d'édition pour un médicament existant.
     *
     * @param Request $request
     * @param Medicament $medicament
     * @return \Inertia\Response
     */
    public function edit(Request $request, Medicament $medicament)
    {
        // Rend la page d'édition en fournissant le médicament à modifier.
        return Inertia::render('Medicament/Edit', ['medicament' => $medicament]);
    }

    /**
     * Met à jour un médicament existant en base de données.
     *
     * @param Request $request
     * @param Medicament $medicament
     * @return \Illuminate\Http\RedirectResponse
     */
    public function update(Request $request, Medicament $medicament)
    {
        // Validation des données entrantes pour la mise à jour.
        // On utilise Rule::unique(...)->ignore(...) pour permettre de conserver le même nom
        // pour le médicament courant tout en conservant la contrainte d'unicité pour les autres.
        $validated = $request->validate([
            'nom_medoc' => [
                'required', 'string',
                // ignore() : on ignore l'enregistrement courant identifié par id_medoc.
                Rule::unique('medicaments')->ignore($medicament->id_medoc, 'id_medoc')->where(function($query) use ($request) {
                    return $query->where('categorie', $request->input('categorie'))
                                 ->where('mesure', $request->input('mesure'))
                                 ->where('unite', $request->input('unite'));
                })
            ],
            'description' => 'nullable|string',
            'categorie' => 'required|string',
            'mesure' => 'nullable|numeric',
            'unite' => 'nullable|string',
            'date_expiration' => 'nullable|date',
        ]);

        // Mise à jour du modèle avec les données validées.
        $medicament->update($validated);

        // Redirection vers la liste avec message flash de succès.
        return redirect()->route('medicaments.index')->with('success', 'Medicine updated.');
    }

    /**
     * Supprime un médicament de la base de données.
     *
     * @param Request $request
     * @param Medicament $medicament
     * @return \Illuminate\Http\RedirectResponse
     */
    public function destroy(Request $request, Medicament $medicament)
    {
        // Suppression de l'enregistrement.
        $medicament->delete();

        // Redirection vers la liste avec message flash de succès.
        return redirect()->route('medicaments.index')->with('success', 'Medicine deleted.');
    }
}
