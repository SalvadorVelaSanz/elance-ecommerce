<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Nuevo mensaje de contacto</title>
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
        .message-info {
            background-color: #f5f5f5;
            padding: 15px;
            border: 1px solid #e5e5e5;
            margin: 20px 0;
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
        p {
            margin-bottom: 15px;
            font-size: 16px;
        }
        .info-row {
            margin-bottom: 10px;
        }
        .info-label {
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Nuevo Mensaje de Contacto</h1>
        </div>
        
        <div class="content">
            <h2>Detalles del mensaje</h2>
            
            <div class="message-info">
                <div class="info-row">
                    <span class="info-label">Nombre:</span> {{ $formData['nombre'] }}
                </div>
                <div class="info-row">
                    <span class="info-label">Email:</span> {{ $formData['email'] }}
                </div>
                <div class="info-row">
                    <span class="info-label">Asunto:</span> {{ $formData['asunto'] }}
                </div>
                <div class="info-row">
                    <span class="info-label">Mensaje:</span>
                    <p>{{ $formData['mensaje'] }}</p>
                </div>
            </div>
            
            <p>Este mensaje fue enviado desde el formulario de contacto.</p>
        </div>
        
        <div class="footer">
            <p>© {{ date('Y') }} {{ config('app.name') }}</p>
        </div>
    </div>
</body>
</html>