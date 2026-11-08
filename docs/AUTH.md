# Autenticación — Seventwo

Definición funcional y técnica de la autenticación de Seventwo. Basada en la auth de
inmobitwo (`backend-inmobitwo`), con las correcciones de seguridad indicadas en §8.

## 1. Arquitectura

```
Navegador ──► seventwo.tech  (Next 16 standalone en Docker, VPS, detrás de nginx)
    │
    └──fetch (credentials: include)──► api.seventwo.tech  (Express en Docker, mismo VPS)
                                            ├── postgres_central (red central_network, no expuesto)
                                            └── Nodemailer ──SMTP──► smtp-relay.brevo.com:587
```

El despliegue se describe en [DEPLOY.md](DEPLOY.md).

- **seventwo-backend** (repo nuevo): Express 5 + `pg` + `bcryptjs` + `jsonwebtoken` + `nodemailer`.
- **Sin Redis.** Rate limit y códigos de un solo uso se guardan en Postgres (§3).
- Front y API comparten el sitio `seventwo.tech`, así que las cookies son *same-site* y no hace falta CORS con terceros.

## 2. Tokens y sesión

| Token | Dónde vive | Duración | Notas |
|---|---|---|---|
| `accessToken` (JWT, `JWT_SECRET`) | Memoria del front (no `localStorage`) | 15 min | Va en `Authorization: Bearer`. Payload `{ id, email, rol }` |
| `refresh_token` (JWT, `JWT_REFRESH_SECRET`) | Cookie `httpOnly; Secure; SameSite=Lax; Domain=.seventwo.tech; Path=/` | 7 días | Se guarda **hasheado** (SHA-256) en `refresh_tokens`. Rotación en cada `/auth/refresh` |

Al cargar la app, el front llama a `POST /auth/refresh` para recuperar la sesión. Si recibe un 401 en cualquier llamada, hace refresh una vez y reintenta.

## 3. Modelo de datos (PostgreSQL)

```sql
CREATE TABLE usuarios (
  id               SERIAL PRIMARY KEY,
  name             VARCHAR(255) NOT NULL,
  email            VARCHAR(255) UNIQUE NOT NULL,      -- siempre en minúsculas
  password         VARCHAR(255),                       -- NULL en cuentas solo-Google
  telefono         VARCHAR(20),
  rol              VARCHAR(30) NOT NULL DEFAULT 'cliente' CHECK (rol IN ('cliente','admin','superadmin')),
  provider         VARCHAR(20) NOT NULL DEFAULT 'local', -- 'local' | 'google'
  google_id        VARCHAR(255) UNIQUE,
  image_url        VARCHAR(500),
  email_verificado BOOLEAN NOT NULL DEFAULT false,
  otp_activo       BOOLEAN NOT NULL DEFAULT false,     -- 2º factor por email, lo activa el usuario
  bloqueado        BOOLEAN NOT NULL DEFAULT false,
  intentos_fallidos INTEGER NOT NULL DEFAULT 0,        -- solo contraseña
  ultimo_login     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE refresh_tokens (
  id          SERIAL PRIMARY KEY,
  usuario_id  INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  token_hash  CHAR(64) NOT NULL UNIQUE,               -- sha256 del JWT
  expira_en   TIMESTAMPTZ NOT NULL,
  revocado    BOOLEAN NOT NULL DEFAULT false,
  user_agent  VARCHAR(255),
  ip          INET,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Todos los códigos de un solo uso en una tabla (sustituye a las columnas
-- codigo_verificacion / otp_login de inmobitwo y al canje OAuth en Redis).
CREATE TABLE auth_codigos (
  id          BIGSERIAL PRIMARY KEY,
  usuario_id  INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo        VARCHAR(30) NOT NULL CHECK (tipo IN
                ('verificar_email','otp_login','reset_password','reset_token','oauth_canje')),
  codigo_hash CHAR(64) NOT NULL,                       -- sha256(codigo + AUTH_PEPPER)
  payload     JSONB,                                   -- p. ej. sesión a canjear en oauth_canje
  intentos    INTEGER NOT NULL DEFAULT 0,
  expira_en   TIMESTAMPTZ NOT NULL,
  usado_en    TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON auth_codigos (usuario_id, tipo) WHERE usado_en IS NULL;

CREATE TABLE rate_limits (
  clave       VARCHAR(200) PRIMARY KEY,                -- 'login:ip:1.2.3.4'
  contador    INTEGER NOT NULL,
  expira_en   TIMESTAMPTZ NOT NULL
);
```

Rate limit en una sola consulta atómica:

