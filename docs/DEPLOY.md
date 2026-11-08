# Despliegue de Seventwo en el VPS

El frontend (`seventwo.tech`) y la API (`api.seventwo.tech`) se despliegan en el mismo VPS que inmobitwo y con su mismo patrón:

- Un push a `main` lanza una GitHub Action.
- La Action entra por SSH al VPS, actualiza el código y ejecuta `docker compose up --build`.
- Después saca el certificado con certbot, instala el sitio de nginx y comprueba que todo responde.

**Lo único manual es crear los archivos `.env` en el VPS la primera vez.**

## 1. Mapa

| | Frontend | Backend |
|---|---|---|
| Repo | `mateodevcode/seventwo-frontend` | `mateodevcode/seventwo-backend` |
| Carpeta en el VPS | `/srv/infra/seventwo/seventwo-frontend` | `/srv/infra/seventwo/seventwo-backend` |
| Dominio | `seventwo.tech` (`www` redirige a `seventwo.tech`) | `api.seventwo.tech` |
| Contenedor | `seventwo-web` · `127.0.0.1:4001` → 3000 | `seventwo-backend` · `127.0.0.1:4000` |
| Variables | `.env.production` | `.env` |
| nginx | `nginx/seventwo.conf` → `sites-available/seventwo` | `nginx/seventwo-api.conf` → `sites-available/seventwo-api` |
| Certificado | `/etc/letsencrypt/live/seventwo.tech/` (incluye `www`) | `/etc/letsencrypt/live/api.seventwo.tech/` |
| Workflow | `.github/workflows/deploy.yml` | `.github/workflows/deploy.yml` |

Infraestructura compartida que ya existe en el VPS: usuario `deploy` (sudo sin contraseña), Docker, nginx, certbot, la red `central_network` y `postgres_central`, con el usuario `adminst`.

Los puertos 3000 y 3001 los usa inmobitwo. Por eso Seventwo usa **4000** (API) y **4001** (web).

## 2. Una sola vez

### 2.1 DNS
Crea estos registros **A** apuntando a la IP del VPS (la misma que inmobitwo, ver `RUNBOOK-REDEPLOY-INMOBITWO.md`):

| Nombre | Tipo | Valor |
|---|---|---|
| `seventwo.tech` | A | IP del VPS |
| `www.seventwo.tech` | A | IP del VPS (o CNAME a `seventwo.tech`) |
| `api.seventwo.tech` | A | IP del VPS |

Si el dominio usa el proxy de Cloudflare (nube naranja), ponlo en **DNS only** al menos durante el primer deploy: certbot necesita llegar al VPS por HTTP. Si `seventwo.tech` tenía un Worker o una ruta de Cloudflare (el despliegue anterior en `new.seventwo.tech`), quítalos.

Comprueba la propagación antes de desplegar:

```bash
nslookup api.seventwo.tech
```

### 2.2 Secrets de GitHub (en los dos repos)
En **Settings → Secrets and variables → Actions** de cada repo, crea los mismos tres secrets que en inmobitwo:

- `VPS_HOST`: la IP del VPS.
- `VPS_USER`: `deploy`.
- `VPS_SSH_KEY`: el contenido completo de la clave privada que usan las Actions de inmobitwo (`~/.ssh/id_vps_nuevo`).

Los repos pueden ser privados: el workflow clona con el token temporal de la propia Action y no lo guarda en el VPS.

### 2.3 Google OAuth
En Google Cloud Console → Credenciales → tu cliente OAuth (Aplicación web):

- **Orígenes autorizados de JavaScript:** `https://seventwo.tech`
- **URIs de redireccionamiento autorizados:** `https://api.seventwo.tech/auth/google/callback`. Añade también `http://localhost:4000/auth/google/callback` si lo usas en local.

### 2.4 Brevo
El remitente `no-reply@seventwo.tech` debe estar verificado en Brevo, y el dominio debe tener los registros SPF, DKIM y DMARC que pide Brevo. Si no, los correos acaban en spam.

### 2.5 Archivos de variables en el VPS
Cada repo tiene en local un `.env.vps` (ignorado por git) con los valores de producción ya preparados:

