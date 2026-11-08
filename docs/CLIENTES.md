# Clientes, proyectos, contratos, cobros, pagos y soporte — plan y maquetas

Estado: **F1 implementada** (08 nov 2026): ficha de cliente, catálogo, proyectos con hitos, "Convertir en proyecto", historial, Resumen y Mis proyectos reales, y datos de facturación en el perfil (migración `005_clientes_proyectos.sql`). Cuentas de cobro, pagos y soporte muestran "Muy pronto" hasta F3–F5. Sigue a `PRESUPUESTOS.md`: este plan empieza donde termina una solicitud **aceptada**.

En F1, "Convertir en proyecto" también acepta solicitudes en `nueva`, `en_revision` o `respondida`, y las deja en `aceptada`. Las rechazadas y archivadas no se pueden convertir.

**Decisiones (08 nov 2026):**
- **Documentos de cobro:** **cuentas de cobro** generadas por Seventwo, con consecutivo propio (`CC-0001`) y PDF. No es factura electrónica DIAN. Si más adelante hace falta, se añade un proveedor DIAN sin rehacer el modelo (§4.5).
- **Pagos, tres vías que conviven:**
  1. **Mercado Pago**: checkout desde el área de cliente y confirmación automática por webhook. Ya funciona en pruebas en inmobitwo; las credenciales de Seventwo las pasa el usuario.
  2. **Transferencia o Nequi con comprobante**: el cliente sube la captura, la IA la lee (importe, fecha, referencia, banco) y la empareja con el cobro pendiente.
  3. **Registro manual del admin**: sube la captura o la nota y marca el cobro como pagado.
- **Contratos:** PDF + **aceptación en la app**. Se guarda quién aceptó, cuándo, la IP, el user-agent y el hash SHA-256 del PDF. También se puede subir un contrato ya firmado a mano.
- **Cuentas:** **una cuenta = un cliente** (persona o empresa con NIT). La ficha de cliente es una tabla aparte de `usuarios`, así que pasar a "empresa con varios usuarios" más adelante no obliga a rehacer nada.
- **Moneda:** COP por defecto. Cada proyecto y cobro guarda su moneda, por si algún día hay clientes en USD.

> **Por qué la captura no marca "pagado" sola.** Una captura se falsifica en segundos y no tenemos acceso al banco para contrastarla. La IA deja el pago **"en verificación"** con los datos leídos y la coincidencia con el cobro. El admin confirma con un clic desde `/admin` o desde el botón del aviso de Telegram. La confirmación automática real llega con Mercado Pago, que avisa por webhook firmado. En una fase posterior podría llegar también leyendo los **emails de notificación del banco** (Bancolombia y Nequi avisan de cada transferencia recibida), que sí son una fuente verificable (§10, F6).

## 1. El flujo en una línea

> Solicitud **aceptada** → el admin pulsa **"Convertir en proyecto"** → se crea la **ficha de cliente** (o se completa la que exista), la cuenta pasa a rol **cliente** y nace el **proyecto** con los datos de la solicitud → se adjunta el **contrato**, que el cliente acepta desde su área → se emiten **cuentas de cobro** (por hito, únicas o periódicas) → el cliente **paga** por una de las tres vías → el soporte se lleva con **tickets** ligados al proyecto. **Todo queda en la línea de tiempo del cliente.**

```
 SOLICITUD S-0012 (aceptada)
        │  "Convertir en proyecto"
        ▼
 CLIENTE (ficha: datos fiscales y de contacto) ◀── el cliente la completa o edita desde "Mi perfil"
        │
        ▼
 PROYECTO P-0007  ── tipo, modelo de cobro, fechas, valor, responsable, hitos
        │
        ├──▶ CONTRATO  v1 (PDF) ── enviado ──▶ aceptado por el cliente (IP, fecha, hash)
        │
        ├──▶ CUENTAS DE COBRO  CC-0031 (anticipo 50 %) · CC-0040 (entrega 50 %) · CC-0052 (mantenimiento nov) …
        │          │
        │          └──▶ PAGOS ── Mercado Pago (webhook)  ─────────────▶ confirmado
        │                       captura → IA → "en verificación" ──▶ admin confirma
        │                       admin registra a mano ─────────────────▶ confirmado
        │
        └──▶ TICKETS  T-0003 "Cambiar textos de la home" … (conversación, como las solicitudes)

 ACTIVIDAD: cada paso anterior deja un evento → "Últimos movimientos" del cliente y el historial del admin
```

