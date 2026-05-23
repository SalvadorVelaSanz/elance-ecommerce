<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('categorias', function (Blueprint $table) {
            $table->id(); 
            $table->string('nombre', 50);
            $table->string('temporada', 30)->nullable();
            $table->enum('publico_objetivo', ['adulto', 'niño', 'bebé', 'unisex']);
            $table->timestamps(); 
            $table->string('imagen_categoria' , 255 )->nullable(); 
        });
    }

    public function down()
    {
        Schema::dropIfExists('categorias');
    }
};