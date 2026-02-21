# Instrucciones de Configuración de Supabase

## 1. Ejecutar el Schema SQL

En el **SQL Editor** de Supabase, ejecuta uno de estos archivos:

- **Si es una base de datos nueva:** Ejecuta `supabase_schema.sql` completo
- **Si ya tienes datos:** Ejecuta `supabase_migration.sql`

## 2. Crear Buckets de Storage

### Bucket: `perfil`
Para almacenar el logo de la empresa.

1. Ve a **Storage** en el panel de Supabase
2. Crea un nuevo bucket llamado `perfil`
3. Marca como **público**
4. Configuración recomendada:
   - Allowed MIME types: `image/*`
   - Max file size: `2MB`

### Bucket: `cotizaciones`
Para almacenar los PDFs de cotizaciones.

1. Ve a **Storage** en el panel de Supabase
2. Crea un nuevo bucket llamado `cotizaciones`
3. Marca como **público**
4. Configuración recomendada:
   - Allowed MIME types: `application/pdf`
   - Max file size: `10MB`

## 3. Configurar Políticas de Storage

### Para el bucket `perfil`:

```sql
-- Permitir lectura pública
CREATE POLICY "Lectura pública perfil"
ON storage.objects FOR SELECT
USING (bucket_id = 'perfil');

-- Permitir subida pública (o restringir si prefieres)
CREATE POLICY "Subida pública perfil"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'perfil');

-- Permitir actualización pública
CREATE POLICY "Actualización pública perfil"
ON storage.objects FOR UPDATE
USING (bucket_id = 'perfil');
```

### Para el bucket `cotizaciones`:

```sql
-- Permitir lectura pública
CREATE POLICY "Lectura pública cotizaciones"
ON storage.objects FOR SELECT
USING (bucket_id = 'cotizaciones');

-- Permitir subida pública
CREATE POLICY "Subida pública cotizaciones"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'cotizaciones');
```

## 4. Variables de Entorno

Asegúrate de tener configuradas estas variables en tu archivo `.env`:

```env
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_clave_anonima
```

## 5. Verificación

Para verificar que todo está funcionando:

1. Ve a **Mi Perfil** en la aplicación
2. Sube un logo de prueba
3. Guarda los datos de la empresa
4. Crea una cotización nueva
5. Previsualiza el PDF - deberías ver tu logo y datos

## Solución de Problemas

### Error: "bucket 'perfil' does not exist"
- Ve a Storage y crea el bucket `perfil` marcado como público

### Error al subir imagen
- Verifica que el bucket es público
- Verifica las políticas de storage
- Asegúrate de que el archivo es una imagen válida (JPG, PNG, SVG)

### Logo no aparece en el PDF
- Verifica que la URL del logo sea pública y accesible
- Comprueba que el logo se guardó correctamente en la base de datos (tabla `perfil_empresa`)
