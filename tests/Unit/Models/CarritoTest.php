<?php

namespace Tests\Unit\Models;

use Tests\TestCase;
use App\Models\Carrito;
use App\Models\User;
use App\Models\Producto;

class CarritoTest extends TestCase
{
    public function test_relacion_user()
    {
        $user = User::create([
            'name' => 'Test User',
            'apellidos' => 'Test',
            'email' => 'test@test.com',
            'password' => bcrypt('password'),
            'email_verified_at' => now()
        ]);

        $producto = $this->createTestProduct();

        $carrito = Carrito::create([
            'user_id' => $user->id,
            'producto_id' => $producto->id,
            'cantidad' => 2
        ]);

        $this->assertInstanceOf(User::class, $carrito->user);
        $this->assertEquals($user->id, $carrito->user->id);
    }

    public function test_relacion_producto()
    {
        $user = User::create([
            'name' => 'Test User',
            'apellidos' => 'Test',
            'email' => 'test@test.com',
            'password' => bcrypt('password'),
            'email_verified_at' => now()
        ]);

        $producto = $this->createTestProduct(['nombre' => 'Producto Test']);

        $carrito = Carrito::create([
            'user_id' => $user->id,
            'producto_id' => $producto->id,
            'cantidad' => 3
        ]);

        $this->assertInstanceOf(Producto::class, $carrito->producto);
        $this->assertEquals($producto->id, $carrito->producto->id);
        $this->assertEquals('Producto Test', $carrito->producto->nombre);
    }

    public function test_crear_item_carrito()
    {
        $user = User::create([
            'name' => 'Test User',
            'apellidos' => 'Test',
            'email' => 'test@test.com',
            'password' => bcrypt('password'),
            'email_verified_at' => now()
        ]);

        $producto = $this->createTestProduct();

        $carrito = Carrito::create([
            'user_id' => $user->id,
            'producto_id' => $producto->id,
            'cantidad' => 5
        ]);

        $this->assertDatabaseHas('carritos', [
            'user_id' => $user->id,
            'producto_id' => $producto->id,
            'cantidad' => 5
        ]);

        $this->assertEquals(5, $carrito->cantidad);
    }

    public function test_actualizar_cantidad_carrito()
    {
        $user = User::create([
            'name' => 'Test User',
            'apellidos' => 'Test',
            'email' => 'test@test.com',
            'password' => bcrypt('password'),
            'email_verified_at' => now()
        ]);

        $producto = $this->createTestProduct();

        $carrito = Carrito::create([
            'user_id' => $user->id,
            'producto_id' => $producto->id,
            'cantidad' => 2
        ]);

        $carrito->cantidad = 7;
        $carrito->save();

        $this->assertEquals(7, $carrito->fresh()->cantidad);
    }
}