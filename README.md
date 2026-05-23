# Elance — Tienda Online

Aplicación de e-commerce fullstack con catálogo de productos, carrito de compra, checkout con validación de stock y precios en servidor, panel de administración y autenticación completa con verificación de email.

---

## Características principales

- **Catálogo** con filtrado por categoría, búsqueda y ordenación
- **Carrito persistente** sincronizado con la cuenta del usuario
- **Lista de favoritos** sincronizable entre dispositivos
- **Checkout** con validación server-side de precios, stock y costos de envío por zona
- **Seguimiento de pedidos** con número de seguimiento y estados
- **Correo de confirmación** automático al completar un pedido
- **Autenticación** con registro, verificación de email y recuperación de contraseña
- **Panel de administración** para gestionar productos, categorías, pedidos, usuarios y reseñas
- **Sistema de reseñas** con valoración por estrellas

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Backend | Laravel 11 (API REST) |
| Frontend | React 18 + React Router |
| Autenticación | Laravel Sanctum |
| Base de datos | MySQL |
| Estilos | CSS Modules |
| Email | SMTP (Gmail) |
| Build | Vite |

---

## Instalación

### Requisitos
- PHP 8.2+
- Composer
- Node.js 18+
- MySQL

### Pasos

```bash
# 1. Clonar el repositorio
git clone <url-del-repo>
cd <nombre-del-proyecto>

# 2. Instalar dependencias
composer install
npm install

# 3. Configurar entorno
cp .env.example .env
php artisan key:generate
```

Edita el `.env` con tus credenciales de base de datos y correo (ver `.env.example` para referencia).

```bash
# 4. Iniciar servidores
npm run dev
php artisan serve
```

Para importar la base de datos (`mi_tienda.sql`) consulta la **[guía de instalación en la Wiki](https://github.com/SalvadorVelaSanz/elance-ecommerce/wiki)**.

La aplicación estará disponible en `http://localhost:8000`.

---

## Credenciales de demostración

| Rol | Email | Contraseña |
|---|---|---|
| Administrador | admin@elance.com | password |

> Para registrar nuevos usuarios es necesario configurar SMTP en el `.env` (ver sección de instalación de la wiki). Sin SMTP, se puede acceder directamente con las credenciales de administrador.

---

## Documentación

La documentación completa del proyecto — arquitectura, modelos de datos, endpoints de la API y guía de uso — está disponible en la **[Wiki del repositorio](https://github.com/SalvadorVelaSanz/elance-ecommerce/wiki)**.

---

## Capturas

Las capturas de pantalla de cada sección de la aplicación están disponibles en el **[Manual de Usuario de la Wiki](https://github.com/SalvadorVelaSanz/elance-ecommerce/wiki/Manual_Usuario)**: home, catálogo, detalle de producto, checkout, panel de Mi Cuenta y panel de administración.

---