```sql
INSERT INTO rate_limits (clave, contador, expira_en) VALUES ($1, 1, now() + $2::interval)
ON CONFLICT (clave) DO UPDATE SET
  contador  = CASE WHEN rate_limits.expira_en < now() THEN 1 ELSE rate_limits.contador + 1 END,
  expira_en = CASE WHEN rate_limits.expira_en < now() THEN now() + $2::interval ELSE rate_limits.expira_en END
RETURNING contador, expira_en;
```

Hay un job de limpieza cada hora (`setInterval` o cron) que borra los `auth_codigos`, `rate_limits` y `refresh_tokens` expirados.

## 4. Reglas de códigos

| Tipo | Formato | Validez | Intentos | Reenvío |
|---|---|---|---|---|
| `verificar_email` | 6 dígitos | 15 min | 5 | cada 60 s |
| `otp_login` | 6 dígitos | 10 min | 5 | cada 60 s |
| `reset_password` | 6 dígitos | 10 min | 5 | cada 60 s |
| `reset_token` | 32 bytes hex | 10 min | 1 uso | — |
| `oauth_canje` | UUID | 2 min | 1 uso | — |

- Se generan con `crypto.randomInt(100000, 1000000)`, no con `Math.random`.
- Emitir un código nuevo invalida los anteriores del mismo tipo (`usado_en = now()`).
- Agotar los intentos **invalida el código, no bloquea la cuenta**. Así nadie puede bloquear la cuenta de otro.
- La comparación se hace sobre el hash, con `crypto.timingSafeEqual`.

## 5. Flujos

### 5.1 Registro
1. `POST /auth/registro { name, email, password }`. Se valida el nombre, el email y la contraseña (mínimo 8 caracteres, al menos 1 letra y 1 número). La contraseña se hashea con bcrypt (coste 12).
2. Se crea el usuario con `email_verificado = false` y se envía un código `verificar_email`.
3. El front muestra la pantalla **/verificar-email**.
4. `POST /auth/verificar-email { email, codigo }`: pone `email_verificado = true` y **emite la sesión**.
5. Si el email ya existe, se responde 409 *"Ya existe una cuenta con ese email"*. Es la única excepción a la regla de no revelar si un email existe; es inevitable en el registro.

### 5.2 Login con email y contraseña
1. `POST /auth/login { email, password }`.
2. Si el usuario no existe o la contraseña está mal: 401 *"Credenciales incorrectas"* y se suma 1 a `intentos_fallidos`. Al llegar a 5, `bloqueado = true` y se avisa al usuario por email.
3. Si la cuenta es solo de Google (sin contraseña): 401 *"Esta cuenta usa ingreso con Google"*.
4. Si `email_verificado = false`: se reenvía el código `verificar_email` y se responde `{ requiereVerificacion: true }`.
5. Si `otp_activo = true`: se envía el código `otp_login` y se responde `{ requiereOTP: true }`, **sin sesión todavía**.
6. En otro caso se emite la sesión.

### 5.3 Segundo factor (OTP por email)
- `POST /auth/otp/verificar { email, codigo }`: emite la sesión.
- `POST /auth/otp/reenviar { email }`: respeta el cooldown de 60 s.
- **Activar**: `POST /auth/otp/activar` (requiere sesión y email verificado). Envía un código y se confirma con `POST /auth/otp/activar/confirmar { codigo }`. Así se demuestra que el usuario recibe los correos antes de exigírselos.
- **Desactivar**: `POST /auth/otp/desactivar { password }`. Las cuentas de Google lo desactivan con un código por email.
- El OTP también se exige cuando el usuario entra con Google, **solo si `otp_activo = true`**.

### 5.4 Google (Authorization Code, en el servidor)
1. Botón → navegación a `GET api.seventwo.tech/auth/google?next=/area-cliente`. El backend firma un `state` con `{ next, nonce }` (JWT de 10 min), guarda el `nonce` en la cookie `g_state` (`httpOnly`, 10 min) y redirige a Google con el scope `openid email profile`.
2. `GET /auth/google/callback?code&state`: se verifica la firma del `state` **y que su `nonce` coincida con la cookie `g_state`**. Así el callback solo vale en el navegador que inició el flujo y se evita que alguien deje a la víctima logueada en la cuenta del atacante. Después se intercambia el `code` por el token y se piden los datos a `userinfo`. Si `email_verified` no es `true`, se rechaza.
3. La cuenta se busca primero por `google_id` y después por email.
   - Si no existe, se crea con `provider = 'google'`, `email_verificado = true` y sin contraseña.
   - Si existe por email, se vincula el `google_id`. Si esa cuenta local tenía el **email sin verificar**, se descarta su contraseña y se revocan sus sesiones. Esto protege del *pre-registro*: un atacante que creó la cuenta antes con el email de la víctima pierde el acceso.
   - Si el email ya está vinculado a otro `google_id`, se responde `error=google_cuenta_distinta`.
