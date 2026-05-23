<?php

namespace Tests\Unit\Models;

use Tests\TestCase;
use App\Models\Producto;
use App\Models\Categoria;
use App\Models\Imagen;

class ProductoTest extends TestCase
{
    public function test_tiene_stock_retorna_true_con_stock_suficiente()
    {
        $producto = $this->createTestProduct(['stock' => 10]);
        
        $this->assertTrue($producto->tieneStock(5));
        $this->assertTrue($producto->tieneStock(10));
        $this->assertTrue($producto->tieneStock(1));
    }

    public function test_tiene_stock_retorna_false_con_stock_insuficiente()
    {
        $producto = $this->createTestProduct(['stock' => 2]);
        
        $this->assertFalse($producto->tieneStock(5));
        $this->assertFalse($producto->tieneStock(3));
    }

    public function test_tiene_stock_con_stock_nulo()
    {
        $producto = $this->createTestProduct(['stock' => 0]);
        
        $this->assertFalse($producto->tieneStock(1));
    }

    public function test_reducir_stock_exitoso()
    {
        $producto = $this->createTestProduct(['stock' => 10]);
        
        $resultado = $producto->reducirStock(3);
        
        $this->assertTrue($resultado);
        $this->assertEquals(7, $producto->fresh()->stock);
    }

    public function test_reducir_stock_insuficiente()
    {
        $producto = $this->createTestProduct(['stock' => 2]);
        
        $resultado = $producto->reducirStock(5);
        
        $this->assertFalse($resultado);
        $this->assertEquals(2, $producto->fresh()->stock);
    }

    public function test_reducir_stock_exacto()
    {
        $producto = $this->createTestProduct(['stock' => 5]);
        
        $resultado = $producto->reducirStock(5);
        
        $this->assertTrue($resultado);
        $this->assertEquals(0, $producto->fresh()->stock);
    }

    public function test_producto_en_oferta()
    {
        $producto = $this->createTestProduct([
            'precio' => 50.00,
            'precio_original' => 100.00,
            'porcentaje_descuento' => 50,
            'fecha_inicio_descuento' => now()->subDay(),
            'fecha_fin_descuento' => now()->addDay()
        ]);
        
        $this->assertTrue($producto->en_oferta);
    }

    public function test_producto_sin_oferta_sin_fechas()
    {
        $producto = $this->createTestProduct([
            'precio_original' => null,
            'fecha_inicio_descuento' => null,
            'fecha_fin_descuento' => null
        ]);
        
        $this->assertFalse($producto->en_oferta);
    }

    public function test_producto_fuera_de_periodo_oferta()
    {
        $producto = $this->createTestProduct([
            'precio_original' => 100.00,
            'fecha_inicio_descuento' => now()->subDays(10),
            'fecha_fin_descuento' => now()->subDays(5)
        ]);
        
        $this->assertFalse($producto->en_oferta);
    }

    public function test_relacion_categoria()
    {
        $categoria = Categoria::create([
            'nombre' => 'Categoría Test',
            'publico_objetivo' => 'adulto'
        ]);
        
        $producto = $this->createTestProduct(['categoria_id' => $categoria->id]);
        
        $this->assertInstanceOf(Categoria::class, $producto->categoria);
        $this->assertEquals($categoria->id, $producto->categoria->id);
    }

    public function test_relacion_imagen()
    {
        $imagen = Imagen::create([
            'url' => 'https://example.com/test.jpg',
            'descripcion' => 'Test imagen'
        ]);
        
        $producto = $this->createTestProduct(['imagen_id' => $imagen->id]);
        
        $this->assertInstanceOf(Imagen::class, $producto->imagenProductos);
        $this->assertEquals($imagen->id, $producto->imagenProductos->id);
    }

  public function test_casteo_de_tipos()
{
    $producto = $this->createTestProduct([
        'precio' => '29.99',
        'precio_original' => '39.99',
        'porcentaje_descuento' => '25.50',
        'stock' => '10'
    ]);
    
    $this->assertIsString($producto->precio); 
    $this->assertIsString($producto->precio_original); 
    $this->assertIsString($producto->porcentaje_descuento); 
    $this->assertIsInt($producto->stock);
    
    $this->assertEquals(29.99, floatval($producto->precio));
    $this->assertEquals(39.99, floatval($producto->precio_original));
    $this->assertEquals(25.50, floatval($producto->porcentaje_descuento));
}
}