<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Crée la table 'detail_expeditions' pour enregistrer les détails des expéditions
     * Cette table fait le lien entre une expédition et les médicaments expédiés avec leurs quantités
     */
    public function up(): void
    {
        Schema::create('detail_expeditions', function (Blueprint $table) {
            $table->id(); // clé primaire auto-incrémentée

            $table->unsignedBigInteger('id_expedition'); // référence à une expédition
            $table->unsignedBigInteger('id_medoc');      // référence à un médicament
            $table->integer('quantite');                  // quantité de médicament expédiée

            // Contraintes de clés étrangères avec suppression en cascade
            $table->foreign('id_expedition')
                  ->references('id_expedition')
                  ->on('expeditions')
                  ->cascadeOnDelete();

            $table->foreign('id_medoc')
                  ->references('id_medoc')
                  ->on('medicaments')
                  ->cascadeOnDelete();

            $table->timestamps(); // created_at et updated_at
        });
    }

    /**
     * Supprime la table en cas de rollback
     */
    public function down(): void
    {
        Schema::dropIfExists('detail_expeditions');
    }
};
