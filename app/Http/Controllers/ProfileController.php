<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use App\Models\Favorito;
use App\Models\Resena;
use App\Models\DetallePedido;
use App\Models\Pedido;
use App\Models\Direccion;
use Laravel\Sanctum\PersonalAccessToken;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ProfileController extends Controller
{
    /**
     * Obtener datos del perfil del usuario autenticado
     */
    public function getUserProfile(Request $request)
    {
        // Obtener el usuario autenticado
        $user = $request->user();
        
        // Devolver solo los campos necesarios para el perfil
        return response()->json([
            'name' => $user->name,
            'apellidos' => $user->apellidos,
            'email' => $user->email,
            'telefono' => $user->telefono,
            'email_verified' => !is_null($user->email_verified_at),
        ]);
    }
    
    /**
     * Actualizar el perfil del usuario
     */
    public function updateProfile(Request $request)
    {
        // Validar los datos de entrada
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'apellidos' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $request->user()->id,
            'telefono' => 'nullable|string|max:20',
        ]);
        
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        // Obtener el usuario autenticado
        $user = $request->user();
        
        // Verificar si el email ha cambiado
        $emailChanged = $user->email !== $request->email;
        
        // Actualizar datos
        $user->name = $request->name;
        $user->apellidos = $request->apellidos;
        $user->email = $request->email;
        $user->telefono = $request->telefono;
        
        // Si el email cambió, marcar como no verificado y enviar email de verificación
        if ($emailChanged) {
            $user->email_verified_at = null;
            $user->save();
            
            // Enviar el email de verificación
            $user->sendEmailVerificationNotification();
            
            return response()->json([
                'message' => 'Perfil actualizado con éxito. Hemos enviado un correo de verificación a tu nueva dirección de email.',
                'email_changed' => true,
                'user' => [
                    'name' => $user->name,
                    'apellidos' => $user->apellidos,
                    'email' => $user->email,
                    'telefono' => $user->telefono,
                ],
                'email_verified' => false
            ]);
        } else {
            $user->save();
            
            return response()->json([
                'message' => 'Perfil actualizado con éxito',
                'email_changed' => false,
                'user' => [
                    'name' => $user->name,
                    'apellidos' => $user->apellidos,
                    'email' => $user->email,
                    'telefono' => $user->telefono,
                ],
                'email_verified' => !is_null($user->email_verified_at)
            ]);
        }
    }

    /**
     * Obtener todos los usuarios para administradores.
     */
    public function getAllUsers(Request $request)
    {
        // Este método solo debe ser accesible por administradores via middleware
        $perPage = $request->get('per_page', 15);
        $page = $request->get('page', 1);
        
        $query = User::orderBy('created_at', 'desc');
        
        // Filtrar por búsqueda si se proporciona
        if ($request->has('search') && $request->get('search')) {
            $search = $request->get('search');
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('apellidos', 'like', "%{$search}%");
            });
        }
        
        // Filtrar por tipo de usuario si se proporciona 
        if ($request->has('is_admin') && $request->get('is_admin') !== '') {
            $query->where('is_admin', $request->get('is_admin') === '1');
        }
        
        // Filtrar por estado de suspensión si se proporciona
        if ($request->has('suspended') && $request->get('suspended') !== '') {
            $query->where('is_suspended', $request->get('suspended') === '1');
        }
        
        $users = $query->paginate($perPage, ['*'], 'page', $page);
        
        return response()->json([
            'data' => $users->items(),
            'pagination' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
                'first_page_url' => $users->url(1),
                'last_page_url' => $users->url($users->lastPage()),
                'next_page_url' => $users->nextPageUrl(),
                'prev_page_url' => $users->previousPageUrl(),
            ]
        ]);
    }

    /**
     * Suspender/Reactivar usuario (SOLO PARA ADMINISTRADORES).
     */
    public function toggleSuspension(Request $request, $id)
    {
        $user = User::findOrFail($id);
        // No permitir suspender a administradores
        if ($user->is_admin) {
            return response()->json(['error' => 'No se puede suspender a un administrador'], 400);
        }

        // Toggle suspensión
        $user->is_suspended = !$user->is_suspended;
        $user->save();

        return response()->json([
            'message' => $user->is_suspended ? 'Usuario suspendido exitosamente' : 'Usuario reactivado exitosamente',
            'user' => $user
        ]);
    }

    /**
     * Eliminar usuario (SOLO PARA ADMINISTRADORES).
     */
    public function deleteUser(Request $request, $id)
    {
        $user = User::findOrFail($id);
        
        if ($user->is_admin) {
            return response()->json(['error' => 'No se puede eliminar a un administrador'], 400);
        }

        // Usar una transacción para verificar que todo se elimina correctamente
        DB::beginTransaction();

        try {
            // 1. Eliminar detalles de pedidos primero (por la clave foránea)
            $pedidoIds = Pedido::where('user_id', $id)->pluck('id');
            if ($pedidoIds->isNotEmpty()) {
                DetallePedido::whereIn('pedido_id', $pedidoIds)->delete();
                Pedido::where('user_id', $id)->delete();
            }
            
            // 2. Eliminar reseñas del usuario
            Resena::where('user_id', $id)->delete();
            
            // 3. Eliminar favoritos del usuario
            Favorito::where('user_id', $id)->delete();
            
            // 4. Eliminar direcciones del usuario
            Direccion::where('user_id', $id)->delete();
            
            // 5. Finalmente, eliminar el usuario
            $user->delete();

            // Confirmar la transacción
            DB::commit();

            Log::info("Usuario eliminado exitosamente: ID {$id}");

            return response()->json(['message' => 'Usuario eliminado exitosamente']);

        } catch (\Exception $e) {
            // Revertir la transacción en caso de error
            DB::rollback();
            
            Log::error("Error al eliminar usuario: " . $e->getMessage());
            
            return response()->json([
                'error' => 'Error al eliminar el usuario',
                'message' => 'Ha ocurrido un error interno. Por favor, intente nuevamente.'
            ], 500);
        }
    }
}