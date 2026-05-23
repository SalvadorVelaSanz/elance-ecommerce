<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Categoria extends Model
{
    use HasFactory;

    /**
     * Los atributos que son asignables en masa.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'nombre',
        'temporada',
        'publico_objetivo',
        'imagen_categoria',
    ];

    /**
     * Los valores permitidos para el campo publico_objetivo.
     *
     * @var array<int, string>
     */
    public static $publicoObjetivoValido = ['adulto', 'niño', 'bebé', 'unisex'];

    /**
     * Relación con productos
     */
    public function productos()
    {
        return $this->hasMany(\App\Models\Producto::class);
    }
}