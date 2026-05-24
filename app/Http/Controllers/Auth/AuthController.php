<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Foundation\Auth\EmailVerificationRequest;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use App\Mail\VerifyEmail;
use App\Mail\ResetPasswordMail;
use Illuminate\Support\Str;
class AuthController extends Controller
{
    // Método para login
  public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        // Intentar autenticar al usuario
        if (Auth::attempt(['email' => $request->email, 'password' => $request->password])) {
            $user = Auth::user();
            
            // Verificar si el usuario está suspendido
            if ($user->is_suspended) {
                // Si el usuario está suspendido, cerrar la sesión y devolver error
                Auth::logout();
                return response()->json([
                    'message' => 'Tu cuenta ha sido suspendida. Contacta con el administrador.',
                    'suspended' => true
                ], 403);
            }
            
            // Verificar si el correo ha sido verificado
            if (!$user->hasVerifiedEmail()) {
                return response()->json([
                    'message' => 'Por favor, verifica tu correo electrónico antes de iniciar sesión',
                    'email_verified' => false
                ], 403);
            }
            
            // Si el usuario es autenticado y verificado, generamos el token de acceso
            $token = $user->createToken('ElanceSesion')->plainTextToken;

            // Retornar el token de acceso
            return response()->json([
                'message' => 'Login exitoso',
                'token' => $token,
                'email_verified' => true
            ]);
        }

