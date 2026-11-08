# Solicitudes de presupuesto y notificaciones — plan y maquetas

Estado: **planificación**. Todavía no hay nada implementado.

## 1. El flujo en una línea

> Un visitante pide presupuesto desde la home **con su email** → se guarda la solicitud → **admins y superadmin reciben el aviso en tiempo real** (app/PWA, email y Telegram) → el equipo **responde desde /admin** → al solicitante le llega la respuesta **por email** y, si tiene cuenta, también en su **área de cliente y su app**. Si crea la cuenta más tarde con ese email, **ve todas sus solicitudes anteriores**.

```
 VISITANTE (sin cuenta)                 BACKEND                         EQUIPO (admin / superadmin)
 ─────────────────────                  ───────                         ──────────────────────────
 Home → formulario ──POST /solicitudes──▶ guarda solicitud (email) ──┬──▶ notificación en BD
   nombre, email, tipo,                   email de confirmación ◀──┐ ├──▶ socket-core  (tiempo real, app abierta)
   rango, descripción                     al solicitante           │ ├──▶ Web Push     (app instalada / cerrada)
                                                                   │ ├──▶ Email
                                                                   │ └──▶ Telegram
                                                                   │
 Email "Recibimos tu solicitud S-0012" ◀───────────────────────────┘

                                         /admin/solicitudes/:id ◀── el admin responde
 Email con la respuesta ◀──────────────── guarda respuesta ─────────┐
 + si tiene cuenta:                        estado → respondida      │
   notificación + socket + push ◀─────────────────────────────────┘

 Se registra más tarde con el mismo email ──▶ al VERIFICAR el email se le vinculan sus solicitudes previas
```

## 2. Reglas de negocio

1. **Pedir presupuesto no exige cuenta.** El email es obligatorio y es la clave para vincular.
2. **Vinculación por email, solo con el email verificado.** Las solicitudes huérfanas (`usuario_id IS NULL`) con ese email se asignan a la cuenta cuando:
   - el usuario verifica su email al registrarse,
   - entra con Google (Google ya garantiza el email),
   - o envía una solicitud estando logueado.

   Así nadie puede registrarse con el email de otra persona y ver sus solicitudes: sin verificar, no hay vínculo.
3. **Con sesión**, el formulario sale relleno con su nombre y email, y la solicitud queda vinculada al momento.
4. **Las notificaciones viven en nuestra BD.** socket-core no guarda mensajes, solo transporta. Si el admin no está conectado, la notificación sigue ahí al entrar (campana con contador) y además le llegó por email, Telegram y push.
5. **Cada canal de aviso es independiente y tolerante a fallos.** Si Telegram falla, el email y el push salen igual. Ningún fallo de aviso hace fallar la solicitud.
6. **El solicitante siempre recibe la respuesta por email**, tenga cuenta o no. Si no tiene cuenta, el email invita a crearla con ese mismo correo para seguir la conversación.

## 3. Estados de una solicitud

```
nueva ──▶ en_revision ──▶ respondida ──▶ aceptada   (→ el admin puede pasar el usuario a "cliente")
  │                           │     └──▶ rechazada
  └─────────▶ archivada ◀─────┘          (spam, duplicada, sin respuesta)
```

| Estado | Lo pone | Qué significa |
|---|---|---|
| `nueva` | sistema | Recién llegada; cuenta en el contador de la campana. |
| `en_revision` | admin (automático al abrirla) | Alguien del equipo la está mirando. |
| `respondida` | admin, al enviar una respuesta | Se envió propuesta o preguntas al solicitante. |
| `aceptada` / `rechazada` | admin | Resultado comercial. |
| `archivada` | admin | Spam, duplicada o cerrada sin más. |

## 4. Modelo de datos (migración 004)

