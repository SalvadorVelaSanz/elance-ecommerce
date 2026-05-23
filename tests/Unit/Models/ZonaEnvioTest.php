<?php

namespace Tests\Unit\Models;

use Tests\TestCase;
use App\Models\ZonaEnvio;
use App\Models\ProvinciaEnvio;

class ZonaEnvioTest extends TestCase
{
    public function test_crear_zona_envio()
    {
        $zona = ZonaEnvio::create([
            'nombre' => 'Península',
            'costo_envio' => 5.99,
            'pedido_minimo_envio_gratis' => 50.00
        ]);

        $this->assertDatabaseHas('zonas_envio', [
            'nombre' => 'Península',
            'costo_envio' => 5.99,
            'pedido_minimo_envio_gratis' => 50.00
        ]);

        $this->assertEquals('Península', $zona->nombre);
        $this->assertEquals('5.99', $zona->costo_envio);
        $this->assertEquals('50.00', $zona->pedido_minimo_envio_gratis);
    }

    public function test_relacion_provincias()
    {
        $zona = ZonaEnvio::create([
            'nombre' => 'Centro',
            'costo_envio' => 3.50,
            'pedido_minimo_envio_gratis' => 30.00
        ]);

        $provincia1 = ProvinciaEnvio::create([
            'provincia' => 'Madrid',
            'codigo_postal_inicio' => 28000,
            'codigo_postal_fin' => 28999,
            'zona_envio_id' => $zona->id
        ]);

        $provincia2 = ProvinciaEnvio::create([
            'provincia' => 'Toledo',
            'codigo_postal_inicio' => 45000,
            'codigo_postal_fin' => 45999,
            'zona_envio_id' => $zona->id
        ]);

        $this->assertInstanceOf(\Illuminate\Database\Eloquent\Collection::class, $zona->provincias);
        $this->assertCount(2, $zona->provincias);
        
        $nombresProvincias = $zona->provincias->pluck('provincia')->toArray();
        $this->assertContains('Madrid', $nombresProvincias);
        $this->assertContains('Toledo', $nombresProvincias);
    }

    public function test_cast_decimal_costo_envio()
    {
        $zona = ZonaEnvio::create([
            'nombre' => 'Test Zone',
            'costo_envio' => '7.50',
            'pedido_minimo_envio_gratis' => '25.99'
        ]);

        // Laravel mantiene decimales como string por defecto
        $this->assertIsString($zona->costo_envio);
        $this->assertIsString($zona->pedido_minimo_envio_gratis);
        
        // Pero se pueden convertir correctamente
        $this->assertEquals(7.50, floatval($zona->costo_envio));
        $this->assertEquals(25.99, floatval($zona->pedido_minimo_envio_gratis));
    }

    public function test_zona_envio_sin_minimo()
    {
        $zona = ZonaEnvio::create([
            'nombre' => 'Sin Mínimo',
            'costo_envio' => 2.00,
            'pedido_minimo_envio_gratis' => null
        ]);

        $this->assertNull($zona->pedido_minimo_envio_gratis);
        $this->assertEquals('2.00', $zona->costo_envio);
    }

    public function test_fillable_attributes()
    {
        $zona = new ZonaEnvio();
        $expected = ['nombre', 'costo_envio', 'pedido_minimo_envio_gratis'];
        
        $this->assertEquals($expected, $zona->getFillable());
    }

    public function test_tabla_nombre()
    {
        $zona = new ZonaEnvio();
        $this->assertEquals('zonas_envio', $zona->getTable());
    }

   public function test_casts_configuration()
{
    $zona = new ZonaEnvio();
    $expectedCasts = [
        'id' => 'int', 
        'costo_envio' => 'decimal:2',
        'pedido_minimo_envio_gratis' => 'decimal:2',
    ];
    
    $this->assertEquals($expectedCasts, $zona->getCasts());
}
}