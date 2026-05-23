<?php

namespace Tests\Feature\Imagenes;

use Tests\TestCase;
use App\Models\Imagen;

class ImagenesControllerTest extends TestCase
{
    public function test_admin_puede_listar_imagenes()
    {
        $admin = $this->authenticatedAdmin();
        
        // Crear imágenes adicionales (ya hay 1 del setup)
        Imagen::create([
            'url' => 'https://example.com/image2.jpg',
            'descripcion' => 'Imagen 2'
        ]);
        
        Imagen::create([
            'url' => 'https://example.com/image3.jpg',
            'descripcion' => 'Imagen 3'
        ]);

        $response = $this->getJson('/api/imagenes');

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'data' => [
                        '*' => ['id', 'url', 'descripcion']
                    ]
                ])
                ->assertJsonCount(3, 'data');
    }

    public function test_usuario_normal_no_puede_listar_imagenes()
    {
        $user = $this->authenticatedUser();

        $response = $this->getJson('/api/imagenes');

        $response->assertStatus(403);
    }

    public function test_obtener_imagen_especifica()
    {
        // CAMBIO: autenticar como admin
        $admin = $this->authenticatedAdmin();
        
        $imagen = Imagen::create([
            'url' => 'https://example.com/specific-image.jpg',
            'descripcion' => 'Imagen específica'
        ]);

        $response = $this->getJson("/api/imagenes/{$imagen->id}");

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'data' => ['id', 'url', 'descripcion']
                ])
                ->assertJson([
                    'data' => [
                        'id' => $imagen->id,
                        'url' => 'https://example.com/specific-image.jpg',
                        'descripcion' => 'Imagen específica'
                    ]
                ]);
    }

    public function test_obtener_imagen_inexistente()
    {
        // CAMBIO: autenticar como admin
        $admin = $this->authenticatedAdmin();
        
        $response = $this->getJson('/api/imagenes/999');

        $response->assertStatus(404);
    }

    public function test_listar_imagenes_sin_autenticacion()
    {
        $response = $this->getJson('/api/imagenes');

        $response->assertStatus(401);
    }
}