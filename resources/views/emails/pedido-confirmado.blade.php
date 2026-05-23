<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Confirmación de pedido</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f9f9f9;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border: 1px solid #e5e5e5;
        }
        .header {
            background-color: #333;
            padding: 25px 20px;
            text-align: center;
        }
        .header h1 {
            color: #ffffff;
            margin: 0;
            text-transform: uppercase;
            font-size: 24px;
            letter-spacing: 1px;
        }
        .content {
            padding: 30px 25px;
        }
        .content h2 {
            color: #333;
            margin-top: 0;
            font-size: 22px;
            border-bottom: 1px solid #e5e5e5;
            padding-bottom: 10px;
        }
        .pedido-info {
            background-color: #f8f9fa;
            padding: 20px;
            border: 1px solid #e5e5e5;
            border-radius: 4px;
            margin: 20px 0;
        }
        .pedido-info h3 {
            margin-top: 0;
            color: #333;
            font-size: 18px;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding: 8px 0;
            border-bottom: 1px solid #e5e5e5;
        }
        .info-row:last-child {
            border-bottom: none;
        }
        .info-label {
            font-weight: bold;
            color: #555;
        }
        .info-value {
            color: #333;
        }
        .productos-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        .productos-table th,
        .productos-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e5e5e5;
        }
        .productos-table th {
            background-color: #f8f9fa;
            font-weight: bold;
            color: #333;
        }
        .productos-table tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        .totales-section {
            background-color: #f8f9fa;
            padding: 20px;
            border: 1px solid #e5e5e5;
            border-radius: 4px;
            margin: 20px 0;
        }
        .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            padding: 5px 0;
        }
        .total-row.final {
            border-top: 2px solid #333;
            padding-top: 10px;
            margin-top: 15px;
            font-weight: bold;
            font-size: 18px;
        }
        .direccion-envio {
            background-color: #f0f8ff;
            padding: 15px;
            border-left: 4px solid #007bff;
            margin: 20px 0;
        }
        .direccion-envio h4 {
            margin-top: 0;
            color: #007bff;
        }
        .estado-badge {
            display: inline-block;
            padding: 4px 12px;
            background-color: #ffc107;
            color: #333;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .metodo-pago {
            display: inline-block;
            padding: 4px 12px;
            background-color: #28a745;
            color: white;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .footer {
            margin-top: 30px;
            padding: 20px;
            background-color: #f5f5f5;
            text-align: center;
            font-size: 14px;
            color: #666;
            border-top: 1px solid #e5e5e5;
        }
        .numero-seguimiento {
            font-size: 24px;
            font-weight: bold;
            color: #007bff;
            text-align: center;
            margin: 20px 0;
            padding: 15px;
            background-color: #f0f8ff;
            border: 2px dashed #007bff;
            border-radius: 8px;
        }
        p {
            margin-bottom: 15px;
            font-size: 16px;
        }
        @media screen and (max-width: 480px) {
            .container {
                margin: 10px;
                width: calc(100% - 20px);
            }
            .content {
                padding: 20px 15px;
            }
            .header h1 {
                font-size: 20px;
            }
            .info-row {
                flex-direction: column;
                gap: 5px;
            }
            .total-row {
                flex-direction: column;
                gap: 5px;
            }
            .productos-table {
                font-size: 14px;
            }
            .productos-table th,
            .productos-table td {
                padding: 8px 4px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{{ config('app.name') }}</h1>
        </div>
        
        <div class="content">
            <h2>¡Gracias por tu pedido, {{ $user->name }}!</h2>
            
            <p>Tu pedido ha sido confirmado y está siendo procesado. Te mantendremos informado sobre el estado de tu envío.</p>
            
            @if($pedido->numero_seguimiento)
            <div class="numero-seguimiento">
                Número de seguimiento: {{ $pedido->numero_seguimiento }}
            </div>
            @endif
            
            <!-- Información del pedido -->
            <div class="pedido-info">
                <h3>Información del pedido</h3>
                
                <div class="info-row">
                    <span class="info-label">Número de pedido:</span>
                    <span class="info-value">#{{ $pedido->numero_seguimiento ?? $pedido->id }}</span>
                </div>
                
                <div class="info-row">
                    <span class="info-label">Fecha del pedido:</span>
                    <span class="info-value">{{ $pedido->created_at->format('d/m/Y H:i') }}</span>
                </div>
                
                <div class="info-row">
                    <span class="info-label">Estado:</span>
                    <span class="info-value">
                        <span class="estado-badge">{{ ucfirst($pedido->estado) }}</span>
                    </span>
                </div>
                
                <div class="info-row">
                    <span class="info-label">Método de pago:</span>
                    <span class="info-value">
                        <span class="metodo-pago">
                            @if($pedido->metodo_pago === 'tarjeta')
                                Envío a domicilio
                            @else
                                Recogida en tienda
                            @endif
                        </span>
                    </span>
                </div>
            </div>
            
            <!-- Dirección de envío (solo si es envío a domicilio) -->
            @if($pedido->metodo_pago === 'tarjeta' && $pedido->direccion_completa)
            <div class="direccion-envio">
                <h4>Dirección de envío</h4>
                <p>{!! nl2br(e($pedido->direccion_completa)) !!}</p>
            </div>
            @endif
            
            <!-- Productos del pedido -->
            <h3>Productos</h3>
            <table class="productos-table">
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th>Cantidad</th>
                        <th>Precio unitario</th>
                        <th>Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($pedido->detalles as $detalle)
                    <tr>
                        <td>
                            <strong>{{ $detalle->producto_nombre }}</strong>
                            @if($detalle->categoria_nombre)
                                <br><small style="color: #666;">{{ $detalle->categoria_nombre }}</small>
                            @endif
                        </td>
                        <td>{{ $detalle->cantidad }}</td>
                        <td>{{ number_format($detalle->precio_unitario, 2) }} €</td>
                        <td>{{ number_format($detalle->precio_unitario * $detalle->cantidad, 2) }} €</td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
            
            <!-- Totales -->
            <div class="totales-section">
                <h3>Resumen de costes</h3>
                
                @if(isset($detalles['subtotal']))
                <div class="total-row">
                    <span>Subtotal:</span>
                    <span>{{ number_format($detalles['subtotal'], 2) }} €</span>
                </div>
                @endif
                
                @if(isset($detalles['costo_envio']))
                <div class="total-row">
                    <span>Envío:</span>
                    <span>
                        @if($detalles['costo_envio'] == 0)
                            GRATIS
                        @else
                            {{ number_format($detalles['costo_envio'], 2) }} €
                        @endif
                    </span>
                </div>
                @endif
                
                @if(isset($detalles['iva']))
                <div class="total-row">
                    <span>IVA (21%):</span>
                    <span>{{ number_format($detalles['iva'], 2) }} €</span>
                </div>
                @endif
                
                <div class="total-row final">
                    <span>Total:</span>
                    <span>{{ number_format($pedido->precio_total, 2) }} €</span>
                </div>
            </div>
            
            @if($pedido->metodo_pago === 'presencial')
            <div style="background-color: #fff3cd; padding: 15px; border: 1px solid #ffeaa7; border-radius: 4px; margin: 20px 0;">
                <h4 style="margin-top: 0; color: #856404;">Recogida en tienda</h4>
                <p style="margin-bottom: 0; color: #856404;">
                    Te contactaremos cuando tu pedido esté listo para recoger en nuestra tienda. 
                    El pago se realizará en el momento de la recogida.
                </p>
            </div>
            @endif
            
            <p>Si tienes alguna pregunta sobre tu pedido, no dudes en contactarnos.</p>
        </div>
        
        <div class="footer">
            <p>Gracias por confiar en nosotros,<br>El equipo de {{ config('app.name') }}</p>
        </div>
    </div>
</body>
</html>