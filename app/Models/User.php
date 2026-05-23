<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Support\Facades\Mail;
use App\Mail\VerifyEmail;
use Illuminate\Support\Facades\Log;

class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * Los atributos que son asignables en masa.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'apellidos',
        'email',
        'password',
        'telefono',
        'direccion',
        'email_verified_at',
    ];

    /**
     * Los atributos que deben ocultarse para los arreglos.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Atributos que deben ser convertidos a tipos nativos.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_admin' => 'boolean',
            'is_suspended' => 'boolean',
        ];
    }
    
    /**
     * Verificar si el usuario es administrador
     */
    public function isAdmin()
    {
        return $this->is_admin;
    }
    
    /**
     * Enviar la notificación de verificación de correo electrónico.
     *
     * @return void
     */
    public function sendEmailVerificationNotification()
    {
        try {
            Mail::to($this->email)->send(new VerifyEmail($this));
            Log::info('Correo de verificación enviado a: ' . $this->email);
        } catch (\Exception $e) {
            Log::error('Error al enviar correo de verificación: ' . $e->getMessage());
        }
    }
    
    /**
     * Obtener el correo electrónico para la verificación.
     *
     * @return string
     */
    public function getEmailForVerification()
    {
        return $this->email;
    }
}