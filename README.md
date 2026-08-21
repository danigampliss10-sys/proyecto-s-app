# Proyecto S — Facción Ilegal (versión React + Supabase)

App React (Vite) que reproduce la herramienta original en HTML, pero con la sincronización
en tiempo real hecha con **Supabase** en vez de Firebase, lista para desplegar en **Vercel**.

Todo el contenido (tablas, notas, textos) vive en una única fila de una tabla de Supabase
(`proyecto_s`, columna `content` de tipo `jsonb`). Cada cambio se guarda ahí con un pequeño
retraso (600 ms) y se retransmite en tiempo real a todos los que tengan la página abierta.

---

## 0. Qué vas a necesitar

- Una cuenta de [GitHub](https://github.com) (gratis).
- Una cuenta de [Supabase](https://supabase.com) (gratis, puedes entrar con GitHub).
- Una cuenta de [Vercel](https://vercel.com) (gratis, puedes entrar con GitHub).
- (Opcional, solo si quieres probarlo en tu ordenador antes de publicarlo) [Node.js](https://nodejs.org) — instala la versión LTS.

No hace falta saber programar para seguir esta guía, solo ir paso a paso.

---

## 1. Crear el proyecto en Supabase (la base de datos)

1. Entra en https://supabase.com y pulsa **Start your project** / **Sign in**, inicia sesión (con GitHub es lo más rápido).
2. Pulsa **New project**.
3. Rellena:
   - **Name**: `proyecto-s` (o el nombre que quieras).
   - **Database password**: genera una y guárdala en un sitio seguro (no la necesitarás para esta app, pero consérvala).
   - **Region**: elige la más cercana a tu grupo (por ejemplo, una de Europa).
4. Pulsa **Create new project** y espera 1-2 minutos mientras Supabase lo provisiona.

### 1.1. Crear la tabla y los permisos

1. En el menú lateral de tu proyecto, entra en **SQL Editor**.
2. Pulsa **New query** y pega esto:

```sql
create table if not exists public.proyecto_s (
  id integer primary key,
  content jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.proyecto_s replica identity full;
alter table public.proyecto_s enable row level security;

create policy "lectura publica" on public.proyecto_s
  for select using (true);

create policy "insercion publica" on public.proyecto_s
  for insert with check (true);

create policy "actualizacion publica" on public.proyecto_s
  for update using (true) with check (true);
```

3. Pulsa **Run**. Debería decir "Success. No rows returned".

> Estas políticas dejan la tabla en lectura/escritura abierta para cualquiera que tenga el
> enlace de tu web (igual que tenía el Firebase original — es una herramienta interna, no un
> sistema con usuarios/login). Si más adelante quieres protegerlo con contraseña, se puede
> añadir después; de momento mantenlo simple.

### 1.2. Activar Realtime en la tabla

1. Ve a **Database → Replication** en el menú lateral.
2. Busca la tabla `proyecto_s` en la lista y activa el interruptor para que se incluya en la
   publicación `supabase_realtime`.
   - Si no ves ese interruptor ahí, alternativamente ve al **SQL Editor** y ejecuta:
     ```sql
     alter publication supabase_realtime add table public.proyecto_s;
     ```

### 1.3. Copiar las claves de conexión

1. Ve a **Project Settings** (el icono de engranaje) → **API**.
2. Copia dos valores, los usarás en el siguiente paso:
   - **Project URL** (algo como `https://xxxxxxxx.supabase.co`).
   - **anon public** key (una cadena larga, empieza normalmente por `eyJ...`).

No copies nunca la clave `service_role` para esto — esa es secreta y no se usa en el navegador.

---

## 2. Configurar el proyecto React con tus claves

1. Dentro de la carpeta `proyecto-s-app`, copia el archivo `.env.example` y renómbralo a `.env.local`.
2. Ábrelo y sustituye los valores:

```
VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...tu-clave-larga...
```

3. Guarda el archivo. `.env.local` nunca se sube a GitHub (está en `.gitignore`), así que tus claves quedan solo en tu máquina y luego las volverás a pegar en Vercel (paso 5).

### 2.1. (Opcional) Probarlo en tu ordenador

Si instalaste Node.js:

```bash
npm install
npm run dev
```

Abre la URL que te muestre la terminal (normalmente `http://localhost:5173`). Deberías ver
la app, y arriba a la derecha el indicador debería pasar de "Conectando…" a "En vivo".

---

## 3. Subir el proyecto a GitHub

1. Entra en https://github.com/new y crea un repositorio nuevo (por ejemplo `proyecto-s-app`).
   Puede ser **privado** (recomendado, ya que es una herramienta interna) o público, tú eliges.
   No marques ninguna casilla de "añadir README/licencia" — ya tenemos archivos.
2. En tu terminal, dentro de la carpeta `proyecto-s-app`:

```bash
git init
git add .
git commit -m "Primera versión de la app"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/proyecto-s-app.git
git push -u origin main
```

(Sustituye `TU-USUARIO` por tu usuario real de GitHub; GitHub te pedirá iniciar sesión la
primera vez, o puedes usar GitHub Desktop si prefieres no usar la terminal para esto.)

---

## 4. Desplegar en Vercel

1. Entra en https://vercel.com y accede con tu cuenta de GitHub.
2. Pulsa **Add New… → Project**.
3. Busca y selecciona el repositorio `proyecto-s-app` que acabas de subir, y pulsa **Import**.
4. Vercel detectará automáticamente que es un proyecto Vite (Framework Preset: Vite). No
   hace falta tocar nada del "Build & Output Settings".
5. Antes de pulsar Deploy, abre la sección **Environment Variables** y añade las dos mismas
   que pusiste en `.env.local`:
   - `VITE_SUPABASE_URL` → tu Project URL de Supabase.
   - `VITE_SUPABASE_ANON_KEY` → tu clave anon public.
6. Pulsa **Deploy**. Espera 1-2 minutos.
7. Cuando termine, Vercel te da una URL tipo `https://proyecto-s-app.vercel.app` — esa es tu
   web ya en producción.

### 4.1. Comprobar que la sincronización funciona

Abre esa URL en dos pestañas (o en dos dispositivos distintos). Edita un texto en una y
comprueba que aparece en la otra al cabo de un segundo, con el aviso "Cambios de otro
usuario aplicados".

---

## 5. Cómo actualizar la web en el futuro

Cada vez que quieras cambiar algo en el código (no en los datos, esos ya se editan en la
propia web):

```bash
git add .
git commit -m "Describe aquí el cambio"
git push
```

Vercel detecta el push automáticamente y vuelve a desplegar la web sola en 1-2 minutos.
No hace falta tocar nada en Vercel ni en Supabase para eso.

---

## Notas técnicas

- El botón **Exportar/Importar JSON** sigue funcionando igual que en la versión original,
  como copia de seguridad manual independiente de Supabase.
- Los datos se guardan en una sola fila (`id = 1`) como un único JSON — sencillo y de sobra
  para el tamaño de esta herramienta. Si algún día quieres histórico de cambios o
  permisos por usuario, se puede migrar a tablas normalizadas más adelante.
- Si ves "Sin conexión" en la cabecera: revisa que las variables de entorno estén bien
  copiadas (sin espacios) y que hayas completado el paso 1.2 (Realtime activado) y el 1.1
  (políticas RLS creadas).
