<?php

namespace Tests\Feature\Productos;

use Tests\TestCase;
use App\Models\Producto;

class ProductoControllerTest extends TestCase
{
    public function test_listar_productos_devuelve_estructura_correcta()
    {
        $this->createTestProducts(3);

        $response = $this->getJson('/api/productos');

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'data' => [
                        '*' => [
                            'id', 'nombre', 'precio', 'descripcion', 
                            'categoria_nombre', 'imagen_url', 'stock'
                        ]
                    ],
                    'pagination' => [
                        'total', 'per_page', 'current_page', 'last_page'
                    ]
                ]);
    }

    public function test_obtener_producto_existente()
    {
        $producto = $this->createTestProduct(['nombre' => 'Producto Específico']);

        $response = $this->getJson("/api/producto/{$producto->id}");

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'data' => [
                        'id', 'nombre', 'precio', 'descripcion',
                        'categoria_nombre', 'imagen_url', 'stock'
                    ],
                    'relacionados'
                ])
                ->assertJsonFragment(['nombre' => 'Producto Específico']);
    }

    public function test_obtener_producto_inexistente()
    {
        $response = $this->getJson('/api/producto/999');

        $response->assertStatus(404);
    }

    public function test_productos_destacados_devuelve_maximo_4()
    {
        $this->createTestProducts(6);

        $response = $this->getJson('/api/productos/destacados');

        $response->assertStatus(200)
                ->assertJsonStructure(['data'])
                ->assertJsonCount(4, 'data');
    }

    public function test_admin_puede_crear_producto()
    {
        $admin = $this->authenticatedAdmin();

        $productoData = [
            'nombre' => 'Nuevo Producto',
            'descripcion' => 'Descripción del nuevo producto',
            'precio' => 39.99,
            'stock' => 15,
            'categoria_id' => 1,
            'imagen_id' => 1,
        ];

        $response = $this->postJson('/api/productos', $productoData);

        $response->assertStatus(201)
                ->assertJsonStructure(['message', 'data']);

        $this->assertDatabaseHas('productos', ['nombre' => 'Nuevo Producto']);
    }

    public function test_usuario_normal_no_puede_crear_producto()
    {
        $user = $this->authenticatedUser();

        $productoData = [
            'nombre' => 'Nuevo Producto',
            'precio' => 39.99,
            'categoria_id' => 1,
        ];

        $response = $this->postJson('/api/productos', $productoData);

        $response->assertStatus(403);
    }
}