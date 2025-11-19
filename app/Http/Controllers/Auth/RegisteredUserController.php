<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Afficher la page d'inscription
     */

    public function create(): Response
    {
        return Inertia::render('auth/register');
    }

    /**
     * Enregistrer un nouvel utilisateur
     */

    public function store(Request $request): RedirectResponse
    {
        // Validation

        $request->validate([
            'user_id'=>'required|string|size:10|unique:users,user_id',
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        // Création du compte

        $user = User::create([
            'user_id'=>$request->user_id,
            'name' => $request->name,
            'email' => $request->email,
            'password' => $request->password,
        ]);

        // Événement et connexion automatique

        event(new Registered($user));

        Auth::login($user);

        $request->session()->regenerate();

        //Redirection vers le tableau de bord

        return redirect()->intended(route('dashboard', absolute: false));
    }
}
