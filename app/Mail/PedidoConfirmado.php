<?php

namespace App\Mail;

use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use App\Models\Pedido;
use App\Models\User;

class PedidoConfirmado extends Mailable 
{
    use SerializesModels;

    /**
     * La instancia del pedido confirmado.
     *
     * @var \App\Models\Pedido
     */
    public $pedido;

    /**
     * La instancia del usuario que realizó el pedido.
     *
     * @var \App\Models\User
     */
    public $user;

    /**
     * Los detalles calculados del pedido (subtotal, envío, IVA, etc.).
     *
     * @var array
     */
    public $detalles;

    /**
     * Crear una nueva instancia de mensaje de confirmación de pedido.
     */
    public function __construct(Pedido $pedido, User $user, array $detalles = [])
    {
        $this->pedido = $pedido;
        $this->user = $user;
        $this->detalles = $detalles;
        
        Log::info('Generando correo de confirmación de pedido', [
            'pedido_id' => $pedido->id,
            'numero_seguimiento' => $pedido->numero_seguimiento,
            'user_email' => $user->email
        ]);
    }

    /**
     * Obtener la envoltura del mensaje.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Confirmación de pedido #' . ($this->pedido->numero_seguimiento ?? $this->pedido->id),
        );
    }

    /**
     * Obtener la configuración de contenido del mensaje.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.pedido-confirmado',
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