```sql
-- Solicitudes de presupuesto
solicitudes (
  id            BIGSERIAL PK,
  codigo        VARCHAR(12) UNIQUE,          -- "S-0012", visible para el cliente
  usuario_id    INT NULL → usuarios(id),     -- NULL hasta que exista cuenta verificada con ese email
  email         VARCHAR(255) NOT NULL,       -- en minúsculas; clave de vinculación
  nombre        VARCHAR(100) NOT NULL,
  telefono      VARCHAR(20),
  empresa       VARCHAR(120),
  tipo_proyecto VARCHAR(40)  NOT NULL,       -- Página web | Aplicación web | App móvil | Software a medida
  presupuesto   VARCHAR(40),                 -- Por definir | Menos de $10M COP | Más de $10M COP
  descripcion   TEXT NOT NULL,               -- 20–3000 caracteres
  estado        VARCHAR(20) NOT NULL DEFAULT 'nueva',
  origen        VARCHAR(20) NOT NULL,        -- 'web' (home) | 'area_cliente'
  asignado_a    INT NULL → usuarios(id),     -- admin responsable (opcional)
  ip, user_agent,
  created_at, updated_at
)
INDEX (lower(email)) WHERE usuario_id IS NULL     -- vinculación rápida

-- Conversación de cada solicitud (respuestas del equipo y del cliente)
solicitud_mensajes (
  id, solicitud_id → solicitudes, autor_id INT NULL → usuarios,  -- NULL = el solicitante sin cuenta
  cuerpo TEXT, interno BOOLEAN DEFAULT false,                     -- interno = nota solo para el equipo
  created_at
)

-- Bandeja de notificaciones in-app (la campana)
notificaciones (
  id, usuario_id → usuarios, tipo VARCHAR(40),   -- 'solicitud_nueva' | 'solicitud_respondida' | ...
  titulo, cuerpo, url,                            -- url relativa: /admin/solicitudes/12
  datos JSONB, leida_en TIMESTAMPTZ NULL, created_at
)

-- Dispositivos con la app instalada (Web Push)
push_suscripciones (
  id, usuario_id → usuarios, endpoint TEXT UNIQUE, p256dh, auth,
  user_agent, created_at, ultimo_uso
)

-- Identificador opaco para socket-core (el README pide no usar ids/emails en `sub`)
ALTER TABLE usuarios ADD COLUMN socket_id UUID UNIQUE DEFAULT gen_random_uuid();
```

## 5. API (backend)

| Método | Ruta | Quién | Qué hace |
|---|---|---|---|
| POST | `/solicitudes` | **público** (o con sesión) | Crea la solicitud, envía la confirmación y dispara los avisos al equipo. Anti-spam en §8. |
| GET | `/solicitudes/mias` | usuario+ | Mis solicitudes, con su estado. |
| GET | `/solicitudes/mias/:codigo` | usuario+ (dueño) | Detalle y mensajes no internos. |
| POST | `/solicitudes/mias/:codigo/mensajes` | usuario+ (dueño) | El cliente contesta (avisa al equipo). |
| GET | `/admin/solicitudes?estado=&buscar=&pagina=` | admin+ | Listado con contadores por estado. |
| GET | `/admin/solicitudes/:id` | admin+ | Detalle con todos los mensajes; pasa `nueva` a `en_revision`. |
| POST | `/admin/solicitudes/:id/mensajes` | admin+ | Responde (o deja una nota interna); el estado pasa a `respondida` y se avisa al solicitante. |
| PATCH | `/admin/solicitudes/:id` | admin+ | Cambia estado o asignado. |
| GET | `/notificaciones?no_leidas=` | usuario+ | Bandeja de la campana. |
| POST | `/notificaciones/leer` | usuario+ | Marca como leídas (todas o una lista de ids). |
| POST | `/notificaciones/socket-token` | usuario+ | Pide a socket-core un JWT `subscribe` de 10 min para su `socket_id`. |
| POST / DELETE | `/notificaciones/push` | usuario+ | Registra o quita la suscripción Web Push de este dispositivo. |

