<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Verifica tu correo electrónico</title>
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
        .button-container {
            text-align: center;
            margin: 30px 0;
        }
        .button {
            display: inline-block;
            padding: 12px 25px;
            background-color: #333;
            color: white !important;
            text-decoration: none;
            text-transform: uppercase;
            font-weight: bold;
            font-size: 16px;
            border-radius: 4px;
            border: none;
        }
        .verification-url {
            background-color: #f5f5f5;
            padding: 15px;
            word-break: break-all;
            border: 1px solid #e5e5e5;
            color: #666;
            font-size: 14px;
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
            .button {
                padding: 10px 20px;
                font-size: 14px;
                width: 80%;
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
            <h2>¡Hola {{ $user->name }}!</h2>
            
            <p>Gracias por registrarte en nuestra plataforma. Para completar tu registro y comenzar a disfrutar de todos nuestros servicios, necesitamos verificar tu dirección de correo electrónico.</p>
            
            <div class="button-container">
                <a href="{{ $verificationUrl }}" class="button">Verificar correo</a>
            </div>
            
            <p>Si no creaste una cuenta en nuestra plataforma, puedes ignorar este mensaje.</p>
            
            <p>Si tienes problemas para hacer clic en el botón, copia y pega el siguiente enlace en tu navegador:</p>
            
            <div class="verification-url">{{ $verificationUrl }}</div>
            
            <p>El enlace de verificación expirará en 60 minutos.</p>
        </div>
        
        <div class="footer">
            <p>Saludos,<br>El equipo de {{ config('app.name') }}</p>
        </div>
    </div>
</body>
</html>