## 2. Qué datos de ejemplo se reemplazan

| Sección (área de cliente) | Datos de ejemplo de hoy | Pasa a salir de |
|---|---|---|
| **Resumen** | "Proyecto activo", 480,00 €, "próximo pago 28 Jul 2024", "100 % pagado", tarjetas (2 facturas pendientes, Mantenimiento web, 1 ticket), actividad reciente | Proyectos activos, saldo pendiente y próximo vencimiento, conteos reales y `actividad` visible para el cliente |
| **Servicio contratado** | "Mantenimiento web Essential", inicio 01 Ene 2024, mensual, 480 €/mes, 4 ítems incluidos | **Mis proyectos**: lista y detalle de cada proyecto con estado, fechas, valor, modelo de cobro, hitos, lo que incluye y el contrato |
| **Facturas** | Tres facturas FAC-2024-00x en euros, total del año, pagadas y pendientes | **Cuentas de cobro**: `cobros`, con PDF descargable, filtro por año y estados reales |
| **Pagos** | Próximo cobro 480 € "cargo automático", Visa •••• 4242 de María García, historial | **Pagos**: pendiente de pago con botones *Pagar con Mercado Pago* y *Subir comprobante*, más el historial de `pagos` y el estado de cada comprobante. Sin tarjetas guardadas, que maneja Mercado Pago |
| **Soporte** | Tickets #2841 y #2819 inventados, botón "Nuevo ticket" sin acción | `tickets` + conversación, con nuevo ticket ligado a un proyecto |
| **Menú lateral** | Badges fijos "2" (facturas) y "1" (soporte) | Conteos reales: cobros pendientes y tickets esperando al cliente |
| **Mi perfil** | Solo nombre, email y teléfono | Más una pestaña **Datos de facturación** (ficha de cliente) |
| **Ayuda** | Tres tarjetas estáticas | Se queda estática; en F5 se enlaza con soporte |

## 3. Reglas de negocio

1. **Un proyecto siempre tiene un cliente**, y una solicitud aceptada solo puede convertirse en un proyecto (`proyectos.solicitud_id` único). También se pueden crear proyectos sin solicitud, para clientes que llegan por otra vía.
2. **Convertir en proyecto** hace en una sola transacción:
   - crea la ficha de cliente si no existe;
   - sube el rol de `usuario` a `cliente`, nunca baja uno mayor;
   - crea el proyecto con el tipo, la descripción y el contacto de la solicitud;
   - deja la solicitud en `aceptada` y registra la actividad.

   Si el solicitante **no tiene cuenta**, el proyecto queda ligado a su email (`clientes.email`) y se le invita por correo a crearla. Al verificar ese email, se vincula, igual que las solicitudes.