- **Backend:** `DB_*` apuntando a `postgres_central:5432`, CORS, cookie, secretos JWT propios de producción, Brevo y Google.
- **Frontend:** `NEXT_PUBLIC_API_URL`.

Súbelos **antes** del primer push. El workflow detecta la carpeta con el archivo dentro e inicializa el repo ahí.

Primero crea las carpetas en el VPS:

```bash
ssh -i ~/.ssh/id_vps_nuevo deploy@161.97.146.80 'mkdir -p /srv/infra/seventwo/seventwo-backend /srv/infra/seventwo/seventwo-frontend'
```

Después sube el archivo del backend:

```bash
scp -i ~/.ssh/id_vps_nuevo seventwo-backend/.env.vps deploy@161.97.146.80:/srv/infra/seventwo/seventwo-backend/.env
```

Y el del frontend:

```bash
scp -i ~/.ssh/id_vps_nuevo seventwo-frontend/.env.vps deploy@161.97.146.80:/srv/infra/seventwo/seventwo-frontend/.env.production
```

Por último, restringe los permisos a tu usuario:

```bash
ssh -i ~/.ssh/id_vps_nuevo deploy@161.97.146.80 'chmod 600 /srv/infra/seventwo/*/.env*'
```

Notas:
- El backend se conecta a Postgres por la red interna: `DB_HOST=postgres_central`, `DB_PORT=5432`. El **5435** es el puerto expuesto en la IP pública, solo para conectarse desde fuera (por ejemplo, desde tu PC).
- La base `seventwo` la crea el workflow si no existe, y las migraciones se aplican solas al arrancar el contenedor.
- Evita el carácter `$` en los valores (docker compose lo interpreta); si lo necesitas, escríbelo como `$$`.
- Si prefieres editarlos a mano en el VPS, parte de `.env.example`.

### 2.6 Notificaciones de presupuestos (opcional; cada canal se activa por separado)
Sin estas variables, las solicitudes funcionan igual: se guardan, llegan los emails y aparecen en la campana al recargar. Cada canal se enciende cuando su variable tiene valor (ver `docs/PRESUPUESTOS.md` §6). El `seventwo-backend/.env.vps` ya trae los nombres, las **claves VAPID generadas** y el **buzón** `EQUIPO_EMAIL=info@seventwo.tech`. Copia esas líneas nuevas al `.env` del backend en el VPS.

**Web Push (app instalada).** Basta con `VAPID_PUBLIC_KEY` y `VAPID_PRIVATE_KEY`, que ya están en `.env.vps`. No se rotan: si cambian, cada dispositivo tiene que volver a activarse desde la campana.

**Tiempo real con socket-core (ya corre en el VPS como `socket-core`).** Se configura una sola vez:
1. Da de alta el proyecto y guarda la API key que imprime:

   ```bash
   cd ~/socket-core && python3 scripts/alta_cliente.py
   ```

   Datos del alta:
   - nombre: `seventwo`
   - dominios: `https://seventwo.tech, http://localhost:3000`
   - prefijo: `seventwo:*`
   - scopes: `publish, subscribe, manage`

2. Añade `https://seventwo.tech` a `ALLOWED_ORIGINS` en el `.env` de socket-core (separado por comas de los orígenes que ya tenga) y reinícialo:

   ```bash
   docker compose up -d
   ```

3. En el `.env` del backend de Seventwo:

   ```
   SOCKET_CORE_URL=http://socket-core:3005   # red interna central_network, sin pasar por nginx
   SOCKET_CORE_API_KEY=sc_live_...           # la del paso 1
   SOCKET_CORE_CANAL=seventwo:notificaciones
   ```

   El canal lo crea el backend la primera vez. El navegador se conecta a `wss://ws.seventwo.tech`, que es `NEXT_PUBLIC_SOCKET_URL` en el `.env.production` del frontend.

**Telegram (grupo del equipo).**
1. En Telegram, crea un bot con **@BotFather** (`/newbot`) y copia el token.
2. Crea un grupo con el equipo, añade el bot y escribe cualquier mensaje en el grupo.
3. Abre esta URL en el navegador, con tu token:

   ```
   https://api.telegram.org/bot<TOKEN>/getUpdates
   ```

   En la respuesta, `chat.id` es el id del grupo; es un número negativo, como `-100…`.
