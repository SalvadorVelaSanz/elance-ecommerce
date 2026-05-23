<?php

namespace Tests\Unit\Models;

use Tests\TestCase;
use App\Models\ProvinciaEnvio;
use App\Models\ZonaEnvio;

class ProvinciaEnvioTest extends TestCase
{
    public function test_crear_provincia_envio()
    {
        $zona = ZonaEnvio::create([
            'nombre' => 'Centro',
            'costo_envio' => 4.00,
            'pedido_minimo_envio_gratis' => 40.00
        ]);

        $provincia = ProvinciaEnvio::create([
            'provincia' => 'Madrid',
            'codigo_postal_inicio' => 28000,
            'codigo_postal_fin' => 28999,
            'zona_envio_id' => $zona->id
        ]);

        $this->assertDatabaseHas('provincias_envio', [
            'provincia' => 'Madrid',
            'codigo_postal_inicio' => 28000,
            'codigo_postal_fin' => 28999,
            'zona_envio_id' => $zona->id
        ]);

        $this->assertEquals('Madrid', $provincia->provincia);
        $this->assertEquals(28000, $provincia->codigo_postal_inicio);
        $this->assertEquals(28999, $provincia->codigo_postal_fin);
        $this->assertEquals($zona->id, $provincia->zona_envio_id);
    }

    public function test_relacion_zona_envio()
    {
        $zona = ZonaEnvio::create([
            'nombre' => 'Norte',
            'costo_envio' => 6.50,
            'pedido_minimo_envio_gratis' => 60.00
        ]);

        $provincia = ProvinciaEnvio::create([
            'provincia' => 'Barcelona',
            'codigo_postal_inicio' => 8000,
            'codigo_postal_fin' => 8999,
            'zona_envio_id' => $zona->id
        ]);

        $this->assertInstanceOf(ZonaEnvio::class, $provincia->zonaEnvio);
        $this->assertEquals($zona->id, $provincia->zonaEnvio->id);
        $this->assertEquals('Norte', $provincia->zonaEnvio->nombre);
        $this->assertEquals('6.50', $provincia->zonaEnvio->costo_envio);
    }

    public function test_multiples_provincias_misma_zona()
    {
        $zona = ZonaEnvio::create([
            'nombre' => 'Andalucía',
            'costo_envio' => 5.00,
            'pedido_minimo_envio_gratis' => 45.00
        ]);

        $sevilla = ProvinciaEnvio::create([
            'provincia' => 'Sevilla',
            'codigo_postal_inicio' => 41000,
            'codigo_postal_fin' => 41999,
            'zona_envio_id' => $zona->id
        ]);

        $cordoba = ProvinciaEnvio::create([
            'provincia' => 'Córdoba',
            'codigo_postal_inicio' => 14000,
            'codigo_postal_fin' => 14999,
            'zona_envio_id' => $zona->id
        ]);

        $this->assertEquals($zona->id, $sevilla->zonaEnvio->id);
        $this->assertEquals($zona->id, $cordoba->zonaEnvio->id);
        $this->assertEquals('Andalucía', $sevilla->zonaEnvio->nombre);
        $this->assertEquals('Andalucía', $cordoba->zonaEnvio->nombre);
    }

    public function test_fillable_attributes()
    {
        $provincia = new ProvinciaEnvio();
        $expected = [
            'provincia',
            'codigo_postal_inicio',
            'codigo_postal_fin',
            'zona_envio_id'
        ];
        
        $this->assertEquals($expected, $provincia->getFillable());
    }

    public function test_tabla_nombre()
    {
        $provincia = new ProvinciaEnvio();
        $this->assertEquals('provincias_envio', $provincia->getTable());
    }

    public function test_codigos_postales_rangos()
    {
        $zona = ZonaEnvio::create([
            'nombre' => 'Valencia',
            'costo_envio' => 4.50,
            'pedido_minimo_envio_gratis' => 35.00
        ]);

        $valencia = ProvinciaEnvio::create([
            'provincia' => 'Valencia',
            'codigo_postal_inicio' => 46000,
            'codigo_postal_fin' => 46999,
            'zona_envio_id' => $zona->id
        ]);

        // Verificar que los códigos postales están en el rango correcto
        $this->assertLessThanOrEqual($valencia->codigo_postal_fin, $valencia->codigo_postal_inicio);
        $this->assertTrue($valencia->codigo_postal_inicio >= 46000);
        $this->assertTrue($valencia->codigo_postal_fin <= 46999);
    }
}