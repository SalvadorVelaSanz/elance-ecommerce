<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ZonaEnvio extends Model
{
    use HasFactory;

    /**
     * El nombre de la tabla asociada con el modelo.
     *
     * @var string
     */
    protected $table = 'zonas_envio';

    /**
     * Los atributos que son asignables en masa.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'nombre',
        'costo_envio',
        'pedido_minimo_envio_gratis',
    ];

    /**
     * Los atributos que deben ser convertidos.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'costo_envio' => 'decimal:2',
        'pedido_minimo_envio_gratis' => 'decimal:2',
    ];

    /**
     * Obtiene las provincias asociadas a esta zona de envío.
     */
    public function provincias(): HasMany
    {
        return $this->hasMany(ProvinciaEnvio::class);
    }
}