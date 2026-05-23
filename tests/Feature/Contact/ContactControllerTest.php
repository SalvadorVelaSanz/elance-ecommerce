<?php

namespace Tests\Feature\Contact;

use Tests\TestCase;
use Illuminate\Support\Facades\Mail;
use App\Mail\ContactFormMail;

class ContactControllerTest extends TestCase
{
    public function test_enviar_mensaje_contacto_valido()
    {
        Mail::fake();

        $messageData = [
            'nombre' => 'Juan Pérez',
            'email' => 'juan@example.com',
            'asunto' => 'Consulta sobre productos',
            'mensaje' => 'Hola, tengo una pregunta sobre sus productos.'
        ];

        $response = $this->postJson('/api/contact', $messageData);

        $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'message' => '¡Mensaje enviado correctamente! Nos pondremos en contacto pronto.'
                ]);

        Mail::assertSent(ContactFormMail::class, function ($mail) use ($messageData) {
            return $mail->hasTo('salvadorvelasan@gmail.com');
        });
    }

    public function test_enviar_mensaje_con_email_invalido()
    {
        $messageData = [
            'nombre' => 'Juan Pérez',
            'email' => 'email-invalido',
            'asunto' => 'Consulta',
            'mensaje' => 'Mensaje de prueba'
        ];

        $response = $this->postJson('/api/contact', $messageData);

        $response->assertStatus(422)
                ->assertJsonValidationErrors('email');
    }

    public function test_enviar_mensaje_campos_requeridos_faltantes()
    {
        $response = $this->postJson('/api/contact', []);

        $response->assertStatus(422)
                ->assertJsonValidationErrors(['nombre', 'email', 'asunto', 'mensaje']);
    }

    public function test_mensaje_demasiado_largo()
    {
        $messageData = [
            'nombre' => 'Juan Pérez',
            'email' => 'juan@example.com',
            'asunto' => 'Consulta',
            'mensaje' => str_repeat('a', 5001) // Más de 5000 caracteres
        ];

        $response = $this->postJson('/api/contact', $messageData);

        $response->assertStatus(422)
                ->assertJsonValidationErrors('mensaje');
    }

    public function test_nombre_demasiado_largo()
    {
        $messageData = [
            'nombre' => str_repeat('Juan', 100), // Más de 255 caracteres
            'email' => 'juan@example.com',
            'asunto' => 'Consulta',
            'mensaje' => 'Mensaje válido'
        ];

        $response = $this->postJson('/api/contact', $messageData);

        $response->assertStatus(422)
                ->assertJsonValidationErrors('nombre');
    }
}