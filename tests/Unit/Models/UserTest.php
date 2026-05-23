<?php

namespace Tests\Unit\Models;

use Tests\TestCase;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserTest extends TestCase
{
    public function test_is_admin_retorna_true_para_administrador()
    {
        $admin = User::create([
            'name' => 'Admin',
            'apellidos' => 'Test',
            'email' => 'admin@test.com',
            'password' => bcrypt('password'),
            'is_admin' => true,
            'email_verified_at' => now(),
        ]);
        
        $this->assertTrue($admin->isAdmin());
    }

    public function test_is_admin_retorna_false_para_usuario_normal()
    {
        $user = User::create([
            'name' => 'User',
            'apellidos' => 'Test',
            'email' => 'user@test.com',
            'password' => bcrypt('password'),
            'is_admin' => false,
            'email_verified_at' => now(),
        ]);
        
        $this->assertFalse($user->isAdmin());
    }

    public function test_password_es_hasheada_automaticamente()
    {
        $user = User::create([
            'name' => 'User',
            'apellidos' => 'Test',
            'email' => 'user@test.com',
            'password' => 'plaintext',
            'email_verified_at' => now(),
        ]);
        
        $this->assertTrue(Hash::check('plaintext', $user->password));
    }

    public function test_usuario_sin_verificar_email()
    {
        $user = User::create([
            'name' => 'User',
            'apellidos' => 'Test',
            'email' => 'user@test.com',
            'password' => bcrypt('password'),
            'email_verified_at' => null,
        ]);
        
        $this->assertFalse($user->hasVerifiedEmail());
    }
}