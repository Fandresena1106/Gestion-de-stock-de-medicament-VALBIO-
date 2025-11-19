<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Crée la table 'medicaments' avec ses colonnes principales
     */
    public function up(): void
    {
        Schema::create('medicaments', function (Blueprint $table) {
            $table->id('id_medoc');               // clé primaire auto-incrémentée
            $table->string('nom_medoc');          // nom du médicament
            $table->text('description')->nullable(); // description ou forme (optionnel)
            $table->string('categorie', 50);      // catégorie du médicament
            $table->decimal('poids', 8, 3)->nullable(); // poids en grammes (optionnel)
            $table->date('date_expiration')->nullable(); // date d'expiration (optionnel)
            $table->timestamps();                 // created_at et updated_at
        });
    }

    /**
     * Supprime la table en cas de rollback
     */
    public function down(): void
    {
        Schema::dropIfExists('medicaments');
    }
};
