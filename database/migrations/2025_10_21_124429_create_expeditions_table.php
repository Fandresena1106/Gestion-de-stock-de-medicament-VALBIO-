<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Crée la table 'expeditions' pour enregistrer les expéditions de médicaments
     */
    public function up(): void
    {
        Schema::create('expeditions', function (Blueprint $table) {
            $table->id('id_expedition');               // clé primaire auto-incrémentée
            $table->string('village');                  // village cible de l'expédition
            $table->enum('zone', ['nord', 'sud', 'est', 'ouest']); // zone géographique
            $table->date('date_expedition');            // date de l'expédition
            $table->integer('duree')->comment('Duree en jours'); // durée de l'expédition en jours
            $table->timestamps();                        // created_at et updated_at
        });
    }

    /**
     * Supprime la table en cas de rollback
     */
    public function down(): void
    {
        Schema::dropIfExists('expeditions');
    }
};
