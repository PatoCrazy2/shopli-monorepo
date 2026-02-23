---
trigger: always_on
---

# ShopLI - Finance & Security

## Reglas de Seguridad
- Toda operación financiera debe validarse en el servidor.
- Ningún cálculo crítico (totales, impuestos, descuentos) es confiable si proviene del cliente POS.
- Todas las rutas API deben validar sesión y rol.
- Nunca se exponen IDs secuenciales públicamente; usar UUID.
- Logs de auditoría obligatorios para:
  - Eliminación de ventas
  - Ajustes de inventario
  - Cambios de precios