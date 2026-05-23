<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Carrito extends Model
{
    use HasFactory;

    protected $table = 'carritos';
    
    protected $fillable = [
        'user_id',
        'producto_id',
        'cantidad'
    ];

    /**
     * Obtener el usuario al que pertenece este ítem del carrito.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Obtener el producto asociado a este ítem del carrito.
     */
    public function producto()
    {
        return $this->belongsTo(Producto::class);
    }
}