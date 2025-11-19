<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Applique la migration :
     * Renomme la colonne "poids" en "mesure" si elle existe déjà dans la table "medicaments".
     *
     * Cela permet de remplacer un nom trop spécifique ("poids")
     * par un nom plus général ("mesure") qui peut représenter des unités variées
     * comme mg, ml, g, L, unité, etc.
     */
    public function up(): void
    {
        Schema::table('medicaments', function (Blueprint $table) {
            // On renomme la colonne uniquement si elle est réellement présente
            if (Schema::hasColumn('medicaments', 'poids')) {
                $table->renameColumn('poids', 'mesure');
            }
        });
    }

    /**
     * Annule la migration (rollback) :
     * Renomme la colonne "mesure" vers "poids" si besoin.
     *
     * Utile si l’on fait un "php artisan migrate:rollback".
     */
    public function down(): void
    {
        Schema::table('medicaments', function (Blueprint $table) {
            // Même principe : on vérifie avant de renommer
            if (Schema::hasColumn('medicaments', 'mesure')) {
                $table->renameColumn('mesure', 'poids');
            }
        });
    }
};
