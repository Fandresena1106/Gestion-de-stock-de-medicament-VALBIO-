<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Entree extends Model
{
    use HasFactory;

    /* 
    |-------------------------------------------------------------
    | Clé primaire personnalisée
    |-------------------------------------------------------------
    | La table utilise "id_entree" comme clé au lieu de "id".
    */
    protected $primaryKey = 'id_entree';

    /* 
    |-------------------------------------------------------------
    | Champs modifiables
    |-------------------------------------------------------------
    | Autorise le remplissage contrôlé des colonnes.
    | Empêche les erreurs de mass assignment.
    */
    protected $fillable = [
        'id_medoc',
        'fournisseur',
        'quantite',
        'unite_mesure',
        'date_entree',
        'date_expiration',
    ];

    /* 
    |-------------------------------------------------------------
    | Casting des dates
    |-------------------------------------------------------------
    | Laravel convertit automatiquement en instance Carbon.
    | Facilite les manipulations et formats de dates.
    */
    protected $casts = [
        'date_entree' => 'date',
        'date_expiration' => 'date',
    ];

    /* 
    |-------------------------------------------------------------
    | Relation : Médicament associé
    |-------------------------------------------------------------
    | Chaque entrée appartient à un médicament.
    */
    public function medicament()
    {
        return $this->belongsTo(Medicament::class, 'id_medoc', 'id_medoc');
    }

    /* 
    |-------------------------------------------------------------
    | Scope personnalisé : Entrées d’un mois donné
    |-------------------------------------------------------------
    | Simplifie : Entree::duMois(5)->get()
    | pour obtenir les entrées du mois de mai par exemple.
    */
    public function scopeDuMois($query, $mois)
    {
        return $query->whereMonth('date_entree', $mois);
    }
}
