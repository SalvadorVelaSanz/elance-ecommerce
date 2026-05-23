<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Resena extends Model
{
    use HasFactory;

    /**
     * El nombre de la tabla asociada con el modelo.
     *
     * @var string
     */
    protected $table = 'resenas';

    /**
     * Los atributos que son asignables en masa.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'producto_id',
        'user_id',
        'puntuacion',
        'fecha_resena',
        'comentario',
    ];

    /**
     * Los atributos que deben ser convertidos.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'puntuacion' => 'integer',
        'fecha_resena' => 'date',
    ];

    /**
     * Las reglas de validación para el modelo.
     *
     * @var array<string, string>
     */
    public static $rules = [
        'puntuacion' => 'required|integer|min:1|max:5',
    ];

    /**
     * Obtiene el producto asociado a la reseña.
     */
    public function producto(): BelongsTo
    {
        return $this->belongsTo(Producto::class);
    }

    /**
     * Obtiene el usuario que escribió la reseña.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}