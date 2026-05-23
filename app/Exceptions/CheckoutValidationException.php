<?php

namespace App\Exceptions;

use RuntimeException;

/**
 * Se lanza cuando los datos del checkout no superan la validación de negocio
 * (precio cambiado, stock insuficiente, total incorrecto, etc.).
 * Lleva el código HTTP (400/422) y campos extra para incluir en la respuesta JSON.
 */
class CheckoutValidationException extends RuntimeException
{
    public function __construct(
        string $message,
        private array $extra = [],
        int $code = 400
    ) {
        parent::__construct($message, $code);
    }

    public function getExtra(): array
    {
        return $this->extra;
    }
}
