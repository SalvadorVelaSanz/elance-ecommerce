<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Imagen extends Model
{
    use HasFactory;

    /**
     * El nombre de la tabla asociada con el modelo.
     *
     * @var string
     */
    protected $table = 'imagenes';

    /**
     * Los atributos que son asignables en masa.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'url',
        'descripcion',
    ];

    /**
     * Obtiene todos los productos que usan esta imagen
     */
    public function productos(): HasMany
    {
        return $this->hasMany(Producto::class, 'imagen_id');
    }

    /**
     * Obtiene las URLs separadas como array
     * Si el campo url contiene múltiples URLs separadas por pipe
     * 
     * @return array
     */
    public function getUrlsArray(): array
    {
        if (empty($this->url)) {
            return [];
        }

        $urls = explode('|', $this->url);
        return array_map('trim', array_filter($urls));
    }

    /**
     * Obtiene la primera URL (URL principal)
     * 
     * @return string|null
     */
    public function getPrimaryUrl(): ?string
    {
        $urls = $this->getUrlsArray();
        return !empty($urls) ? $urls[0] : null;
    }

    /**
     * Verifica si la imagen tiene múltiples URLs
     * 
     * @return bool
     */
    public function hasMultipleUrls(): bool
    {
        return count($this->getUrlsArray()) > 1;
    }

    /**
     * Obtiene el número total de URLs
     * 
     * @return int
     */
    public function getUrlsCount(): int
    {
        return count($this->getUrlsArray());
    }
}