<?php

namespace App\Mail;

use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Log;
use App\Models\User;

class VerifyEmail extends Mailable 
{
    use SerializesModels;

    /**
     * La instancia del usuario que está verificando su correo electrónico.
     *
     * @var \App\Models\User
     */
    public $user;

    /**
     * La URL de verificación generada para el usuario.
     *
     * @var string
     */
    public $verificationUrl;

    /**
     * Crear una nueva instancia de mensaje de verificación de correo electrónico.
     */
    public function __construct(User $user)
    {
        $this->user = $user;
        $this->verificationUrl = $this->generateVerificationUrl($user);
        Log::info('Generando URL de verificación para: ' . $user->email);
    }

    /**
     * Obtener la envoltura del mensaje.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Verifica tu dirección de correo electrónico',
        );
    }

    /**
     * Obtener la configuración de contenido del mensaje.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.verify-email',
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

    /**
     * Generar la URL de verificación firmada que se le da al usuario .
     */
    protected function generateVerificationUrl(User $user): string
    {
        // Generamos la URL firmada que Laravel proporciona
        $backendUrl = URL::temporarySignedRoute(
            'verification.verify',
            Carbon::now()->addMinutes(Config::get('auth.verification.expire', 60)),
            [
                'id' => $user->getKey(),
                'hash' => sha1($user->getEmailForVerification()),
            ]
        );
        
        // Parseamos la URL para extraer los parámetros
        $parsedUrl = parse_url($backendUrl);
        $query = [];
        
        if (isset($parsedUrl['query'])) {
            parse_str($parsedUrl['query'], $query);
        }
        
        // Construimos la URL del frontend (que debe estar definida en el .env)
        $frontendUrl = env('FRONTEND_URL', 'http://127.0.0.1:8000');
        $verifyRoute = env('VERIFY_EMAIL_ROUTE', '/verify-email');
        
        // URL completa para el frontend
        $finalUrl = $frontendUrl . $verifyRoute . '?' . http_build_query([
            'id' => $user->getKey(),
            'hash' => sha1($user->getEmailForVerification()),
            'expires' => $query['expires'] ?? Carbon::now()->addHour()->timestamp,
            'signature' => $query['signature'] ?? ''
        ]);
        
        Log::info('URL de verificación generada: ' . $finalUrl);
        
        return $finalUrl;
    }
}