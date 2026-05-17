# Diseño — App de práctica de diálogos para actores

**Fecha:** 2026-05-17
**Estado:** Aprobado para pasar a plan de implementación

## 1. Visión

App profesional multiplataforma (iOS, Android, tablet y web) que ayuda a los
actores a **memorizar y ensayar diálogos solos**. La app pone voz a los demás
personajes, funciona como teleprompter, escucha al actor mediante
reconocimiento de voz y lo asiste con técnicas de memorización. En su fase
final permite que varios actores ensayen una misma escena en vivo, cubriendo
la app únicamente a los personajes ausentes.

El problema que resuelve: los actores tienen que memorizar conversaciones y
diálogos, y cuando practican solos no pueden recrear el ir y venir de la
escena. La app simula al/los compañero(s) de escena y guía la memorización.

## 2. Alcance y enfoque

- **Producto** pensado para distribuirse a actores en general (no herramienta
  personal): requiere cuentas, sincronización y monetización.
- Se diseña el **producto completo de una** (enfoque B). El documento de plan
  de implementación lo divide en fases incrementales (ver sección 9).
- La colaboración en vivo es la pieza más compleja y se construye al final,
  pero la arquitectura se diseña desde el inicio para soportarla.

## 3. Decisiones de producto

| Tema | Decisión |
|------|----------|
| Avance durante la práctica | Reconocimiento de voz como modo principal, con fallback manual (tap) ante ruido o errores |
| Carga de guiones | PDF, foto/OCR, pegar texto y editor estructurado — todos convergen a un `Script` canónico |
| Voces de otros personajes | TTS en la nube de alta calidad, una voz por personaje |
| Ayudas de memorización | Ocultamiento progresivo, pistas/apuntador bajo demanda, repaso espaciado de líneas débiles, métricas de progreso |
| Plataformas | iOS, Android, tablet y web, con calidad profesional ("sin limitaciones") |
| Backend | Firebase |
| Monetización | Freemium + suscripción |
| Colaboración | Ensayo en vivo compartido (varios actores en una escena) |

## 4. Arquitectura

La estrategia para lograr calidad profesional en tres plataformas sin deuda
técnica es **separar la lógica de dominio de la plataforma** mediante un
monorepo con un núcleo aislado.

```
repo/
├── packages/
│   ├── core      → lógica de dominio en TypeScript, agnóstica de plataforma:
│   │               modelo de guion, motor de ensayo (máquina de estados),
│   │               ocultamiento progresivo, pistas, repaso espaciado,
│   │               scoring. 100% testeable con tests puros.
│   ├── data      → capa de acceso a Firebase: auth, repositorios,
│   │               cache offline. Compartida entre mobile y web.
│   └── ui        → tokens de diseño y componentes compartidos.
├── apps/
│   ├── mobile    → React Native + Expo (iOS, Android, tablet — nativo real).
│   └── web       → Next.js (web + desktop, instalable).
└── functions/    → Firebase Cloud Functions: proxy de TTS, pipeline de
                    parsing de guiones, gestión de suscripciones,
                    señalización del ensayo en vivo.
```

`packages/core` no depende de React ni de Firebase. El motor de ensayo se
prueba con tests unitarios puros, y la app móvil y la web comparten
exactamente la misma lógica de dominio.

### 4.1 Backend y servicios externos

- **Firebase**
  - Auth — cuentas de usuario.
  - Firestore — datos y sincronización offline-first.
  - Storage — archivos de guion y audio TTS cacheado.
  - Cloud Functions — proxy de TTS, parsing, suscripciones, señalización.
- **TTS (voces de los personajes)** — proveedor en la nube de alta calidad
  (ej. ElevenLabs). Siempre se accede **detrás de una Cloud Function** para no
  exponer claves de API. El audio de cada línea se **cachea en Storage** con
  clave `hash(texto + voiceId)`: se genera una sola vez y se reutiliza. Esto
  es clave para la calidad y para controlar el costo del plan gratuito.
- **STT (reconocimiento de voz)** — STT en streaming en la nube
  (ej. Deepgram), para lograr el **mismo comportamiento en las tres
  plataformas** (la Web Speech API es demasiado despareja). Reconocimiento
  on-device como fallback.
- **Parsing de guiones** — Cloud Vision para OCR de fotos, extracción de
  texto de PDF, y un paso con LLM que estructura el texto en
  personajes / líneas / acotaciones.

## 5. Componentes

1. **Ingesta de guiones** — importación por PDF, foto/OCR, pegado de texto y
   editor estructurado. Todos los métodos producen un mismo `Script`
   canónico. El parsing de PDF/fotos corre en una Cloud Function (Vision +
   LLM); el actor **revisa y corrige** el resultado en el editor antes de
   guardar (paso humano obligatorio por la variedad de formatos de guion).

2. **Motor de ensayo** (`packages/core`) — máquina de estados que conduce la
   sesión de práctica: puntero de línea actual, de quién es el turno, nivel
   de ocultamiento por línea, estado de pistas, scoring de precisión. Emite
   eventos que la UI renderiza.

3. **Teleprompter** — vista del guion con scroll, resalta la línea actual,
   muestra las líneas del actor según el nivel de ocultamiento configurado y
   las de los demás a medida que se pronuncian. Controles de pista, override
   manual y velocidad.

4. **Capa de voz** — reproducción TTS por personaje (audio cacheado) y STT en
   streaming con un **comparador difuso** que compara lo reconocido con la
   línea esperada, tolera errores chicos y decide
   "línea completa / parcial / equivocada".

5. **Capa de memorización** — niveles de ocultamiento progresivo (texto
   completo → solo iniciales → nada), proveedor de pistas/apuntador,
   planificador de repaso espaciado que prioriza líneas y escenas débiles, y
   agregación de métricas.

