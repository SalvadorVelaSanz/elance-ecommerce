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
        Schema::create('productos', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 100);
            $table->text('descripcion')->nullable();
            $table->decimal('precio', 10, 2);
            $table->decimal('precio_original', 10, 2)->nullable();
            $table->decimal('porcentaje_descuento', 5, 2)->nullable();
            $table->date('fecha_inicio_descuento')->nullable();
            $table->date('fecha_fin_descuento')->nullable();
            $table->string('talla', 10)->nullable();
            $table->integer('stock')->default(0);
            $table->foreignId('categoria_id')->constrained('categorias');
            $table->foreignId('imagen_id')->constrained('imagenes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('productos');
    }
};