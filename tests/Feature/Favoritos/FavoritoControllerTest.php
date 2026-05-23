<?php

namespace Tests\Feature\Favoritos;

use Tests\TestCase;
use App\Models\Favorito;
use App\Models\User;

class FavoritoControllerTest extends TestCase
{
    public function test_obtener_favoritos_vacios()
    {
        $user = $this->authenticatedUser();

        $response = $this->getJson('/api/favorites');

        $response->assertStatus(200)
                ->assertJson([]);
    }

    public function test_obtener_favoritos_con_productos()
    {
        $user = $this->authenticatedUser();
        $producto = $this->createTestProduct(['nombre' => 'Producto Favorito']);
        
        Favorito::create([
            'user_id' => $user->id,
            'producto_id' => $producto->id
        ]);

        $response = $this->getJson('/api/favorites');

        $response->assertStatus(200)
                ->assertJsonCount(1)
                ->assertJsonFragment(['name' => 'Producto Favorito']);
    }

    public function test_anadir_producto_a_favoritos()
    {
        $user = $this->authenticatedUser();
        $producto = $this->createTestProduct(['nombre' => 'Producto Nuevo']);

        $response = $this->postJson('/api/favorites', [
            'producto_id' => $producto->id
        ]);

        $response->assertStatus(201)
                ->assertJsonStructure([
                    'message',
                    'favorite' => [
                        'id', 'producto_id', 'name', 'price', 'image'
                    ]
                ]);

        $this->assertDatabaseHas('favoritos', [
            'user_id' => $user->id,
            'producto_id' => $producto->id
        ]);
    }

    public function test_anadir_producto_ya_favorito()
    {
        $user = $this->authenticatedUser();
        $producto = $this->createTestProduct();
        
        Favorito::create([
            'user_id' => $user->id,
            'producto_id' => $producto->id
        ]);

        $response = $this->postJson('/api/favorites', [
            'producto_id' => $producto->id
        ]);

        $response->assertStatus(200)
                ->assertJson(['message' => 'El producto ya está en favoritos']);
    }

    public function test_anadir_producto_inexistente_a_favoritos()
    {
        $user = $this->authenticatedUser();

        $response = $this->postJson('/api/favorites', [
            'producto_id' => 999
        ]);

        $response->assertStatus(404)
                ->assertJson(['error' => 'Producto no encontrado']);
    }

    public function test_eliminar_favorito_propio()
    {
        $user = $this->authenticatedUser();
        $producto = $this->createTestProduct();
        
        $favorito = Favorito::create([
            'user_id' => $user->id,
            'producto_id' => $producto->id
        ]);

        $response = $this->deleteJson("/api/favorites/{$favorito->id}");

        $response->assertStatus(200)
                ->assertJson(['message' => 'Producto eliminado de favoritos']);

        $this->assertDatabaseMissing('favoritos', ['id' => $favorito->id]);
    }

    public function test_eliminar_favorito_ajeno()
    {
        $user1 = $this->authenticatedUser();
        $user2 = User::create([
            'name' => 'Otro Usuario',
            'apellidos' => 'Test',
            'email' => 'otro@test.com',
            'password' => bcrypt('password'),
            'email_verified_at' => now()
        ]);
        
        $producto = $this->createTestProduct();
        $favorito = Favorito::create([
            'user_id' => $user2->id,
            'producto_id' => $producto->id
        ]);

        $response = $this->deleteJson("/api/favorites/{$favorito->id}");

        $response->assertStatus(404)
                ->assertJson(['error' => 'Favorito no encontrado']);
    }

    public function test_anadir_favorito_sin_autenticacion()
    {
        $producto = $this->createTestProduct();

        $response = $this->postJson('/api/favorites', [
            'producto_id' => $producto->id
        ]);

        $response->assertStatus(401);
    }
}