**IDOR:** las rutas `/mias/*` filtran siempre por `usuario_id = token.id` y no aceptan el email del body. Las rutas `/admin/*` piden `requiereRol(ROLES_ADMIN)`.

## 6. Notificaciones: un solo servicio, cinco salidas

`notificar({ destinatarios, tipo, titulo, cuerpo, url, datos })` en `src/services/notificaciones.service.js`:

1. **BD:** inserta una fila en `notificaciones` por destinatario. Es la fuente de verdad.
2. **socket-core:** `POST /channels/seventwo:notificaciones/events` con `targets: [socket_id…]`. Llega al instante a quien tenga la web o la app abierta.
3. **Web Push:** envía a cada `push_suscripcion` del destinatario con la librería `web-push` y claves VAPID. Llega aunque la app esté cerrada. Si la suscripción devuelve 410 Gone, se borra.
4. **Email:** con Nodemailer y Brevo, plantilla por tipo.
5. **Telegram:** solo para avisos al equipo. `sendMessage` al chat del equipo, con un botón que abre la solicitud.

Todo se lanza en paralelo con `Promise.allSettled`: los fallos se registran y no se propagan.

| Evento | Equipo (admin + superadmin) | Solicitante |
|---|---|---|
| Solicitud nueva | BD · socket · push · email · Telegram | Email de confirmación (+ BD/socket/push si tiene cuenta) |
| Respuesta del equipo | — | **Email siempre** · BD · socket · push si tiene cuenta |
| El cliente contesta | BD · socket · push · email · Telegram | — |
| Cambio a aceptada/rechazada | — | Email · BD · socket · push |

### socket-core (ya corre en el VPS: `wss://ws.seventwo.tech/ws`)
- **Alta del proyecto, una vez, en el VPS:** `python3 scripts/alta_cliente.py` con nombre `seventwo`, `domains` = `https://seventwo.tech` y `http://localhost:3000`, `channel_prefix` = `seventwo:*`, `scopes` = `publish, subscribe, manage`.
- **Canal único:** `seventwo:notificaciones`. Cada usuario se suscribe con un JWT `subscribe` y solo recibe los eventos cuyo `targets` incluye su `socket_id`, porque socket-core filtra por destinatario.
- **Front:** el SDK `socket-core.mjs` se copia a `src/lib/` y se usa con `tokenProvider` → `POST /notificaciones/socket-token`. Al recibir un evento: toast, +1 en la campana y refresco de la vista si está abierta.
- **Variables nuevas (backend):** `SOCKET_CORE_URL`, `SOCKET_CORE_API_KEY`. **Frontend:** `NEXT_PUBLIC_SOCKET_URL=wss://ws.seventwo.tech`.

### Web Push ("la aplicación instalada")
- **La web se vuelve PWA instalable:** `manifest.webmanifest` e iconos, más un service worker que muestra la notificación y abre la URL al pulsarla. Ya existe `public/sw.js` con el manejador de `push`, pero el clic lee `event.data?.url`, que siempre es `undefined`; la URL está en `event.notification.data.url`. Hay que corregirlo.
- **Activación:** en el área de cliente o admin aparece "Activar notificaciones en este dispositivo". Pide permiso y registra la suscripción.
- **Compatibilidad:** Android, Chrome y Edge de escritorio, Firefox, y iPhone/iPad con la app instalada en la pantalla de inicio (iOS ≥ 16.4).
- **Variables nuevas:** `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT=mailto:admin@seventwo.tech`. **Frontend:** `NEXT_PUBLIC_VAPID_PUBLIC_KEY`.

### Telegram
- Se crea un bot con @BotFather y se añade a un grupo del equipo.
- **Variables nuevas:** `TELEGRAM_BOT_TOKEN` y `TELEGRAM_CHAT_ID`.

## 7. Maquetas

