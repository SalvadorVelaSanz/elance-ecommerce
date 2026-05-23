<?php

use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\ImagenesController;
use App\Http\Controllers\ProductoController;
use App\Http\Controllers\CategoriaController;
use App\Http\Controllers\ResenaController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\FavoritoController;
use App\Http\Controllers\DireccionController;
use App\Http\Controllers\PedidosController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\CarritoController;
use App\Http\Controllers\CheckoutController;
use Illuminate\Support\Facades\Route;

// Rutas de autenticación
Route::post('/login', [AuthController::class, 'login']);
Route::middleware('auth:sanctum')->get('/user', [AuthController::class, 'user']);
Route::middleware('auth:sanctum')->post('/logout', [AuthController::class, 'logout']);
Route::post('/register', [AuthController::class, 'register']);

Route::get('/email/verify/{id}/{hash}', [AuthController::class, 'verifyEmail'])
    ->middleware(['signed', 'throttle:6,1'])
    ->name('verification.verify');

Route::post('/email/verification-notification', [AuthController::class, 'resendVerificationEmail'])
    ->middleware(['throttle:6,1'])
    ->name('verification.send');

Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])
    ->middleware(['throttle:6,1'])
    ->name('password.forgot');
    
// Rutas públicas para productos (lectura)
Route::get('/productos', [ProductoController::class, 'index']);
Route::get('/productos/destacados', [ProductoController::class, 'destacados']);
Route::get('/productos/mas-vendidos', [ProductoController::class, 'masVendidos']);
Route::get('/producto/{id}', [ProductoController::class, 'show']);
Route::get('/productos/sin-categoria', [ProductoController::class, 'sinCategoria']);

// Rutas para categorías - PÚBLICAS (lectura)
Route::get('/categorias', [CategoriaController::class, 'index']);
Route::get('/categorias/todas', [CategoriaController::class, 'todas']);

// Rutas para reseñas - PÚBLICAS (lectura)
Route::get('/resenas/producto/{producto_id}', [ResenaController::class, 'getByProducto']);

// Rutas para formulario de contacto - PÚBLICA
Route::post('/contact', [ContactController::class, 'sendMessage']);

// Rutas protegidas por autenticación (para usuarios normales)
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/resenas/check/{producto_id}', [ResenaController::class, 'checkUserResena']);
    Route::post('/resenas', [ResenaController::class, 'store']);
    Route::put('/resenas/{id}', [ResenaController::class, 'update']);
    Route::delete('/resenas/{id}', [ResenaController::class, 'destroy']);
    
    // Rutas de perfil
    Route::get('/profile', [ProfileController::class, 'getUserProfile']);
    Route::put('/profile', [ProfileController::class, 'updateProfile']);
    
    // Rutas de favoritos
    Route::get('/favorites', [FavoritoController::class, 'getFavorites']);
    Route::post('/favorites', [FavoritoController::class, 'addFavorite']);
    Route::delete('/favorites/{id}', [FavoritoController::class, 'removeFavorite']);
    Route::get('/favorites/check/{productId}', [FavoritoController::class, 'checkFavorite']);
    Route::post('/favorites/sync', [FavoritoController::class, 'syncFavorites']);

    // Rutas de direcciones 
    Route::get('/direcciones', [DireccionController::class, 'index']);
    Route::post('/direcciones', [DireccionController::class, 'store']);
    Route::get('/direcciones/{id}', [DireccionController::class, 'show']);
    Route::put('/direcciones/{id}', [DireccionController::class, 'update']);
    Route::delete('/direcciones/{id}', [DireccionController::class, 'destroy']);
    Route::put('/direcciones/{id}/set-principal', [DireccionController::class, 'setPrincipal']);

    // Rutas para pedidos (usuarios normales)
    Route::get('/pedidos', [PedidosController::class, 'index']);
    Route::get('/pedidos/{id}', [PedidosController::class, 'show']);
    Route::put('/pedidos/{id}/cancelar', [PedidosController::class, 'cancelarUsuario']); // CAMBIADO EL MÉTODO
    
    // Ruta para cambiar contraseña
    Route::post('/change-password', [AuthController::class, 'changePassword']);

    // Rutas para el carrito
    Route::get('/carrito/check', [CarritoController::class, 'checkCart']);
    Route::get('/carrito', [CarritoController::class, 'getCart']);
    Route::post('/carrito', [CarritoController::class, 'addToCart']);
    Route::put('/carrito/{id}', [CarritoController::class, 'updateCartItem']);
    Route::delete('/carrito/all', [CarritoController::class, 'clearCart']);
    Route::delete('/carrito/{id}', [CarritoController::class, 'removeFromCart']);
    Route::get('/carrito/summary', [CarritoController::class, 'getCartSummary']);
    
    // Rutas de checkout
    Route::post('/checkout/pedido', [CheckoutController::class, 'crearPedido']);
    Route::get('/checkout/totales', [CheckoutController::class, 'calcularTotales']);
    Route::get('/checkout/envio/{direccion_id}', [CheckoutController::class, 'obtenerInfoEnvio']);
});

// Rutas protegidas solo para administradores
Route::middleware(['auth:sanctum', 'admin'])->group(function () {
    // Rutas de administración de productos (crear, actualizar, eliminar)
    Route::post('/productos', [ProductoController::class, 'store']);
    Route::put('/productos/{id}', [ProductoController::class, 'update']);
    Route::delete('/productos/{id}', [ProductoController::class, 'destroy']);

    // Rutas de administración de imágenes
    Route::get('/imagenes', [ImagenesController::class, 'index']);
    Route::get('/imagenes/{id}', [ImagenesController::class, 'show']); 
    Route::post('/imagenes', [ImagenesController::class, 'store']);
    Route::put('/imagenes/{id}', [ImagenesController::class, 'update']);
    Route::delete('/imagenes/{id}', [ImagenesController::class, 'destroy']);

    
    // Rutas de administración de categorías - SOLO PARA ADMINISTRADORES
    Route::post('/categorias', [CategoriaController::class, 'store']);
    Route::put('/categorias/{id}', [CategoriaController::class, 'update']);
    Route::delete('/categorias/{id}', [CategoriaController::class, 'destroy']);
    
    // Rutas de administración de pedidos (solo para administradores) 
    Route::get('/admin/pedidos', [PedidosController::class, 'getAllPedidos']);
    Route::put('/admin/pedidos/{id}/estado', [PedidosController::class, 'actualizarEstado']); 
    Route::put('/admin/pedidos/{id}/seguimiento', [PedidosController::class, 'actualizarSeguimiento']);
    Route::put('/admin/pedidos/{id}/cancelar', [PedidosController::class, 'cancelarAdmin']);

    // Rutas de gestión de usuarios
    Route::get('/admin/users', [ProfileController::class, 'getAllUsers']);
    Route::put('/admin/users/{id}/toggle-suspension', [ProfileController::class, 'toggleSuspension']);
    Route::delete('/admin/users/{id}', [ProfileController::class, 'deleteUser']);

    Route::get('/admin/resenas', [ResenaController::class, 'getAllResenas']);
    Route::delete('/admin/resenas/{id}', [ResenaController::class, 'destroyByAdmin']);
});