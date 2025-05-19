# Configuración del Servicio de Correo Electrónico

Para habilitar el servicio de notificaciones por correo electrónico cuando se recibe un nuevo feedback, sigue estos pasos:

## 1. Configuración de variables de entorno

Añade las siguientes variables a tu archivo `.env`:

```
# Configuración de correo electrónico
EMAIL_USER=tu-correo@gmail.com
EMAIL_PASSWORD=tu-contraseña-de-aplicación
```

## 2. Obtener una contraseña de aplicación de Gmail

Si utilizas Gmail como servicio de correo, necesitarás una "contraseña de aplicación" en lugar de tu contraseña regular:

1. Ve a [Cuenta de Google > Seguridad](https://myaccount.google.com/security)
2. Activa la verificación en dos pasos si no está activada
3. En "Contraseñas de aplicaciones", genera una nueva contraseña para esta aplicación
4. Usa esa contraseña generada en la variable `EMAIL_PASSWORD`

## 3. Probar el servicio de correo

Una vez configurado, cada vez que un usuario envíe feedback, se enviará automáticamente un correo electrónico a `shiyicheng13@gmail.com` con los detalles del feedback.

## 4. Consideraciones

- Asegúrate de que tu proveedor de correo permita el envío desde aplicaciones externas
- Si experimentas problemas, verifica los logs del servidor para identificar errores
- En entornos de producción, considera usar servicios como SendGrid, Mailgun o Amazon SES para mayor fiabilidad 