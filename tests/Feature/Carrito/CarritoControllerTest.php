<?php

namespace Tests\Feature\Carrito;

use Tests\TestCase;
use App\Models\Carrito;

class CarritoControllerTest extends TestCase
{
    public function test_verificar_carrito_vacio_retorna_false()
    {
        $user = $this->authenticatedUser();

        $response = $this->getJson('/api/carrito/check');

        $response->assertStatus(200)
                ->assertJson(['hasItems' => false]);
    }

    public function test_verificar_carrito_con_productos_retorna_true()
    {
        $user = $this->authenticatedUser();
        $producto = $this->createTestProduct();
        
        Carrito::create([
            'user_id' => $user->id,
            'producto_id' => $producto->id,
            'cantidad' => 2
        ]);

        $response = $this->getJson('/api/carrito/check');

        $response->assertStatus(200)
                ->assertJson(['hasItems' => true]);
    }

    public function test_anadir_producto_nuevo_al_carrito()
    {
        $user = $this->authenticatedUser();
        $producto = $this->createTestProduct(['nombre' => 'Producto Test']);

        $response = $this->postJson('/api/carrito', [
            'producto_id' => $producto->id,
            'cantidad' => 2
        ]);

        $response->assertStatus(201)
                ->assertJsonStructure(['success', 'message', 'item'])
                ->assertJson(['success' => true]);

        $this->assertDatabaseHas('carritos', [
            'user_id' => $user->id,
            'producto_id' => $producto->id,
            'cantidad' => 2
        ]);
    }

    public function test_anadir_producto_existente_actualiza_cantidad()
    {
        $user = $this->authenticatedUser();
        $producto = $this->createTestProduct();
        
        Carrito::create([
            'user_id' => $user->id,
            'producto_id' => $producto->id,
            'cantidad' => 1
        ]);

        $response = $this->postJson('/api/carrito', [
            'producto_id' => $producto->id,
            'cantidad' => 2
        ]);

        $response->assertStatus(200)
                ->assertJson(['success' => true]);

        $this->assertDatabaseHas('carritos', [
            'user_id' => $user->id,
            'producto_id' => $producto->id,
            'cantidad' => 3
        ]);
    }

    public function test_eliminar_producto_del_carrito()
    {
        $user = $this->authenticatedUser();
        $producto = $this->createTestProduct();
        
        Carrito::create([
            'user_id' => $user->id,
            'producto_id' => $producto->id,
            'cantidad' => 2
        ]);

        $response = $this->deleteJson("/api/carrito/{$producto->id}");

        $response->assertStatus(200)
                ->assertJson(['success' => true]);

        $this->assertDatabaseMissing('carritos', [
            'user_id' => $user->id,
            'producto_id' => $producto->id
        ]);
    }
}