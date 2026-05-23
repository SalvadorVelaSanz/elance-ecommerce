<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProvinciaEnvio extends Model
{
    use HasFactory;

    /**
     * El nombre de la tabla asociada con el modelo.
     *
     * @var string
     */
    protected $table = 'provincias_envio';

    /**
     * Los atributos que son asignables en masa.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'provincia',
        'codigo_postal_inicio',
        'codigo_postal_fin',
        'zona_envio_id',
    ];

    /**
     * Obtiene la zona de envío asociada a esta provincia.
     */
    public function zonaEnvio(): BelongsTo
    {
        return $this->belongsTo(ZonaEnvio::class);
    }
}