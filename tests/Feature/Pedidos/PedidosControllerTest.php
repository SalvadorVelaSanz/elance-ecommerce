<?php

namespace Tests\Feature\Pedidos;

use Tests\TestCase;
use App\Models\Pedido;
use App\Models\DetallePedido;
use App\Models\Direccion;
use App\Models\User;

class PedidosControllerTest extends TestCase
{
    protected function createTestPedido($user, $attributes = [])
    {
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

        return Pedido::create(array_merge([
            'user_id' => $user->id,
            'precio_total' => 100.00,
            'estado' => 'pendiente',
            'direccion_id' => $direccion->id,
            'metodo_pago' => 'tarjeta'
        ], $attributes));
    }

    public function test_listar_pedidos_usuario()
    {
        $user = $this->authenticatedUser();
        $pedido = $this->createTestPedido($user);
        
        $response = $this->getJson('/api/pedidos');

        $response->assertStatus(200)
                ->assertJsonCount(1)
                ->assertJsonStructure([
                    '*' => [
                        'id', 'precio_total', 'estado', 'created_at',
                        'numero_seguimiento', 'metodo_pago'
                    ]
                ]);
    }

    public function test_obtener_pedido_especifico_propio()
    {
        $user = $this->authenticatedUser();
        $pedido = $this->createTestPedido($user);

        $response = $this->getJson("/api/pedidos/{$pedido->id}");

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'id', 'precio_total', 'estado', 'metodo_pago',
                    'numero_seguimiento', 'direccion', 'detalles'
                ])
                ->assertJson(['id' => $pedido->id]);
    }

    public function test_obtener_pedido_de_otro_usuario()
    {
        $user1 = $this->authenticatedUser();
        $user2 = User::create([
            'name' => 'Otro Usuario',
            'apellidos' => 'Test',
            'email' => 'otro@test.com',
            'password' => bcrypt('password'),
            'email_verified_at' => now()
        ]);
        
        $pedido = $this->createTestPedido($user2);

        $response = $this->getJson("/api/pedidos/{$pedido->id}");

        $response->assertStatus(404);
    }

    public function test_cancelar_pedido_pendiente()
    {
        $user = $this->authenticatedUser();
        $pedido = $this->createTestPedido($user, ['estado' => 'pendiente']);

        $response = $this->putJson("/api/pedidos/{$pedido->id}/cancelar");

        $response->assertStatus(200)
                ->assertJsonFragment(['message' => 'Pedido cancelado correctamente']);

        $this->assertDatabaseHas('pedidos', [
            'id' => $pedido->id,
            'estado' => 'cancelado'
        ]);
    }

    public function test_cancelar_pedido_procesando()
    {
        $user = $this->authenticatedUser();
        $pedido = $this->createTestPedido($user, ['estado' => 'procesando']);

        $response = $this->putJson("/api/pedidos/{$pedido->id}/cancelar");

        $response->assertStatus(200);

        $this->assertDatabaseHas('pedidos', [
            'id' => $pedido->id,
            'estado' => 'cancelado'
        ]);
    }

    public function test_no_puede_cancelar_pedido_entregado()
    {
        $user = $this->authenticatedUser();
        $pedido = $this->createTestPedido($user, ['estado' => 'entregado']);

        $response = $this->putJson("/api/pedidos/{$pedido->id}/cancelar");

        $response->assertStatus(400)
                ->assertJsonFragment(['message' => 'No se puede cancelar un pedido en estado: entregado']);
    }

    public function test_admin_puede_listar_todos_los_pedidos()
    {
        $admin = $this->authenticatedAdmin();
        $user = User::create([
            'name' => 'Usuario Test',
            'apellidos' => 'Test',
            'email' => 'user@test.com',
            'password' => bcrypt('password'),
            'email_verified_at' => now()
        ]);
        
        $this->createTestPedido($user);
        $this->createTestPedido($admin);

        $response = $this->getJson('/api/admin/pedidos');

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'data',
                    'pagination' => [
                        'current_page', 'last_page', 'per_page', 'total'
                    ]
                ]);
    }

    public function test_admin_puede_actualizar_estado_pedido()
    {
        $admin = $this->authenticatedAdmin();
        $user = User::create([
            'name' => 'Usuario Test',
            'apellidos' => 'Test',
            'email' => 'user@test.com',
            'password' => bcrypt('password'),
            'email_verified_at' => now()
        ]);
        
        $pedido = $this->createTestPedido($user, ['estado' => 'pendiente']);

        $response = $this->putJson("/api/admin/pedidos/{$pedido->id}/estado", [
            'estado' => 'procesando'
        ]);

        $response->assertStatus(200)
                ->assertJsonFragment(['message' => 'Estado del pedido actualizado correctamente']);

        $this->assertDatabaseHas('pedidos', [
            'id' => $pedido->id,
            'estado' => 'procesando'
        ]);
    }

    public function test_admin_puede_actualizar_seguimiento()
    {
        $admin = $this->authenticatedAdmin();
        $user = User::create([
            'name' => 'Usuario Test',
            'apellidos' => 'Test',
            'email' => 'user@test.com',
            'password' => bcrypt('password'),
            'email_verified_at' => now()
        ]);
        
        $pedido = $this->createTestPedido($user);

        $response = $this->putJson("/api/admin/pedidos/{$pedido->id}/seguimiento", [
            'numero_seguimiento' => 'ES123456789012'
        ]);

        $response->assertStatus(200)
                ->assertJsonFragment(['message' => 'Número de seguimiento actualizado correctamente']);

        $this->assertDatabaseHas('pedidos', [
            'id' => $pedido->id,
            'numero_seguimiento' => 'ES123456789012'
        ]);
    }

    public function test_admin_puede_cancelar_cualquier_pedido()
    {
        $admin = $this->authenticatedAdmin();
        $user = User::create([
            'name' => 'Usuario Test',
            'apellidos' => 'Test',
            'email' => 'user@test.com',
            'password' => bcrypt('password'),
            'email_verified_at' => now()
        ]);
        
        $pedido = $this->createTestPedido($user, ['estado' => 'enviado']);

        $response = $this->putJson("/api/admin/pedidos/{$pedido->id}/cancelar");

        $response->assertStatus(200);

        $this->assertDatabaseHas('pedidos', [
            'id' => $pedido->id,
            'estado' => 'cancelado'
        ]);
    }

    public function test_usuario_normal_no_puede_acceder_admin_pedidos()
    {
        $user = $this->authenticatedUser();

        $response = $this->getJson('/api/admin/pedidos');

        $response->assertStatus(403);
    }
}