<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Medicament extends Model
{
    use HasFactory;

    /* 
    |-------------------------------------------------------------
    | Clé primaire personnalisée
    |-------------------------------------------------------------
    | On précise la clé primaire car elle ne suit pas le nom "id".
    */
    protected $primaryKey = 'id_medoc';

    /* 
    |-------------------------------------------------------------
    | Champs remplissables
    |-------------------------------------------------------------
    | Liste des colonnes autorisées lors des insertions/updates.
    | Permet d'éviter les erreurs de mass assignment.
    */
    protected $fillable = [
        'nom_medoc',
        'description',
        'categorie',
        'mesure',       // quantité numérique (ex : 500)
        'unite',        // unité de mesure (ex : mg, ml)
        'date_expiration'
    ];

    /* 
    |-------------------------------------------------------------
    | Relation : Entrées de stock
    |-------------------------------------------------------------
    | Un médicament possède plusieurs entrées (arrivages).
    */
    public function entrees()
    {
        return $this->hasMany(Entree::class, 'id_medoc', 'id_medoc');
    }

    /* 
    |-------------------------------------------------------------
    | Relation : Sorties (détail des expéditions)
    |-------------------------------------------------------------
    | Permet de calculer les quantités sorties du stock.
    */
    public function detailsExpeditions()
    {
        return $this->hasMany(DetailExpedition::class, 'id_medoc', 'id_medoc');
    }

    /* 
    |-------------------------------------------------------------
    | Relation : Expéditions liées
    |-------------------------------------------------------------
    | Relation many-to-many via la table pivôt detail_expeditions.
    | On inclut la quantité pour chaque sortie.
    */
    public function expeditions()
    {
        return $this->belongsToMany(
            Expedition::class,
            'detail_expeditions',
            'id_medoc',
            'id_expedition'
        )
        ->withPivot('quantite')
        ->withTimestamps();
    }

    /* 
    |-------------------------------------------------------------
    | Stock calculé automatiquement
    |-------------------------------------------------------------
    | Stock = total des entrées - total des sorties.
    | Retourne un attribut dynamique : $medicament->stock
    */
    public function getStockAttribute()
    {
        $totalEntree = (int) $this->entrees()->sum('quantite');
        $totalSortie = (int) $this->detailsExpeditions()->sum('quantite');
        return $totalEntree - $totalSortie;
    }

    /* 
    |-------------------------------------------------------------
    | Méthode utilitaire
    |-------------------------------------------------------------
    | Fournit une lecture propre du stock disponible.
    */
    public function availableStock(): int
    {
        return (int) $this->stock;
    }
}
