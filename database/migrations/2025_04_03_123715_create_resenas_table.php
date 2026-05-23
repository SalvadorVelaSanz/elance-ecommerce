<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('resenas', function (Blueprint $table) {
            $table->id(); 
            $table->foreignId('producto_id')->constrained('productos');
            $table->foreignId('user_id')->constrained('users');
            $table->unsignedTinyInteger('puntuacion');
            $table->date('fecha_resena');
            $table->text('comentario')->nullable();
            $table->timestamps();
            
            $table->unique(['producto_id', 'user_id']);
        });

        // Limitar puntuación entre 1 y 5
        DB::statement('ALTER TABLE resenas ADD CONSTRAINT chk_puntuacion CHECK (puntuacion BETWEEN 1 AND 5)');
    }

    public function down(): void
    {
        Schema::dropIfExists('resenas');
    }
};
