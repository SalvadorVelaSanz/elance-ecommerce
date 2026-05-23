<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use App\Mail\ContactFormMail;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class ContactController extends Controller
{
    public function sendMessage(Request $request)
    {
        try {
            // Validar los datos del formulario
            $validatedData = $request->validate([
                'nombre' => 'required|string|max:255',
                'email' => 'required|email|max:255',
                'asunto' => 'required|string|max:255',
                'mensaje' => 'required|string|max:5000',
            ]);

            // Dirección de correo que recibirá el mensaje (configurable por .env)
            $recipientEmail = env('CONTACT_EMAIL', 'salvadorvelasan@gmail.com');

            // Enviar el correo
            Mail::to($recipientEmail)->send(new ContactFormMail($validatedData));

            // Devolver respuesta de éxito
            return response()->json([
                'success' => true,
                'message' => '¡Mensaje enviado correctamente! Nos pondremos en contacto pronto.'
            ], 200);
            
        } catch (ValidationException $e) {
            Log::error('Error de validación:', $e->errors());
            return response()->json([
                'success' => false,
                'message' => 'Error en los datos enviados.',
                'errors' => $e->errors()
            ], 422);
            
        } catch (\Exception $e) {
            // Registrar el error completo en el log
            Log::error('Error al enviar el mensaje de contacto: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            
            // Devolver respuesta de error
            return response()->json([
                'success' => false,
                'message' => 'Error interno del servidor. Por favor, inténtalo de nuevo más tarde.',
                'error' => config('app.debug') ? $e->getMessage() : 'Error interno'
            ], 500);
        }
    }
}