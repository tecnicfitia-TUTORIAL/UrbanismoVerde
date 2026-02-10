# 📊 Configuración de Supabase - EcoUrbe AI

Esta guía detalla cómo configurar Supabase como base de datos principal para EcoUrbe AI, incluyendo la creación del proyecto, configuración de tablas, Row Level Security (RLS) y datos de prueba.

## 📋 Tabla de Contenidos

1. [Requisitos Previos](#requisitos-previos)
2. [Crear Proyecto en Supabase](#crear-proyecto-en-supabase)
3. [Ejecutar Migraciones](#ejecutar-migraciones)
4. [Configurar Row Level Security](#configurar-row-level-security)
5. [Cargar Datos de Prueba](#cargar-datos-de-prueba)
6. [Configurar Variables de Entorno](#configurar-variables-de-entorno)
7. [Verificar Configuración](#verificar-configuración)
8. [Troubleshooting](#troubleshooting)

---

## ✅ Requisitos Previos

- Cuenta en [Supabase](https://supabase.com)
- Node.js 18 o superior
- Git instalado
- Credenciales del proyecto:
  - **URL**: `https://wxxztdpkwbyvggpwqdgx.supabase.co`
  - **Publishable Key**: Ya incluida en la configuración

---

## 🚀 Crear Proyecto en Supabase

### 1. Acceder a Supabase Dashboard

1. Ve a [https://app.supabase.com](https://app.supabase.com)
2. Inicia sesión con tu cuenta
3. El proyecto ya está creado con las credenciales proporcionadas

### 2. Verificar Información del Proyecto

En el dashboard, verifica:
- **Project URL**: `https://wxxztdpkwbyvggpwqdgx.supabase.co`
- **API Keys**: Anon/Public key ya configurada
- **Database**: PostgreSQL 15 con extensiones activadas

---

## 📦 Ejecutar Migraciones

### Opción 1: Desde la UI de Supabase (Recomendada)

1. Ve a **SQL Editor** en el dashboard
2. Ejecuta las migraciones en orden:

#### a) Crear Schema Inicial

```sql
-- Copia y pega el contenido de: supabase/migrations/001_initial_schema.sql
```

Click en **Run** para ejecutar.

#### b) Habilitar Row Level Security

```sql
-- Copia y pega el contenido de: supabase/migrations/002_enable_rls.sql
```

Click en **Run** para ejecutar.

### Opción 2: Usando Supabase CLI

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login en Supabase
supabase login

# Link al proyecto
supabase link --project-ref wxxztdpkwbyvggpwqdgx

# Ejecutar migraciones
supabase db push
```

---

## 🔒 Configurar Row Level Security

Las políticas RLS ya están incluidas en `002_enable_rls.sql`. Verifica que estén activas:

### Verificar RLS en Tablas

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

Todas las tablas deben tener `rowsecurity = true`.

### Políticas Configuradas

#### Zonas Verdes
- ✅ Todos pueden ver zonas verdes
- ✅ Usuarios autenticados pueden crear zonas
- ✅ Usuarios pueden actualizar sus propias zonas
- ✅ Usuarios pueden eliminar sus propias zonas

#### Analisis, Proyectos, Imágenes
- ✅ Todos pueden ver
- ✅ Solo usuarios autenticados pueden modificar

#### Especies y Municipios
- ✅ Lectura pública
- ✅ Solo usuarios autenticados pueden insertar/modificar

---

## 🌱 Cargar Datos de Prueba

### Desde SQL Editor

1. Ve a **SQL Editor**
2. Copia y pega el contenido de `supabase/seed.sql`
3. Click en **Run**

### Datos Incluidos

- **10 municipios** principales de España
- **15 especies** vegetales para reforestación urbana
- **3 zonas verdes** de ejemplo en Madrid

### Verificar Datos

```sql
-- Contar registros
SELECT 
  (SELECT COUNT(*) FROM municipios) as municipios,
  (SELECT COUNT(*) FROM especies) as especies,
  (SELECT COUNT(*) FROM zonas_verdes) as zonas_verdes;
```

---

## ⚙️ Configurar Variables de Entorno

### Frontend

1. Crea un archivo `.env` en `frontend/`:

```bash
cp frontend/.env.example frontend/.env
```

2. Edita el archivo `.env` con las credenciales de Supabase:

```env
VITE_SUPABASE_URL=https://wxxztdpkwbyvggpwqdgx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4eHp0ZHBrd2J5dmdncHdxZGd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg4ODEwMDAsImV4cCI6MjA1NDQ1NzAwMH0.sb_publishable_ixXatFFRmRZNgvBJVflnjg_V7IQTbnU
VITE_API_URL=http://localhost:4000
VITE_AI_SERVICE_URL=http://localhost:8000
```

> **Nota de Seguridad**: Estas credenciales son las claves públicas de Supabase (anon key) que están diseñadas para ser usadas en el cliente. La seguridad está garantizada por las políticas RLS (Row Level Security) en la base de datos. Nunca uses la `service_role_key` en el frontend.

### Obtener las Claves (si es necesario)

1. Ve a **Settings** > **API** en Supabase Dashboard
2. Copia:
   - **Project URL**: Ya configurada
   - **anon/public key**: Ya configurada en `.env.example`

---

## ✅ Verificar Configuración

### 1. Test de Conexión

```bash
cd frontend
npm install
npm run dev
```

La aplicación debe conectarse a Supabase automáticamente.

### 2. Verificar en Browser Console

```javascript
// Abrir DevTools > Console
// Deberías ver mensajes de:
// - "Service Worker registered"
// - "Starting sync service..."
// - "Syncing data..."
```

### 3. Test Desde SQL Editor

```sql
-- Verificar tablas creadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Debería mostrar:
-- analisis, especies, imagenes, municipios, proyectos, zonas_verdes
```

---

## 🔧 Troubleshooting

### Error: "relation does not exist"

**Solución**: Las migraciones no se ejecutaron correctamente.

```bash
# Ejecutar migraciones manualmente
supabase db reset
# Luego ejecutar cada migración en SQL Editor
```

### Error: "permission denied for table"

**Solución**: RLS no está configurado correctamente.

```sql
-- Verificar políticas
SELECT * FROM pg_policies WHERE tablename = 'zonas_verdes';

-- Ejecutar nuevamente 002_enable_rls.sql si es necesario
```

### Error: "Failed to fetch"

**Causas posibles**:
1. URL de Supabase incorrecta en `.env`
2. Anon Key incorrecta
3. CORS no configurado

**Solución**:
```bash
# Verificar variables
cat frontend/.env

# Verificar en Supabase Dashboard > Settings > API
# Authentication > Site URL debe incluir localhost:3000
```

### Error: "Too many connections"

**Solución**: Supabase Free Tier tiene límite de conexiones.

```javascript
// En supabase.ts, agregar pooling:
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'public',
  },
  auth: {
    persistSession: true,
  },
  global: {
    headers: {
      'x-application-name': 'EcoUrbe AI',
    },
  },
});
```

---

## 📊 Monitoreo

### Dashboard de Supabase

- **Database** > **Tables**: Ver datos en tiempo real
- **Database** > **Roles**: Verificar permisos
- **Database** > **Replication**: Ver sincronización
- **Auth** > **Users**: Ver usuarios registrados (si aplica)

### Métricas Importantes

```sql
-- Tamaño de la base de datos
SELECT pg_size_pretty(pg_database_size(current_database()));

-- Número de conexiones activas
SELECT count(*) FROM pg_stat_activity;

-- Queries más lentas
SELECT query, calls, mean_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

---

## 🔄 Actualizar Schema

Si necesitas agregar nuevas tablas o columnas:

1. Crea un nuevo archivo de migración:
   ```
   supabase/migrations/003_add_feature.sql
   ```

2. Ejecuta desde SQL Editor o CLI:
   ```bash
   supabase db push
   ```

3. Actualiza las políticas RLS si es necesario

---

## 🔐 Seguridad Best Practices

1. ✅ **Nunca** expongas la `service_role` key en frontend
2. ✅ Usa solo `anon/public` key en cliente
3. ✅ Mantén RLS habilitado en todas las tablas
4. ✅ Revisa políticas periódicamente
5. ✅ Usa autenticación para operaciones sensibles
6. ✅ Limita operaciones por usuario con rate limiting

---

## 📚 Recursos Adicionales

- [Documentación Supabase](https://supabase.com/docs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

## 🆘 Soporte

Si encuentras problemas:

1. Revisa los logs en Supabase Dashboard
2. Verifica Browser Console para errores del cliente
3. Consulta la documentación oficial
4. Abre un issue en el repositorio del proyecto

---

**✅ ¡Configuración completada!** Tu base de datos Supabase está lista para usar.
