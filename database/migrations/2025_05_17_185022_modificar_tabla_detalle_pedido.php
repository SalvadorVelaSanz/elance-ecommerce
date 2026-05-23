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
        Schema::table('detalle_pedidos', function (Blueprint $table) {
            // Primero modificar las claves foráneas
            try {
                $table->dropForeign(['producto_id']);
            } catch (Exception $e) {
                // Si no existe el constraint, continúa
            }
            try {
                $table->dropForeign(['pedido_id']);
            } catch (Exception $e) {
                // Si no existe el constraint, continúa
            }
            
            // Hacer producto_id nullable (pedido_id se mantiene)
            $table->unsignedBigInteger('producto_id')->nullable()->change();
            
            // Recrear claves foráneas
            $table->foreign('pedido_id')
                  ->references('id')
                  ->on('pedidos')
                  ->onDelete('cascade'); // Si se borra el pedido, se borran los detalles
                  
            $table->foreign('producto_id')
                  ->references('id')
                  ->on('productos')
                  ->onDelete('set null'); // Si se borra el producto, se mantiene el detalle
            
            // Snapshot del producto en el momento del pedido
            $table->string('producto_nombre')->nullable()->after('precio_unitario');
            $table->text('producto_descripcion')->nullable()->after('producto_nombre');
            $table->string('producto_talla')->nullable()->after('producto_descripcion');
            $table->decimal('producto_precio_original', 10, 2)->nullable()->after('producto_talla');
            $table->decimal('producto_porcentaje_descuento', 5, 2)->nullable()->after('producto_precio_original');
            $table->date('producto_fecha_inicio_descuento')->nullable()->after('producto_porcentaje_descuento');
            $table->date('producto_fecha_fin_descuento')->nullable()->after('producto_fecha_inicio_descuento');
            
            // Información de la categoría del producto
            $table->string('categoria_nombre')->nullable()->after('producto_fecha_fin_descuento');
            
            // URL o path de la imagen principal
            $table->text('producto_imagen_url')->nullable()->after('categoria_nombre');
            
            // SKU o código del producto si lo tuvieras
            $table->string('producto_sku')->nullable()->after('producto_imagen_url');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('detalle_pedidos', function (Blueprint $table) {
            $table->dropColumn([
                'producto_nombre',
                'producto_descripcion',
                'producto_talla',
                'producto_precio_original',
                'producto_porcentaje_descuento',
                'producto_fecha_inicio_descuento',
                'producto_fecha_fin_descuento',
                'categoria_nombre',
                'producto_imagen_url',
                'producto_sku'
            ]);
        });
    }
};