<?php

namespace Tests\Feature\Direcciones;

use Tests\TestCase;
use App\Models\Direccion;
use App\Models\User;

class DireccionControllerTest extends TestCase
{
    public function test_listar_direcciones_usuario()
    {
        $user = $this->authenticatedUser();
        
        Direccion::create([
            'user_id' => $user->id,
            'nombre_direccion' => 'Casa',
            'calle' => 'Calle Principal',
            'numero' => '123',
            'codigo_postal' => '28001',
            'ciudad' => 'Madrid',
            'provincia' => 'Madrid',
            'pais' => 'España',
            'es_principal' => true
        ]);

        $response = $this->getJson('/api/direcciones');

        $response->assertStatus(200)
                ->assertJsonCount(1)
                ->assertJsonFragment(['nombre_direccion' => 'Casa']);
    }

    public function test_crear_primera_direccion_es_principal()
    {
        $user = $this->authenticatedUser();

        $direccionData = [
            'nombre_direccion' => 'Oficina',
            'calle' => 'Avenida Test',
            'numero' => '456',
            'codigo_postal' => '28002',
            'ciudad' => 'Madrid',
            'provincia' => 'Madrid',
            'pais' => 'España',
            'es_principal' => false // Aunque sea false, debe ser true por ser la primera
        ];

        $response = $this->postJson('/api/direcciones', $direccionData);

        $response->assertStatus(201);

        $this->assertDatabaseHas('direcciones', [
            'user_id' => $user->id,
            'nombre_direccion' => 'Oficina',
            'es_principal' => true // Debe ser true automáticamente
        ]);
    }

    public function test_crear_direccion_adicional()
    {
        $user = $this->authenticatedUser();
        
        // Crear primera dirección
        Direccion::create([
            'user_id' => $user->id,
            'nombre_direccion' => 'Casa',
            'calle' => 'Calle Principal',
            'numero' => '123',
            'codigo_postal' => '28001',
            'ciudad' => 'Madrid',
            'provincia' => 'Madrid',
            'pais' => 'España',
            'es_principal' => true
        ]);

        $direccionData = [
            'nombre_direccion' => 'Trabajo',
            'calle' => 'Calle Trabajo',
            'numero' => '789',
            'codigo_postal' => '28003',
            'ciudad' => 'Madrid',
            'provincia' => 'Madrid',
            'pais' => 'España'
        ];

        $response = $this->postJson('/api/direcciones', $direccionData);

        $response->assertStatus(201);

        $this->assertDatabaseHas('direcciones', [
            'user_id' => $user->id,
            'nombre_direccion' => 'Trabajo',
            'es_principal' => false // No debe ser principal
        ]);
    }

    public function test_obtener_direccion_especifica()
    {
        $user = $this->authenticatedUser();
        
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

        $response = $this->getJson("/api/direcciones/{$direccion->id}");

        $response->assertStatus(200)
                ->assertJson([
                    'id' => $direccion->id,
                    'nombre_direccion' => 'Casa'
                ]);
    }

    public function test_obtener_direccion_de_otro_usuario()
    {
        $user1 = $this->authenticatedUser();
        $user2 = User::create([
            'name' => 'Otro Usuario',
            'apellidos' => 'Test',
            'email' => 'otro@test.com',
            'password' => bcrypt('password'),
            'email_verified_at' => now()
        ]);
        
        $direccion = Direccion::create([
            'user_id' => $user2->id,
            'nombre_direccion' => 'Casa Ajena',
            'calle' => 'Calle Ajena',
            'numero' => '123',
            'codigo_postal' => '28001',
            'ciudad' => 'Madrid',
            'provincia' => 'Madrid',
            'pais' => 'España',
            'es_principal' => true
        ]);

        $response = $this->getJson("/api/direcciones/{$direccion->id}");

        $response->assertStatus(404);
    }

    public function test_actualizar_direccion_propia()
    {
        $user = $this->authenticatedUser();
        
        $direccion = Direccion::create([
            'user_id' => $user->id,
            'nombre_direccion' => 'Casa Original',
            'calle' => 'Calle Original',
            'numero' => '123',
            'codigo_postal' => '28001',
            'ciudad' => 'Madrid',
            'provincia' => 'Madrid',
            'pais' => 'España',
            'es_principal' => true
        ]);

        $updateData = [
            'nombre_direccion' => 'Casa Actualizada',
            'calle' => 'Calle Actualizada'
        ];

        $response = $this->putJson("/api/direcciones/{$direccion->id}", $updateData);

        $response->assertStatus(200);

        $this->assertDatabaseHas('direcciones', [
            'id' => $direccion->id,
            'nombre_direccion' => 'Casa Actualizada',
            'calle' => 'Calle Actualizada'
        ]);
    }

    public function test_establecer_direccion_como_principal()
    {
        $user = $this->authenticatedUser();
        
        // Crear primera dirección principal
        $direccion1 = Direccion::create([
            'user_id' => $user->id,
            'nombre_direccion' => 'Casa',
            'calle' => 'Calle Casa',
            'numero' => '123',
            'codigo_postal' => '28001',
            'ciudad' => 'Madrid',
            'provincia' => 'Madrid',
            'pais' => 'España',
            'es_principal' => true
        ]);

        // Crear segunda dirección
        $direccion2 = Direccion::create([
            'user_id' => $user->id,
            'nombre_direccion' => 'Trabajo',
            'calle' => 'Calle Trabajo',
            'numero' => '456',
            'codigo_postal' => '28002',
            'ciudad' => 'Madrid',
            'provincia' => 'Madrid',
            'pais' => 'España',
            'es_principal' => false
        ]);

        $response = $this->putJson("/api/direcciones/{$direccion2->id}/set-principal");

        $response->assertStatus(200);

        // Verificar que direccion2 ahora es principal
        $this->assertDatabaseHas('direcciones', [
            'id' => $direccion2->id,
            'es_principal' => true
        ]);

        // Verificar que direccion1 ya no es principal
        $this->assertDatabaseHas('direcciones', [
            'id' => $direccion1->id,
            'es_principal' => false
        ]);
    }

    public function test_eliminar_direccion_sin_pedidos()
    {
        $user = $this->authenticatedUser();
        
        $direccion = Direccion::create([
            'user_id' => $user->id,
            'nombre_direccion' => 'Para Eliminar',
            'calle' => 'Calle Test',
            'numero' => '123',
            'codigo_postal' => '28001',
            'ciudad' => 'Madrid',
            'provincia' => 'Madrid',
            'pais' => 'España',
            'es_principal' => false
        ]);

        $response = $this->deleteJson("/api/direcciones/{$direccion->id}");

        $response->assertStatus(200)
                ->assertJsonFragment(['eliminacion_segura' => true]);

        $this->assertDatabaseMissing('direcciones', ['id' => $direccion->id]);
    }
}