3. **Qué edita el cliente:** sus datos de contacto y de facturación (razón social, documento, dirección, email de facturación…). Cada cambio queda en `actividad` con el valor anterior. Si la ficha ya tiene cobros emitidos, los cobros **conservan una copia** de los datos con los que se emitieron: editar la ficha no altera documentos pasados.
4. **Qué no edita el cliente:** estado, notas internas, proyectos, valores, cobros. Solo el equipo.
5. **Los cobros son inmutables una vez emitidos.** Para corregir uno se **anula** y se emite otro. El consecutivo `CC-` nunca se reutiliza ni deja huecos sin explicar: la anulación queda registrada.
6. **Un cobro puede recibir varios pagos** (abonos). Su estado se deriva de la suma de pagos confirmados: `pendiente → parcial → pagado`. `vencido` sale de la fecha de vencimiento.
7. **Solo los pagos confirmados cuentan.** Un comprobante subido queda `en_verificacion` y no cambia el saldo hasta que un admin lo confirma o lo rechaza con un motivo, que le llega al cliente.
8. **El contrato aceptado no cambia.** Si hay que cambiar algo, se sube una **nueva versión** que el cliente vuelve a aceptar; las anteriores quedan en el historial.
9. **Archivos privados.** Contratos, comprobantes y PDFs de cobro no tienen URL pública. Se descargan por la API comprobando que la cuenta es dueña del cliente o es del equipo, sin IDOR (§8).
10. **Todo deja rastro en `actividad`** (quién, qué, cuándo, antes y después), con un flag `visible_cliente` para decidir qué aparece en "Últimos movimientos" del cliente.

## 4. Modelo de datos (migraciones 005–008)

### 4.1 Clientes y catálogo (005)

```sql
clientes
  id, usuario_id (UNIQUE, NULL si aún no tiene cuenta), email (para vincular)
  tipo_persona        natural | juridica
  nombre / razon_social, nombre_comercial
  tipo_documento      CC | CE | NIT | PAS        numero_documento, dv (NIT)
  email_facturacion, telefono, direccion, ciudad, departamento, pais (CO)
  sitio_web, sector
  contacto_nombre, contacto_cargo, contacto_telefono      -- persona de contacto (empresas)
  estado              activo | pausado | baja
  notas_internas      -- solo el equipo
  alta_por (admin), creado_en, actualizado_en

servicios_catalogo          -- precios y "lo que incluye", editable desde /admin
  id, nombre, categoria (proyecto | recurrente), tipo_proyecto
  descripcion, incluye TEXT[]
  modelo_cobro        unico | hitos | recurrente | horas
  precio_base, moneda, periodicidad (mensual | trimestral | anual, si recurrente)
  activo
```

### 4.2 Proyectos (006)

```sql
proyectos
  id, codigo (P-0001), cliente_id, solicitud_id (UNIQUE, NULL), servicio_id (NULL)
  nombre, tipo_proyecto, descripcion, incluye TEXT[]
  modelo_cobro        unico | hitos | recurrente | horas
  valor_total, moneda                         -- único / hitos
  importe_periodo, periodicidad, proximo_cobro -- recurrente
  horas_contratadas, precio_hora               -- bolsa de horas
  estado              propuesta | en_curso | pausado | entregado | mantenimiento | finalizado | cancelado
  fecha_inicio, fecha_entrega_estimada, fecha_entrega, fecha_fin
  progreso (0–100), responsable_id (equipo)
  creado_en, actualizado_en

proyecto_hitos
  id, proyecto_id, orden, nombre, descripcion
  fecha_prevista, fecha_completado, estado (pendiente | en_curso | completado)
  porcentaje_cobro / importe   -- al completarse, se puede emitir su cobro
```

### 4.3 Contratos (007)

```sql
contratos
  id, proyecto_id, version, titulo
  archivo_id → archivos, sha256
  estado              borrador | enviado | aceptado | firmado_fuera | reemplazado
  enviado_en, aceptado_en, aceptado_por (usuario), aceptado_ip, aceptado_ua
```

### 4.4 Archivos (007)

```sql
archivos
  id (UUID), cliente_id, subido_por, nombre_original, mime, bytes, sha256
  ruta (volumen privado /data/archivos/AAAA/MM/uuid), creado_en
```

Se guardan en un volumen de Docker del backend, nunca en `public/`. Límites: PDF de hasta 10 MB y comprobantes JPG/PNG/WEBP/PDF de hasta 5 MB. Se valida el tipo por los bytes iniciales, no solo por la extensión.

