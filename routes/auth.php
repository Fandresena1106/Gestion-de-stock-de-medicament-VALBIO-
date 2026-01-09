<?php

use App\Http\Controllers\Auth\NewPasswordController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\Auth\RegisteredUserController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Routes pour les invités (utilisateurs non connectés)
|--------------------------------------------------------------------------
| Toutes les routes ici sont réservées aux utilisateurs qui NE sont PAS
| authentifiés. Le middleware "guest" empêche un utilisateur déjà connecté
| d'accéder à ces pages (comme registre, mot de passe oublié, etc.)
*/
Route::middleware('guest')->group(function () {

    /*
    |--------------------------------------------------------------------------
    | INSCRIPTION
    |--------------------------------------------------------------------------
    | GET  /register  → Affiche le formulaire d'inscription
    | POST /register → Enregistre un nouvel utilisateur dans la base de données
    */
    Route::get('register', [RegisteredUserController::class, 'create'])
        ->name('register');

    Route::post('register', [RegisteredUserController::class, 'store'])
        ->name('register.store');

    /*
    |--------------------------------------------------------------------------
    | MOT DE PASSE OUBLIÉ — ENVOI DU LIEN DE RÉINITIALISATION
    |--------------------------------------------------------------------------
    | GET  /forgot-password → Page où l'utilisateur entre son email
    | POST /forgot-password → Laravel envoie un email contenant un lien tokenisé
    */
    Route::get('forgot-password', [PasswordResetLinkController::class, 'create'])
        ->name('password.request');

    Route::post('forgot-password', [PasswordResetLinkController::class, 'store'])
        ->name('password.email');

    /*
    |--------------------------------------------------------------------------
    | RÉINITIALISATION DU MOT DE PASSE AVEC LE TOKEN
    |--------------------------------------------------------------------------
    | GET  /reset-password/{token} → Formulaire avec le token dans l'URL
    | POST /reset-password → Enregistre le nouveau mot de passe
    */
    Route::get('reset-password/{token}', [NewPasswordController::class, 'create'])
        ->name('password.reset');

    Route::post('reset-password', [NewPasswordController::class, 'store'])
        ->name('password.store');
});
