<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Crée les tables nécessaires pour l'authentification et sessions
     */
    public function up(): void
    {
        // Table 'users' pour stocker les utilisateurs
        Schema::create('users', function (Blueprint $table) {
            $table->string('user_id', 20)->primary(); // clé primaire personnalisée
            $table->string('name');                   // nom de l'utilisateur
            $table->string('email')->unique();        // email unique
            $table->timestamp('email_verified_at')->nullable(); // date vérification email
            $table->string('password');               // mot de passe haché
            $table->enum('role', ['admin', 'user'])->default('user'); // rôle utilisateur
            $table->rememberToken();                  // token "se souvenir de moi"
            $table->timestamps();                     // created_at & updated_at
        });

        // Table pour stocker les tokens de réinitialisation de mot de passe
        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();       // email associé au token
            $table->string('token');                   // token de reset
            $table->timestamp('created_at')->nullable(); // date de création du token
        });

        // Table des sessions utilisateurs (stockage des sessions actives)
        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();           // identifiant unique de session
            $table->string('user_id')->nullable()->index(); // utilisateur lié (nullable)
            $table->string('ip_address', 45)->nullable();   // IP de la session
            $table->text('user_agent')->nullable();          // infos navigateur / client
            $table->longText('payload');                      // données de session
            $table->integer('last_activity')->index();       // timestamp dernière activité
        });
    }

    /**
     * Supprime les tables à la rollback
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('sessions');
    }
};
