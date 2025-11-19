<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Crée la table 'entrees' pour enregistrer les entrées de stock
     */
    public function up(): void
    {
        Schema::create('entrees', function (Blueprint $table) {
            $table->id('id_entree'); // clé primaire auto-incrémentée
            $table->foreignId('id_medoc')             // clé étrangère vers medicaments
                  ->constrained('medicaments', 'id_medoc')
                  ->cascadeOnDelete();                 // suppression en cascade si médicament supprimé
            $table->string('fournisseur', 200)->nullable(); // fournisseur (optionnel)
            $table->integer('quantite');               // quantité entrée en stock
            $table->date('date_entree');                // date de l'entrée en stock
            $table->timestamps();                       // created_at et updated_at
        });
    }

    /**
     * Supprime la table en cas de rollback
     */
    public function down(): void
    {
        Schema::dropIfExists('entrees');
    }
};