        return response()->json([
            'message' => 'Credenciales incorrectas'
        ], 401);
    }

    // Método para obtener el usuario autenticado
    public function user(Request $request)
    {
        // Asegurar que el usuario autenticado siempre incluya el campo is_admin
        $user = $request->user();
        
        // Crear un array asegurándonos de que is_admin sea siempre un bool
        $userData = $user->toArray();
        $userData['is_admin'] = (bool)$user->is_admin;

        return response()->json($userData);
    }
    // Método para logout (cerrar sesión)
     public function logout(Request $request)
    {
        $request->user()->tokens->each(function ($token) {
            $token->delete(); // Eliminar todos los tokens del usuario
        });

        return response()->json([
            'message' => 'Sesión cerrada exitosamente'
        ]);
    }

    // Método para registro
    public function register(Request $request)
    {
        // Validación de los datos de entrada
        $request->validate([
            'name' => 'required|string|max:255',
            'apellidos' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'telefono' => 'nullable|numeric',
            'password' => 'required|min:8|confirmed',
        ]);
    
        // Crear el usuario
        $user = User::create([
            'name' => $request->name,
            'apellidos' => $request->apellidos,
            'email' => $request->email,
            'telefono' => $request->telefono,
            'password' => bcrypt($request->password),
            'is_admin' => false, // Los nuevos usuarios no son administradores
        ]);
    
        // Enviar correo de verificación usando Mail Facade
        try {
            Mail::to($user->email)->send(new VerifyEmail($user));
            Log::info('Correo de verificación enviado a: ' . $user->email);
        } catch (\Exception $e) {
            Log::error('Error al enviar correo de verificación: ' . $e->getMessage());
        }
    
        // Generar un token de acceso
        $token = $user->createToken('ElanceRegistro')->plainTextToken;
    
        // Retornar respuesta
        return response()->json([
            'message' => 'Usuario registrado exitosamente. Por favor verifica tu correo electrónico.',
            'token' => $token,
            'user' => $user
        ]);
    }

    // Método para verificar email (recibe solicitud directa)

    public function verifyEmail(Request $request, $id, $hash)
    {
        $expires   = $request->query('expires');
        $signature = $request->query('signature');

        // Verificar que los parámetros necesarios existen
        if (!$expires || !$signature) {
            return response()->json([
                'message' => 'Parámetros de verificación inválidos'
            ], 403);
        }

        // Verificar que el enlace no ha expirado
        if (time() > (int) $expires) {
            return response()->json([
                'message' => 'El enlace de verificación ha expirado'
            ], 403);
        }

        // Regenerar la URL firmada con los mismos parámetros usando el generador de Laravel.
        // Gracias a URL::forceRootUrl() en AppServiceProvider, esto siempre usará APP_URL
        // sin importar el host de la petición entrante.
        $resignedUrl = \Illuminate\Support\Facades\URL::temporarySignedRoute(
            'verification.verify',
            \Carbon\Carbon::createFromTimestamp((int) $expires),
            ['id' => (int) $id, 'hash' => $hash]
        );
        $resignedParsed = [];
        parse_str(parse_url($resignedUrl, PHP_URL_QUERY), $resignedParsed);
        $expectedSignature = $resignedParsed['signature'] ?? '';

        if (!hash_equals($expectedSignature, (string) $signature)) {
            return response()->json([
                'message' => 'URL de verificación inválida o expirada'
            ], 403);
        }

        // Buscar al usuario por ID
        $user = User::findOrFail($id);

        // Verificar si el usuario ya ha verificado su correo electrónico
        if ($user->hasVerifiedEmail()) {
            return response()->json([
                'message' => 'El correo electrónico ya ha sido verificado'
            ]);
        }

        // Verificar si el hash coincide con el correo electrónico del usuario
        if (sha1($user->getEmailForVerification()) !== $hash) {
            return response()->json([
                'message' => 'Verificación fallida'
            ], 403);
        }

        $user->markEmailAsVerified();

        return response()->json([
            'message' => 'Email verificado correctamente'
        ]);
    }
    
    // Método para reenviar correo de verificación
    public function resendVerificationEmail(Request $request)
    {
        // Validación del correo
        $request->validate([
            'email' => 'required|email|exists:users,email',
        ]);
        // Buscar al usuario
        
        $user = User::where('email', $request->email)->first();
        
        if ($user->hasVerifiedEmail()) {
            return response()->json([
                'message' => 'El correo electrónico ya ha sido verificado.'
            ]);
        }
        
        // Reenviar el correo de verificación usando Mail Facade
        try {
            Mail::to($user->email)->send(new VerifyEmail($user));
            Log::info('Correo de verificación reenviado a: ' . $user->email);
            
            return response()->json([
                'message' => 'Enlace de verificación enviado.'
            ]);
        } catch (\Exception $e) {
            Log::error('Error al reenviar correo de verificación: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'Ocurrió un error al enviar el correo de verificación.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Método para cambiar la contraseña del usuario
     */
    public function changePassword(Request $request)
    {
        // Validación de los datos de entrada
        $request->validate([
            'current_password' => 'required',
            'password' => 'required|min:8|confirmed',
        ]);

        $user = $request->user();
        
        // Verificar que la contraseña actual sea correcta
        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'message' => 'La contraseña actual es incorrecta'
            ], 422);
        }
        
        // Actualizar la contraseña
        $user->password = Hash::make($request->password);
        $user->save();
        
        return response()->json([
            'message' => 'Contraseña actualizada exitosamente'
        ]);
    }

     /**
     * Método para recuperar contraseña olvidada
     */
    public function forgotPassword(Request $request)
    {
        // Validación del correo
        $request->validate([
            'email' => 'required|email|exists:users,email',
        ], [
            'email.exists' => 'No existe ninguna cuenta con este correo electrónico.',
        ]);

        try {
            // Buscar al usuario
            $user = User::where('email', $request->email)->first();
            
            // Verificar si el correo ha sido verificado
            if (!$user->hasVerifiedEmail()) {
                return response()->json([
                    'message' => 'Por favor, verifica tu correo electrónico antes de solicitar una nueva contraseña.'
                ], 403);
            }
            
            // Generar una contraseña temporal aleatoria
            $tempPassword = Str::random(10);
            
            // Actualizar la contraseña del usuario
            $user->password = Hash::make($tempPassword);
            $user->save();
            
            // Enviar el correo con la contraseña temporal
            Mail::to($user->email)->send(new ResetPasswordMail($user, $tempPassword));
            Log::info('Correo de recuperación de contraseña enviado a: ' . $user->email);
            
            return response()->json([
                'message' => 'Se ha enviado una contraseña temporal a tu correo electrónico.'
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error al procesar solicitud de recuperación de contraseña: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'Ha ocurrido un error al procesar tu solicitud. Por favor, intenta de nuevo más tarde.'
            ], 500);
        }
    }

    /**
     * Método para verificar si el usuario es administrador
     */
    public function checkAdmin(Request $request)
    {
        $user = $request->user();
        return response()->json([
            'is_admin' => (bool)$user->is_admin,
            'user_id' => $user->id,
        ]);
    }
}

    