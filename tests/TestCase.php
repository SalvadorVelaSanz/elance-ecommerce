<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use App\Models\User;
use App\Models\Categoria;
use App\Models\Producto;
use App\Models\Imagen;
use Laravel\Sanctum\Sanctum;
use Illuminate\Database\Eloquent\Collection;

abstract class TestCase extends BaseTestCase
{
    use RefreshDatabase, WithFaker;

    /**
     * Setup que se ejecuta antes de cada test
     */
    protected function setUp(): void
    {
        parent::setUp();
        
        // Ejecutar migraciones en la BD de testing
        $this->artisan('migrate:fresh');
        
        // Crear datos básicos necesarios para las pruebas
        $this->createBasicTestData();
    }

    /**
     * Crear datos básicos para las pruebas
     */
    protected function createBasicTestData(): void
    {
        // Crear categoría básica
        Categoria::create([
            'id' => 1,
            'nombre' => 'Categoría Test',
            'publico_objetivo' => 'adulto',
            'temporada' => 'Primavera',
            'imagen_categoria' => 'https://example.com/categoria-test.jpg'
        ]);

        // Crear imagen básica
        Imagen::create([
            'id' => 1,
            'url' => 'https://example.com/test-image.jpg',
            'descripcion' => 'Imagen de prueba'
        ]);
    }

    /**
     * Crear y autenticar usuario normal
     */
    protected function authenticatedUser(array $attributes = []): User
    {
        $user = User::create(array_merge([
            'name' => 'Usuario Test',
            'apellidos' => 'Apellidos Test',
            'email' => 'user@test.com',
            'password' => bcrypt('password123'),
            'email_verified_at' => now(),
            'is_admin' => false,
            'is_suspended' => false,
        ], $attributes));

        Sanctum::actingAs($user);
        return $user;
    }

    /**
     * Crear y autenticar usuario administrador
     */
    protected function authenticatedAdmin(array $attributes = []): User
    {
        $user = User::create(array_merge([
            'name' => 'Admin Test',
            'apellidos' => 'Admin Apellidos',
            'email' => 'admin@test.com',
            'password' => bcrypt('password123'),
            'email_verified_at' => now(),
            'is_admin' => true,
            'is_suspended' => false,
        ], $attributes));

        Sanctum::actingAs($user);
        return $user;
    }

    /**
     * Crear usuario no verificado
     */
    protected function unverifiedUser(array $attributes = []): User
    {
        return User::create(array_merge([
            'name' => 'Usuario No Verificado',
            'apellidos' => 'Apellidos',
            'email' => 'unverified@test.com',
            'password' => bcrypt('password123'),
            'email_verified_at' => null,
            'is_admin' => false,
            'is_suspended' => false,
        ], $attributes));
    }

    /**
     * Crear producto de prueba
     */
    protected function createTestProduct(array $attributes = []): Producto
    {
        return Producto::create(array_merge([
            'nombre' => 'Producto Test',
            'descripcion' => 'Descripción del producto de prueba',
            'precio' => 29.99,
            'precio_original' => null,
            'porcentaje_descuento' => null,
            'fecha_inicio_descuento' => null,
            'fecha_fin_descuento' => null,
            'talla' => 'M',
            'stock' => 10,
            'categoria_id' => 1,
            'imagen_id' => 1,
        ], $attributes));
    }

    /**
     * Crear múltiples productos de prueba
     */
    protected function createTestProducts(int $count = 3): Collection
    {
        $products = new Collection();
        
        for ($i = 1; $i <= $count; $i++) {
            $products->push($this->createTestProduct([
                'nombre' => "Producto Test {$i}",
                'precio' => 20 + ($i * 10)
            ]));
        }
        
        return $products;
    }
}