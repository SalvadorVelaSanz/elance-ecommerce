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
            // Añadir la columna solo si no existe
            if (!Schema::hasColumn('pedidos', 'numero_seguimiento')) {
                $table->string('numero_seguimiento')->nullable()->after('metodo_pago');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pedidos', function (Blueprint $table) {
            if (Schema::hasColumn('pedidos', 'numero_seguimiento')) {
                $table->dropColumn('numero_seguimiento');
            }
        });
    }
};