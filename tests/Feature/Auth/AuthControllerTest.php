<?php

namespace Tests\Feature\Auth;

use Tests\TestCase;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use App\Mail\VerifyEmail;

class AuthControllerTest extends TestCase
{
    public function test_usuario_puede_hacer_login_con_credenciales_validas()
    {
        $user = User::create([
            'name' => 'Test User',
            'apellidos' => 'Test Apellidos',
            'email' => 'test@example.com',
            'password' => Hash::make('password123'),
            'email_verified_at' => now(),
            'is_suspended' => false,
            'is_admin' => false,
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'test@example.com',
            'password' => 'password123',
        ]);

        // DEBUGGING: Ver qué está devolviendo
        if ($response->status() !== 200) {
            dd([
                'status' => $response->status(),
                'response' => $response->json(),
                'user_created' => $user->toArray(),
                'user_from_db' => User::where('email', 'test@example.com')->first()->toArray()
            ]);
        }

        $response->assertStatus(200)
                ->assertJsonStructure(['message', 'token', 'email_verified'])
                ->assertJson(['message' => 'Login exitoso', 'email_verified' => true]);

        $this->assertNotNull($response->json('token'));
    }

    public function test_login_falla_con_credenciales_incorrectas()
    {
        $user = User::create([
            'name' => 'Test User',
            'apellidos' => 'Test Apellidos',
            'email' => 'test@example.com',
            'password' => Hash::make('password123'),
            'email_verified_at' => now(),
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'test@example.com',
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(401)
                ->assertJson(['message' => 'Credenciales incorrectas']);
    }

    public function test_usuario_suspendido_no_puede_hacer_login()
    {
        $user = User::create([
            'name' => 'Test User',
            'apellidos' => 'Test Apellidos',
            'email' => 'test@example.com',
            'password' => Hash::make('password123'),
            'email_verified_at' => now(),
            'is_suspended' => true,
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'test@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(403)
                ->assertJson(['suspended' => true]);
    }

    public function test_registro_exitoso_crea_usuario_y_envia_email()
    {
        Mail::fake();

        $userData = [
            'name' => 'John',
            'apellidos' => 'Doe',
            'email' => 'john@example.com',
            'telefono' => '123456789',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ];

        $response = $this->postJson('/api/register', $userData);

        $response->assertStatus(200)
                ->assertJsonStructure(['message', 'token', 'user']);

        $this->assertDatabaseHas('users', [
            'email' => 'john@example.com',
            'is_admin' => false,
        ]);

        Mail::assertSent(VerifyEmail::class);
    }

    public function test_logout_elimina_tokens()
    {
        $user = $this->authenticatedUser();
        
        $token = $user->createToken('test-token');
        
        $this->withHeaders([
            'Authorization' => 'Bearer ' . $token->plainTextToken,
        ]);

        $this->assertGreaterThan(0, $user->tokens()->count());

        $response = $this->postJson('/api/logout');

        $response->assertStatus(200);
        
        $this->assertEquals(0, $user->fresh()->tokens()->count());
    }
}