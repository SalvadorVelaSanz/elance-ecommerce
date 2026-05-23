<?php

namespace App\Http\Controllers;

use App\Models\Pedido;
use App\Models\DetallePedido;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class PedidosController extends Controller
{
    /**
     * Mostrar una lista de todos los pedidos del usuario autenticado.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        
        if (!$user) {
            return response()->json(['message' => 'Usuario no autenticado'], 401);
        }
        
        $pedidos = Pedido::where('user_id', $user->id)
            ->with(['detalles.producto', 'direccion'])
            ->orderBy('created_at', 'desc')
            ->get();
        
        // Transformar los pedidos para incluir datos de snapshots 
        $pedidosTransformados = $pedidos->map(function ($pedido) {
            return $this->transformarPedidoConSnapshots($pedido);
        });
        
        return response()->json($pedidosTransformados);
    }

    /**
     * Mostrar el pedido especificado.
     */
    public function show(Request $request, $id)
    {
        $user = $request->user();
        
        if (!$user) {
            return response()->json(['message' => 'Usuario no autenticado'], 401);
        }
        
        $pedido = Pedido::with(['detalles.producto', 'direccion'])
            ->where('user_id', $user->id)
            ->findOrFail($id);
        
        $pedidoTransformado = $this->transformarPedidoConSnapshots($pedido);
        
        return response()->json($pedidoTransformado);
    }

    /**
     * Transformar pedido para incluir datos de snapshots cuando las relaciones no existen
     */
    private function transformarPedidoConSnapshots($pedido)
    {
        // Convertir a array para poder modificarlo
        $pedidoArray = $pedido->toArray();
        
        // MANEJAR DIRECCIÓN CON SNAPSHOTS
        if (!$pedido->direccion && $pedido->direccion_calle) {
            // Si la dirección fue eliminada pero tenemos snapshots, crear objeto de dirección virtual
            $pedidoArray['direccion'] = [
                'id' => null,
                'nombre_direccion' => $pedido->direccion_nombre_direccion,
                'calle' => $pedido->direccion_calle,
                'numero' => $pedido->direccion_numero,
                'piso' => $pedido->direccion_piso,
                'puerta' => $pedido->direccion_puerta,
                'codigo_postal' => $pedido->direccion_codigo_postal,
                'ciudad' => $pedido->direccion_ciudad,
                'provincia' => $pedido->direccion_provincia,
                'pais' => $pedido->direccion_pais,
                'es_principal' => false,
                'eliminada' => true // Marcador para identificar que fue eliminada
            ];
        }
        
        // MANEJAR DETALLES CON SNAPSHOTS DE PRODUCTOS
        if (isset($pedidoArray['detalles'])) {
            $pedidoArray['detalles'] = collect($pedido->detalles)->map(function ($detalle) {
                $detalleArray = $detalle->toArray();
                
                // Si el producto existe, mantenerlo como está
                if ($detalle->producto) {
                    // Producto existe - mantener datos normales
                    return $detalleArray;
                }
                
                // Si el producto fue eliminado, crear objeto virtual con snapshots
                if ($detalle->producto_nombre) {
                    $detalleArray['producto'] = [
                        'id' => null,
                        'nombre' => $detalle->producto_nombre,
                        'descripcion' => $detalle->producto_descripcion,
                        'precio' => $detalle->precio_unitario,
                        'talla' => $detalle->producto_talla,
                        'imagen_url' => $detalle->producto_imagen_url,
                        'categoria' => [
                            'nombre' => $detalle->categoria_nombre
                        ],
                        'eliminado' => true // Marcador para identificar que fue eliminado
                    ];
                } else {
                    // Si no hay snapshots usar datos mínimos
                    $detalleArray['producto'] = [
                        'id' => null,
                        'nombre' => 'Producto eliminado (sin información)',
                        'eliminado' => true
                    ];
                }
                
                return $detalleArray;
            })->toArray();
        }
        
        return $pedidoArray;
    }

    /**
     * Obtener todos los pedidos para administradores.
     */
    public function getAllPedidos(Request $request)
    {
        // Este método solo debe ser accesible por administradores via middleware
        $perPage = $request->get('per_page', 15);
        $page = $request->get('page', 1);
        
        $query = Pedido::with(['user', 'detalles.producto', 'direccion'])
            ->orderBy('created_at', 'desc');
        
        // Filtrar por ID del pedido si se proporciona
        if ($request->has('id') && $request->get('id')) {
            $query->where('id', $request->get('id'));
        }
        
        // Filtrar por estado si se proporciona
        if ($request->has('estado') && $request->get('estado')) {
            $query->where('estado', $request->get('estado'));
        }
        
        $pedidos = $query->paginate($perPage, ['*'], 'page', $page);
        
        // Transformar los pedidos para incluir snapshots
        $pedidosTransformados = $pedidos->getCollection()->map(function ($pedido) {
            return $this->transformarPedidoConSnapshots($pedido);
        });
        
        return response()->json([
            'data' => $pedidosTransformados,
            'pagination' => [
                'current_page' => $pedidos->currentPage(),
                'last_page' => $pedidos->lastPage(),
                'per_page' => $pedidos->perPage(),
                'total' => $pedidos->total(),
                'first_page_url' => $pedidos->url(1),
                'last_page_url' => $pedidos->url($pedidos->lastPage()),
                'next_page_url' => $pedidos->nextPageUrl(),
                'prev_page_url' => $pedidos->previousPageUrl(),
            ]
        ]);
    }

    /**
     * Actualizar el estado de un pedido (SOLO PARA ADMINISTRADORES).
     */
    public function actualizarEstado(Request $request, $id)
    {
        $request->validate([
            'estado' => 'required|string|in:' . implode(',', Pedido::$estadosValidos),
        ]);
        
        $pedido = Pedido::with(['user', 'detalles.producto', 'direccion'])
            ->findOrFail($id);
        
        $pedido->estado = $request->estado;
        $pedido->save();
        
        return response()->json([
            'message' => 'Estado del pedido actualizado correctamente',
            'pedido' => $this->transformarPedidoConSnapshots($pedido)
        ]);
    }

    /**
     * Actualizar un número de seguimiento para un pedido (SOLO PARA ADMINISTRADORES).
     */
    public function actualizarSeguimiento(Request $request, $id)
    {
        $request->validate([
            'numero_seguimiento' => 'required|string|max:255',
        ]);
        
        $pedido = Pedido::with(['user', 'detalles.producto', 'direccion'])
            ->findOrFail($id);
        
        $pedido->numero_seguimiento = $request->numero_seguimiento;
        $pedido->save();
        
        return response()->json([
            'message' => 'Número de seguimiento actualizado correctamente',
            'pedido' => $this->transformarPedidoConSnapshots($pedido)
        ]);
    }

    /**
     * Cancelar un pedido para usuarios normales
     */
    public function cancelarUsuario(Request $request, $id)
    {
        try {
            $user = $request->user();
            
            if (!$user) {
                return response()->json(['message' => 'Usuario no autenticado'], 401);
            }
            
            Log::info('Usuario intentando cancelar pedido', [
                'pedido_id' => $id,
                'user_id' => $user->id,
                'user_email' => $user->email,
                'is_admin' => $user->is_admin ?? 'null'
            ]);
            
            // Buscar el pedido que pertenece al usuario
            $pedido = Pedido::where('user_id', $user->id)
                ->where('id', $id)
                ->with(['detalles.producto', 'direccion'])
                ->first();
            
            if (!$pedido) {
                Log::warning('Pedido no encontrado para usuario', [
                    'pedido_id' => $id,
                    'user_id' => $user->id
                ]);
                return response()->json(['message' => 'Pedido no encontrado'], 404);
            }
            
            // Verificar que el pedido puede ser cancelado
            if (!in_array($pedido->estado, ['pendiente', 'procesando'])) {
                Log::warning('Intento de cancelar pedido en estado no permitido', [
                    'pedido_id' => $id,
                    'user_id' => $user->id,
                    'estado_actual' => $pedido->estado
                ]);
                return response()->json([
                    'message' => 'No se puede cancelar un pedido en estado: ' . $pedido->estado
                ], 400);
            }
            
            $pedido->estado = 'cancelado';
            $pedido->save();
            
            Log::info('Pedido cancelado exitosamente por usuario', [
                'pedido_id' => $id,
                'user_id' => $user->id,
                'numero_seguimiento' => $pedido->numero_seguimiento
            ]);
            
            return response()->json([
                'message' => 'Pedido cancelado correctamente',
                'pedido' => $this->transformarPedidoConSnapshots($pedido)
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error al cancelar pedido (usuario)', [
                'pedido_id' => $id,
                'user_id' => $user->id ?? 'unknown',
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'message' => 'Error interno al cancelar el pedido',
                'error' => config('app.debug') ? $e->getMessage() : 'Error interno del servidor'
            ], 500);
        }
    }

    /**
     * Cancelar un pedido para administradores 
     * Los administradores pueden cancelar cualquier pedido que no esté entregado o ya cancelado.
     */
    public function cancelarAdmin(Request $request, $id)
    {
        try {
            $user = $request->user();
            
            Log::info('Administrador intentando cancelar pedido', [
                'pedido_id' => $id,
                'admin_id' => $user->id,
                'admin_email' => $user->email
            ]);
            
            $pedido = Pedido::with(['user', 'detalles.producto', 'direccion'])
                ->where('estado', '!=', 'entregado')
                ->where('estado', '!=', 'cancelado')
                ->findOrFail($id);
            
            $estadoAnterior = $pedido->estado;
            $pedido->estado = 'cancelado';
            $pedido->save();
            
            Log::info('Pedido cancelado exitosamente por administrador', [
                'pedido_id' => $id,
                'admin_id' => $user->id,
                'estado_anterior' => $estadoAnterior,
                'numero_seguimiento' => $pedido->numero_seguimiento
            ]);
            
            return response()->json([
                'message' => 'Pedido cancelado correctamente',
                'pedido' => $this->transformarPedidoConSnapshots($pedido)
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error al cancelar pedido (admin)', [
                'pedido_id' => $id,
                'admin_id' => $user->id ?? 'unknown',
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'message' => 'Error interno al cancelar el pedido',
                'error' => config('app.debug') ? $e->getMessage() : 'Error interno del servidor'
            ], 500);
        }
    }
}