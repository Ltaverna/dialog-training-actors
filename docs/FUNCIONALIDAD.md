# Funcionalidad — dialog-training-actors

> Qué hace (y hará) el producto. Para el detalle de qué está construido hoy ver
> [`ESTADO.md`](./ESTADO.md); para cómo está hecho ver
> [`ARQUITECTURA.md`](./ARQUITECTURA.md).

## 1. El problema

Los actores tienen que **memorizar diálogos** y, cuando ensayan solos, no
pueden recrear el ir y venir de la escena: les falta el compañero que diga las
otras líneas. La app cumple ese rol — pone voz a los demás personajes, hace de
teleprompter, escucha al actor y lo ayuda a memorizar.

## 2. Funcionalidades del producto

Organizadas por área. El estado (✅ hecho / 🚧 en curso / ⬜ planeado) refleja
el avance al momento de escribir esta doc.

### 2.1 Cuentas y datos
- ⬜→✅ **Registro e inicio de sesión** con email/contraseña, Google y Apple.
- ✅ **Perfil de usuario** en la nube (se crea al primer login).
- ✅ **Persistencia de guiones** por usuario en la nube (crear, leer, listar,
  borrar), con aislamiento por usuario garantizado por reglas de seguridad.

### 2.2 Carga de guiones
- ⬜ **Importar** un guion por PDF, foto (OCR), pegado de texto o un editor
  estructurado. Todos los métodos producen el mismo `Script` canónico, que el
  actor revisa y corrige antes de guardar.

### 2.3 Práctica y memorización
- ⬜ **Modo ensayo:** la app dice las líneas de los otros personajes con voz
  (TTS) y escucha al actor por **reconocimiento de voz** (STT), avanzando
  cuando detecta que terminó su línea; con fallback manual.
- ⬜ **Teleprompter** con resaltado de la línea actual.
- ⬜ **Ocultamiento progresivo** de las líneas propias (texto completo → solo
  iniciales → nada) a medida que el actor las domina.
- ⬜ **Pistas / apuntador** bajo demanda.
- ⬜ **Repaso espaciado** de las líneas/escenas más débiles.
- ⬜ **Métricas de progreso** (precisión por escena/personaje, líneas
  dominadas, racha).

### 2.4 Voces
- ⬜ **TTS en la nube de alta calidad**, una voz por personaje, con el audio de
  cada línea cacheado para controlar costo y latencia.

### 2.5 Colaboración (fase final)
- ⬜ **Ensayo en vivo compartido:** varios actores se conectan a la misma
  escena en tiempo real y la app cubre solo a los personajes ausentes.

### 2.6 Monetización
- ⬜ **Freemium + suscripción:** plan gratis con límites (cantidad de guiones,
  voces básicas, minutos de TTS) y suscripción que desbloquea lo demás.

## 3. Plataformas

- **Web** (Next.js) — en construcción activa.
- **iOS / Android** (Expo / React Native) — scaffolding listo; UI a futuro.

## 4. Estado actual (resumen)

Lo construido hasta ahora es la **base**: el modelo de dominio del guion, la
integración con Firebase (auth + datos + reglas), y la **UI de autenticación
web** (login / registro / reseteo / Google / Apple). Lo que sigue es la
pantalla de "Mis guiones" y, después, el editor, el motor de ensayo, las voces
y la memorización.

El detalle fase por fase está en [`ESTADO.md`](./ESTADO.md).

## 5. Recorrido del usuario (objetivo)

1. Crea una cuenta / inicia sesión.
2. Importa o crea un guion y asigna una voz a cada personaje; elige su propio
   personaje.
3. Practica una escena: la app dice las líneas de los otros, lo escucha, lo
   corrige y lo ayuda a memorizar con ocultamiento progresivo y pistas.
4. Repasa lo que más le cuesta y sigue su progreso.
5. (Más adelante) ensaya en vivo con el elenco, cubriendo la app a los
   ausentes.
