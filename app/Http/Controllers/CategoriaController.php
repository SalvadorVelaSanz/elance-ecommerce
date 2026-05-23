<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Categoria;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CategoriaController extends Controller
{
    /**
     * Devuelve 3 categorías aleatorias para el home
     */
    public function index()
    {
        $categorias = Categoria::inRandomOrder()
                    ->limit(3)
                    ->get();
                    
        return response()->json(['data' => $categorias]);
    }
    
    /**
     * Devuelve todas las categorías 
     */
    public function todas()
    {
        $categorias = Categoria::all();
        return response()->json(['data' => $categorias]);
    }

    /**
     * Muestra los detalles de una categoría específica
     */
    public function show($id)
    {
        $categoria = Categoria::findOrFail($id);
        
        return response()->json([
            'data' => $categoria
        ]);
    }

    /**
     * Crea una nueva categoría (SOLO ADMINISTRADORES)
     */
    public function store(Request $request)
    {
        // Validar los datos de entrada
        $validator = Validator::make($request->all(), [
            'nombre' => 'required|string|max:50|unique:categorias,nombre',
            'temporada' => 'nullable|string|max:30',
            'publico_objetivo' => 'required|in:adulto,niño,bebé,unisex',
            'imagen_categoria' => 'nullable|string|max:255|url',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()], 400);
        }

        // Preparar los datos
        $data = $request->only(['nombre', 'temporada', 'publico_objetivo', 'imagen_categoria']);

        // Crear la nueva categoría
        $categoria = Categoria::create($data);

        return response()->json([
            'message' => 'Categoría creada correctamente',
            'data' => $categoria
        ], 201);
    }

    /**
     * Actualiza una categoría existente (SOLO ADMINISTRADORES)
     */
    public function update(Request $request, $id)
    {
        // Buscar la categoría
        $categoria = Categoria::findOrFail($id);

        // Validar los datos de entrada
        $validator = Validator::make($request->all(), [
            'nombre' => 'sometimes|required|string|max:50|unique:categorias,nombre,' . $id,
            'temporada' => 'nullable|string|max:30',
            'publico_objetivo' => 'sometimes|required|in:adulto,niño,bebé,unisex',
            'imagen_categoria' => 'nullable|string|max:255|url',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()], 400);
        }

        // Preparar los datos
        $data = $request->only(['nombre', 'temporada', 'publico_objetivo', 'imagen_categoria']);

        // Actualizar la categoría
        $categoria->update($data);

        return response()->json([
            'message' => 'Categoría actualizada correctamente',
            'data' => $categoria
        ]);
    }

    /**
     * Elimina una categoría (SOLO ADMINISTRADORES)
     * Los productos asociados quedarán sin categoría (categoria_id = null)
     */
    public function destroy($id)
    {
        // Buscar la categoría
        $categoria = Categoria::findOrFail($id);
        
        // Contar productos asociados para informar al usuario
        $productosCount = $categoria->productos()->count();
        
        // Eliminar la categoría
        // Gracias a la foreign key con onDelete('set null'), 
        // los productos automáticamente tendrán categoria_id = null
        $categoria->delete();

        $mensaje = 'Categoría eliminada correctamente';
        
        if ($productosCount > 0) {
            $mensaje .= '. Los ' . $productosCount . ' producto(s) asociado(s) ahora están sin categoría.';
        }

        return response()->json([
            'message' => $mensaje,
            'productos_afectados' => $productosCount
        ]);
    }
}