### 4.5 Cobros, pagos y soporte (008)

```sql
cobros                      -- cuentas de cobro
  id, numero (CC-0001, secuencia propia), cliente_id, proyecto_id, hito_id (NULL)
  concepto, lineas JSONB [{descripcion, cantidad, valor_unitario}]
  total, moneda
  fecha_emision, fecha_vencimiento
  estado              borrador | emitido | parcial | pagado | anulado     (vencido = derivado)
  emisor JSONB, cliente_snapshot JSONB   -- copia congelada de los datos al emitir
  pdf_archivo_id, anulado_motivo
  mp_preference_id                        -- Mercado Pago
  proveedor_fiscal, numero_fiscal, cufe   -- vacíos; reservados por si algún día hay DIAN

pagos
  id, cobro_id, cliente_id, importe, moneda, fecha_pago
  via                 mercadopago | comprobante | manual
  estado              en_verificacion | confirmado | rechazado
  referencia, banco, comprobante_archivo_id
  lectura_ia JSONB    {importe, fecha, referencia, banco, confianza, coincide_con_cobro}
  mp_payment_id (UNIQUE), mp_status
  registrado_por, confirmado_por, confirmado_en, rechazo_motivo

tickets
  id, codigo (T-0001), cliente_id, proyecto_id (NULL), creado_por
  asunto, categoria (incidencia | cambio | consulta | cobros)
  prioridad (baja | normal | alta | urgente)
  estado (abierto | en_progreso | esperando_cliente | resuelto | cerrado)
  asignado_a, creado_en, actualizado_en, cerrado_en

ticket_mensajes            -- igual que solicitud_mensajes (de_equipo, interno, adjunto_id)

actividad
  id, cliente_id, actor_id, entidad (cliente | proyecto | contrato | cobro | pago | ticket)
  entidad_id, accion, datos JSONB (antes/después), visible_cliente, creado_en
```

## 5. API (backend)

| Método | Ruta | Quién | Para qué |
|---|---|---|---|
| GET · PATCH | `/clientes/yo` | cliente | Mi ficha de facturación (solo campos editables) |
| GET | `/clientes/yo/resumen` | cliente | Datos del Resumen: proyectos activos, saldo, próximo vencimiento, conteos, actividad |
| GET | `/proyectos/mios` · `/proyectos/mios/:codigo` | cliente | Mis proyectos y su detalle (hitos, contrato) |
| POST | `/contratos/:id/aceptar` | cliente | Acepta la versión vigente (guarda IP, UA y hash) |
| GET | `/cobros/mios` · `/cobros/mios/:numero` | cliente | Mis cuentas de cobro |
| POST | `/cobros/mios/:numero/mercadopago` | cliente | Crea la preferencia y devuelve la URL de pago |
| POST | `/cobros/mios/:numero/comprobante` | cliente | Sube la captura → lectura con IA → pago `en_verificacion` |
| GET · POST | `/tickets/mios` · `/tickets/mios/:codigo/mensajes` | cliente | Soporte |
| GET | `/archivos/:id` | dueño o equipo | Descarga privada (contrato, comprobante, PDF) |
| GET · POST · PATCH | `/admin/clientes[/:id]` | admin+ | Listado, ficha completa, alta manual, notas internas |
| POST | `/admin/solicitudes/:id/convertir` | admin+ | Solicitud aceptada → cliente + proyecto (§3.2) |
| CRUD | `/admin/servicios` | admin+ | Catálogo y precios |
| CRUD | `/admin/proyectos[/:id][/hitos]` | admin+ | Proyectos e hitos |
| POST | `/admin/proyectos/:id/contratos` | admin+ | Subir una versión del contrato y enviarla |
| POST · PATCH | `/admin/cobros` · `/admin/cobros/:id/emitir` · `/anular` | admin+ | Emitir y anular cuentas de cobro |
| POST · PATCH | `/admin/pagos` · `/admin/pagos/:id/confirmar` · `/rechazar` | admin+ | Registrar a mano y verificar comprobantes |
| CRUD | `/admin/tickets[/:id]` | admin+ | Gestión de soporte |
| POST | `/webhooks/mercadopago` | Mercado Pago | Verifica la firma `x-signature`, consulta el pago a la API y confirma |

