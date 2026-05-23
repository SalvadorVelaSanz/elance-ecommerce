<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ContactFormMail extends Mailable
{
    use SerializesModels;

    /**
     * Los datos del formulario de contacto
     *
     * @var array
     */
    public $formData;

    /**
     * Crear una nueva instancia del mensaje.
     */
    public function __construct(array $formData)
    {
        $this->formData = $formData;
    }

    /**
     * Obtener el sobre del mensaje.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Nuevo contacto de: ' . $this->formData['nombre'] . ' - ' . $this->formData['asunto'],
            replyTo: $this->formData['email']
        );
    }

    /**
     * Obtener la configuración de contenido del mensaje.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.contact-form',
        );
    }

    /**
     * Obtener los datos adjuntos del mensaje.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}