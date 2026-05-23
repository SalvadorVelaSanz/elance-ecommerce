<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Favorito;
use App\Models\Producto;
use Illuminate\Support\Facades\Log;

class FavoritoController extends Controller
{
    /**
     * Obtener favoritos del usuario autenticado
     */
    public function getFavorites(Request $request)
    {
        try {
            $user = $request->user();
            
            if (!$user) {
                return response()->json(['error' => 'Usuario no autenticado'], 401);
            }
            
            $favorites = Favorito::where('user_id', $user->id)
                ->with(['producto', 'producto.categoria'])
                ->get()
                ->map(function($favorite) {
                    $producto = $favorite->producto;
                    return [
                        'id' => $favorite->id,
                        'producto_id' => $producto->id,
                        'name' => $producto->nombre,
                        'price' => number_format($producto->precio, 2, '.', '') . ' €',
                        'raw_price' => $producto->precio,
                        'precio_original' => $producto->precio_original,
                        'en_oferta' => $producto->en_oferta,
                        'image' => $producto->imagen_principal,
                        'category' => $producto->categoria->nombre ?? 'Sin categoría',
                        'stock' => $producto->stock,
                        'slug' => $producto->slug
                    ];
                });
            
            return response()->json($favorites);
        } catch (\Exception $e) {
            Log::error('Error en getFavorites: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
    
    /**
     * Eliminar un producto de favoritos
     */
    public function removeFavorite(Request $request, $id)
    {
        try {
            $user = $request->user();
            
            if (!$user) {
                return response()->json(['error' => 'Usuario no autenticado'], 401);
            }
            
            $favorite = Favorito::where('id', $id)
                ->where('user_id', $user->id)
                ->first();
                
            if (!$favorite) {
                return response()->json(['error' => 'Favorito no encontrado'], 404);
            }
            
            $favorite->delete();
            
            return response()->json([
                'success' => true,
                'message' => 'Producto eliminado de favoritos'
            ]);
        } catch (\Exception $e) {
            Log::error('Error en removeFavorite: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
    
    /**
     * Añadir un producto a favoritos
     */
    public function addFavorite(Request $request)
    {
        try {
            $request->validate([
                'producto_id' => 'required|exists:productos,id'
            ]);
            
            $user = $request->user();
            
            if (!$user) {
                return response()->json(['error' => 'Usuario no autenticado'], 401);
            }
            
            $productoId = $request->input('producto_id');
            
            $producto = Producto::with(['categoria'])->find($productoId);
            if (!$producto) {
                return response()->json(['error' => 'Producto no encontrado'], 404);
            }
            
            // Verificar si el producto ya está en favoritos
            $existingFavorite = Favorito::where('user_id', $user->id)
                ->where('producto_id', $productoId)
                ->first();
                
            if ($existingFavorite) {
                return response()->json([
                    'success' => false,
                    'message' => 'El producto ya está en favoritos',
                    'exists' => true
                ], 200); // Cambio a 200 en lugar de error para mejor manejo
            }
            
            // Crear nuevo favorito
            $favorito = new Favorito();
            $favorito->user_id = $user->id;
            $favorito->producto_id = $productoId;
            $favorito->save();
            
            return response()->json([
                'success' => true,
                'message' => 'Producto añadido a favoritos',
                'favorite' => [
                    'id' => $favorito->id,
                    'producto_id' => $producto->id,
                    'name' => $producto->nombre,
                    'price' => number_format($producto->precio, 2, '.', '') . ' €',
                    'raw_price' => $producto->precio,
                    'precio_original' => $producto->precio_original,
                    'en_oferta' => $producto->en_oferta,
                    'image' => $producto->imagen_principal,
                    'category' => $producto->categoria->nombre ?? 'Sin categoría',
                    'stock' => $producto->stock,
                    'slug' => $producto->slug
                ]
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error en addFavorite: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
    
    /**
     * Verificar si un producto está en favoritos
     */
    public function checkFavorite(Request $request, $productId)
    {
        try {
            $user = $request->user();
            
            if (!$user) {
                return response()->json(['error' => 'Usuario no autenticado'], 401);
            }
            
            $isFavorite = Favorito::where('user_id', $user->id)
                ->where('producto_id', $productId)
                ->exists();
            
            return response()->json(['isFavorite' => $isFavorite]);
        } catch (\Exception $e) {
            Log::error('Error en checkFavorite: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
    
    /**
     * Sincronizar favoritos desde localStorage (usado después del login)
     */
    public function syncFavorites(Request $request)
    {
        try {
            $request->validate([
                'favorites' => 'required|array',
                'favorites.*.producto_id' => 'required|exists:productos,id'
            ]);
            
            $user = $request->user();
            
            if (!$user) {
                return response()->json(['error' => 'Usuario no autenticado'], 401);
            }
            
            $localFavorites = $request->input('favorites');
            $productoIds = array_column($localFavorites, 'producto_id');

            // Una sola query para obtener todos los favoritos existentes del usuario
            $existingIds = Favorito::where('user_id', $user->id)
                ->whereIn('producto_id', $productoIds)
                ->pluck('producto_id')
                ->toArray();

            $syncedCount = 0;
            $alreadyExistsCount = 0;
            $errors = [];

            foreach ($localFavorites as $localFavorite) {
                $productoId = $localFavorite['producto_id'];

                if (in_array($productoId, $existingIds)) {
                    $alreadyExistsCount++;
                } else {
                    try {
                        $favorito = new Favorito();
                        $favorito->user_id = $user->id;
                        $favorito->producto_id = $productoId;
                        $favorito->save();
                        $syncedCount++;
                        $existingIds[] = $productoId; // evitar duplicados en el mismo lote
                    } catch (\Exception $e) {
                        $errors[] = "Error con producto {$productoId}: " . $e->getMessage();
                    }
                }
            }
            
            return response()->json([
                'success' => true,
                'message' => 'Favoritos sincronizados correctamente',
                'synced_count' => $syncedCount,
                'already_exists_count' => $alreadyExistsCount,
                'errors' => $errors
            ]);
        } catch (\Exception $e) {
            Log::error('Error en syncFavorites: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
    
}