**Tareas programadas** (el job horario que ya existe):
- generar los cobros de los proyectos recurrentes cuando llega `proximo_cobro`, en `borrador` o emitidos directamente según una opción del proyecto;
- avisar 3 días antes del vencimiento y el día que vence;
- marcar como vencidos los cobros con la fecha pasada.

**Avisos:** se reutiliza `notificar()`, que ya reparte por BD, socket, push, email y Telegram. Eventos nuevos:

| Evento | Destino |
|---|---|
| Cobro emitido | Cliente |
| Vence pronto | Cliente |
| Comprobante subido | Equipo (Telegram con botón "Revisar pago") |
| Pago confirmado o rechazado | Cliente |
| Contrato enviado | Cliente |
| Contrato aceptado | Equipo |
| Ticket nuevo o respuesta del cliente | Equipo |
| Respuesta del equipo | Cliente |
| Hito completado | Cliente |

## 6. Las tres vías de pago

### 6.1 Mercado Pago (Checkout Pro)
1. El cliente pulsa **Pagar con Mercado Pago** en un cobro pendiente.
2. El backend crea una preferencia con `external_reference = CC-0031`, el importe pendiente y las URLs de vuelta a `/area-cliente?seccion=cobros&cobro=CC-0031`, y guarda `mp_preference_id`.
3. Mercado Pago llama al webhook. Se **verifica la firma** y se **consulta el pago** a la API de Mercado Pago, sin fiarse del cuerpo del webhook. Si está `approved` y el importe y la referencia coinciden, se crea el pago `confirmado`. Es idempotente gracias a `mp_payment_id UNIQUE`.
4. Avisos al cliente y al equipo.

Se toma la estructura de la integración de inmobitwo (preferencia, webhook, verificación), con **credenciales propias de Seventwo** (`MP_ACCESS_TOKEN` y `MP_WEBHOOK_SECRET`) en el `.env`. Primero en modo prueba.

### 6.2 Transferencia o Nequi con comprobante
1. En el cobro se muestran los **datos de pago** (banco, tipo y número de cuenta, Nequi, titular), configurables desde `/admin`, y la referencia que debe poner: `CC-0031`.
2. El cliente sube la captura. El backend la guarda y la envía a **Claude con visión**, que devuelve JSON estructurado: importe, fecha, referencia, banco o entidad, número de aprobación y confianza. El modelo se elige al implementar.
3. Se compara con el cobro: importe igual al pendiente, fecha posterior a la emisión, referencia o nombre coincidente, y que ese número de aprobación no se haya usado ya en otro pago (anti-duplicados).
4. Se crea el pago `en_verificacion` con la lectura y el resultado (✓ coincide, ⚠ importe distinto, ⚠ sin referencia…). Aviso al equipo por Telegram con los datos leídos y el botón para revisar.
5. El admin ve la captura junto a la lectura y pulsa **Confirmar** o **Rechazar** (con motivo). El cliente recibe el aviso.

Si la IA no está configurada (sin API key), el comprobante entra igual como `en_verificacion`, sin la lectura.

### 6.3 Registro manual del admin
Desde la ficha del cobro: **Registrar pago** con importe, fecha, vía (transferencia, Nequi, efectivo…), referencia y, opcionalmente, la captura. Queda `confirmado` y con autor. Opcionalmente, el admin sube la captura y deja que la IA rellene el formulario.

## 7. Maquetas

