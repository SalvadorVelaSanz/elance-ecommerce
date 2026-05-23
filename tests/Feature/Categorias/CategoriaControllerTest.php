<?php

namespace Tests\Feature\Categorias;

use Tests\TestCase;
use App\Models\Categoria;

class CategoriaControllerTest extends TestCase
{
    public function test_obtener_categorias_aleatorias_retorna_maximo_3()
    {
        // Crear 5 categorías (1 ya existe del setup)
        for ($i = 0; $i < 4; $i++) {
            Categoria::create([
                'nombre' => "Categoría {$i}",
                'publico_objetivo' => 'adulto'
            ]);
        }

        $response = $this->getJson('/api/categorias');

        $response->assertStatus(200)
                ->assertJsonStructure(['data'])
                ->assertJsonCount(3, 'data');
    }

    public function test_obtener_todas_las_categorias()
    {
        // Crear categorías adicionales
        for ($i = 0; $i < 3; $i++) {
            Categoria::create([
                'nombre' => "Categoría {$i}",
                'publico_objetivo' => 'adulto'
            ]);
        }

        $response = $this->getJson('/api/categorias/todas');

        $response->assertStatus(200)
                ->assertJsonStructure(['data'])
                ->assertJsonCount(4, 'data'); // 3 + 1 del setup
    }

    public function test_admin_puede_crear_categoria()
    {
        $admin = $this->authenticatedAdmin();

        $categoriaData = [
            'nombre' => 'Nueva Categoría',
            'temporada' => 'Verano',
            'publico_objetivo' => 'adulto',
            'imagen_categoria' => 'https://example.com/image.jpg'
        ];

        $response = $this->postJson('/api/categorias', $categoriaData);

        $response->assertStatus(201)
                ->assertJsonStructure(['message', 'data']);

        $this->assertDatabaseHas('categorias', ['nombre' => 'Nueva Categoría']);
    }

    public function test_usuario_normal_no_puede_crear_categoria()
    {
        $user = $this->authenticatedUser();

        $categoriaData = [
            'nombre' => 'Nueva Categoría',
            'publico_objetivo' => 'adulto'
        ];

        $response = $this->postJson('/api/categorias', $categoriaData);

        $response->assertStatus(403);
    }
}