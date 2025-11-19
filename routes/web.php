<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\MedicamentController;
use App\Http\Controllers\ExpeditionController;
use App\Http\Controllers\EntreeController;
use App\Http\Controllers\DetailExpeditionController;
use App\Http\Controllers\DashboardController;

/*
|--------------------------------------------------------------------------
| ROUTES PUBLIQUES
|--------------------------------------------------------------------------
| Toutes les routes accessibles SANS être connecté.
| Ici, la racine du site (/) redirige vers la page de login.
| Le middleware "guest" empêche un utilisateur connecté
| d’aller sur la page d’accueil publique.
*/
Route::get('/', function () {
    return redirect()->route('login');
})->name('home')->middleware('guest');



/*
|--------------------------------------------------------------------------
| ROUTES PROTÉGÉES (authentifié + email vérifié)
|--------------------------------------------------------------------------
| Toutes les routes ici nécessitent :
| - un utilisateur connecté (middleware "auth")
| - un email vérifié (middleware "verified") si activé dans ton projet
*/
Route::middleware(['auth', 'verified'])->group(function () {

    /*
    |--------------------------------------------------------------------------
    | DASHBOARD — Page d’accueil après login
    |--------------------------------------------------------------------------
    | GET /dashboard → affiche les statistiques globales
    */
    Route::get('/dashboard', [DashboardController::class, 'index'])
        ->name('dashboard');


    /*
    |--------------------------------------------------------------------------
    | CRUD MÉDICAMENTS
    |--------------------------------------------------------------------------
    | Route::resource crée automatiquement les routes :
    |
    | GET    /medicaments           (index)
    | GET    /medicaments/create    (create)
    | POST   /medicaments           (store)
    | GET    /medicaments/{id}      (show)
    | GET    /medicaments/{id}/edit (edit)
    | PUT    /medicaments/{id}      (update)
    | DELETE /medicaments/{id}      (destroy)
    |
    */
    Route::resource('medicaments', MedicamentController::class);


    /*
    |--------------------------------------------------------------------------
    | CRUD ENTRÉES → gestion des arrivages/stock
    |--------------------------------------------------------------------------
    */
    Route::resource('entrees', EntreeController::class);


    /*
    |--------------------------------------------------------------------------
    | CRUD EXPÉDITIONS → gestion des sorties vers les villages
    |--------------------------------------------------------------------------
    */
    Route::resource('expeditions', ExpeditionController::class);


    /*
    |--------------------------------------------------------------------------
    | CRUD DÉTAIL EXPÉDITION → médicaments par expédition
    |--------------------------------------------------------------------------
    | Représente le pivot (id_expedition, id_medoc, quantite)
    |--------------------------------------------------------------------------
    */
    Route::resource('detailexpedition', DetailExpeditionController::class);
});



/*
|--------------------------------------------------------------------------
| FICHIERS SUPPLÉMENTAIRES
|--------------------------------------------------------------------------
| settings.php → routes liées aux paramètres (profil, sécurité, etc.)
| auth.php     → routes d’authentification (login, register, reset, ...)
*/
require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
