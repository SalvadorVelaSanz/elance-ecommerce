<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\Producto;
use App\Models\Pedido;

class DetallePedido extends Model
{
    use HasFactory;

    /**
     * El nombre de la tabla asociada con el modelo.
     *
     * @var string
     */
    protected $table = 'detalle_pedidos';

    /**
     * Los atributos que son asignables en masa.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'pedido_id',
        'producto_id',
        'cantidad',
        'precio_unitario',
        // Snapshots de producto
        'producto_nombre',
        'producto_descripcion',
        'producto_talla',
        'producto_precio_original',
        'producto_porcentaje_descuento',
        'producto_fecha_inicio_descuento',
        'producto_fecha_fin_descuento',
        'categoria_nombre',
        'producto_imagen_url',
        'producto_sku',
    ];

    /**
     * Los atributos que deben ser convertidos.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'precio_unitario' => 'decimal:2',
        'producto_precio_original' => 'decimal:2',
        'producto_porcentaje_descuento' => 'decimal:2',
        'producto_fecha_inicio_descuento' => 'date',
        'producto_fecha_fin_descuento' => 'date',
    ];

    /**
     * Boot del modelo para crear snapshots automáticamente.
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($detallePedido) {
            // Crear snapshots automáticamente
            $detallePedido->crearSnapshotProducto();
        });

        static::updating(function ($detallePedido) {
            // Si se cambia el producto, actualizar snapshot
            if ($detallePedido->isDirty('producto_id')) {
                $detallePedido->crearSnapshotProducto();
            }
        });
    }

    /**
     * Crea el snapshot del producto y su categoría
     */
    protected function crearSnapshotProducto()
    {
        if ($this->producto_id) {
            // Cargar el producto con su categoría si no está ya cargado
            $producto = $this->producto ?? Producto::with('categoria', 'imagenProductos')->find($this->producto_id);
            
            if ($producto) {
                // Snapshot básico del producto
                $this->producto_nombre = $producto->nombre;
                $this->producto_descripcion = $producto->descripcion;
                $this->producto_talla = $producto->talla;
                $this->producto_precio_original = $producto->precio_original ?? $producto->precio;
                $this->producto_porcentaje_descuento = $producto->porcentaje_descuento;
                $this->producto_fecha_inicio_descuento = $producto->fecha_inicio_descuento;
                $this->producto_fecha_fin_descuento = $producto->fecha_fin_descuento;
                
                // Snapshot de la categoría
                if ($producto->categoria) {
                    $this->categoria_nombre = $producto->categoria->nombre;
                }
                
                // Snapshot de la imagen
                if ($producto->imagenProductos) {
                    // Si imagenProductos es una colección, tomar la primera imagen
                    if ($producto->imagenProductos instanceof \Illuminate\Database\Eloquent\Collection) {
                        $primeraImagen = $producto->imagenProductos->first();
                        if ($primeraImagen) {
                            $this->producto_imagen_url = $primeraImagen->url ?? $primeraImagen->path ?? null;
                        }
                    } else {
                        // Si es una sola imagen
                        $this->producto_imagen_url = $producto->imagenProductos->url ?? $producto->imagenProductos->path ?? null;
                    }
                }
                
                // SKU si existe
                $this->producto_sku = $producto->sku ?? null;
            }
        }
    }

    /**
     * Calcula el subtotal de este detalle
     */
    public function getSubtotalAttribute(): float
    {
        return $this->cantidad * $this->precio_unitario;
    }

    /**
     * Obtiene el nombre del producto (desde snapshot o relación)
     */
    public function getNombreProductoAttribute(): string
    {
        return $this->producto_nombre ?? $this->producto?->nombre ?? 'Producto eliminado';
    }

    /**
     * Verifica si el producto original fue eliminado
     */
    public function getProductoEliminadoAttribute(): bool
    {
        return $this->producto_id === null || $this->producto === null;
    }

    /**
     * Obtiene información completa del producto para mostrar
     */
    public function getInfoProductoAttribute(): array
    {
        return [
            'nombre' => $this->nombre_producto,
            'descripcion' => $this->producto_descripcion,
            'talla' => $this->producto_talla,
            'categoria' => $this->categoria_nombre,
            'imagen_url' => $this->producto_imagen_url,
            'sku' => $this->producto_sku,
            'precio_original' => $this->producto_precio_original,
            'descuento' => $this->producto_porcentaje_descuento,
            'eliminado' => $this->producto_eliminado,
        ];
    }

    /**
     * Obtiene el pedido asociado al detalle.
     */
    public function pedido(): BelongsTo
    {
        return $this->belongsTo(Pedido::class);
    }

    /**
     * Obtiene el producto asociado al detalle.
     */
    public function producto(): BelongsTo
    {
        return $this->belongsTo(Producto::class);
    }
}