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
Conéctate por SSH con el usuario `deploy`:

```bash
ssh -i ~/.ssh/id_vps_nuevo deploy@IP_DEL_VPS
```

**Backend.** Crea la carpeta, vacía; el workflow clona el repo dentro en el primer deploy:

```bash
mkdir -p /srv/infra/seventwo
```

El primer deploy falla a propósito con `❌ Falta .env` y deja el repo clonado. Entonces crea el archivo a partir del ejemplo:

```bash
cd /srv/infra/seventwo/seventwo-backend
cp .env.example .env && nano .env
```

Rellena estos valores:

```
NODE_ENV=production
DATABASE_URL=postgres://adminst:CONTRASEÑA_DE_ADMINST@postgres_central:5432/seventwo
FRONTEND_URL=https://seventwo.tech,https://www.seventwo.tech
COOKIE_DOMAIN=.seventwo.tech
JWT_SECRET=...            # node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_REFRESH_SECRET=...    # otro distinto
AUTH_PEPPER=...           # otro distinto
BREVO_SMTP_EMAIL=...
BREVO_SMTP_PASS=...
BREVO_EMAIL_NO_REPLY=no-reply@seventwo.tech
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=https://api.seventwo.tech/auth/google/callback
```

La base `seventwo` la crea el workflow si no existe, y las migraciones se aplican solas al arrancar el contenedor. Evita el carácter `$` en los valores (docker compose lo interpreta); si lo necesitas, escríbelo como `$$`.

**Frontend.** Pasa lo mismo: el primer deploy falla con `❌ Falta .env.production` y deja el repo clonado.

```bash
cd /srv/infra/seventwo/seventwo-frontend
cp .env.example .env.production && nano .env.production
```

Contenido:

```
NEXT_PUBLIC_API_URL=https://api.seventwo.tech
```

Si prefieres no esperar al fallo, puedes clonar tú los repos en esas carpetas y crear los archivos antes del primer push.

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
