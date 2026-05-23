<?php

namespace Tests\Unit\Models;

use Tests\TestCase;
use App\Models\Direccion;
use App\Models\User;
use App\Models\Pedido;

class DireccionTest extends TestCase
{
    public function test_crear_direccion()
    {
        $user = User::create([
            'name' => 'Usuario Test',
            'apellidos' => 'Apellidos Test',
            'email' => 'user@test.com',
            'password' => bcrypt('password'),
            'email_verified_at' => now()
        ]);

        $direccion = Direccion::create([
            'user_id' => $user->id,
            'nombre_direccion' => 'Casa Principal',
            'calle' => 'Calle Mayor',
            'numero' => '123',
            'piso' => '2',
            'puerta' => 'A',
            'codigo_postal' => '28001',
            'ciudad' => 'Madrid',
            'provincia' => 'Madrid',
            'pais' => 'España',
            'es_principal' => true
        ]);

        $this->assertDatabaseHas('direcciones', [
            'user_id' => $user->id,
            'nombre_direccion' => 'Casa Principal',
            'calle' => 'Calle Mayor',
            'numero' => '123',
            'ciudad' => 'Madrid'
        ]);

        $this->assertEquals('Casa Principal', $direccion->nombre_direccion);
        $this->assertEquals('Calle Mayor', $direccion->calle);
        $this->assertTrue($direccion->es_principal);
    }

    public function test_relacion_user()
    {
        $user = User::create([
            'name' => 'Usuario Test',
            'apellidos' => 'Apellidos Test',
            'email' => 'user@test.com',
            'password' => bcrypt('password'),
            'email_verified_at' => now()
        ]);

        $direccion = Direccion::create([
            'user_id' => $user->id,
            'nombre_direccion' => 'Casa Test',
            'calle' => 'Calle Test',
            'numero' => '456',
            'codigo_postal' => '28002',
            'ciudad' => 'Madrid',
            'provincia' => 'Madrid',
            'pais' => 'España',
            'es_principal' => false
        ]);

        $this->assertInstanceOf(User::class, $direccion->user);
        $this->assertEquals($user->id, $direccion->user->id);
        $this->assertEquals('Usuario Test', $direccion->user->name);
    }

    public function test_relacion_pedidos()
    {
        $user = User::create([
            'name' => 'Usuario Test',
            'apellidos' => 'Apellidos Test',
            'email' => 'user@test.com',
            'password' => bcrypt('password'),
            'email_verified_at' => now()
        ]);

        $direccion = Direccion::create([
            'user_id' => $user->id,
            'nombre_direccion' => 'Casa Test',
            'calle' => 'Calle Test',
            'numero' => '789',
            'codigo_postal' => '28003',
            'ciudad' => 'Madrid',
            'provincia' => 'Madrid',
            'pais' => 'España',
            'es_principal' => true
        ]);

        $pedido = Pedido::create([
            'user_id' => $user->id,
            'direccion_id' => $direccion->id,
            'precio_total' => 100.00,
            'estado' => 'pendiente',
            'metodo_pago' => 'tarjeta'
        ]);

        $this->assertInstanceOf(\Illuminate\Database\Eloquent\Collection::class, $direccion->pedidos);
        $this->assertCount(1, $direccion->pedidos);
        $this->assertEquals($pedido->id, $direccion->pedidos->first()->id);
    }

    public function test_cast_es_principal_boolean()
    {
        $user = User::create([
            'name' => 'Usuario Test',
            'apellidos' => 'Apellidos Test',
            'email' => 'user@test.com',
            'password' => bcrypt('password'),
            'email_verified_at' => now()
        ]);

        $direccion = Direccion::create([
            'user_id' => $user->id,
            'nombre_direccion' => 'Casa Test',
            'calle' => 'Calle Test',
            'numero' => '123',
            'codigo_postal' => '28001',
            'ciudad' => 'Madrid',
            'provincia' => 'Madrid',
            'pais' => 'España',
            'es_principal' => '1' // String que debe convertirse a boolean
        ]);

        $this->assertIsBool($direccion->es_principal);
        $this->assertTrue($direccion->es_principal);
    }

    public function test_fillable_attributes()
    {
        $direccion = new Direccion();
        $expected = [
            'user_id',
            'nombre_direccion',
            'calle',
            'numero',
            'piso',
            'puerta',
            'codigo_postal',
            'ciudad',
            'provincia',
            'pais',
            'es_principal'
        ];
        
        $this->assertEquals($expected, $direccion->getFillable());
    }

    public function test_tabla_nombre()
    {
        $direccion = new Direccion();
        $this->assertEquals('direcciones', $direccion->getTable());
    }

    public function test_direccion_con_campos_opcionales()
    {
        $user = User::create([
            'name' => 'Usuario Test',
            'apellidos' => 'Apellidos Test',
            'email' => 'user@test.com',
            'password' => bcrypt('password'),
            'email_verified_at' => now()
        ]);

        $direccion = Direccion::create([
            'user_id' => $user->id,
            'nombre_direccion' => 'Oficina',
            'calle' => 'Avenida Principal',
            'numero' => '456',
            'codigo_postal' => '28004',
            'ciudad' => 'Madrid',
            'provincia' => 'Madrid',
            'pais' => 'España'
            // piso y puerta son opcionales
        ]);

        $this->assertNull($direccion->piso);
        $this->assertNull($direccion->puerta);
        $this->assertEquals('Oficina', $direccion->nombre_direccion);
    }
}