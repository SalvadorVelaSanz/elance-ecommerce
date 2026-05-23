<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Imagen;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class ImagenesController extends Controller
{
    /**
     * Devuelve todas las imágenes disponibles
     */
    public function index()
    {
        $imagenes = Imagen::all()->map(function($imagen) {
            return [
                'id' => $imagen->id,
                'url' => $imagen->url,
                'descripcion' => $imagen->descripcion ?: 'Sin descripción',
            ];
        });
        
        return response()->json([
            'data' => $imagenes
        ]);
    }

    /**
     * Muestra los detalles de una imagen específica
     */
    public function show($id)
    {
        $imagen = Imagen::findOrFail($id);
        
        return response()->json([
            'data' => [
                'id' => $imagen->id,
                'url' => $imagen->url,
                'descripcion' => $imagen->descripcion ?: 'Sin descripción',
            ]
        ]);
    }

    /**
     * Crea una imagen con una o múltiples URLs
     * Las URLs múltiples se guardan separadas por "|" en un solo registro
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'urls' => 'required|string',
            'descripcion_base' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()], 400);
        }

        try {
            DB::beginTransaction();

            // Procesar las URLs pero mantenerlas unidas
            $urls = $request->urls;
            $descripcionBase = $request->descripcion_base ?: 'Imagen de producto';

            // Validar que todas las URLs sean válidas
            $urlsArray = explode('|', $urls);
            $urlsArray = array_map('trim', $urlsArray); // Eliminar espacios en blanco
            $urlsArray = array_filter($urlsArray); // Eliminar URLs vacías
            
            foreach ($urlsArray as $url) {
                if (!filter_var($url, FILTER_VALIDATE_URL)) {
                    DB::rollBack();
                    return response()->json([
                        'error' => "La URL '{$url}' no tiene un formato válido."
                    ], 400);
                }
            }

            // Crear una sola imagen con todas las URLs
            $imagen = Imagen::create([
                'url' => $urls, // Guardar todas las URLs con el pipe
                'descripcion' => $descripcionBase
            ]);

            DB::commit();

            return response()->json([
                'message' => count($urlsArray) > 1 
                    ? 'Imagen con múltiples URLs creada correctamente' 
                    : 'Imagen creada correctamente',
                'data' => [
                    'id' => $imagen->id,
                    'url' => $imagen->url,
                    'descripcion' => $imagen->descripcion,
                    'urls_count' => count($urlsArray)
                ],
                'principal_id' => $imagen->id // ID de la imagen creada
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'error' => 'Error al crear la imagen: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Actualiza una imagen existente
     */
    public function update(Request $request, $id)
    {
        $imagen = Imagen::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'url' => 'sometimes|required|string',
            'descripcion' => 'sometimes|nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()], 400);
        }

        // Si se está actualizando la URL, validar todas las URLs
        if ($request->has('url')) {
            $urlsArray = explode('|', $request->url);
            $urlsArray = array_map('trim', $urlsArray);
            $urlsArray = array_filter($urlsArray);
            
            foreach ($urlsArray as $url) {
                if (!filter_var($url, FILTER_VALIDATE_URL)) {
                    return response()->json([
                        'error' => "La URL '{$url}' no tiene un formato válido."
                    ], 400);
                }
            }
        }

        $imagen->update($request->only(['url', 'descripcion']));

        return response()->json([
            'message' => 'Imagen actualizada correctamente',
            'data' => [
                'id' => $imagen->id,
                'url' => $imagen->url,
                'descripcion' => $imagen->descripcion,
            ]
        ]);
    }

    /**
     * Elimina una imagen
     */
    public function destroy($id)
    {
        try {
            $imagen = Imagen::findOrFail($id);
            
            // Verificar si la imagen está siendo usada por algún producto
            $productosUsandoImagen = $imagen->productos()->count();
            
            if ($productosUsandoImagen > 0) {
                return response()->json([
                    'error' => 'No se puede eliminar la imagen porque está siendo utilizada por ' . $productosUsandoImagen . ' producto(s).'
                ], 400);
            }

            $imagen->delete();

            return response()->json([
                'message' => 'Imagen eliminada correctamente'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error al eliminar la imagen: ' . $e->getMessage()
            ], 500);
        }
    }
}