<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Recuperación de Contraseña</title>
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
        .password-container {
            background-color: #f5f5f5;
            padding: 15px;
            text-align: center;
            border: 1px solid #e5e5e5;
            color: #333;
            font-size: 18px;
            font-weight: bold;
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
            
            <p>Hemos recibido una solicitud para recuperar tu contraseña. Hemos generado una contraseña temporal que podrás utilizar para acceder a tu cuenta.</p>
            
            <p>Tu contraseña temporal es:</p>
            
            <div class="password-container">{{ $temporaryPassword }}</div>
            
            <p>Por seguridad, te recomendamos cambiar esta contraseña temporal por una nueva tan pronto como inicies sesión.</p>
            
            <p>Si no has solicitado este cambio de contraseña, por favor, contacta inmediatamente con nuestro equipo de soporte.</p>
        </div>
        
        <div class="footer">
            <p>Saludos,<br>El equipo de {{ config('app.name') }}</p>
        </div>
    </div>
</body>
</html>