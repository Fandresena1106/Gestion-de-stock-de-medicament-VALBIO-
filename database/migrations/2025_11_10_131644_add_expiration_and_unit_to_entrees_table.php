<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Ajoute des colonnes à la table 'entrees' pour gérer des informations supplémentaires sur les lots
     */
    public function up(): void
    {
        Schema::table('entrees', function (Blueprint $table) {
            // Ajout de la date d'expiration propre à chaque lot (nullable pour compatibilité avec les anciens enregistrements)
            if (!Schema::hasColumn('entrees', 'date_expiration')) {
                $table->date('date_expiration')->nullable()->after('date_entree');
            }

            // Ajout de l'unité de mesure spécifique au lot (ex: mg, ml, plaquette), nullable aussi
            if (!Schema::hasColumn('entrees', 'unite_mesure')) {
                $table->string('unite_mesure', 50)->nullable()->after('quantite');
            }
        });
    }

    /**
     * Supprime les colonnes ajoutées lors du rollback de la migration
     */
    public function down(): void
    {
        Schema::table('entrees', function (Blueprint $table) {
            if (Schema::hasColumn('entrees', 'date_expiration')) {
                $table->dropColumn('date_expiration');
            }
            if (Schema::hasColumn('entrees', 'unite_mesure')) {
                $table->dropColumn('unite_mesure');
            }
        });
    }
};
