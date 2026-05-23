<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Producto extends Model
{
    use HasFactory;

    /**
     * Los atributos que son asignables en masa.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'nombre',
        'descripcion',
        'precio',
        'precio_original',
        'porcentaje_descuento',
        'fecha_inicio_descuento',
        'fecha_fin_descuento',
        'talla',
        'stock',
        'categoria_id',
        'imagen_id',
    ];

    /**
     * Los atributos que deben ser convertidos.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'precio' => 'decimal:2',
        'precio_original' => 'decimal:2',
        'porcentaje_descuento' => 'decimal:2',
        'fecha_inicio_descuento' => 'date',
        'fecha_fin_descuento' => 'date',
        'stock' => 'integer',
    ];

    /**
     * Obtiene la categoría asociada al producto.
     */
    public function categoria(): BelongsTo
    {
        return $this->belongsTo(Categoria::class);
    }

    /**
     * Obtiene la imagen principal asociada al producto.
     */
    public function imagenProductos(): BelongsTo
    {
        return $this->belongsTo(Imagen::class, 'imagen_id');
    }

    /**
     * Verifica si el producto tiene stock disponible
     */
    public function tieneStock($cantidad = 1): bool
    {
        return $this->stock !== null && $this->stock >= $cantidad;
    }

    /**
     * Reduce el stock del producto de forma atómica.
     * El WHERE stock >= $cantidad se evalúa en la BD en la misma sentencia UPDATE,
     * evitando race conditions cuando dos pedidos compran el mismo producto a la vez.
     * Devuelve true si el stock se redujo, false si no había suficiente.
     */
    public function reducirStock($cantidad): bool
    {
        $affected = Producto::where('id', $this->id)
            ->where('stock', '>=', $cantidad)
            ->decrement('stock', $cantidad);

        return $affected > 0;
    }

    /**
     * Accessor para verificar si está en oferta.
     * Un producto está en oferta si tiene precio_original y porcentaje_descuento > 0,
     * y opcionalmente se encuentra dentro del rango de fechas (si se han definido).
     */
    public function getEnOfertaAttribute(): bool
    {
        if (!$this->precio_original || !($this->porcentaje_descuento > 0)) {
            return false;
        }

        $hoy = now();

        // Sin fechas → siempre en oferta mientras tenga precio y descuento
        if (!$this->fecha_inicio_descuento && !$this->fecha_fin_descuento) {
            return true;
        }

        // Con fechas → verificar que estemos dentro del rango
        return $this->fecha_inicio_descuento <= $hoy &&
               (!$this->fecha_fin_descuento || $this->fecha_fin_descuento >= $hoy);
    }

    /**
     * Accessor para obtener el nombre de la categoría o un valor por defecto
     */
    public function getCategoriaNombreAttribute(): string
    {
        return $this->categoria ? $this->categoria->nombre : 'Sin categoría';
    }

    /**
     * Verifica si el producto tiene categoría asignada
     */
    public function tieneCategoria(): bool
    {
        return !is_null($this->categoria_id);
    }
}