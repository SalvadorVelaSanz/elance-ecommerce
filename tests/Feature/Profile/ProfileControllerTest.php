<?php

namespace Tests\Feature\Profile;

use Tests\TestCase;
use App\Models\User;
use Illuminate\Support\Facades\Mail;

class ProfileControllerTest extends TestCase
{
    public function test_obtener_perfil_usuario_autenticado()
    {
        $user = $this->authenticatedUser([
            'name' => 'Juan',
            'apellidos' => 'Pérez',
            'email' => 'juan@test.com',
            'telefono' => '123456789'
        ]);

        $response = $this->getJson('/api/profile');

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'name', 'apellidos', 'email', 'telefono', 'email_verified'
                ])
                ->assertJson([
                    'name' => 'Juan',
                    'apellidos' => 'Pérez',
                    'email' => 'juan@test.com',
                    'telefono' => '123456789',
                    'email_verified' => true
                ]);
    }

    public function test_actualizar_perfil_sin_cambio_email()
    {
        $user = $this->authenticatedUser([
            'email' => 'original@test.com'
        ]);

        $updateData = [
            'name' => 'Nombre Actualizado',
            'apellidos' => 'Apellidos Actualizados',
            'email' => 'original@test.com',
            'telefono' => '987654321'
        ];

        $response = $this->putJson('/api/profile', $updateData);

        $response->assertStatus(200)
                ->assertJson([
                    'message' => 'Perfil actualizado con éxito',
                    'email_changed' => false,
                    'email_verified' => true
                ]);

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'name' => 'Nombre Actualizado',
            'apellidos' => 'Apellidos Actualizados',
            'telefono' => '987654321'
        ]);
    }

    public function test_actualizar_perfil_con_nuevo_email()
    {
        Mail::fake();
        
        $user = $this->authenticatedUser([
            'email' => 'original@test.com'
        ]);

        $updateData = [
            'name' => 'Juan',
            'apellidos' => 'Pérez',
            'email' => 'nuevo@test.com',
            'telefono' => '123456789'
        ];

        $response = $this->putJson('/api/profile', $updateData);

        $response->assertStatus(200)
                ->assertJson([
                    'email_changed' => true,
                    'email_verified' => false
                ])
                // CAMBIO: verificar el mensaje exacto completo
                ->assertJsonFragment(['message' => 'Perfil actualizado con éxito. Hemos enviado un correo de verificación a tu nueva dirección de email.']);

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'email' => 'nuevo@test.com',
            'email_verified_at' => null
        ]);
    }

    public function test_actualizar_con_email_duplicado()
    {
        $user1 = $this->authenticatedUser(['email' => 'user1@test.com']);
        $user2 = User::create([
            'name' => 'Usuario 2',
            'apellidos' => 'Test',
            'email' => 'user2@test.com',
            'password' => bcrypt('password'),
            'email_verified_at' => now()
        ]);

        $updateData = [
            'name' => 'Juan',
            'apellidos' => 'Pérez',
            'email' => 'user2@test.com', 
            'telefono' => '123456789'
        ];

        $response = $this->putJson('/api/profile', $updateData);

        $response->assertStatus(422)
                ->assertJsonValidationErrors('email');
    }

    public function test_admin_puede_listar_usuarios()
    {
        $admin = $this->authenticatedAdmin();
        
        // Crear usuarios adicionales
        User::create([
            'name' => 'Usuario 1',
            'apellidos' => 'Test',
            'email' => 'user1@test.com',
            'password' => bcrypt('password'),
            'email_verified_at' => now()
        ]);

        $response = $this->getJson('/api/admin/users');

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'data',
                    'pagination' => [
                        'current_page', 'last_page', 'per_page', 'total'
                    ]
                ]);
    }

    public function test_admin_puede_suspender_usuario()
    {
        $admin = $this->authenticatedAdmin();
        $user = User::create([
            'name' => 'Usuario Test',
            'apellidos' => 'Test',
            'email' => 'user@test.com',
            'password' => bcrypt('password'),
            'email_verified_at' => now(),
            'is_suspended' => false
        ]);

        $response = $this->putJson("/api/admin/users/{$user->id}/toggle-suspension");

        $response->assertStatus(200)
                ->assertJsonFragment(['message' => 'Usuario suspendido exitosamente']);

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'is_suspended' => true
        ]);
    }

    public function test_admin_puede_reactivar_usuario()
    {
        $admin = $this->authenticatedAdmin();
        $user = User::create([
            'name' => 'Usuario Test',
            'apellidos' => 'Test',
            'email' => 'user@test.com',
            'password' => bcrypt('password'),
            'email_verified_at' => now(),
            'is_suspended' => true
        ]);

        $response = $this->putJson("/api/admin/users/{$user->id}/toggle-suspension");

        $response->assertStatus(200)
                ->assertJsonFragment(['message' => 'Usuario reactivado exitosamente']);

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'is_suspended' => false
        ]);
    }

    public function test_admin_no_puede_suspender_otro_admin()
    {
        $admin1 = $this->authenticatedAdmin();
        $admin2 = User::create([
            'name' => 'Admin 2',
            'apellidos' => 'Test',
            'email' => 'admin2@test.com',
            'password' => bcrypt('password'),
            'email_verified_at' => now(),
            'is_admin' => true
        ]);

        $response = $this->putJson("/api/admin/users/{$admin2->id}/toggle-suspension");

        $response->assertStatus(400)
                ->assertJson(['error' => 'No se puede suspender a un administrador']);
    }

    public function test_admin_puede_eliminar_usuario()
    {
        $admin = $this->authenticatedAdmin();
        $user = User::create([
            'name' => 'Usuario Para Eliminar',
            'apellidos' => 'Test',
            'email' => 'eliminar@test.com',
            'password' => bcrypt('password'),
            'email_verified_at' => now()
        ]);

        $response = $this->deleteJson("/api/admin/users/{$user->id}");

        $response->assertStatus(200)
                ->assertJson(['message' => 'Usuario eliminado exitosamente']);

        $this->assertDatabaseMissing('users', ['id' => $user->id]);
    }

    public function test_admin_no_puede_eliminar_otro_admin()
    {
        $admin1 = $this->authenticatedAdmin();
        $admin2 = User::create([
            'name' => 'Admin 2',
            'apellidos' => 'Test',
            'email' => 'admin2@test.com',
            'password' => bcrypt('password'),
            'email_verified_at' => now(),
            'is_admin' => true
        ]);

        $response = $this->deleteJson("/api/admin/users/{$admin2->id}");

        $response->assertStatus(400)
                ->assertJson(['error' => 'No se puede eliminar a un administrador']);
    }

    public function test_usuario_normal_no_puede_acceder_admin_users()
    {
        $user = $this->authenticatedUser();

        $response = $this->getJson('/api/admin/users');

        $response->assertStatus(403);
    }
}