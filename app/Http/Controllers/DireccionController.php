<?php

namespace App\Http\Controllers;

use App\Models\Direccion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class DireccionController extends Controller
{
    /**
     * Obtener todas las direcciones del usuario autenticado.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        $direcciones = Direccion::where('user_id', Auth::id())->get();
        return response()->json($direcciones);
    }

    /**
     * Almacenar una nueva dirección en la base de datos.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nombre_direccion' => 'required|string|max:100',
            'calle' => 'required|string|max:255',
            'numero' => 'required|string|max:20',
            'codigo_postal' => 'required|string|max:10',
            'ciudad' => 'required|string|max:100',
            'provincia' => 'required|string|max:100',
            'pais' => 'required|string|max:100',
            'es_principal' => 'boolean'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Verificar si el usuario ya tiene direcciones
        $tieneDirecciones = Direccion::where('user_id', Auth::id())->exists();
        
        // Si es la primera dirección o el usuario la marca como principal
        $esPrincipal = $request->input('es_principal', false);
        if (!$tieneDirecciones || $esPrincipal) {
            // Forzar a que sea principal si es la primera
            $esPrincipal = true;
            
            // Si va a ser principal, quitar la marca de principal de todas las demás
            if ($tieneDirecciones) {
                Direccion::where('user_id', Auth::id())->update(['es_principal' => false]);
            }
        }

        // Crear la nueva dirección
        $direccion = new Direccion($request->only([
            'nombre_direccion', 'calle', 'numero', 'piso', 'puerta',
            'codigo_postal', 'ciudad', 'provincia', 'pais',
        ]));
        $direccion->user_id = Auth::id();
        $direccion->es_principal = $esPrincipal;
        $direccion->save();

        return response()->json($direccion, 201);
    }

    /**
     * Mostrar una dirección específica.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        $direccion = Direccion::where('id', $id)
            ->where('user_id', Auth::id())
            ->first();

        if (!$direccion) {
            return response()->json(['message' => 'Dirección no encontrada'], 404);
        }

        return response()->json($direccion);
    }

    /**
     * Actualizar una dirección específica en la base de datos.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id)
    {
        $direccion = Direccion::where('id', $id)
            ->where('user_id', Auth::id())
            ->first();

        if (!$direccion) {
            return response()->json(['message' => 'Dirección no encontrada'], 404);
        }

        $validator = Validator::make($request->all(), [
            'nombre_direccion' => 'sometimes|required|string|max:100',
            'calle' => 'sometimes|required|string|max:255',
            'numero' => 'sometimes|required|string|max:20',
            'piso' => 'nullable|string|max:20',
            'puerta' => 'nullable|string|max:20',
            'codigo_postal' => 'sometimes|required|string|max:10',
            'ciudad' => 'sometimes|required|string|max:100',
            'provincia' => 'sometimes|required|string|max:100',
            'pais' => 'sometimes|required|string|max:100',
            'es_principal' => 'boolean'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Si la dirección actualizada es principal, actualizar todas las direcciones existentes del usuario
        if ($request->has('es_principal') && $request->es_principal) {
            Direccion::where('user_id', Auth::id())
                ->where('id', '!=', $id)
                ->update(['es_principal' => false]);
        }

        $direccion->fill($request->only([
            'nombre_direccion', 'calle', 'numero', 'piso', 'puerta',
            'codigo_postal', 'ciudad', 'provincia', 'pais', 'es_principal',
        ]));
        $direccion->save();

        return response()->json($direccion);
    }

    /**
     * Eliminar una dirección específica de la base de datos.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
  
    public function destroy($id)
    {
        try {
            $direccion = Direccion::where('id', $id)
                ->where('user_id', Auth::id())
                ->first();

            if (!$direccion) {
                return response()->json(['message' => 'Dirección no encontrada'], 404);
            }

            $esPrincipal = $direccion->es_principal;
            
            // Verificar si la dirección está en pedidos (solo para informar al usuario)
            $pedidosConEstaDirection = \App\Models\Pedido::where('direccion_id', $id)->count();
            
            // Eliminar la dirección - 
            $direccion->delete();

            // Si la dirección eliminada era principal, establecer otra como principal
            if ($esPrincipal) {
                $otraDireccion = Direccion::where('user_id', Auth::id())->first();
                if ($otraDireccion) {
                    $otraDireccion->es_principal = true;
                    $otraDireccion->save();
                }
            }

            // Mensaje de respuesta informativo
            $mensaje = 'Dirección eliminada correctamente';
            if ($pedidosConEstaDirection > 0) {
                $mensaje .= ". Los pedidos existentes mantienen la información de la dirección.";
            }

            return response()->json([
                'message' => $mensaje,
                'pedidos_afectados' => $pedidosConEstaDirection,
                'eliminacion_segura' => true
            ]);

        } catch (\Exception $e) {
            // En caso de error de constraint (si no se aplicó la migración correctamente)
            if (strpos($e->getMessage(), 'foreign key constraint') !== false) {
                return response()->json([
                    'message' => 'No se puede eliminar la dirección porque está asociada a pedidos existentes.',
                    'error' => 'constraint_error',
                    'sugerencia' => 'Contacta con soporte si necesitas eliminar esta dirección.'
                ], 409);
            }

            return response()->json([
                'message' => 'Error al eliminar la dirección',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Establecer una dirección como principal.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function setPrincipal($id)
    {
        $direccion = Direccion::where('id', $id)
            ->where('user_id', Auth::id())
            ->first();

        if (!$direccion) {
            return response()->json(['message' => 'Dirección no encontrada'], 404);
        }

        // Quitar la marca de principal de todas las direcciones del usuario
        Direccion::where('user_id', Auth::id())->update(['es_principal' => false]);

        // Establecer esta dirección como principal
        $direccion->es_principal = true;
        $direccion->save();

        return response()->json(['message' => 'Dirección establecida como principal']);
    }
}