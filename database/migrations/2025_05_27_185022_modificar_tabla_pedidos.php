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
        Schema::table('pedidos', function (Blueprint $table) {
            // Primero modificar las claves foráneas
            // Eliminar constraints existentes si existen
            try {
                $table->dropForeign(['direccion_id']);
            } catch (Exception $e) {
                // Si no existe el constraint, continúa
            }
            try {
                $table->dropForeign(['user_id']);
            } catch (Exception $e) {
                // Si no existe el constraint, continúa
            }
            
            // Hacer los campos nullable
            $table->unsignedBigInteger('direccion_id')->nullable()->change();
            $table->unsignedBigInteger('user_id')->nullable()->change();
            
            // Recrear claves foráneas con onDelete('set null')
            $table->foreign('user_id')
                  ->references('id')
                  ->on('users')
                  ->onDelete('set null');
                  
            $table->foreign('direccion_id')
                  ->references('id')
                  ->on('direcciones')
                  ->onDelete('set null');
            
            // Snapshot de la dirección de envío
            $table->string('direccion_nombre_direccion')->nullable()->after('direccion_id');
            $table->string('direccion_calle')->nullable()->after('direccion_nombre_direccion');
            $table->string('direccion_numero')->nullable()->after('direccion_calle');
            $table->string('direccion_piso')->nullable()->after('direccion_numero');
            $table->string('direccion_puerta')->nullable()->after('direccion_piso');
            $table->string('direccion_codigo_postal')->nullable()->after('direccion_puerta');
            $table->string('direccion_ciudad')->nullable()->after('direccion_codigo_postal');
            $table->string('direccion_provincia')->nullable()->after('direccion_ciudad');
            $table->string('direccion_pais')->nullable()->after('direccion_provincia');
            
            // Información del usuario en el momento del pedido
            $table->string('usuario_nombre')->nullable()->after('direccion_pais');
            $table->string('usuario_email')->nullable()->after('usuario_nombre');
            $table->string('usuario_telefono')->nullable()->after('usuario_email');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pedidos', function (Blueprint $table) {
            $table->dropColumn([
                'direccion_nombre_direccion',
                'direccion_calle',
                'direccion_numero',
                'direccion_piso',
                'direccion_puerta',
                'direccion_codigo_postal',
                'direccion_ciudad',
                'direccion_provincia',
                'direccion_pais',
                'usuario_nombre',
                'usuario_email',
                'usuario_telefono'
            ]);
        });
    }
};