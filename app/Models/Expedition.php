<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Expedition extends Model
{
    use HasFactory;

    /*
    |--------------------------------------------------------------------------
    | Clé primaire personnalisée
    |--------------------------------------------------------------------------
    | Utilise "id_expedition" au lieu de la clé "id" par défaut.
    */
    protected $primaryKey = 'id_expedition';

    /*
    |--------------------------------------------------------------------------
    | Champs modifiables
    |--------------------------------------------------------------------------
    | Liste des colonnes autorisées au mass assignment.
    */
    protected $fillable = [
        'village',
        'zone',
        'date_expedition',
        'duree'
    ];

    /*
    |--------------------------------------------------------------------------
    | Relation Many-to-Many avec Medicament
    |--------------------------------------------------------------------------
    | Lien via la table pivot "detail_expeditions".
    | Permet d’accéder aux médicaments d’une expédition avec leur quantité.
    */
    public function medicaments()
    {
        return $this->belongsToMany(
            Medicament::class,
            'detail_expeditions',
            'id_expedition',
            'id_medoc'
        )
        ->withPivot('quantite')
        ->withTimestamps();
    }

    /*
    |--------------------------------------------------------------------------
    | Relation One-to-Many avec DetailExpedition
    |--------------------------------------------------------------------------
    | Permet d’accéder aux détails spécifiques (lignes) d’une expédition.
    */
    public function details()
    {
        return $this->hasMany(DetailExpedition::class, 'id_expedition', 'id_expedition');
    }
}