6. **Cuentas y sincronización** — auth de Firebase, biblioteca por usuario de
   guiones, sesiones y progreso; offline-first con sincronización.

7. **Ensayo en vivo** — sesión compartida: varios actores se unen a una
   escena, la app pone voz solo a los personajes ausentes. Audio por WebRTC y
   estado en tiempo real; señalización vía Cloud Functions. Última fase.

8. **Monetización** — límites del plan free (ej. 2 guiones, voces básicas,
   tope mensual de minutos de TTS, sin ensayo en vivo) y suscripción vía App
   Store / Play / Stripe (web). El entitlement se guarda en Firestore y se
   verifica server-side.

## 6. Modelo de datos (Firestore)

- **`users/{uid}`** — perfil y estado de suscripción (entitlement verificado
  server-side).
- **`scripts/{scriptId}`** — `{ title, ownerUid, collaborators[],
  characters[], scenes[], characterVoices }`. Las líneas van en una
  **subcolección** `scripts/{scriptId}/lines` para no chocar con el límite de
  1 MB por documento en obras largas.
  - `Line { id, sceneId, order, characterId, type: dialogue | direction, text }`
  - `characterVoices` — mapeo personaje → voz TTS.
- **`users/{uid}/progress/{scriptId}`** — por línea: nivel de dominio, nivel
  de ocultamiento actual, último repaso, historial de precisión. Alimenta el
  repaso espaciado.
- **`users/{uid}/sessions/{sessionId}`** — registro de cada ensayo: fecha,
  escena, scores, duración. Alimenta las métricas.
- **`liveRooms/{roomId}`** — sala de ensayo en vivo: guion, escena,
  participantes, asignación de personajes, puntero de línea, datos de
  señalización.
- **Cache de audio TTS** — en Storage, con clave `hash(texto + voiceId)`,
  referenciada desde la línea.

## 7. Flujos de usuario

1. **Onboarding e importación** — crear cuenta → importar guion (PDF / foto /
   pegar) → revisar y corregir en el editor → asignar voces a los personajes
   → elegir el personaje propio.
2. **Sesión de práctica** — elegir escena y modo (nivel de ocultamiento) → la
   app dice las líneas de los otros con TTS y escucha al actor con STT → el
   comparador difuso decide si la línea estuvo bien y avanza → pistas bajo
   demanda si se traba → al final: score y actualización del dominio.
3. **Repaso** — la app propone escenas/líneas débiles según el repaso
   espaciado.
4. **Métricas** — dashboard de precisión por escena/personaje, líneas
   dominadas, tiempo de ensayo y racha.
5. **Ensayo en vivo** — crear sala → invitar al elenco → asignar personajes →
   la app cubre solo a los ausentes → ensayar en tiempo real.
6. **Paywall** — aparece al superar los límites del plan free.

## 8. Manejo de errores y casos borde

- **STT impreciso o ruido ambiente** — el comparador difuso clasifica la línea
  como parcial/equivocada; el actor puede usar el fallback manual (tap) para
  avanzar y la sesión nunca se traba.
- **Parsing de guion incorrecto** — el paso de revisión humana en el editor es
  obligatorio antes de guardar; el actor corrige personajes, líneas y
  acotaciones mal detectados.
- **Sin conexión** — la práctica offline requiere **pre-generar y cachear** el
  audio TTS de la escena antes de perder conexión; la app avisa qué escenas
  están listas para usar offline.
- **Costo de TTS** — controlado con el cacheo de audio por línea/voz; un mismo
  guion practicado muchas veces no regenera audio.
- **Caída en ensayo en vivo** — si un participante se desconecta, la app
  vuelve a cubrir su personaje con TTS hasta que se reconecte.

## 9. Fases de implementación

El plan de implementación detallado desarrollará estas fases. Cada fase deja
la app en un estado usable.

- **Fase 0** — Monorepo, `packages/core`, proyecto Firebase, auth.
- **Fase 1** — Ingesta de guiones: pegar + editor estructurado primero; luego
  pipeline PDF + OCR.
- **Fase 2** — Motor de ensayo + teleprompter + reproducción TTS (avance
  manual primero).
- **Fase 3** — Reconocimiento de voz (STT streaming) + comparador difuso.
- **Fase 4** — Capa de memorización: ocultamiento progresivo, pistas, repaso
  espaciado, métricas.
- **Fase 5** — App web con paridad real.
- **Fase 6** — Monetización: límites del free + suscripciones.
- **Fase 7** — Ensayo en vivo compartido.

## 10. Riesgos clave

- **Comparador difuso de STT** — su precisión y latencia son el corazón de la
  experiencia y el mayor riesgo de UX; debe validarse temprano (Fase 3).
- **Parsing de PDFs de guiones** — gran variedad de formatos; mitigado con el
  paso de revisión humana obligatorio.
- **Costo de TTS** — mitigado con el cacheo de audio por línea.
- **Práctica offline** — requiere pre-generación de audio.
- **Tiempo real del ensayo en vivo** — complejidad de WebRTC y sincronización;
  por eso se construye en último lugar.

## 11. Estrategia de testing

- `packages/core` — tests unitarios puros del motor de ensayo, el ocultamiento
  progresivo, las pistas, el repaso espaciado y el scoring.
- `packages/data` — tests de integración contra el emulador de Firebase.
- Comparador difuso — set de casos con transcripciones reales (líneas exactas,
  con errores chicos, con omisiones) para validar la clasificación.
- Apps `mobile` y `web` — tests de componentes y flujos end-to-end de los
  recorridos principales (importar, practicar, repasar).
