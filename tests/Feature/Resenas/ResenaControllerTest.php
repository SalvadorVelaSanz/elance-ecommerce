<?php

namespace Tests\Feature\Resenas;

use Tests\TestCase;
use App\Models\Resena;
use App\Models\User;

class ResenaControllerTest extends TestCase
{
    public function test_obtener_resenas_producto()
    {
        $producto = $this->createTestProduct();
        $user = User::create([
            'name' => 'Usuario Test',
            'apellidos' => 'Test',
            'email' => 'user@test.com',
            'password' => bcrypt('password'),
            'email_verified_at' => now()
        ]);
        
        Resena::create([
            'producto_id' => $producto->id,
            'user_id' => $user->id,
            'puntuacion' => 5,
            'comentario' => 'Excelente producto',
            'fecha_resena' => now()
        ]);

        $response = $this->getJson("/api/resenas/producto/{$producto->id}");

        $response->assertStatus(200)
                ->assertJsonStructure([
                    'success',
                    'data' => [
                        '*' => [
                            'id', 'puntuacion', 'comentario', 'fecha_resena', 'user'
                        ]
                    ]
                ])
                ->assertJson(['success' => true]);
    }

    public function test_verificar_usuario_sin_resena()
    {
        $user = $this->authenticatedUser();
        $producto = $this->createTestProduct();

        $response = $this->getJson("/api/resenas/check/{$producto->id}");

        $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'hasReview' => false,
                    'data' => null
                ]);
    }

    public function test_verificar_usuario_con_resena()
    {
        $user = $this->authenticatedUser();
        $producto = $this->createTestProduct();
        
        $resena = Resena::create([
            'producto_id' => $producto->id,
            'user_id' => $user->id,
            'puntuacion' => 4,
            'comentario' => 'Buen producto',
            'fecha_resena' => now()
        ]);

        $response = $this->getJson("/api/resenas/check/{$producto->id}");

        $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'hasReview' => true
                ])
                ->assertJsonStructure(['data' => ['id', 'puntuacion', 'comentario']]);
    }

    public function test_crear_primera_resena()
    {
        $user = $this->authenticatedUser();
        $producto = $this->createTestProduct();

        $resenaData = [
            'producto_id' => $producto->id,
            'puntuacion' => 5,
            'comentario' => 'Producto excelente, muy recomendable'
        ];

        $response = $this->postJson('/api/resenas', $resenaData);

        $response->assertStatus(201)
                ->assertJsonStructure([
                    'success', 'message',
                    'data' => ['id', 'puntuacion', 'comentario', 'user']
                ])
                ->assertJson([
                    'success' => true,
                    'message' => 'Reseña publicada con éxito'
                ]);

        $this->assertDatabaseHas('resenas', [
            'producto_id' => $producto->id,
            'user_id' => $user->id,
            'puntuacion' => 5,
            'comentario' => 'Producto excelente, muy recomendable'
        ]);
    }

    public function test_crear_resena_duplicada()
    {
        $user = $this->authenticatedUser();
        $producto = $this->createTestProduct();
        
        // Crear primera reseña
        Resena::create([
            'producto_id' => $producto->id,
            'user_id' => $user->id,
            'puntuacion' => 4,
            'comentario' => 'Primera reseña',
            'fecha_resena' => now()
        ]);

        $resenaData = [
            'producto_id' => $producto->id,
            'puntuacion' => 5,
            'comentario' => 'Segunda reseña'
        ];

        $response = $this->postJson('/api/resenas', $resenaData);

        $response->assertStatus(422)
                ->assertJson([
                    'success' => false,
                    'message' => 'Ya has publicado una reseña para este producto'
                ]);
    }

    public function test_crear_resena_con_datos_invalidos()
    {
        $user = $this->authenticatedUser();
        $producto = $this->createTestProduct();

        $resenaData = [
            'producto_id' => $producto->id,
            'puntuacion' => 6, // Fuera del rango 1-5
            'comentario' => '' // Vacío
        ];

        $response = $this->postJson('/api/resenas', $resenaData);

        $response->assertStatus(422)
                ->assertJsonValidationErrors(['puntuacion', 'comentario']);
    }

    public function test_actualizar_resena_propia()
    {
        $user = $this->authenticatedUser();
        $producto = $this->createTestProduct();
        
        $resena = Resena::create([
            'producto_id' => $producto->id,
            'user_id' => $user->id,
            'puntuacion' => 3,
            'comentario' => 'Comentario original',
            'fecha_resena' => now()
        ]);

        $updateData = [
            'puntuacion' => 5,
            'comentario' => 'Comentario actualizado'
        ];

        $response = $this->putJson("/api/resenas/{$resena->id}", $updateData);

        $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'message' => 'Reseña actualizada con éxito'
                ]);

        $this->assertDatabaseHas('resenas', [
            'id' => $resena->id,
            'puntuacion' => 5,
            'comentario' => 'Comentario actualizado'
        ]);
    }

    public function test_actualizar_resena_ajena()
    {
        $user1 = $this->authenticatedUser();
        $user2 = User::create([
            'name' => 'Otro Usuario',
            'apellidos' => 'Test',
            'email' => 'otro@test.com',
            'password' => bcrypt('password'),
            'email_verified_at' => now()
        ]);
        $producto = $this->createTestProduct();
       
       $resena = Resena::create([
           'producto_id' => $producto->id,
           'user_id' => $user2->id,
           'puntuacion' => 3,
           'comentario' => 'Comentario original',
           'fecha_resena' => now()
       ]);

       $updateData = [
           'puntuacion' => 5,
           'comentario' => 'Comentario actualizado'
       ];

       $response = $this->putJson("/api/resenas/{$resena->id}", $updateData);

       $response->assertStatus(404)
               ->assertJson([
                   'success' => false,
                   'message' => 'Reseña no encontrada o no tienes permiso para editarla'
               ]);
   }

   public function test_eliminar_resena_propia()
   {
       $user = $this->authenticatedUser();
       $producto = $this->createTestProduct();
       
       $resena = Resena::create([
           'producto_id' => $producto->id,
           'user_id' => $user->id,
           'puntuacion' => 4,
           'comentario' => 'Para eliminar',
           'fecha_resena' => now()
       ]);

       $response = $this->deleteJson("/api/resenas/{$resena->id}");

       $response->assertStatus(200)
               ->assertJson([
                   'success' => true,
                   'message' => 'Reseña eliminada con éxito'
               ]);

       $this->assertDatabaseMissing('resenas', ['id' => $resena->id]);
   }

   public function test_eliminar_resena_ajena()
   {
       $user1 = $this->authenticatedUser();
       $user2 = User::create([
           'name' => 'Otro Usuario',
           'apellidos' => 'Test',
           'email' => 'otro@test.com',
           'password' => bcrypt('password'),
           'email_verified_at' => now()
       ]);
       
       $producto = $this->createTestProduct();
       $resena = Resena::create([
           'producto_id' => $producto->id,
           'user_id' => $user2->id,
           'puntuacion' => 4,
           'comentario' => 'Reseña ajena',
           'fecha_resena' => now()
       ]);

       $response = $this->deleteJson("/api/resenas/{$resena->id}");

       $response->assertStatus(404)
               ->assertJson([
                   'success' => false,
                   'message' => 'Reseña no encontrada o no tienes permiso para eliminarla'
               ]);
   }

   public function test_admin_puede_listar_todas_las_resenas()
   {
       $admin = $this->authenticatedAdmin();
       $user = User::create([
           'name' => 'Usuario Test',
           'apellidos' => 'Test',
           'email' => 'user@test.com',
           'password' => bcrypt('password'),
           'email_verified_at' => now()
       ]);
       
       $producto = $this->createTestProduct();
       
       Resena::create([
           'producto_id' => $producto->id,
           'user_id' => $user->id,
           'puntuacion' => 5,
           'comentario' => 'Reseña de prueba',
           'fecha_resena' => now()
       ]);

       $response = $this->getJson('/api/admin/resenas');

       $response->assertStatus(200)
               ->assertJsonStructure([
                   'success',
                   'data',
                   'pagination' => [
                       'total', 'per_page', 'current_page', 'last_page'
                   ]
               ]);
   }

   public function test_admin_puede_eliminar_cualquier_resena()
   {
       $admin = $this->authenticatedAdmin();
       $user = User::create([
           'name' => 'Usuario Test',
           'apellidos' => 'Test',
           'email' => 'user@test.com',
           'password' => bcrypt('password'),
           'email_verified_at' => now()
       ]);
       
       $producto = $this->createTestProduct();
       $resena = Resena::create([
           'producto_id' => $producto->id,
           'user_id' => $user->id,
           'puntuacion' => 2,
           'comentario' => 'Reseña inapropiada',
           'fecha_resena' => now()
       ]);

       $response = $this->deleteJson("/api/admin/resenas/{$resena->id}");

       $response->assertStatus(200)
               ->assertJson([
                   'success' => true,
                   'message' => 'Reseña eliminada con éxito'
               ]);

       $this->assertDatabaseMissing('resenas', ['id' => $resena->id]);
   }

   public function test_usuario_normal_no_puede_acceder_admin_resenas()
   {
       $user = $this->authenticatedUser();

       $response = $this->getJson('/api/admin/resenas');

       $response->assertStatus(403);
   }

   public function test_crear_resena_sin_autenticacion()
   {
       $producto = $this->createTestProduct();

       $resenaData = [
           'producto_id' => $producto->id,
           'puntuacion' => 5,
           'comentario' => 'Producto excelente'
       ];

       $response = $this->postJson('/api/resenas', $resenaData);

       $response->assertStatus(401);
   }
}