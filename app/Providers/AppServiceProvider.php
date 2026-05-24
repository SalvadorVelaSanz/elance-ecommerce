<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\URL;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // Forzar siempre APP_URL como base para la generación de URLs firmadas.
        // Necesario cuando las peticiones llegan a través del proxy de Vite,
        // ya que el header Host puede ser el del frontend (ej: [::1]:5173)
        // en lugar del backend real, lo que rompería las firmas de verificación de email.
        URL::forceRootUrl(config('app.url'));

        // Forzar HTTPS en producción
        if (config('app.env') === 'production' || env('FORCE_HTTPS')) {
            URL::forceScheme('https');
            $this->app['request']->server->set('HTTPS', 'on');
        }
    }
}