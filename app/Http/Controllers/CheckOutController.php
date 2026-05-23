<?php

namespace App\Http\Controllers;

use App\Exceptions\CheckoutValidationException;
use App\Mail\PedidoConfirmado;
use App\Models\Carrito;
use App\Models\DetallePedido;
use App\Models\Direccion;
use App\Models\Pedido;
use App\Models\Producto;
use App\Models\ProvinciaEnvio;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;

class CheckoutController extends Controller
{
    // =========================================================================
    // Endpoints públicos
    // =========================================================================

    /**
     * Crear un nuevo pedido.
     *
     * Flujo:
     *   1. Validar formato de la petición
     *   2. Resolver y verificar la dirección de envío
     *   3. Validar productos (precio, stock) y calcular subtotal
     *   4. Validar y calcular el costo de envío
     *   5. Calcular IVA + total y comprobar que coincide con el cliente
     *   6. Persistir pedido, detalles y reducción de stock en una transacción
     */
    public function crearPedido(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Usuario no autenticado'], 401);
        }

        try {
            $this->validarPeticion($request);

            $direccion  = $this->resolverDireccion($request, $user);
            $resultado  = $this->validarProductosYCalcularSubtotal($request->productos);
            $costoEnvio = $this->validarYCalcularEnvio($request, $direccion, $resultado['subtotal']);
            $totales    = $this->calcularYVerificarTotal(
                $resultado['subtotal'],
                $costoEnvio,
                floatval($request->precio_total)
            );

            return DB::transaction(fn () =>
                $this->persistirPedido($user, $request, $direccion, $resultado['detalles'], $totales)
            );

        } catch (CheckoutValidationException $e) {
            // Error de negocio (400/422): devolver el mensaje y los campos extra
            return response()->json(
                array_merge(['message' => $e->getMessage()], $e->getExtra()),
                $e->getCode()
            );
        } catch (\Exception $e) {
            Log::error('Error al crear pedido', [
                'user_id'      => $user->id,
                'error'        => $e->getMessage(),
                'file'         => $e->getFile(),
                'line'         => $e->getLine(),
                'request_data' => $request->all(),
            ]);

            return response()->json([
                'message' => 'Error al procesar el pedido',
                'error'   => config('app.debug') ? $e->getMessage() : 'Error interno del servidor',
            ], 500);
        }
    }

    /**
     * Calcular totales del carrito (subtotal, envío, IVA, total).
     */
    public function calcularTotales(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            if (!$user) {
                return response()->json(['message' => 'Usuario no autenticado'], 401);
            }

            $metodo_pago  = $request->get('metodo_pago', 'tarjeta');
            $direccion_id = $request->get('direccion_id');

            $carritoItems = Carrito::with('producto')
                ->where('user_id', $user->id)
                ->get();

            if ($carritoItems->isEmpty()) {
                return response()->json([
                    'subtotal'   => 0,
                    'shipping'   => 0,
                    'vat'        => 0,
                    'total'      => 0,
                    'zona_envio' => null,
                ]);
            }

            $subtotal = $carritoItems->sum(fn ($item) => $item->cantidad * $item->producto->precio);

            $shipping  = 0;
            $zonaEnvio = null;

            if ($metodo_pago === 'tarjeta' && $direccion_id) {
                $direccion = Direccion::where('id', $direccion_id)
                    ->where('user_id', $user->id)
                    ->first();

                if ($direccion) {
                    $shipping  = $this->calcularCostoEnvio($direccion, $subtotal);
                    $zonaEnvio = $this->obtenerZonaEnvio($direccion);
                }
            }

            $vat   = $subtotal * config('tienda.iva_rate');
            $total = $subtotal + $shipping + $vat;

            return response()->json([
                'subtotal'   => round($subtotal, 2),
                'shipping'   => round($shipping, 2),
                'vat'        => round($vat, 2),
                'total'      => round($total, 2),
                'zona_envio' => $zonaEnvio,
            ]);

        } catch (\Exception $e) {
            Log::error('Error al calcular totales', [
                'user_id' => $user->id ?? 'unknown',
                'error'   => $e->getMessage(),
                'file'    => $e->getFile(),
                'line'    => $e->getLine(),
            ]);

            return response()->json([
                'message' => 'Error al calcular totales',
                'error'   => config('app.debug') ? $e->getMessage() : 'Error interno del servidor',
            ], 500);
        }
    }

    /**
     * Obtener información de zona de envío para una dirección específica.
     */
    public function obtenerInfoEnvio(Request $request, $direccion_id): JsonResponse
    {
        try {
            $user = $request->user();

            if (!$user) {
                return response()->json(['message' => 'Usuario no autenticado'], 401);
            }

            $direccion = Direccion::where('id', $direccion_id)
                ->where('user_id', $user->id)
                ->first();

            if (!$direccion) {
                return response()->json(['message' => 'Dirección no encontrada'], 404);
            }

            $zonaEnvio = $this->obtenerZonaEnvio($direccion);

            if (!$zonaEnvio) {
                return response()->json([
                    'zona_encontrada' => false,
                    'mensaje'         => 'No se encontró información de envío para esta dirección. Se aplicará tarifa estándar.',
                    'costo_envio'     => 2.00,
                ]);
            }

            return response()->json([
                'zona_encontrada' => true,
                'zona_envio'      => [
                    'nombre'                    => $zonaEnvio->nombre,
                    'costo_envio'               => $zonaEnvio->costo_envio,
                    'pedido_minimo_envio_gratis' => $zonaEnvio->pedido_minimo_envio_gratis,
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('Error obteniendo info de envío', [
                'direccion_id' => $direccion_id,
                'user_id'      => $user->id ?? 'unknown',
                'error'        => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Error al obtener información de envío',
                'error'   => config('app.debug') ? $e->getMessage() : 'Error interno del servidor',
            ], 500);
        }
    }

    /**
     * Verificar si el carrito tiene items.
     */
    public function checkCarrito(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            if (!$user) {
                return response()->json(['message' => 'Usuario no autenticado'], 401);
            }

            $hasItems = Carrito::where('user_id', $user->id)->exists();

            return response()->json([
                'hasItems' => $hasItems,
                'message'  => $hasItems ? 'Carrito tiene productos' : 'Carrito vacío',
            ]);

        } catch (\Exception $e) {
            Log::error('Error verificando carrito', [
                'user_id' => $user->id ?? 'unknown',
                'error'   => $e->getMessage(),
            ]);

            return response()->json(['hasItems' => false, 'message' => 'Error al verificar carrito'], 500);
        }
    }

    // =========================================================================
    // Pasos de validación (crearPedido)
    // =========================================================================

    /**
     * Validar el formato y tipos de la petición.
     * Lanza CheckoutValidationException (422) si falla.
     */
    private function validarPeticion(Request $request): void
    {
        $validator = Validator::make($request->all(), [
            'direccion_id'                => 'nullable|exists:direcciones,id',
            'metodo_pago'                 => 'required|string|in:tarjeta,presencial',
            'precio_total'                => 'required|numeric|min:0',
            'costo_envio'                 => 'required|numeric|min:0',
            'productos'                   => 'required|array|min:1',
            'productos.*.producto_id'     => 'required|exists:productos,id',
            'productos.*.cantidad'        => 'required|integer|min:1',
            'productos.*.precio_unitario' => 'required|numeric|min:0',
        ]);

        if ($validator->fails()) {
            throw new CheckoutValidationException(
                'Datos de validación incorrectos',
                ['errors' => $validator->errors()],
                422
            );
        }
    }

    /**
     * Verificar que la dirección es válida y coherente con el método de pago.
     * Devuelve la Direccion o null (recogida presencial sin dirección).
     */
    private function resolverDireccion(Request $request, $user): ?Direccion
    {
        if (!$request->direccion_id) {
            if ($request->metodo_pago === 'tarjeta') {
                throw new CheckoutValidationException('Se requiere dirección para envío a domicilio');
            }
            return null;
        }

        $direccion = Direccion::where('id', $request->direccion_id)
            ->where('user_id', $user->id)
            ->first();

        if (!$direccion) {
            throw new CheckoutValidationException('Dirección no válida');
        }

        return $direccion;
    }

    /**
     * Cargar los productos de la BD, verificar precios y stock,
     * y devolver el subtotal calculado junto con los detalles listos para persistir.
     *
     * @param  array $productosRequest  Array de ['producto_id', 'cantidad', 'precio_unitario']
     * @return array{subtotal: float, detalles: array}
     */
    private function validarProductosYCalcularSubtotal(array $productosRequest): array
    {
        $productosRequest = collect($productosRequest);
        $productoIds      = $productosRequest->pluck('producto_id');

        $productosDB = Producto::with(['categoria', 'imagenProductos'])
            ->whereIn('id', $productoIds)
            ->get();

        if ($productosDB->count() !== $productosRequest->count()) {
            throw new CheckoutValidationException('Algunos productos no están disponibles');
        }

        $subtotal = 0;
        $detalles = [];

        foreach ($productosRequest as $item) {
            $producto       = $productosDB->firstWhere('id', $item['producto_id']);
            $precioEsperado = floatval($producto->precio);
            $precioRecibido = floatval($item['precio_unitario']);
            $cantidad       = intval($item['cantidad']);

            // Verificar que el precio no ha cambiado desde que el usuario cargó el carrito
            if (abs($precioEsperado - $precioRecibido) > 0.01) {
                throw new CheckoutValidationException('El precio del producto ha cambiado', [
                    'producto'        => $producto->nombre,
                    'precio_actual'   => $precioEsperado,
                    'precio_recibido' => $precioRecibido,
                ]);
            }

            // Verificar stock disponible
            if ($producto->stock !== null && $producto->stock < $cantidad) {
                throw new CheckoutValidationException(
                    'Stock insuficiente para el producto: ' . $producto->nombre,
                    [
                        'stock_disponible'    => $producto->stock,
                        'cantidad_solicitada' => $cantidad,
                    ]
                );
            }

            if ($producto->stock === null) {
                Log::info("Producto {$producto->nombre} no maneja stock");
            }

            $subtotal  += $precioEsperado * $cantidad;
            $detalles[] = [
                'producto_id'     => $producto->id,
                'cantidad'        => $cantidad,
                'precio_unitario' => $precioEsperado,
                'producto'        => $producto, // referencia para reducir stock en la transacción
            ];
        }

        return ['subtotal' => $subtotal, 'detalles' => $detalles];
    }

    /**
     * Calcular el costo de envío real y verificar que coincide con lo que envió el cliente.
     */
    private function validarYCalcularEnvio(Request $request, ?Direccion $direccion, float $subtotal): float
    {
        // Recogida presencial: el envío siempre debe ser 0
        if ($request->metodo_pago !== 'tarjeta' || !$direccion) {
            if (abs(floatval($request->costo_envio)) > 0.01) {
                throw new CheckoutValidationException(
                    'El costo de envío para recogida presencial debe ser 0',
                    [
                        'costo_envio_actual'   => 0,
                        'costo_envio_recibido' => floatval($request->costo_envio),
                    ]
                );
            }
            return 0;
        }

        $costoCalculado = $this->calcularCostoEnvio($direccion, $subtotal);

        if (abs($costoCalculado - floatval($request->costo_envio)) > 0.01) {
            throw new CheckoutValidationException('El costo de envío ha cambiado', [
                'costo_envio_actual'   => $costoCalculado,
                'costo_envio_recibido' => floatval($request->costo_envio),
            ]);
        }

        return $costoCalculado;
    }

    /**
     * Calcular IVA y total final, y verificar que coincide con el total enviado por el cliente.
     *
     * @return array{subtotal: float, costoEnvio: float, iva: float, total: float}
     */
    private function calcularYVerificarTotal(float $subtotal, float $costoEnvio, float $totalRecibido): array
    {
        $iva   = $subtotal * config('tienda.iva_rate');
        $total = $subtotal + $costoEnvio + $iva;

        if (abs($total - $totalRecibido) > 0.01) {
            throw new CheckoutValidationException('El total del pedido no coincide', [
                'total_calculado' => round($total, 2),
                'total_recibido'  => $totalRecibido,
                'diferencia'      => abs($total - $totalRecibido),
            ]);
        }

        return [
            'subtotal'   => $subtotal,
            'costoEnvio' => $costoEnvio,
            'iva'        => $iva,
            'total'      => $total,
        ];
    }

    // =========================================================================
    // Persistencia (ejecutada dentro de DB::transaction)
    // =========================================================================

    /**
     * Crear el pedido, los detalles, reducir stock y vaciar el carrito.
     * Cualquier excepción aquí provoca el rollback automático de la transacción.
     */
    private function persistirPedido($user, Request $request, ?Direccion $direccion, array $detalles, array $totales): JsonResponse
    {
        $pedido = Pedido::create([
            'user_id'      => $user->id,
            'precio_total' => round($totales['total'], 2),
            'estado'       => 'pendiente',
            'direccion_id' => $request->direccion_id,
            'metodo_pago'  => $request->metodo_pago,
        ]);

        Log::info('Pedido creado con snapshots', [
            'pedido_id'          => $pedido->id,
            'numero_seguimiento' => $pedido->numero_seguimiento,
            'usuario_snapshot'   => $pedido->usuario_nombre,
            'direccion_snapshot' => $pedido->direccion_completa,
        ]);

        foreach ($detalles as $detalle) {
            $detallePedido = DetallePedido::create([
                'pedido_id'       => $pedido->id,
                'producto_id'     => $detalle['producto_id'],
                'cantidad'        => $detalle['cantidad'],
                'precio_unitario' => $detalle['precio_unitario'],
            ]);

            Log::info('Detalle creado con snapshot', [
                'detalle_id'         => $detallePedido->id,
                'producto_snapshot'  => $detallePedido->producto_nombre,
                'categoria_snapshot' => $detallePedido->categoria_nombre,
            ]);

            if ($detalle['producto']->stock !== null) {
                $stockAnterior = $detalle['producto']->stock;

                if (!$detalle['producto']->reducirStock($detalle['cantidad'])) {
                    // Lanzar excepción para que DB::transaction haga rollback automático
                    throw new \RuntimeException(
                        'No se pudo reducir el stock para: ' . $detalle['producto']->nombre
                    );
                }

                Log::info('Stock reducido', [
                    'producto_id'      => $detalle['producto']->id,
                    'producto_nombre'  => $detalle['producto']->nombre,
                    'stock_anterior'   => $stockAnterior,
                    'cantidad_reducida' => $detalle['cantidad'],
                    'stock_actual'     => $detalle['producto']->fresh()->stock,
                ]);
            }
        }

        $carritoItems = Carrito::where('user_id', $user->id)->count();
        Carrito::where('user_id', $user->id)->delete();
        Log::info('Carrito limpiado', [
            'user_id'          => $user->id,
            'items_eliminados' => $carritoItems,
        ]);

        $pedido->load(['detalles']);
        $this->enviarCorreoConfirmacion($pedido, $user, $totales);

        return response()->json([
            'message' => 'Pedido creado correctamente',
            'pedido'  => [
                'id'                 => $pedido->id,
                'numero_seguimiento' => $pedido->numero_seguimiento,
                'precio_total'       => $pedido->precio_total,
                'estado'             => $pedido->estado,
                'metodo_pago'        => $pedido->metodo_pago,
                'created_at'         => $pedido->created_at,
                'usuario_nombre'     => $pedido->usuario_nombre,
                'direccion_completa' => $pedido->direccion_completa,
                'detalles_count'     => $pedido->detalles->count(),
            ],
            'detalles' => [
                'subtotal'    => $totales['subtotal'],
                'costo_envio' => $totales['costoEnvio'],
                'iva'         => $totales['iva'],
                'total'       => $totales['total'],
            ],
        ], 201);
    }

    /**
     * Enviar correo de confirmación al cliente.
     * El fallo en el envío solo se loggea; no revierte el pedido.
     */
    private function enviarCorreoConfirmacion($pedido, $user, array $totales): void
    {
        try {
            Mail::to($user->email)->send(new PedidoConfirmado($pedido, $user, [
                'subtotal'    => $totales['subtotal'],
                'costo_envio' => $totales['costoEnvio'],
                'iva'         => $totales['iva'],
                'total'       => $totales['total'],
            ]));

            Log::info('Correo de confirmación de pedido enviado', [
                'pedido_id'          => $pedido->id,
                'user_email'         => $user->email,
                'numero_seguimiento' => $pedido->numero_seguimiento,
            ]);
        } catch (\Exception $e) {
            Log::error('Error al enviar correo de confirmación de pedido', [
                'pedido_id'  => $pedido->id,
                'user_email' => $user->email,
                'error'      => $e->getMessage(),
            ]);
        }
    }

    // =========================================================================
    // Helpers de cálculo de envío
    // =========================================================================

    /**
     * Calcular el costo de envío según la zona de la dirección.
     * Devuelve 2.00 como tarifa por defecto si no se encuentra la zona.
     */
    private function calcularCostoEnvio($direccion, float $subtotal): float
    {
        try {
            $zonaEnvio = $this->obtenerZonaEnvio($direccion);

            if (!$zonaEnvio) {
                Log::warning('Zona de envío no encontrada, usando tarifa por defecto', [
                    'direccion_id' => $direccion->id,
                    'provincia'    => $direccion->provincia,
                    'codigo_postal' => $direccion->codigo_postal,
                ]);
                return 2.00;
            }

            if ($zonaEnvio->pedido_minimo_envio_gratis && $subtotal >= $zonaEnvio->pedido_minimo_envio_gratis) {
                Log::info('Envío gratis aplicado', [
                    'zona_envio'    => $zonaEnvio->nombre,
                    'pedido_minimo' => $zonaEnvio->pedido_minimo_envio_gratis,
                    'subtotal'      => $subtotal,
                ]);
                return 0;
            }

            return $zonaEnvio->costo_envio;

        } catch (\Exception $e) {
            Log::error('Error calculando costo de envío', [
                'direccion_id' => $direccion->id ?? 'unknown',
                'error'        => $e->getMessage(),
            ]);
            return 2.00;
        }
    }

    /**
     * Obtener la ZonaEnvio que corresponde a la provincia y código postal de la dirección.
     */
    private function obtenerZonaEnvio($direccion)
    {
        try {
            $provinciaEnvio = ProvinciaEnvio::with('zonaEnvio')
                ->where('provincia', 'LIKE', '%' . $direccion->provincia . '%')
                ->where(function ($query) use ($direccion) {
                    $codigoPostal = (int) $direccion->codigo_postal;
                    $query->where('codigo_postal_inicio', '<=', $codigoPostal)
                          ->where('codigo_postal_fin', '>=', $codigoPostal);
                })
                ->first();

            return $provinciaEnvio ? $provinciaEnvio->zonaEnvio : null;

        } catch (\Exception $e) {
            Log::error('Error obteniendo zona de envío', [
                'direccion_id' => $direccion->id ?? 'unknown',
                'error'        => $e->getMessage(),
            ]);
            return null;
        }
    }
}
