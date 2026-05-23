<?php

namespace App\Http\Controllers;

use App\Models\Resena;
use App\Models\Producto;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ResenaController extends Controller
{
    /**
     * Obtener todas las reseñas de un producto específico
     */
    public function getByProducto(int $producto_id)
    {
        $resenas = Resena::with('user')
            ->where('producto_id', $producto_id)
            ->orderBy('fecha_resena', 'desc')
            ->get();
        return response()->json([
            'success' => true,
            'data' => $resenas
        ]);
    }

    /**
     * Verificar si el usuario actual ya tiene una reseña para este producto
     */
    public function checkUserResena(int $producto_id)
    {
        $user_id = Auth::id();
        
        if (!$user_id) {
            return response()->json([
                'success' => false,
                'message' => 'Usuario no autenticado'
            ], 401);
        }
        
        $resena = Resena::where('producto_id', $producto_id)
            ->where('user_id', $user_id)
            ->first();
        
        return response()->json([
            'success' => true,
            'hasReview' => $resena ? true : false,
            'data' => $resena
        ]);
    }
    
    /**
     * Almacenar una nueva reseña
     */
    public function store(Request $request)
    {
        // Validar la solicitud
        $request->validate([
            'producto_id' => 'required|exists:productos,id',
            'puntuacion' => 'required|integer|min:1|max:5',
            'comentario' => 'required|string|max:1000',
        ]);
        
        $user_id = Auth::id();
        
        if (!$user_id) {
            return response()->json([
                'success' => false,
                'message' => 'Usuario no autenticado'
            ], 401);
        }
        
        // Verificar si el usuario ya tiene una reseña para este producto
        $existingResena = Resena::where('producto_id', $request->producto_id)
            ->where('user_id', $user_id)
            ->first();
        
        if ($existingResena) {
            return response()->json([
                'success' => false,
                'message' => 'Ya has publicado una reseña para este producto'
            ], 422);
        }
        
        // Crear una nueva reseña
        $resena = new Resena();
        $resena->producto_id = $request->producto_id;
        $resena->user_id = $user_id;
        $resena->puntuacion = $request->puntuacion;
        $resena->comentario = $request->comentario;
        $resena->fecha_resena = now();
        $resena->save();
        
        // Cargar la relación del usuario para la respuesta
        $resena->load('user');
        
        return response()->json([
            'success' => true,
            'message' => 'Reseña publicada con éxito',
            'data' => $resena
        ], 201);
    }
    
    /**
     * Actualizar una reseña existente
     */
    public function update(Request $request, $id)
    {
        // Validar la solicitud
        $request->validate([
            'puntuacion' => 'required|integer|min:1|max:5',
            'comentario' => 'required|string|max:1000',
        ]);
        
        $user_id = Auth::id();
        
        if (!$user_id) {
            return response()->json([
                'success' => false,
                'message' => 'Usuario no autenticado'
            ], 401);
        }
        
        // Encontrar la reseña
        $resena = Resena::where('id', $id)
            ->where('user_id', $user_id)
            ->first();
        
        if (!$resena) {
            return response()->json([
                'success' => false,
                'message' => 'Reseña no encontrada o no tienes permiso para editarla'
            ], 404);
        }
        
        // Actualizar la reseña
        $resena->puntuacion = $request->puntuacion;
        $resena->comentario = $request->comentario;
        $resena->save();
        
        // Cargar la relación del usuario para la respuesta
        $resena->load('user');
        
        return response()->json([
            'success' => true,
            'message' => 'Reseña actualizada con éxito',
            'data' => $resena
        ]);
    }
    
    /**
     * Eliminar una reseña existente
     */
    public function destroy($id)
    {
        $user_id = Auth::id();
        
        if (!$user_id) {
            return response()->json([
                'success' => false,
                'message' => 'Usuario no autenticado'
            ], 401);
        }
        
        // Encontrar la reseña asegurándose de que pertenece al usuario actual
        $resena = Resena::where('id', $id)
            ->where('user_id', $user_id)
            ->first();
        
        if (!$resena) {
            return response()->json([
                'success' => false,
                'message' => 'Reseña no encontrada o no tienes permiso para eliminarla'
            ], 404);
        }
        
        // Eliminar la reseña
        $resena->delete();
        
        return response()->json([
            'success' => true,
            'message' => 'Reseña eliminada con éxito'
        ]);
    }

    /**
     * Obtener todas las reseñas para administradores
     */
    public function getAllResenas(Request $request)
    {
        // Verificar que el usuario sea administrador se hace en el middleware
        
        $query = Resena::with(['user', 'producto']);
        
        // Filtros opcionales
        if ($request->has('producto_id')) {
            $query->where('producto_id', $request->producto_id);
        }
        
        if ($request->has('puntuacion')) {
            $query->where('puntuacion', $request->puntuacion);
        }
        
        // Paginación
        $perPage = $request->per_page ?? 15; // 15 reseñas por página
        $resenas = $query->orderBy('fecha_resena', 'desc')->paginate($perPage);
        
        return response()->json([
            'success' => true,
            'data' => $resenas->items(),
            'pagination' => [
                'total' => $resenas->total(),
                'per_page' => $resenas->perPage(),
                'current_page' => $resenas->currentPage(),
                'last_page' => $resenas->lastPage()
            ]
        ]);
    }

    /**
     * Eliminar cualquier reseña (solo para administradores)
     */
    public function destroyByAdmin($id)
    {
        // Buscar la reseña
        $resena = Resena::findOrFail($id);
        
        // Eliminar la reseña
        $resena->delete();
        
        return response()->json([
            'success' => true,
            'message' => 'Reseña eliminada con éxito'
        ]);
    }
}