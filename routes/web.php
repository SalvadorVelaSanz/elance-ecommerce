<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ProductoController;


// Ruta para servir la aplicación React
Route::get('/{any?}', function () {
    return view('welcome');
})->where('any', '.*');