4. En el `.env` del backend: `TELEGRAM_BOT_TOKEN=…` y `TELEGRAM_CHAT_ID=-100…`.

Tras cambiar el `.env` del backend no hace falta rebuild:

```bash
cd /srv/infra/seventwo/seventwo-backend && docker compose up -d
```

Al arrancar, el log dice qué canales siguen desactivados (`ℹ️  Canales de aviso desactivados: …`).

## 3. Desplegar

**Orden: primero el backend.** El frontend necesita la API para funcionar, y conviene que certbot no se ejecute dos veces a la vez.

```bash
cd seventwo-backend
git push -u origin main
```

Espera a que la Action termine en verde: **✅ Deploy Backend OK**, con `/health` respondiendo `"db":"ok"`. Después:

```bash
cd seventwo-frontend
git checkout main
git merge feat/auth
git push origin main
```

En cada deploy, el workflow hace esto:

1. Clona el repo si no existe y lo actualiza con un `reset --hard` a `origin/main`, conservando el archivo de variables.
2. **Backend:** verifica `central_network` y crea la BD `seventwo` en `postgres_central` si no existe.
3. Ejecuta `docker compose up -d --build`.
4. Saca el certificado con certbot la primera vez; las siguientes solo lo renueva.
5. Copia el sitio de nginx, ejecuta `nginx -t` y recarga nginx.
6. Comprueba que responde: el backend con `https://api.seventwo.tech/health`; el frontend con `https://seventwo.tech/`.

También se puede lanzar a mano desde **Actions → Deploy … → Run workflow**.

## 4. Verificación manual

```bash
curl -s https://api.seventwo.tech/health
```

Debe responder `{"status":"ok","service":"seventwo-backend","db":"ok"}`.

```bash
curl -sI https://www.seventwo.tech | grep -i location
```

Debe redirigir a `https://seventwo.tech/`.

```bash
curl -sI https://seventwo.tech/area-cliente | grep -i location
```

Debe redirigir a `/login?next=%2Farea-cliente`.

En el navegador: crea una cuenta en `https://seventwo.tech/registro`, verifica el email que llega por Brevo, entra con Google y activa la verificación en dos pasos desde Área de cliente → Seguridad.

## 5. Operación

```bash
ssh -i ~/.ssh/id_vps_nuevo deploy@IP_DEL_VPS
```

Logs:

```bash
docker logs -f seventwo-backend
```

```bash
docker logs -f seventwo-web
```

Estado:

```bash
cd /srv/infra/seventwo/seventwo-backend && docker compose ps
```

Roles (`usuario` < `cliente` < `admin` < `superadmin`). Desde `/admin`, un admin pasa usuarios a clientes y un superadmin nombra admins. **Superadmin solo se asigna desde el VPS:**

```bash
docker exec seventwo-backend node src/scripts/rol.js correo@ejemplo.com superadmin
```

Sin rol, muestra el actual:

```bash
docker exec seventwo-backend node src/scripts/rol.js correo@ejemplo.com
```

Backup de la base:

```bash
docker exec postgres_central pg_dump -U adminst -d seventwo -Fc -f /tmp/seventwo.dump
```

```bash
docker cp postgres_central:/tmp/seventwo.dump ~/seventwo-$(date +%F).dump
```

Para cambiar una variable:

- **Backend:** edita `.env` y ejecuta `docker compose up -d` en su carpeta. No hace falta rebuild.
- **Frontend:** las `NEXT_PUBLIC_*` se fijan al compilar, así que hay que hacer un redeploy (push o Run workflow).

## 6. Reglas

1. No borres `.env` ni `.env.production` del VPS. Los workflows los conservan en cada deploy.
2. No despliegues a la vez Seventwo e inmobitwo: el lock de certbot y los 4 núcleos del VPS no dan para los dos.
3. No expongas los puertos 4000 y 4001 fuera de `127.0.0.1`: solo nginx debe llegar a ellos.
4. Los certificados no se borran; certbot solo los renueva (además del timer del sistema).
