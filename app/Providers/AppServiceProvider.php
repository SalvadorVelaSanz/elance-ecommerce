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
        // Forzar HTTPS para todas las URLs generadas por Laravel
        if (config('app.env') === 'production' || env('FORCE_HTTPS')) {
            URL::forceScheme('https');
            URL::forceRootUrl(env('APP_URL')); // Esta línea es clave
            
            // También forzar para URLs firmadas
            $this->app['request']->server->set('HTTPS', 'on');
        }
    }
}