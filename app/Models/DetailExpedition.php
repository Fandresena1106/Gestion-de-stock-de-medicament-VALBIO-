<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DetailExpedition extends Model
{
    use HasFactory;

    /*
    |--------------------------------------------------------------------------
    | Table & configuration spéciale (table pivot)
    |--------------------------------------------------------------------------
    | Ce modèle représente une table pivot entre "expeditions" et "medicaments".
    | Elle n'a pas de clé primaire auto-incrémentée, d’où les paramètres ci-dessous.
    */
    protected $table = 'detail_expeditions';
    protected $primaryKey = null;     // pas de colonne "id" dans la table
    public $incrementing = false;     // évite à Laravel de chercher un autoincrement

    /*
    |--------------------------------------------------------------------------
    | Champs autorisés
    |--------------------------------------------------------------------------
    | Sécurise l’insertion / mise à jour lors du mass assignment.
    */
    protected $fillable = [
        'id_expedition',
        'id_medoc',
        'quantite',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relation : lien vers l’expédition
    |--------------------------------------------------------------------------
    | Chaque ligne correspond à un médicament dans une expédition donnée.
    */
    public function expedition()
    {
        return $this->belongsTo(Expedition::class, 'id_expedition', 'id_expedition');
    }

    /*
    |--------------------------------------------------------------------------
    | Relation : lien vers le médicament
    |--------------------------------------------------------------------------
    | Permet de récupérer les infos du médicament utilisé dans l’expédition.
    */
    public function medicament()
    {
        return $this->belongsTo(Medicament::class, 'id_medoc', 'id_medoc');
    }
}
