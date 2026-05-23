<?php
// Archivo: database/migrations/xxxx_xx_xx_xxxxxx_create_direcciones_table.php

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
        Schema::create('direcciones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users');
            $table->string('nombre_direccion')->nullable(); 
            $table->string('calle');
            $table->string('numero');
            $table->string('piso')->nullable();
            $table->string('puerta')->nullable();
            $table->string('codigo_postal');
            $table->string('ciudad');
            $table->string('provincia');
            $table->string('pais')->default('España');
            $table->boolean('es_principal')->default(false);
            $table->timestamps();
        });
        
      
        if (Schema::hasColumn('pedidos', 'direccion_envio')) {
            Schema::table('pedidos', function (Blueprint $table) {
                // Si ya existe la columna direccion_envio, primero se elimina
                $table->dropColumn('direccion_envio');
                // Añade la referencia a la tabla direcciones
                $table->foreignId('direccion_id')->nullable()->constrained('direcciones');
            });
        }
        
   
        if (Schema::hasColumn('users', 'direccion')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('direccion');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('pedidos') && Schema::hasColumn('pedidos', 'direccion_id')) {
            Schema::table('pedidos', function (Blueprint $table) {
                $table->dropForeign(['direccion_id']);
                $table->dropColumn('direccion_id');
                $table->string('direccion_envio')->nullable();
            });
        }
        
        Schema::table('users', function (Blueprint $table) {
            $table->string('direccion')->nullable();
        });
        
        Schema::dropIfExists('direcciones');
    }
};