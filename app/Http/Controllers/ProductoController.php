<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Producto;
use App\Models\Categoria;
use App\Models\DetallePedido;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class ProductoController extends Controller
{
    /**
     * Devuelve todos los productos
     */
    public function index(Request $request)
    {
        $query = Producto::with(['categoria', 'imagenProductos']);
        
        // Filtrar por categoría si se proporciona
        if ($request->has('categoria_id')) {
            if ($request->categoria_id === 'sin_categoria') {
                $query->whereNull('categoria_id');
            } else {
                $query->where('categoria_id', $request->categoria_id);
            }
        }
        
        // Filtrar por nombre si se proporciona
        if ($request->has('nombre')) {
            $query->where('nombre', 'like', '%' . $request->nombre . '%');
        }
        
        // Paginación
        $perPage = $request->per_page ?? 12; // Por defecto 12 productos por página
        $productos = $query->paginate($perPage);
        
        // Transformar datos
        $productosData = $productos->map(function($producto) {
            return [
                'id' => $producto->id,
                'nombre' => $producto->nombre,
                'descripcion' => $producto->descripcion,
                'precio' => $producto->precio,
                'precio_original' => $producto->precio_original,
                'porcentaje_descuento' => $producto->porcentaje_descuento,
                'talla' => $producto->talla,
                'stock' => $producto->stock,
                'imagen_url' => $producto->imagenProductos ? $producto->imagenProductos->url : null,
                'imagen_alt' => $producto->imagenProductos ? $producto->imagenProductos->descripcion : $producto->nombre,
                'imagen_id' => $producto->imagen_id,
                'categoria_nombre' => $producto->categoria ? $producto->categoria->nombre : 'Sin categoría',
                'categoria_id' => $producto->categoria_id,
                'fecha_inicio_descuento' => $producto->fecha_inicio_descuento,
                'fecha_fin_descuento' => $producto->fecha_fin_descuento,
                'en_oferta' => $producto->en_oferta,
                'puede_eliminarse' => true,
            ];
        });

        return response()->json([
            'data' => $productosData,
            'pagination' => [
                'total' => $productos->total(),
                'per_page' => $productos->perPage(),
                'current_page' => $productos->currentPage(),
                'last_page' => $productos->lastPage()
            ]
        ]);
    }

    /**
     * Muestra los detalles de un producto específico
     */
    public function show($id)
    {
        $producto = Producto::with(['categoria', 'imagenProductos'])->findOrFail($id);
        
        // Transformar datos
        $productoData = [
            'id' => $producto->id,
            'nombre' => $producto->nombre,
            'descripcion' => $producto->descripcion,
            'precio' => $producto->precio,
            'precio_original' => $producto->precio_original,
            'porcentaje_descuento' => $producto->porcentaje_descuento,
            'talla' => $producto->talla,
            'stock' => $producto->stock,
            'imagen_url' => $producto->imagenProductos ? $producto->imagenProductos->url : null,
            'imagen_miniaturas' => $producto->imagenProductos ? [$producto->imagenProductos->url] : [], // Puedes expandir esto si tienes múltiples imágenes
            'imagen_alt' => $producto->imagenProductos ? $producto->imagenProductos->descripcion : $producto->nombre,
            'imagen_id' => $producto->imagen_id,
            'categoria_nombre' => $producto->categoria ? $producto->categoria->nombre : 'Sin categoría',
            'categoria_id' => $producto->categoria_id,
            'fecha_inicio_descuento' => $producto->fecha_inicio_descuento,
            'fecha_fin_descuento' => $producto->fecha_fin_descuento,
            'en_oferta' => $producto->en_oferta,
            'puede_eliminarse' => true,
        ];

        // Obtener productos relacionados de la misma categoría (si tiene categoría)
        $relacionados = collect([]);
        if ($producto->categoria_id) {
            $relacionados = Producto::with(['categoria', 'imagenProductos'])
                            ->where('categoria_id', $producto->categoria_id)
                            ->where('id', '!=', $producto->id)
                            ->inRandomOrder()
                            ->limit(4)
                            ->get()
                            ->map(function($producto) {
                                return [
                                    'id' => $producto->id,
                                    'nombre' => $producto->nombre,
                                    'precio' => $producto->precio,
                                    'precio_original' => $producto->precio_original,
                                    'imagen_url' => $producto->imagenProductos ? $producto->imagenProductos->url : null,
                                    'categoria_nombre' => $producto->categoria ? $producto->categoria->nombre : 'Sin categoría',
                                    'en_oferta' => $producto->en_oferta,
                                    'stock' => $producto->stock,
                                ];
                            });
        }
        
        return response()->json([
            'data' => $productoData,
            'relacionados' => $relacionados
        ]);
    }

    /**
     * Devuelve 4 productos aleatorios para mostrar como destacados
     */
    public function destacados()
    {
        $productos = Producto::with(['categoria', 'imagenProductos'])
                    ->inRandomOrder()
                    ->limit(4)
                    ->get()
                    ->map(function($producto) {
                        return [
                            'id' => $producto->id,
                            'nombre' => $producto->nombre,
                            'precio' => $producto->precio,
                            'precio_original' => $producto->precio_original,
                            'porcentaje_descuento' => $producto->porcentaje_descuento,
                            'imagen_url' => $producto->imagenProductos ? $producto->imagenProductos->url : null,
                            'imagen_alt' => $producto->imagenProductos ? $producto->imagenProductos->descripcion : $producto->nombre,
                            'categoria_nombre' => $producto->categoria ? $producto->categoria->nombre : 'Sin categoría',
                            'en_oferta' => $producto->en_oferta,
                            'stock' => $producto->stock,
                        ];
                    });

        return response()->json(['data' => $productos]);
    }

    /**
     * Devuelve los 4 productos más vendidos ordenados por cantidad total en pedidos.
     * Se obtienen primero los IDs en una subquery separada para evitar el conflicto
     * con ONLY_FULL_GROUP_BY de MySQL al hacer SELECT * con GROUP BY parcial.
     */
    public function masVendidos()
    {
        // Paso 1: IDs ordenados por ventas (solo agrupa por ID, sin SELECT *)
        $topIds = \DB::table('detalle_pedidos')
            ->select('producto_id')
            ->groupBy('producto_id')
            ->orderByRaw('SUM(cantidad) DESC')
            ->limit(4)
            ->pluck('producto_id');

        // Paso 2: si no hay pedidos todavía, devolver los más recientes como fallback
        if ($topIds->isEmpty()) {
            $topIds = Producto::latest()->limit(4)->pluck('id');
        }

        // Paso 3: cargar productos completos manteniendo el orden de ventas
        $productos = Producto::with(['categoria', 'imagenProductos'])
                    ->whereIn('id', $topIds)
                    ->get()
                    ->sortBy(fn($p) => $topIds->search($p->id))
                    ->values()
                    ->map(function($producto) {
                        return [
                            'id' => $producto->id,
                            'nombre' => $producto->nombre,
                            'precio' => $producto->precio,
                            'precio_original' => $producto->precio_original,
                            'porcentaje_descuento' => $producto->porcentaje_descuento,
                            'imagen_url' => $producto->imagenProductos ? $producto->imagenProductos->url : null,
                            'imagen_alt' => $producto->imagenProductos ? $producto->imagenProductos->descripcion : $producto->nombre,
                            'categoria_nombre' => $producto->categoria ? $producto->categoria->nombre : 'Sin categoría',
                            'en_oferta' => $producto->en_oferta,
                            'stock' => $producto->stock,
                        ];
                    });

        return response()->json(['data' => $productos]);
    }

    /**
     * Crea un nuevo producto
     */
    public function store(Request $request)
    {
        // Validar los datos de entrada
        $validator = Validator::make($request->all(), [
            'nombre' => 'required|string|max:255',
            'descripcion' => 'nullable|string',
            'precio' => 'required|numeric|min:0',
            'precio_original' => 'nullable|numeric|min:0',
            'porcentaje_descuento' => 'nullable|numeric|min:0|max:100',
            'fecha_inicio_descuento' => 'nullable|date',
            'fecha_fin_descuento' => 'nullable|date|after_or_equal:fecha_inicio_descuento',
            'talla' => 'nullable|string|max:50',
            'stock' => 'required|integer|min:0',
            'categoria_id' => 'nullable|exists:categorias,id', // Ahora puede ser null
            'imagen_id' => 'nullable|exists:imagenes,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()], 400);
        }

        // Preparar los datos para permitir valores nulos explícitos
        $data = $this->prepareData($request);

        // Crear el nuevo producto
        $producto = Producto::create($data);

        return response()->json([
            'message' => 'Producto creado correctamente',
            'data' => $producto
        ], 201);
    }

    /**
     * Actualiza un producto existente
     */
    public function update(Request $request, $id)
    {
        // Buscar el producto
        $producto = Producto::findOrFail($id);

        // Validar los datos de entrada
        $validator = Validator::make($request->all(), [
            'nombre' => 'sometimes|required|string|max:255',
            'descripcion' => 'nullable|string',
            'precio' => 'sometimes|required|numeric|min:0',
            'precio_original' => 'nullable|numeric|min:0',
            'porcentaje_descuento' => 'nullable|numeric|min:0|max:100',
            'fecha_inicio_descuento' => 'nullable|date',
            'fecha_fin_descuento' => 'nullable|date|after_or_equal:fecha_inicio_descuento',
            'talla' => 'nullable|string|max:50',
            'stock' => 'sometimes|required|integer|min:0',
            'categoria_id' => 'nullable|exists:categorias,id', // Ahora puede ser null
            'imagen_id' => 'nullable|exists:imagenes,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()], 400);
        }

        // Preparar los datos para permitir valores nulos explícitos
        $data = $this->prepareData($request);

        // Actualizar el producto
        $producto->update($data);

        return response()->json([
            'message' => 'Producto actualizado correctamente',
            'data' => $producto
        ]);
    }

    /**
     * Elimina un producto (soft delete si está en pedidos, hard delete si no)
     */
    public function destroy($id)
    {
        try {
            DB::beginTransaction();
            
            // Buscar el producto
            $producto = Producto::findOrFail($id);
            
            // Verificar si el producto está referenciado en algún pedido
            $enPedidos = DetallePedido::where('producto_id', $id)->exists();
            
            if ($enPedidos) {
                
                $producto->delete();
                
                $mensaje = 'Producto eliminado correctamente. Los pedidos existentes mantienen la información del producto.';
            } else {
                // Si no está en pedidos, eliminación directa
                $producto->delete();
                $mensaje = 'Producto eliminado correctamente.';
            }
            
            DB::commit();
            
            return response()->json([
                'message' => $mensaje,
                'eliminacion_segura' => $enPedidos
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'error' => 'Error al eliminar el producto: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Verifica si un producto puede eliminarse de forma segura
     */
    public function verificarEliminacion($id)
    {
        $producto = Producto::findOrFail($id);
        $enPedidos = DetallePedido::where('producto_id', $id)->exists();
        
        return response()->json([
            'puede_eliminarse' => true, // Siempre puede eliminarse gracias a los snapshots
            'en_pedidos' => $enPedidos,
            'mensaje' => $enPedidos 
                ? 'El producto está en pedidos existentes, pero puede eliminarse de forma segura. Los pedidos mantendrán la información del producto.'
                : 'El producto puede eliminarse sin problemas.'
        ]);
    }

    /**
     * Obtiene productos sin categoría
     */
    public function sinCategoria(Request $request)
    {
        $query = Producto::with(['imagenProductos'])->whereNull('categoria_id');
        
        // Paginación
        $perPage = $request->per_page ?? 12;
        $productos = $query->paginate($perPage);
        
        // Transformar datos
        $productosData = $productos->map(function($producto) {
            return [
                'id' => $producto->id,
                'nombre' => $producto->nombre,
                'descripcion' => $producto->descripcion,
                'precio' => $producto->precio,
                'precio_original' => $producto->precio_original,
                'porcentaje_descuento' => $producto->porcentaje_descuento,
                'talla' => $producto->talla,
                'stock' => $producto->stock,
                'imagen_url' => $producto->imagenProductos ? $producto->imagenProductos->url : null,
                'imagen_alt' => $producto->imagenProductos ? $producto->imagenProductos->descripcion : $producto->nombre,
                'imagen_id' => $producto->imagen_id,
                'categoria_nombre' => 'Sin categoría',
                'categoria_id' => null,
                'fecha_inicio_descuento' => $producto->fecha_inicio_descuento,
                'fecha_fin_descuento' => $producto->fecha_fin_descuento,
                'en_oferta' => $producto->en_oferta,
                'puede_eliminarse' => true,
            ];
        });

        return response()->json([
            'data' => $productosData,
            'pagination' => [
                'total' => $productos->total(),
                'per_page' => $productos->perPage(),
                'current_page' => $productos->currentPage(),
                'last_page' => $productos->lastPage()
            ]
        ]);
    }

    /**
     * Prepara los datos para permitir valores nulos
     */
    private function prepareData(Request $request)
    {
        $data = $request->all();

        // Procesar campos que podrían ser null 
        $nullableFields = [
            'descripcion', 'precio_original', 'porcentaje_descuento', 
            'fecha_inicio_descuento', 'fecha_fin_descuento', 'talla', 
            'imagen_id', 'categoria_id' // Agregamos categoria_id a los campos nullable
        ];

        foreach ($nullableFields as $field) {
            // Si el campo está presente en la solicitud y es una cadena vacía o "null", establecerlo a null
            if (array_key_exists($field, $data) && ($data[$field] === '' || $data[$field] === 'null')) {
                $data[$field] = null;
            }
        }

        return $data;
    }
}