### 7.1 /admin → solicitud aceptada → "Convertir en proyecto"
```
┌─ S-0012 · Laura Gómez · Página web ─────────────────── [Aceptada ▾] ┐
│ …conversación…                                                     │
│ ┌──────────────────────────────────────────────────────────────┐  │
│ │ ✓ Solicitud aceptada        [ Convertir en proyecto → ]       │  │
│ └──────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────┘

        ┌─ Nuevo proyecto desde S-0012 ──────────────────────────────┐
        │ CLIENTE   ● Laura Gómez (cuenta existente, pasará a cliente)│
        │           Tipo  (•) Persona natural  ( ) Empresa            │
        │           Documento [CC ▾] [ 1.020.345.678 ]                │
        │ PROYECTO  Nombre   [ Web corporativa Gómez Estudio        ] │
        │           Servicio [ Página web · Landing pro ▾ ]  (catálogo)│
        │           Modelo   [ Por hitos ▾ ]   Valor [ $ 4.800.000 ]  │
        │           Inicio   [ 15/11/2026 ]   Entrega [ 20/12/2026 ]  │
        │           Responsable [ Mateo ▾ ]                           │
        │ HITOS     1. Anticipo y arranque ......... 50 %  15/11      │
        │           2. Entrega y publicación ....... 50 %  20/12      │
        │           [ + hito ]                                        │
        │ [ ] Emitir ya la cuenta de cobro del primer hito             │
        │                          [ Cancelar ]  [ Crear proyecto ]   │
        └─────────────────────────────────────────────────────────────┘
```

### 7.2 /admin → Clientes (nueva sección) y ficha
```
 Clientes  [ Buscar nombre, documento, email… ]   [ Activos ▾ ]   [ + Nuevo cliente ]
 ─────────────────────────────────────────────────────────────────────────────────
 Laura Gómez            CC 1.020.345.678   1 proyecto en curso   $ 2.400.000 pendiente
 Inversiones Rojas SAS  NIT 901.234.567-1  2 proyectos           Al día
 …

 ┌─ Laura Gómez ─────────────────────── Activo ▾ ─────────────────────────────┐
 │ [Resumen] [Datos] [Proyectos] [Contratos] [Cobros] [Pagos] [Tickets] [Historial] │
 │                                                                             │
 │ Saldo pendiente  $ 2.400.000    Próximo vencimiento  CC-0040 · 20 dic       │
 │ Proyectos   P-0007 Web corporativa · En curso · 60 %                        │
 │ Contrato    v1 · Aceptado 16 nov 10:42 (IP 181.x.x.x)                       │
 │ Notas internas (solo equipo)  [ Prefiere WhatsApp, factura a nombre…    ]   │
 │                                                                             │
 │ HISTORIAL                                                                   │
 │ 16 nov  Laura aceptó el contrato v1                                         │
 │ 15 nov  Mateo emitió CC-0031 · $ 2.400.000                                  │
 │ 15 nov  Mateo creó P-0007 desde S-0012                                      │
 └─────────────────────────────────────────────────────────────────────────────┘
```

### 7.3 /admin → verificar un comprobante
```
┌─ Pago en verificación · CC-0031 · Laura Gómez ──────────────────────────────┐
│ ┌────────────────┐   Lectura IA                     Cobro                   │
│ │                │   Importe   $ 2.400.000      ✓   $ 2.400.000 pendiente   │
│ │   (captura     │   Fecha     16 nov 2026      ✓   emitido 15 nov          │
│ │    Nequi)      │   Referencia CC-0031          ✓                          │
│ │                │   Entidad   Nequi · aprob. 4K7… ✓ no usado antes         │
│ └────────────────┘   Confianza  alta                                        │
│                                                                             │
│              [ Rechazar… ]                     [ ✓ Confirmar pago ]          │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.4 Área de cliente → Resumen (con datos reales)
```
 Buenas tardes, Laura                                   [ + Cotizar nuevo proyecto ]
 ┌─ Proyecto activo ─────────────────────┐  ┌─ Estado de cuenta ──────────┐
 │ Web corporativa Gómez Estudio         │  │ $ 2.400.000 pendiente       │
 │ En curso · 60 % ████████░░░░          │  │ CC-0040 vence 20 dic 2026   │
 │ Próximo hito: Entrega · 20 dic        │  │ ██████████░░░░ 50 % pagado  │
 │ [ Ver proyecto → ]                    │  │ [ Pagar ahora → ]           │
 └───────────────────────────────────────┘  └─────────────────────────────┘
 [ Cuentas de cobro: 1 pendiente ]  [ Mis proyectos: 1 en curso ]  [ Soporte: 1 abierto ]

 Últimos movimientos
 ✓ Pago confirmado       CC-0031 · 16 nov              + $ 2.400.000
 ✎ Contrato aceptado     P-0007 v1 · 16 nov
 ◆ Hito completado       Anticipo y arranque · 15 nov
