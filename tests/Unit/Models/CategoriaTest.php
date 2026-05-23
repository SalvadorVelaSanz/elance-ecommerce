<?php

namespace Tests\Unit\Models;

use Tests\TestCase;
use App\Models\Categoria;
use App\Models\Producto;

class CategoriaTest extends TestCase
{
    public function test_crear_categoria()
    {
        $categoria = Categoria::create([
            'nombre' => 'Ropa de Verano',
            'temporada' => 'Verano',
            'publico_objetivo' => 'adulto',
            'imagen_categoria' => 'https://example.com/verano.jpg'
        ]);

        $this->assertDatabaseHas('categorias', [
            'nombre' => 'Ropa de Verano',
            'temporada' => 'Verano',
            'publico_objetivo' => 'adulto'
        ]);

        $this->assertEquals('Ropa de Verano', $categoria->nombre);
        $this->assertEquals('Verano', $categoria->temporada);
        $this->assertEquals('adulto', $categoria->publico_objetivo);
    }

    public function test_relacion_productos()
    {
        $categoria = Categoria::create([
            'nombre' => 'Categoría Test',
            'publico_objetivo' => 'adulto'
        ]);

        $producto1 = $this->createTestProduct([
            'categoria_id' => $categoria->id,
            'nombre' => 'Producto 1'
        ]);
        
        $producto2 = $this->createTestProduct([
            'categoria_id' => $categoria->id,
            'nombre' => 'Producto 2'
        ]);

        $this->assertInstanceOf(\Illuminate\Database\Eloquent\Collection::class, $categoria->productos);
        $this->assertCount(2, $categoria->productos);
        
        $nombres = $categoria->productos->pluck('nombre')->toArray();
        $this->assertContains('Producto 1', $nombres);
        $this->assertContains('Producto 2', $nombres);
    }

    public function test_publico_objetivo_valido()
    {
        $expectedValues = ['adulto', 'niño', 'bebé', 'unisex'];
        $this->assertEquals($expectedValues, Categoria::$publicoObjetivoValido);
    }

    public function test_categoria_con_campos_opcionales()
    {
        $categoria = Categoria::create([
            'nombre' => 'Categoría Mínima',
            'publico_objetivo' => 'unisex'
            // temporada e imagen_categoria son opcionales
        ]);

        $this->assertNull($categoria->temporada);
        $this->assertNull($categoria->imagen_categoria);
        $this->assertEquals('Categoría Mínima', $categoria->nombre);
        $this->assertEquals('unisex', $categoria->publico_objetivo);
    }

    public function test_fillable_attributes()
    {
        $categoria = new Categoria();
        $expected = ['nombre', 'temporada', 'publico_objetivo', 'imagen_categoria'];
        
        $this->assertEquals($expected, $categoria->getFillable());
    }

    public function test_tabla_nombre()
    {
        $categoria = new Categoria();
        $this->assertEquals('categorias', $categoria->getTable());
    }
}