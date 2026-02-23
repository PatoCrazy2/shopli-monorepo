---
trigger: model_decision
description: aplica estas reglas cada vez que trabajes en crear esquemas/migraciones (ORM), programar APIs,configurar bd local PWA, sincronizar datos offline.online
---

##Reglas Generales##
La integridad referencial y las reglas de inmutabilidad son críticas para evitar inconsistencias durante la sincronización de datos entre el cliente localy el servidor central.
Identificadores: Todas las tablas deben usar UUID v4 como Primary Key (id). Nunca autoincrementales.

Tipos de Moneda: Todos los campos de dinero (costo, precio_publico, total, etc.) deben usar el tipo de dato DECIMAL(10,2) (o equivalente en el ORM) para evitar errores de coma flotante.

##Usuarios##

Restricción de Rol: El campo rol debe ser un ENUM estricto: ['DUEÑO', 'ENCARGADO', 'CAJERO'].

Credenciales: El email debe ser UNIQUE e indexado.

Regla de Negocio (PIN): Si el rol es CAJERO o ENCARGADO, el campo pin_hash es obligatorio (NOT NULL) para permitir el cambio rápido de sesión en el POS.

##Sucursales##

Restricción: No se puede eliminar una sucursal si tiene registros en Turnos o Inventario_Sucursal (Comportamiento: RESTRICT).

##Proveedores##

Ninguna regla restrictiva compleja, pero el campo nombre debe ser UNIQUE.

##Productos##
NO se manejan codigos de barras.
Validación Matemática: costo y precio_publico deben ser mayores o iguales a 0. precio_publico siempre debe ser mayor o igual a costo.

##Inventario_Sucursal (Pivote)##

Unicidad Compuesta: Debe existir un índice único compuesto por (sucursal_id, producto_id) para evitar registros duplicados del mismo producto en la misma sucursal.

Validación: cantidad puede llegar a 0, pero la base de datos debe impedir valores negativos (CHECK cantidad >= 0).

##Turnos##

Regla de Estado: Un usuario_id solo puede tener un (1) turno con estado ABIERTO a la vez.

Validación de Fechas: Si estado es CERRADO, fecha_cierre debe ser estrictamente mayor a fecha_apertura y no puede ser nula (NOT NULL).

Dinero: monto_inicial y total_ventas no pueden ser negativos.

##Ventas##

Inmutabilidad Parcial: Si estado es COMPLETADA, los campos total y fecha son inmutables (no se pueden hacer UPDATE).

Sincronización: Campo sync_status (ENUM: ['PENDING', 'SYNCED']) por defecto siempre será PENDING al crearse.

##Detalle_Ventas##

Inmutabilidad Total: Solo permite INSERT. Las operaciones UPDATE o DELETE están estrictamente prohibidas en esta tabla a nivel base de datos/ORM.

Regla de Histórico: El precio_unitario_historico es obligatorio. Debe ser una copia dura del precio_publico del producto en el momento exacto de la transacción.

Validación: cantidad debe ser mayor a 0.

