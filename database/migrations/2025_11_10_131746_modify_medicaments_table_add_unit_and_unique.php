<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1) ajouter la colonne 'unite' si elle n'existe pas
        if (! Schema::hasColumn('medicaments', 'unite')) {
            Schema::table('medicaments', function (Blueprint $table) {
                $table->string('unite')->nullable()->after('poids')->comment('ex: mg, ml, plaquette');
            });
        }

        // 2) créer un index unique composite si non présent
        //    on vérifie dans information_schema au lieu d'utiliser getDoctrineSchemaManager
        $indexName = 'medicaments_unique_nom_cat_poids_unite';

        $exists = (bool) DB::table('information_schema.STATISTICS')
            ->where('TABLE_SCHEMA', DB::getDatabaseName())
            ->where('TABLE_NAME', 'medicaments')
            ->where('INDEX_NAME', $indexName)
            ->count();

        if (! $exists) {
            // utiliser try/catch au cas où la contrainte ne pourrait pas être créée
            try {
                Schema::table('medicaments', function (Blueprint $table) use ($indexName) {
                    $table->unique(['nom_medoc', 'categorie', 'poids', 'unite'], $indexName);
                });
            } catch (\Throwable $e) {
                // log l'erreur mais ne casse pas la migration
                info('Impossible de créer l\'index unique '.$indexName.': '.$e->getMessage());
            }
        }
    }

    public function down(): void
    {
        $indexName = 'medicaments_unique_nom_cat_poids_unite';

        // supprimer l'index si existe
        $exists = (bool) DB::table('information_schema.STATISTICS')
            ->where('TABLE_SCHEMA', DB::getDatabaseName())
            ->where('TABLE_NAME', 'medicaments')
            ->where('INDEX_NAME', $indexName)
            ->count();

        if ($exists) {
            Schema::table('medicaments', function (Blueprint $table) use ($indexName) {
                $table->dropUnique($indexName);
            });
        }

        if (Schema::hasColumn('medicaments', 'unite')) {
            Schema::table('medicaments', function (Blueprint $table) {
                $table->dropColumn('unite');
            });
        }
    }
};
