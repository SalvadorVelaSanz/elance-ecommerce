<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Carrito;
use App\Models\Producto;
use Illuminate\Support\Facades\Log;

class CarritoController extends Controller
{
    /**
     * Verificar si el usuario tiene productos en el carrito
     */
    public function checkCart(Request $request)
    {
        try {
            $user = $request->user();
            
            if (!$user) {
                return response()->json(['error' => 'Usuario no autenticado'], 401);
            }
            
            $hasItems = Carrito::where('user_id', $user->id)
                ->where('cantidad', '>', 0)
                ->exists();
            
            return response()->json(['hasItems' => $hasItems]);
        } catch (\Exception $e) {
            Log::error('Error en checkCart: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Obtener el carrito del usuario autenticado
     */
    public function getCart(Request $request)
    {
        try {
            $user = $request->user();
            
            if (!$user) {
                return response()->json(['error' => 'Usuario no autenticado'], 401);
            }
            
            $cartItems = Carrito::where('user_id', $user->id)
                ->with(['producto', 'producto.imagenProductos', 'producto.categoria'])
                ->get();

            if ($cartItems->isEmpty()) {
                return response()->json([]);
            }

            $cartItems = $cartItems->map(function($item) {
                    $producto = $item->producto;
                    return [
                        'id' => $item->id,
                        'producto_id' => $producto->id,
                        'cantidad' => $item->cantidad,
                        'producto_nombre' => $producto->nombre,
                        'precio' => $producto->precio,
                        'precio_original' => $producto->precio_original,
                        'en_oferta' => $producto->en_oferta,
                        'imagen_url' => $producto->imagenProductos ? $producto->imagenProductos->url : null,
                        'imagen_alt' => $producto->imagenProductos ? $producto->imagenProductos->descripcion : $producto->nombre,
                        'categoria_nombre' => $producto->categoria ? $producto->categoria->nombre : 'Sin categoría',
                        'stock' => $producto->stock,
                        'subtotal' => number_format($producto->precio * $item->cantidad, 2, '.', '')
                    ];
                });
            
            return response()->json($cartItems);
        } catch (\Exception $e) {
            Log::error('Error en getCart: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
    
    /**
     * Añadir un producto al carrito
     */
    public function addToCart(Request $request)
    {
        try {
            $request->validate([
                'producto_id' => 'required|exists:productos,id',
                'cantidad' => 'required|integer|min:1'
            ]);
            
            $user = $request->user();
            
            if (!$user) {
                return response()->json(['error' => 'Usuario no autenticado'], 401);
            }
            
            $productoId = $request->input('producto_id');
            $cantidad = $request->input('cantidad');
            
            $producto = Producto::with(['imagenProductos', 'categoria'])->find($productoId);
            if (!$producto) {
                return response()->json(['error' => 'Producto no encontrado'], 404);
            }

            // Verificar si hay stock disponible
            if ($producto->stock <= 0) {
                return response()->json([
                    'success' => false,
                    'error' => 'El producto no tiene stock disponible'
                ], 422);
            }

            // Verificar si el producto ya está en el carrito
            $existingItem = Carrito::where('user_id', $user->id)
                ->where('producto_id', $productoId)
                ->first();

            if ($existingItem) {
                // Comprobar que la nueva cantidad total no supere el stock
                $nuevaCantidad = $existingItem->cantidad + $cantidad;
                if ($nuevaCantidad > $producto->stock) {
                    return response()->json([
                        'success' => false,
                        'error' => 'No hay suficiente stock. Stock disponible: ' . $producto->stock
                    ], 422);
                }
                $existingItem->cantidad = $nuevaCantidad;
                $existingItem->save();
                
                return response()->json([
                    'success' => true,
                    'message' => 'Cantidad actualizada en el carrito',
                    'item' => [
                        'id' => $existingItem->id,
                        'producto_id' => $producto->id,
                        'cantidad' => $existingItem->cantidad,
                        'producto_nombre' => $producto->nombre,
                        'precio' => $producto->precio,
                        'precio_original' => $producto->precio_original,
                        'en_oferta' => $producto->en_oferta,
                        'imagen_url' => $producto->imagenProductos ? $producto->imagenProductos->url : null,
                        'imagen_alt' => $producto->imagenProductos ? $producto->imagenProductos->descripcion : $producto->nombre
                    ]
                ]);
            } else {
                // Verificar que la cantidad solicitada no supere el stock
                if ($cantidad > $producto->stock) {
                    return response()->json([
                        'success' => false,
                        'error' => 'No hay suficiente stock. Stock disponible: ' . $producto->stock
                    ], 422);
                }
                // Añadir nuevo producto al carrito
                $cartItem = new Carrito();
                $cartItem->user_id = $user->id;
                $cartItem->producto_id = $productoId;
                $cartItem->cantidad = $cantidad;
                $cartItem->save();
                
                return response()->json([
                    'success' => true,
                    'message' => 'Producto añadido al carrito',
                    'item' => [
                        'id' => $cartItem->id,
                        'producto_id' => $producto->id,
                        'cantidad' => $cartItem->cantidad,
                        'producto_nombre' => $producto->nombre,
                        'precio' => $producto->precio,
                        'precio_original' => $producto->precio_original,
                        'en_oferta' => $producto->en_oferta,
                        'imagen_url' => $producto->imagenProductos ? $producto->imagenProductos->url : null,
                        'imagen_alt' => $producto->imagenProductos ? $producto->imagenProductos->descripcion : $producto->nombre
                    ]
                ], 201);
            }
        } catch (\Exception $e) {
            Log::error('Error en addToCart: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
    
    /**
     * Actualizar la cantidad de un producto en el carrito
     */
    public function updateCartItem(Request $request, $id)
    {
        try {
            $request->validate([
                'cantidad' => 'required|integer|min:1'
            ]);
            
            $user = $request->user();
            
            if (!$user) {
                return response()->json(['error' => 'Usuario no autenticado'], 401);
            }
            
            $cantidad = $request->input('cantidad');
            
            $cartItem = Carrito::where('user_id', $user->id)
                ->where('producto_id', $id)
                ->first();
                
            if (!$cartItem) {
                return response()->json(['error' => 'Producto no encontrado en el carrito'], 404);
            }
            
            $cartItem->cantidad = $cantidad;
            $cartItem->save();
            
            return response()->json([
                'success' => true,
                'message' => 'Cantidad actualizada correctamente'
            ]);
        } catch (\Exception $e) {
            Log::error('Error en updateCartItem: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
    
    /**
     * Eliminar un producto del carrito
     */
    public function removeFromCart(Request $request, $id)
    {
        try {
            $user = $request->user();
            
            if (!$user) {
                return response()->json(['error' => 'Usuario no autenticado'], 401);
            }
            
            $cartItem = Carrito::where('user_id', $user->id)
                ->where('producto_id', $id)
                ->first();
                
            if (!$cartItem) {
                return response()->json(['error' => 'Producto no encontrado en el carrito'], 404);
            }
            
            $cartItem->delete();
            
            return response()->json([
                'success' => true,
                'message' => 'Producto eliminado del carrito'
            ]);
        } catch (\Exception $e) {
            Log::error('Error en removeFromCart: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
    
    /**
     * Vaciar todo el carrito
     */
    public function clearCart(Request $request)
    {
        try {
            $user = $request->user();
            
            if (!$user) {
                return response()->json(['error' => 'Usuario no autenticado'], 401);
            }
            
            Carrito::where('user_id', $user->id)->delete();
            
            return response()->json([
                'success' => true,
                'message' => 'Carrito vaciado correctamente'
            ]);
        } catch (\Exception $e) {
            Log::error('Error en clearCart: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
    
    /**
     * Obtener resumen del carrito (totales)
     */
    public function getCartSummary(Request $request)
    {
        try {
            $user = $request->user();
            
            if (!$user) {
                return response()->json(['error' => 'Usuario no autenticado'], 401);
            }
            
            $cartItems = Carrito::where('user_id', $user->id)
                ->with('producto')
                ->get();
                
            $subtotal = 0;
            $itemCount = 0;
            
            foreach ($cartItems as $item) {
                $subtotal += $item->producto->precio * $item->cantidad;
                $itemCount += $item->cantidad;
            }
            
            $shipping = $itemCount > 0 ? 2.00 : 0;
            $vat = $subtotal * config('tienda.iva_rate');
            $total = $subtotal + $shipping + $vat;
            
            return response()->json([
                'success' => true,
                'summary' => [
                    'item_count' => $itemCount,
                    'subtotal' => number_format($subtotal, 2, '.', ''),
                    'shipping' => number_format($shipping, 2, '.', ''),
                    'vat' => number_format($vat, 2, '.', ''),
                    'total' => number_format($total, 2, '.', '')
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error en getCartSummary: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
    
}