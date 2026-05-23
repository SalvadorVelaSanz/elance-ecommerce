<?php

namespace Tests\Feature\Checkout;

use Tests\TestCase;
use App\Models\Carrito;
use App\Models\Direccion;
use App\Models\Pedido;
use App\Models\ZonaEnvio;
use App\Models\ProvinciaEnvio;

class CheckoutControllerTest extends TestCase
{
    public function test_crear_pedido_valido_con_direccion()
    {
        $user = $this->authenticatedUser();
        $producto = $this->createTestProduct(['precio' => 50.00, 'stock' => 10]);
        
        // Crear dirección para el usuario
        $direccion = Direccion::create([
            'user_id' => $user->id,
            'nombre_direccion' => 'Casa',
            'calle' => 'Calle Test',
            'numero' => '123',
            'codigo_postal' => '28001',
            'ciudad' => 'Madrid',
            'provincia' => 'Madrid',
            'pais' => 'España',
            'es_principal' => true
        ]);

        $pedidoData = [
            'direccion_id' => $direccion->id,
            'metodo_pago' => 'tarjeta',
            'precio_total' => 62.50, // 50 + 2 envío + 10.5 IVA
            'costo_envio' => 2.00,
            'productos' => [
                [
                    'producto_id' => $producto->id,
                    'cantidad' => 1,
                    'precio_unitario' => 50.00
                ]
            ]
        ];

        $response = $this->postJson('/api/checkout/pedido', $pedidoData);

        $response->assertStatus(201)
                ->assertJsonStructure([
                    'message',
                    'pedido' => [
                        'id', 'numero_seguimiento', 'precio_total', 'estado'
                    ]
                ]);

        $this->assertDatabaseHas('pedidos', [
            'user_id' => $user->id,
            'direccion_id' => $direccion->id,
            'metodo_pago' => 'tarjeta'
        ]);
    }

    public function test_crear_pedido_recogida_presencial()
    {
        $user = $this->authenticatedUser();
        $producto = $this->createTestProduct(['precio' => 30.00, 'stock' => 5]);

        $pedidoData = [
            'direccion_id' => null,
            'metodo_pago' => 'presencial',
            'precio_total' => 36.30, // 30 + 0 envío + 6.30 IVA
            'costo_envio' => 0.00,
            'productos' => [
                [
                    'producto_id' => $producto->id,
                    'cantidad' => 1,
                    'precio_unitario' => 30.00
                ]
            ]
        ];

        $response = $this->postJson('/api/checkout/pedido', $pedidoData);

        $response->assertStatus(201);

        $this->assertDatabaseHas('pedidos', [
            'user_id' => $user->id,
            'direccion_id' => null,
            'metodo_pago' => 'presencial'
        ]);
    }

    public function test_crear_pedido_sin_stock_suficiente()
    {
        $user = $this->authenticatedUser();
        $producto = $this->createTestProduct(['precio' => 25.00, 'stock' => 1]);

        $pedidoData = [
            'metodo_pago' => 'presencial',
            'precio_total' => 60.50,
            'costo_envio' => 0.00,
            'productos' => [
                [
                    'producto_id' => $producto->id,
                    'cantidad' => 5, 
                    'precio_unitario' => 25.00
                ]
            ]
        ];

        $response = $this->postJson('/api/checkout/pedido', $pedidoData);

        $response->assertStatus(400)
                ->assertJsonFragment(['message' => 'Stock insuficiente para el producto: Producto Test']);
    }

    public function test_calcular_totales_carrito()
    {
        $user = $this->authenticatedUser();
        $producto = $this->createTestProduct(['precio' => 40.00]);
        
        Carrito::create([
            'user_id' => $user->id,
            'producto_id' => $producto->id,
            'cantidad' => 2
        ]);

        $response = $this->getJson('/api/checkout/totales?metodo_pago=presencial');

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'subtotal', 'shipping', 'vat', 'total'
                ])
                ->assertJson([
                    'subtotal' => 80.00,
                    'shipping' => 0.00,
                    'vat' => 16.80, // 21% de 80
                    'total' => 96.80
                ]);
    }

    public function test_verificar_carrito_con_productos()
    {
        $user = $this->authenticatedUser();
        $producto = $this->createTestProduct();
        
        Carrito::create([
            'user_id' => $user->id,
            'producto_id' => $producto->id,
            'cantidad' => 1
        ]);

        // CAMBIO: usar la ruta correcta que sí existe
        $response = $this->getJson('/api/carrito/check');

        $response->assertStatus(200)
                ->assertJson([
                    'hasItems' => true
                ]);
    }

    public function test_verificar_carrito_vacio()
    {
        $user = $this->authenticatedUser();

        // CAMBIO: usar la ruta correcta que sí existe
        $response = $this->getJson('/api/carrito/check');

        $response->assertStatus(200)
                ->assertJson([
                    'hasItems' => false
                ]);
    }
}