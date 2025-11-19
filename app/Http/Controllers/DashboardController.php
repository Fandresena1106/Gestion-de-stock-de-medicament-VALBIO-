<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use App\Models\Medicament;

class DashboardController extends Controller
{
    public function index()
    {
        /**
         * ---------------------------------------------------------------
         * 1) COUNTERS PRINCIPAUX POUR LES CARTES DU DASHBOARD
         * ---------------------------------------------------------------
         */

        // Nombre total de médicaments enregistrés dans la base
        $totalMedicaments = Medicament::count();

        // Quantité totale entrée dans le stock (toutes entrées confondues)
        $totalEntrees = (int) DB::table('entrees')->sum('quantite');

        // Quantité totale sortie via expéditions
        $totalSorties = (int) DB::table('detail_expeditions')->sum('quantite');


        /**
         * ---------------------------------------------------------------
         * 2) STOCK PAR MÉDICAMENT
         *    - Calcule le stock (entrées - sorties)
         *    - Ajoute description (forme), dosage, unité d’inventaire
         * ---------------------------------------------------------------
         */

        $stockPerMedicament = DB::table('medicaments')
            ->select(
                'medicaments.id_medoc',
                'medicaments.nom_medoc',
                'medicaments.categorie',
                'medicaments.mesure',      // quantité de dosage (ex : 500)
                'medicaments.unite',       // unité de dosage (ex : mg)
                'medicaments.description', // forme (ex : comprimé)

                // Récupère une unité d’inventaire depuis la table des entrées (blister, bouteille...)
                DB::raw('(SELECT unite_mesure 
                          FROM entrees 
                          WHERE entrees.id_medoc = medicaments.id_medoc 
                          AND entrees.unite_mesure IS NOT NULL 
                          LIMIT 1) as unite_mesure'),

                // Calcule le stock = total entrées - total sorties
                DB::raw('(COALESCE((SELECT SUM(quantite) 
                                    FROM entrees 
                                    WHERE entrees.id_medoc = medicaments.id_medoc), 0)
                          -
                          COALESCE((SELECT SUM(quantite) 
                                    FROM detail_expeditions 
                                    WHERE detail_expeditions.id_medoc = medicaments.id_medoc), 0)
                         ) as stock'),

                // Total des entrées uniquement
                DB::raw('COALESCE((SELECT SUM(quantite) 
                                   FROM entrees 
                                   WHERE entrees.id_medoc = medicaments.id_medoc), 0) 
                         as total_entrees'),

                // Total des sorties uniquement
                DB::raw('COALESCE((SELECT SUM(quantite) 
                                   FROM detail_expeditions 
                                   WHERE detail_expeditions.id_medoc = medicaments.id_medoc), 0)
                         as total_sorties')
            )
            ->get();


        /**
         * ---------------------------------------------------------------
         * 3) MÉDICAMENTS LES PLUS UTILISÉS
         *    - Somme des quantités sorties via expéditions
         *    - Récupère forme, dosage, unité d’inventaire
         * ---------------------------------------------------------------
         */

        $mostUsed = DB::table('detail_expeditions')
            ->select('id_medoc', DB::raw('SUM(quantite) as total'))
            ->groupBy('id_medoc')
            ->orderByDesc('total')
            ->limit(10)
            ->get()
            ->map(function ($row) {
                // Récupère les infos du médicament
                $med = DB::table('medicaments')->where('id_medoc', $row->id_medoc)->first();

                // Récupère unité d’inventaire depuis les entrées
                $unitInventory = DB::table('entrees')
                    ->where('id_medoc', $row->id_medoc)
                    ->whereNotNull('unite_mesure')
                    ->value('unite_mesure');

                return [
                    'id_medoc' => $row->id_medoc,
                    'nom_medoc' => $med?->nom_medoc ?? '—',
                    'description' => $med?->description ?? null, // forme
                    'mesure' => $med?->mesure ?? null,
                    'unite' => $med?->unite ?? null, // dosage
                    'unite_mesure' => $unitInventory ?? null, // unité inventaire
                    'total' => (int) $row->total,
                ];
            });


        /**
         * ---------------------------------------------------------------
         * 4) USAGE PAR VILLAGE
         *    - Compte le nombre de médicaments différents envoyés
         *    - Classement des villages les plus "consommateurs"
         * ---------------------------------------------------------------
         */

        $villageUsage = DB::table('detail_expeditions')
            ->join('expeditions', 'detail_expeditions.id_expedition', '=', 'expeditions.id_expedition')
            ->select(
                'expeditions.village',
                DB::raw('COUNT(DISTINCT detail_expeditions.id_medoc) as med_count')
            )
            ->groupBy('expeditions.village')
            ->orderByDesc('med_count')
            ->limit(10)
            ->get();


        /**
         * ---------------------------------------------------------------
         * 5) INVENTAIRE COMPLET
         *    - Joins entrees + sorties
         *    - Ajoute la plus proche date d’expiration
         *    - Ajoute l’unité d’inventaire
         * ---------------------------------------------------------------
         */

        $inventoryData = DB::table('medicaments')
            ->leftJoin('entrees', 'medicaments.id_medoc', '=', 'entrees.id_medoc')

            // Sous-table sorties pour optimiser
            ->leftJoin(
                DB::raw('(SELECT id_medoc, SUM(quantite) as total_sorties 
                          FROM detail_expeditions 
                          GROUP BY id_medoc) as sorties'),
                'medicaments.id_medoc', '=', 'sorties.id_medoc'
            )

            ->select(
                'medicaments.id_medoc as medicine_id',
                'medicaments.nom_medoc as medicine_name',
                'medicaments.categorie as category',
                'medicaments.mesure',
                'medicaments.unite',
                'medicaments.description',

                // Stock = entrées - sorties
                DB::raw('COALESCE(SUM(entrees.quantite), 0) - COALESCE(sorties.total_sorties, 0) as stock'),

                // Prochaine date d’expiration
                DB::raw('MIN(entrees.date_expiration) as expiry_date'),

                // Unité inventaire (blister, flacon…)
                DB::raw('(SELECT unite_mesure 
                          FROM entrees 
                          WHERE entrees.id_medoc = medicaments.id_medoc 
                          AND entrees.unite_mesure IS NOT NULL 
                          LIMIT 1) as unite_mesure')
            )
            ->groupBy(
                'medicaments.id_medoc',
                'medicaments.nom_medoc',
                'medicaments.categorie',
                'medicaments.mesure',
                'medicaments.unite',
                'medicaments.description',
                'sorties.total_sorties'
            )

            // Tri priorité : produits sans date d’expiration en bas
            ->orderByRaw('CASE WHEN MIN(entrees.date_expiration) IS NULL THEN 1 ELSE 0 END, MIN(entrees.date_expiration) ASC')
            ->get();


        /**
         * ---------------------------------------------------------------
         * 6) STOCK GLOBAL — Somme des stocks positifs
         * ---------------------------------------------------------------
         */
        $totalStock = $stockPerMedicament->sum(fn($m) => max(0, (int)$m->stock));


        /**
         * ---------------------------------------------------------------
         * 7) RETOUR À LA VUE INERTIA
         * ---------------------------------------------------------------
         */
        return Inertia::render('dashboard', [
            'totals' => [
                'medicaments' => $totalMedicaments,
                'entrees' => $totalEntrees,
                'sorties' => $totalSorties,
                'stock' => $totalStock,
            ],
            'stockPerMedicament' => $stockPerMedicament,
            'mostUsed' => $mostUsed,
            'villageUsage' => $villageUsage,
            'inventoryData' => $inventoryData,
        ]);
    }
}
