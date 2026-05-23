<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminMiddleware
{
    /**
     * Manejar la solicitud entrante.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Verificar si el usuario está autenticado
        if (!$request->user()) {
            return response()->json(['error' => 'Usuario no autenticado'], 401);
        }

        $user = $request->user();

        // is_admin está casteado a boolean en el modelo User
        if (!$user->is_admin) {
            return response()->json(['error' => 'No tienes permisos para realizar esta acción.'], 403);
        }

        return $next($request);
    }
}