```
Si el cliente aún no tiene proyecto (recién pasado a cliente), se muestra un estado vacío con "Estamos preparando tu proyecto" y la solicitud de la que viene.

### 7.5 Área de cliente → Mis proyectos (sustituye a "Servicio contratado")
```
 P-0007 · Web corporativa Gómez Estudio                         [ En curso ]
 Página web · Por hitos · $ 4.800.000 · Inicio 15 nov 2026 · Entrega prevista 20 dic 2026
 Responsable: Mateo Lizcano

 HITOS                                         LO QUE INCLUYE
 ✓ Anticipo y arranque      15 nov  50 %       ✓ Diseño a medida (5 secciones)
 ◐ Diseño y desarrollo      —                  ✓ Formulario de contacto
 ○ Entrega y publicación    20 dic  50 %       ✓ Hosting y dominio el primer año

 CONTRATO   v1 · Contrato de desarrollo web.pdf   ✓ Aceptado el 16 nov 2026   [ Descargar ]
            (si está pendiente:  [ Leer contrato ]  [ ✓ Acepto el contrato ] )
 ORIGEN     Solicitud S-0012 · 08 nov 2026
```

### 7.6 Área de cliente → Cuentas de cobro y pago
```
 Tus cuentas de cobro                                              [ 2026 ▾ ]
 Total 2026 $ 4.800.000 · Pagado $ 2.400.000 · Pendiente $ 2.400.000
 ───────────────────────────────────────────────────────────────────────────
 CC-0040  Entrega y publicación (50 %)   20 dic   $ 2.400.000  [Pendiente]  [ Pagar ]
 CC-0031  Anticipo y arranque (50 %)     15 nov   $ 2.400.000  [Pagada]     [ PDF ]

        ┌─ Pagar CC-0040 · $ 2.400.000 ───────────────────────────┐
        │ [ Pagar con Mercado Pago ]   tarjeta, PSE, efectivo     │
        │ ─────────────── o por transferencia ───────────────     │
        │ Bancolombia ahorros 123-456789-00 · Nequi 300 000 0000  │
        │ Titular: … · Referencia: CC-0040                         │
        │ [ Subir comprobante ]  (captura o PDF, máx. 5 MB)        │
        └──────────────────────────────────────────────────────────┘
 Tras subirlo: "Recibimos tu comprobante. Lo estamos verificando" → aviso cuando se confirme.
```

### 7.7 Área de cliente → Soporte
```
 Centro de soporte                                              [ + Nuevo ticket ]
 T-0003  Cambiar textos de la home    P-0007 · Cambio     Esperando tu respuesta · hace 2 h
 T-0001  Duda con la cuenta de cobro  Cobros              Resuelto · 18 nov

 Nuevo ticket:  Proyecto [P-0007 ▾]  Tipo [Cambio ▾]  Prioridad [Normal ▾]
                Asunto [ … ]   Detalle [ … ]   Adjunto (opcional)