### 7.1 Home → sección "¿Qué necesitás?" (formulario público)
Se añaden **nombre, email y teléfono** al formulario actual (tipo, rango y descripción). Si hay sesión, nombre y email salen rellenos y bloqueados.
```
┌──────────────────────────────┬─────────────────────────────────────────────┐
│ 01 Página web            ↗   │  Tipo de proyecto     [ Página web        ]  │
│ 02 Aplicación web  ■■■■  ↗   │  Presupuesto          [ Selecciona rango ▾]  │
│ 03 App móvil             ↗   │  Tu nombre *          [__________________ ]  │
│ 04 Software a medida     ↗   │  Tu email *           [__________________ ]  │
│                              │  Teléfono (opcional)  [__________________ ]  │
│                              │  Cuéntanos brevemente*[__________________ ]  │
│                              │                       [__________________ ]  │
│                              │  ☐ Acepto que me contacten sobre esta solicitud│
│                              │  [ COTIZA TU PROYECTO ↗ ]                     │
└──────────────────────────────┴─────────────────────────────────────────────┘
```
Al enviar, el formulario se sustituye por la confirmación:
```
┌──────────────────────────────────────────────┐
│  ✔ SOLICITUD S-0012 RECIBIDA                 │
│  Te escribimos a ana@empresa.com en menos    │
│  de 24 h hábiles.                            │
│  ¿Quieres seguirla en línea?                 │
│  [ Crear cuenta con este email ]             │   ← solo si no hay sesión
└──────────────────────────────────────────────┘
```

### 7.2 Área de cliente → "Solicitar presupuesto" (usuario y cliente)
Arriba, el mismo formulario relleno. Debajo, **Mis solicitudes**:
```
MIS SOLICITUDES
┌─────────┬────────────────────┬──────────────┬────────────┬──────────┐
│ Código  │ Proyecto           │ Enviada      │ Estado     │          │
├─────────┼────────────────────┼──────────────┼────────────┼──────────┤
│ S-0012  │ Aplicación web     │ 08 nov 2026  │ RESPONDIDA │   Ver ↗  │
│ S-0007  │ Página web         │ 02 oct 2026  │ Aceptada   │   Ver ↗  │   ← hecha sin cuenta, vinculada al verificar
└─────────┴────────────────────┴──────────────┴────────────┴──────────┘
```
Detalle (conversación):
```
S-0012 · Aplicación web · Más de $10M COP                    [RESPONDIDA]
──────────────────────────────────────────────────────────────────────────
 Tú · 08 nov 10:14
 Necesito una app para reservas de mi barbería...
──────────────────────────────────────────────────────────────────────────
 Seventwo (Andrés) · 08 nov 16:40
 ¡Hola Ana! Te proponemos dos alternativas...           [ propuesta.pdf ]   ← adjuntos: fase posterior
──────────────────────────────────────────────────────────────────────────
 [ Escribe tu respuesta…                                   ] [ ENVIAR ]
```

### 7.3 Campana de notificaciones (Topbar del área de cliente y de /admin)
```
                                  🔔³  [SS]
                          ┌───────────────────────────────────────┐
                          │ NOTIFICACIONES        Marcar leídas   │
                          │ ● Nueva solicitud S-0012              │
                          │   Ana Pérez · Aplicación web · hace 2m│
                          │ ● Ana respondió en S-0009             │
                          │   hace 1 h                            │
                          │   Solicitud S-0008 aceptada           │
                          │   ayer                                │
                          │ ───────────────────────────────────── │
                          │ 📱 Activar notificaciones aquí        │   ← Web Push en este dispositivo
                          └───────────────────────────────────────┘
```
En tiempo real, además, aparece un toast abajo a la derecha: **"Nueva solicitud S-0012 — Ana Pérez · Aplicación web [Ver]"**.

