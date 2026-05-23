<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\Direccion;
use App\Models\User;
use App\Models\DetallePedido;
class Pedido extends Model
{
    use HasFactory;

    /**
     * Los atributos que son asignables en masa.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'precio_total',
        'estado',
        'direccion_id',
        'metodo_pago',
        'numero_seguimiento',
        // Snapshots de dirección
        'direccion_nombre_direccion',
        'direccion_calle',
        'direccion_numero',
        'direccion_piso',
        'direccion_puerta',
        'direccion_codigo_postal',
        'direccion_ciudad',
        'direccion_provincia',
        'direccion_pais',
        // Snapshots de usuario
        'usuario_nombre',
        'usuario_email',
        'usuario_telefono',
    ];

    /**
     * Los atributos que deben ser convertidos.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'precio_total' => 'decimal:2',
    ];

    /**
     * Los valores permitidos para el campo estado.
     *
     * @var array<int, string>
     */
    public static $estadosValidos = ['pendiente', 'procesando', 'enviado', 'entregado', 'cancelado'];

    /**
     * Genera un número de seguimiento único.
     *
     * @return string
     */
    public static function generarNumeroSeguimiento()
    {
        do {
            // Generar número que empiece con ES + 12 dígitos
            $numeroSeguimiento = 'ES' . str_pad(random_int(0, 999999999999), 12, '0', STR_PAD_LEFT);
        } while (self::where('numero_seguimiento', $numeroSeguimiento)->exists());

        return $numeroSeguimiento;
    }

    /**
     * Boot del modelo para generar número de seguimiento y snapshots automáticamente.
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($pedido) {
            // Generar número de seguimiento si no existe
            if (empty($pedido->numero_seguimiento)) {
                $pedido->numero_seguimiento = self::generarNumeroSeguimiento();
            }
            
            // Crear snapshots automáticamente
            $pedido->crearSnapshots();
        });

        static::updating(function ($pedido) {
            // Si se cambia la dirección o usuario, actualizar snapshots
            if ($pedido->isDirty(['direccion_id', 'user_id'])) {
                $pedido->crearSnapshots();
            }
        });
    }

    /**
     * Crea los snapshots de dirección y usuario
     */
    protected function crearSnapshots()
    {
        // Snapshot de dirección
        if ($this->direccion_id) {
            // Cargar la dirección si no está ya cargada
            $direccion = $this->direccion ?? Direccion::find($this->direccion_id);
            
            if ($direccion) {
                $this->direccion_nombre_direccion = $direccion->nombre_direccion;
                $this->direccion_calle = $direccion->calle;
                $this->direccion_numero = $direccion->numero;
                $this->direccion_piso = $direccion->piso;
                $this->direccion_puerta = $direccion->puerta;
                $this->direccion_codigo_postal = $direccion->codigo_postal;
                $this->direccion_ciudad = $direccion->ciudad;
                $this->direccion_provincia = $direccion->provincia;
                $this->direccion_pais = $direccion->pais;
            }
        }

        // Snapshot de usuario
        if ($this->user_id) {
            // Cargar el usuario si no está ya cargado
            $usuario = $this->user ?? User::find($this->user_id);
            
            if ($usuario) {
                $this->usuario_nombre = $usuario->name;
                $this->usuario_email = $usuario->email;
                $this->usuario_telefono = $usuario->telefono ?? null;
            }
        }
    }

    /**
     * Obtiene la dirección formateada desde el snapshot
     */
    public function getDireccionCompletaAttribute(): string
    {
        $direccion = [];
        
        if ($this->direccion_calle) $direccion[] = $this->direccion_calle;
        if ($this->direccion_numero) $direccion[] = $this->direccion_numero;
        if ($this->direccion_piso) $direccion[] = "Piso: {$this->direccion_piso}";
        if ($this->direccion_puerta) $direccion[] = "Puerta: {$this->direccion_puerta}";
        if ($this->direccion_codigo_postal) $direccion[] = $this->direccion_codigo_postal;
        if ($this->direccion_ciudad) $direccion[] = $this->direccion_ciudad;
        if ($this->direccion_provincia) $direccion[] = $this->direccion_provincia;
        if ($this->direccion_pais) $direccion[] = $this->direccion_pais;
        
        return implode(', ', $direccion);
    }

    /**
     * Obtiene el usuario asociado al pedido.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Obtiene la dirección de envío asociada a este pedido.
     */
    public function direccion(): BelongsTo
    {
        return $this->belongsTo(Direccion::class, 'direccion_id');
    }
    
    /**
     * Obtiene los detalles de productos asociados al pedido.
     */
    public function detalles(): HasMany
    {
        return $this->hasMany(DetallePedido::class);
    }
}