```

### 7.8 Cuenta de cobro (PDF)
```
                                CUENTA DE COBRO N.º CC-0040
 Ciudad y fecha: Bogotá, 20 de diciembre de 2026
 [CLIENTE] Laura Gómez · CC 1.020.345.678
 DEBE A: [EMISOR] Nombre · CC … · No responsable de IVA
 LA SUMA DE: dos millones cuatrocientos mil pesos M/CTE ($ 2.400.000)
 POR CONCEPTO DE: Entrega y publicación (50 %) — Proyecto P-0007 Web corporativa
 Pago a: Bancolombia ahorros … · Nequi … · Referencia CC-0040
 ______________________
 Firma · Nombre · CC
```
Los datos del emisor (nombre, documento, régimen, ciudad, cuentas, firma en imagen) se configuran una vez en `/admin → Ajustes de cobro`.

## 8. Seguridad (lo mismo que se revisó en presupuestos, más archivos y dinero)
- **IDOR:** toda ruta `/…/mios` filtra por el `cliente_id` de la cuenta del token, nunca por un id del cuerpo o la URL. `/archivos/:id` comprueba que el archivo es del cliente de la cuenta o que quien lo pide es del equipo.
- **Archivos:** se valida el tipo por los bytes iniciales, hay límite de tamaño, se usa nombre UUID en disco, se descarga con `Content-Disposition: attachment` y `X-Content-Type-Options: nosniff`, y nunca se sirven desde `public/`.
- **Importes:** los importes los calcula siempre el backend, a partir del cobro. El cliente nunca envía un importe a pagar.
- **Webhook de Mercado Pago:** se verifica la firma, se consulta el pago a la API y es idempotente. Un webhook falso no puede marcar nada como pagado.
- **Comprobantes:** nunca confirman solos; hay un anti-duplicado por número de aprobación y un rate limit en las subidas.
- **Rate limits** en tickets, subidas y creación de preferencias.

## 9. Variables de entorno nuevas (backend)
```
ARCHIVOS_DIR=/data/archivos          # volumen de docker-compose
MP_ACCESS_TOKEN=                     # Mercado Pago (primero el de prueba)
MP_WEBHOOK_SECRET=
ANTHROPIC_API_KEY=                   # lectura de comprobantes (opcional: sin ella, revisión manual)
```

## 10. Fases

| Fase | Contenido | Resultado visible |
|---|---|---|
| **F1** | Ficha de cliente (005), catálogo, proyectos e hitos (006), "Convertir en proyecto", `actividad`. Área de cliente: **Resumen** real, **Mis proyectos**, **Datos de facturación** en el perfil. /admin: **Clientes** y **Catálogo** | Das de alta a tu cliente con todos sus datos y su proyecto; él los ve y edita los suyos |
| **F2** | Archivos privados y **contratos** (007): subir versión, enviar, aceptar en la app, historial | Contrato aceptado con evidencia |
| **F3** | **Cuentas de cobro** (008): emisión, PDF, anulación, cobros por hito y recurrentes, recordatorios de vencimiento. **Registro manual de pagos** (vía 3) | El cliente ve y descarga sus cuentas de cobro; tú marcas pagos |
| **F4** | **Comprobantes con IA** (vía 2) y **Mercado Pago** (vía 1), en modo prueba y luego en producción | El cliente paga solo desde su área |
| **F5** | **Tickets** de soporte con avisos; badges reales del menú; Ayuda enlazada a soporte | Soporte trazable por proyecto |
| F6 (más adelante) | Lectura de emails del banco para confirmar transferencias solas, proveedor DIAN si llega a hacer falta, empresa con varios usuarios, backups | — |

## 11. Pendiente de definir antes de F3
- Datos del **emisor** de las cuentas de cobro: nombre, documento, régimen ("no responsable de IVA"), ciudad, firma.
- **Cuentas** de pago que se muestran: banco, número, Nequi y titular.
- ¿Los cobros recurrentes se emiten **solos** o quedan en **borrador** para revisarlos?
- Plazo de vencimiento por defecto (p. ej. 5 días).
