<?php

namespace Tests\Unit\Models;

use Tests\TestCase;
use App\Models\Pedido;
use App\Models\User;
use App\Models\Direccion;

class PedidoTest extends TestCase
{
    public function test_generar_numero_seguimiento_unico()
    {
        $numero1 = Pedido::generarNumeroSeguimiento();
        $numero2 = Pedido::generarNumeroSeguimiento();
        
        $this->assertNotEquals($numero1, $numero2);
        $this->assertStringStartsWith('ES', $numero1);
        $this->assertStringStartsWith('ES', $numero2);
        $this->assertEquals(14, strlen($numero1)); // ES + 12 dígitos
    }

    public function test_crear_pedido_genera_numero_seguimiento_automatico()
    {
        $user = User::create([
            'name' => 'Test User',
            'apellidos' => 'Test',
            'email' => 'test@test.com',
            'password' => bcrypt('password'),
            'email_verified_at' => now()
        ]);

        $pedido = Pedido::create([
            'user_id' => $user->id,
            'precio_total' => 100.00,
            'estado' => 'pendiente',
            'metodo_pago' => 'tarjeta'
        ]);

        $this->assertNotNull($pedido->numero_seguimiento);
        $this->assertStringStartsWith('ES', $pedido->numero_seguimiento);
    }

  public function test_direccion_completa_attribute()
{
    $user = User::create([
        'name' => 'Test User',
        'apellidos' => 'Test',
        'email' => 'test@test.com',
        'password' => bcrypt('password'),
        'email_verified_at' => now()
    ]);

    $direccion = Direccion::create([
        'user_id' => $user->id,
        'nombre_direccion' => 'Casa',
        'calle' => 'Calle Principal',
        'numero' => '123',
        'piso' => '2',
        'puerta' => 'A',
        'codigo_postal' => '28001',
        'ciudad' => 'Madrid',
        'provincia' => 'Madrid',
        'pais' => 'España',
        'es_principal' => true
    ]);

    $pedido = Pedido::create([
        'user_id' => $user->id,
        'precio_total' => 100.00,
        'estado' => 'pendiente',
        'direccion_id' => $direccion->id,
        'metodo_pago' => 'tarjeta'
    ]);

    $direccionCompleta = $pedido->direccion_completa;
    
    // CAMBIO: assertStringContains por assertStringContainsString
    $this->assertStringContainsString('Calle Principal', $direccionCompleta);
    $this->assertStringContainsString('123', $direccionCompleta);
    $this->assertStringContainsString('Piso: 2', $direccionCompleta);
    $this->assertStringContainsString('Puerta: A', $direccionCompleta);
    $this->assertStringContainsString('28001', $direccionCompleta);
    $this->assertStringContainsString('Madrid', $direccionCompleta);
    $this->assertStringContainsString('España', $direccionCompleta);
}

    public function test_snapshots_usuario_automaticos()
    {
        $user = User::create([
            'name' => 'Juan',
            'apellidos' => 'Pérez',
            'email' => 'juan@test.com',
            'telefono' => '123456789',
            'password' => bcrypt('password'),
            'email_verified_at' => now()
        ]);

        $pedido = Pedido::create([
            'user_id' => $user->id,
            'precio_total' => 100.00,
            'estado' => 'pendiente',
            'metodo_pago' => 'tarjeta'
        ]);

        $this->assertEquals('Juan', $pedido->usuario_nombre);
        $this->assertEquals('juan@test.com', $pedido->usuario_email);
        $this->assertEquals('123456789', $pedido->usuario_telefono);
    }

    public function test_snapshots_direccion_automaticos()
    {
        $user = User::create([
            'name' => 'Test User',
            'apellidos' => 'Test',
            'email' => 'test@test.com',
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
            'es_principal' => true
        ]);

        $pedido = Pedido::create([
            'user_id' => $user->id,
            'precio_total' => 100.00,
            'estado' => 'pendiente',
            'direccion_id' => $direccion->id,
            'metodo_pago' => 'tarjeta'
        ]);

        $this->assertEquals('Casa Test', $pedido->direccion_nombre_direccion);
        $this->assertEquals('Calle Test', $pedido->direccion_calle);
        $this->assertEquals('123', $pedido->direccion_numero);
        $this->assertEquals('28001', $pedido->direccion_codigo_postal);
        $this->assertEquals('Madrid', $pedido->direccion_ciudad);
        $this->assertEquals('Madrid', $pedido->direccion_provincia);
        $this->assertEquals('España', $pedido->direccion_pais);
    }

    public function test_estados_validos()
    {
        $estadosEsperados = ['pendiente', 'procesando', 'enviado', 'entregado', 'cancelado'];
        
        $this->assertEquals($estadosEsperados, Pedido::$estadosValidos);
    }

    public function test_relacion_user()
    {
        $user = User::create([
            'name' => 'Test User',
            'apellidos' => 'Test',
            'email' => 'test@test.com',
            'password' => bcrypt('password'),
            'email_verified_at' => now()
        ]);

        $pedido = Pedido::create([
            'user_id' => $user->id,
            'precio_total' => 100.00,
            'estado' => 'pendiente',
            'metodo_pago' => 'tarjeta'
        ]);

        $this->assertInstanceOf(User::class, $pedido->user);
        $this->assertEquals($user->id, $pedido->user->id);
    }
}