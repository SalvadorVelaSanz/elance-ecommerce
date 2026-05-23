<?php

namespace App\Mail;

use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use App\Models\User;

class ResetPasswordMail extends Mailable 
{
    use SerializesModels;

    /**
     * La instancia del usuario 
     *
     * @var \App\Models\User
     */
    public $user;

    /**
     * La contraseña temporal generada para el usuario.
     *
     * @var string
     */
    public $temporaryPassword;

    /**
     * Crear una nueva instancia de mensaje de recuperación de contraseña.
     */
    public function __construct(User $user, string $temporaryPassword)
    {
        $this->user = $user;
        $this->temporaryPassword = $temporaryPassword;
    }

    /**
     * Obtener el asunto del mensaje.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Recuperación de Contraseña',
        );
    }

    /**
     * Obtener la configuración de contenido del mensaje.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.reset-password',
        );
    }

    /**
     * Obtener los datos de la vista del mensaje.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}