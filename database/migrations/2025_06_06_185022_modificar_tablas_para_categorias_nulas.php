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
        Schema::table('productos', function (Blueprint $table) {
            // Hacer que categoria_id sea nullable
            $table->unsignedBigInteger('categoria_id')->nullable()->change();
            
            // Si tienes una foreign key constraint, necesitas eliminarla y recrearla
            $table->dropForeign(['categoria_id']);
            $table->foreign('categoria_id')
                  ->references('id')
                  ->on('categorias')
                  ->onDelete('set null'); // Esto hace que se ponga null cuando se elimine la categoría
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('productos', function (Blueprint $table) {
            // Primero, asegurarnos de que no haya productos con categoria_id nulo
            \DB::statement('UPDATE productos SET categoria_id = 1 WHERE categoria_id IS NULL');
            
            // Eliminar la foreign key actual
            $table->dropForeign(['categoria_id']);
            
            // Hacer que categoria_id no sea nullable nuevamente
            $table->unsignedBigInteger('categoria_id')->nullable(false)->change();
            
            // Recrear la foreign key sin onDelete
            $table->foreign('categoria_id')
                  ->references('id')
                  ->on('categorias');
        });
    }
};