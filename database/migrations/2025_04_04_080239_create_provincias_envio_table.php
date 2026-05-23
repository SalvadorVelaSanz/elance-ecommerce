<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('provincias_envio', function (Blueprint $table) {
            $table->id();
            $table->string('provincia'); // Nombre de la provincia
            $table->string('codigo_postal_inicio')->nullable(); // Opcional: Para rangos de CPs
            $table->string('codigo_postal_fin')->nullable(); // Opcional: Para rangos de CPs
            $table->foreignId('zona_envio_id')->constrained('zonas_envio');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('provincias_envio');
    }
};