### 7.4 /admin → "Solicitudes" (nueva sección junto a "Usuarios y roles")
```
SOLICITUDES DE PRESUPUESTO
 NUEVAS 3 │ EN REVISIÓN 2 │ RESPONDIDAS 5 │ ACEPTADAS 4          [🔎 Buscar…] [Estado ▾]
┌────────┬───────────────────────────┬────────────────┬─────────────┬───────────┬────────┐
│ Código │ Solicitante               │ Proyecto       │ Presupuesto │ Estado    │ Llegó  │
├────────┼───────────────────────────┼────────────────┼─────────────┼───────────┼────────┤
│ S-0012 │ Ana Pérez · ana@empresa…  │ Aplicación web │ > $10M COP  │ ● NUEVA   │ 2 min  │
│ S-0011 │ Luis Gómez · sin cuenta   │ Página web     │ Por definir │ Revisión  │ 3 h    │
└────────┴───────────────────────────┴────────────────┴─────────────┴───────────┴────────┘
```
Detalle:
```
S-0012 · Ana Pérez                                  Estado [En revisión ▾]  Asignado [Andrés ▾]
 ana@empresa.com · +57 300 123 4567 · Cuenta: ✔ usuario (ver perfil)
 Aplicación web · Más de $10M COP · desde la web · 08 nov 2026 10:14
──────────────────────────────────────────────────────────────────────────────────────────
 [conversación como en 7.2, con las notas internas en otro color]
──────────────────────────────────────────────────────────────────────────────────────────
 ( ) Respuesta al cliente   ( ) Nota interna
 [ Escribe…                                                          ] [ ENVIAR ]
 Si aceptada → [ Pasar a cliente ]                              ← atajo al cambio de rol
```

### 7.5 Emails (plantillas con el layout actual de Brevo)
| Plantilla | Para | Asunto | CTA |
|---|---|---|---|
| `solicitudConfirmacion` | Solicitante | "Recibimos tu solicitud S-0012" | "Crea tu cuenta para seguirla" (sin cuenta) / "Ver solicitud" (con cuenta) |
| `solicitudNuevaEquipo` | Admins | "Nueva solicitud S-0012 · Aplicación web" | "Abrir en el panel" |
| `solicitudRespuesta` | Solicitante | "Seventwo respondió a tu solicitud S-0012" | Texto de la respuesta + "Responder" / "Crea tu cuenta" |
| `solicitudClienteRespondio` | Admins | "Ana respondió en S-0012" | "Abrir en el panel" |

### 7.6 Telegram (grupo del equipo)
```
🆕 Nueva solicitud S-0012
👤 Ana Pérez — ana@empresa.com
📞 +57 300 123 4567
🧩 Aplicación web · 💰 Más de $10M COP
📝 "Necesito una app para reservas de mi barbería…"
[ Abrir en el panel ]
```

## 8. Anti-spam del formulario público
- Rate limit por IP (5/hora) y por email (3/día).
- Campo trampa invisible (*honeypot*) y tiempo mínimo de llenado (≥ 3 s): los bots que lo fallan reciben un "OK" falso.
- Descripción de 20 a 3000 caracteres. Teléfono y nombre validados igual que en el perfil.
- Más adelante, si llega spam: Cloudflare Turnstile (gratis, sin captchas molestos).

## 9. Fases

| Fase | Entrega | Depende de |
|---|---|---|
| **P1** | Migración 004. `POST /solicitudes` (formulario de la home con los campos nuevos) y email de confirmación. Vinculación por email al verificar. "Mis solicitudes" en el área de cliente. | — |
| **P2** | /admin → Solicitudes: listado, detalle, responder, estados. Email de respuesta. Conversación cliente ↔ equipo. | P1 |
| **P3** | Bandeja `notificaciones` y campana con contador. Avisos al equipo por email y Telegram. | P1 · bot de Telegram |
| **P4** | Tiempo real con socket-core: token, SDK, toast y campana en vivo. | P3 · API key de socket-core |
| **P5** | PWA instalable con Web Push en el móvil, también con la app cerrada. | P3 · claves VAPID |

Cada fase se despliega por separado y deja algo usable: con P1 y P2 ya se reciben y responden solicitudes por email.
