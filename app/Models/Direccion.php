<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Direccion extends Model
{
    use HasFactory;

    /**
     * El nombre de la tabla asociada con el modelo.
     *
     * @var string
     */
    protected $table = 'direcciones';

    /**
     * Los atributos que son asignables en masa.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'nombre_direccion',
        'calle',
        'numero',
        'piso',
        'puerta',
        'codigo_postal',
        'ciudad',
        'provincia',
        'pais',
        'es_principal',
    ];

    /**
     * Los atributos que deben ser convertidos.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'es_principal' => 'boolean',
    ];

    /**
     * Obtiene el usuario asociado a esta dirección.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Obtiene los pedidos que utilizan esta dirección.
     */
    public function pedidos(): HasMany
    {
        return $this->hasMany(Pedido::class);
    }
}