4. Si la cuenta está bloqueada, se redirige a `/login?error=cuenta_bloqueada`.
5. Si `otp_activo = true`, se envía el código `otp_login` y se redirige a `/login/otp?email=...&next=...`. El login se completa con `POST /auth/otp/verificar`.
6. En otro caso se emite la sesión: la cookie refresh ya queda puesta y se redirige a `new.seventwo.tech/auth/google/callback?next=...`.
7. Esa página del front llama a `POST /auth/refresh`, recibe `{ usuario, accessToken }` y navega a `next`. No hace falta ningún código de canje.
8. `next` solo acepta rutas internas (`/...`, nunca `//` ni `/\`).
9. Códigos de `?error=` en `/login`: `google_no_configurado`, `google_cancelado`, `google_estado_invalido`, `google_sin_codigo`, `google_codigo_invalido`, `google_perfil_invalido`, `google_email_no_verificado`, `google_cuenta_distinta`, `cuenta_bloqueada`, `email_no_enviado` y `google_error`.

### 5.5 Restablecer contraseña
1. `POST /auth/password/solicitar { email }`. Responde **siempre** 200 con el mensaje *"Si el correo existe, te enviamos un código"*. Solo se envía el código `reset_password` si la cuenta existe.
2. `POST /auth/password/validar { email, codigo }`. Si el código es correcto, devuelve un `resetToken` de un solo uso (10 min).
3. `POST /auth/password/restablecer { resetToken, password }`. Aplica la nueva contraseña, pone `intentos_fallidos = 0`, `bloqueado = false` y `email_verificado = true`, **revoca todos los refresh tokens** y envía un email de aviso *"Tu contraseña cambió"*.
4. También es la vía para desbloquear una cuenta bloqueada por intentos fallidos.
5. Una cuenta solo de Google puede usar este flujo para crearse una contraseña.

### 5.6 Sesión
- `POST /auth/refresh`: valida la cookie, el hash en la base de datos, que no esté revocado y que no haya expirado; después rota el token. **Si llega un refresh ya revocado** (posible robo), se revocan todos los tokens de ese usuario.
- `POST /auth/logout`: revoca el refresh actual y borra la cookie.
- `POST /auth/logout-todo`: revoca todas las sesiones del usuario.
- `GET /auth/me`: devuelve el usuario actual.
- `PATCH /auth/password` (requiere sesión): `{ actual, nueva }`.

## 6. Emails (Nodemailer + SMTP de Brevo)

`createTransporter()` usa `smtp-relay.brevo.com:587` con `BREVO_SMTP_EMAIL` y `BREVO_SMTP_PASS`. El remitente es `"Seventwo" <BREVO_EMAIL_NO_REPLY>`.
Las plantillas HTML van en `src/emails/` (se adaptan las de inmobitwo con la marca Seventwo):

| Plantilla | Cuándo |
|---|---|
| `codigoVerificacion` | Registro y login con el email sin verificar |
| `codigoOtpLogin` | Segundo factor |
| `codigoResetPassword` | Olvidé mi contraseña |
| `passwordCambiada` | Tras restablecer o cambiar la contraseña |
| `cuentaBloqueada` | Tras 5 fallos de contraseña (incluye enlace para restablecer) |
| `otpActivado` / `otpDesactivado` | Cambios en el 2º factor |

Si el envío falla en login u OTP, se responde 500 *"No pudimos enviar el código"* y se invalida el código.

## 7. Endpoints y límites

| Método | Ruta | Auth | Rate limit (por IP) |
|---|---|---|---|
| POST | `/auth/registro` | — | 5 / 10 min |
| POST | `/auth/verificar-email` · `/auth/verificar-email/reenviar` | — | 10 / 10 min |
| POST | `/auth/login` | — | 10 / 10 min (+ 5 por email) |
| POST | `/auth/otp/verificar` · `/auth/otp/reenviar` | — | 10 / 10 min |
| POST | `/auth/otp/activar` · `/activar/confirmar` · `/desactivar` | ✔ | 10 / 10 min |
| GET | `/auth/google` · `/auth/google/callback` | — | 20 / min |
| POST | `/auth/password/solicitar` · `/validar` · `/restablecer` | — | 5 / 10 min |
| PATCH | `/auth/password` | ✔ | 10 / 10 min |
| POST | `/auth/refresh` · `/auth/logout` · `/auth/logout-todo` | cookie | 60 / min |
| GET | `/auth/me` | ✔ | — |

Middlewares: `verificarToken`, `verificarRol([...])` y `rateLimit(nombre, max, ventana)`. Las respuestas siguen el formato de inmobitwo: `{ success, message?, data?, error? }`.

## 8. Diferencias con inmobitwo (correcciones)

1. **Crítico:** en inmobitwo `PATCH /api/usuario/reset-password` acepta `{ id, password }` sin ninguna prueba, así que cualquiera puede cambiar la contraseña de cualquier usuario. Aquí se exige un `resetToken` de un solo uso.
2. En inmobitwo el OTP está atado a `email_verificado`. Aquí lo controla `otp_activo`, que activa el propio usuario.
3. En inmobitwo los OTP se generan con `Math.random` y se guardan en claro. Aquí se usa `crypto.randomInt` y se guarda el hash.
4. En inmobitwo los refresh tokens se guardan en claro. Aquí se guarda el hash y se detecta la reutilización.
5. En inmobitwo, fallar 3 códigos de reset bloquea la cuenta (permite bloquear cuentas ajenas). Aquí solo se invalida el código.
6. inmobitwo tiene `check-email` y respuestas de reset que revelan si un email existe. Aquí las respuestas son genéricas.
7. En inmobitwo el registro emite sesión sin verificar el email. Aquí primero se verifica.
8. El `accessToken` de inmobitwo va en `localStorage`. Aquí vive en memoria; el refresh por cookie restaura la sesión.
9. Sin Redis: el rate limit pasa a Postgres y el canje OAuth desaparece (la cookie ya queda puesta en el callback).
10. El `state` de Google se ata al navegador con la cookie `g_state` y se protege del pre-registro de cuentas (§5.4).

## 9. Frontend (seventwo-frontend)

Rutas nuevas en `src/app/`:

| Ruta | Pantalla |
|---|---|
| `/login` | Email y contraseña, botón de Google, enlace a "¿Olvidaste tu contraseña?" |
| `/login/otp` | Código de 6 dígitos, reenviar con contador de 60 s |
| `/registro` | Nombre, email, contraseña y confirmación |
| `/verificar-email` | Código de 6 dígitos |
| `/olvide-contrasena` | Email → código → nueva contraseña (3 pasos en la misma página) |
| `/auth/google/callback` | Llama a `POST /auth/refresh` y redirige a `next` |
| `/area-cliente/seguridad` | Activar o desactivar OTP, cambiar contraseña, cerrar todas las sesiones |

- `src/lib/api.js`: `fetch` con `credentials: "include"`, añade el bearer y hace refresh automático ante un 401.
- `AuthProvider` (contexto): guarda `usuario` y `accessToken` en memoria y hace refresh al montar.
- La protección de `/area-cliente/*` se hace en `src/proxy.js`, el `proxy` de Next 16 (antes `middleware`). Si no hay cookie `refresh_token`, redirige a `/login?next=...`. La validación real la hace el backend.
- Variable de entorno: `NEXT_PUBLIC_API_URL=https://api.seventwo.tech`.

## 10. Variables de entorno (backend)

```
PORT=4000
NODE_ENV=production
DATABASE_URL=postgres://seventwo:***@postgres:5432/seventwo
FRONTEND_URL=https://new.seventwo.tech
COOKIE_DOMAIN=.seventwo.tech
JWT_SECRET=            # 64+ bytes aleatorios
JWT_REFRESH_SECRET=    # distinto del anterior
AUTH_PEPPER=           # para hashear códigos
BREVO_SMTP_EMAIL=
BREVO_SMTP_PASS=
BREVO_EMAIL_NO_REPLY=no-reply@seventwo.tech
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=https://api.seventwo.tech/auth/google/callback
```

## 11. Orden de implementación

1. **Backend base:** repo `seventwo-backend` con Express, `docker-compose` (api + postgres), migraciones de §3 y config.
2. **Núcleo:** registro, verificación de email, login, refresh, logout, me, rate limit y emails.
3. **OTP:** activar, desactivar, verificar y reenviar.
4. **Reset de contraseña** y cambio de contraseña.
5. **Google OAuth.**
6. **Frontend:** `api.js`, `AuthProvider`, pantallas de §9 y protección de `/area-cliente`.
7. **Despliegue:** `api.seventwo.tech` en el VPS (nginx con TLS) y credenciales de Google y Brevo.
