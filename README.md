# 🐾 PetConnect

Sitio web de **adopción responsable de mascotas**, desarrollado para el **Desafío Web 2026** en IP Santo Tomás, sede San Joaquín.

PetConnect no solo muestra mascotas: ayuda a la persona a descubrir cuál es compatible con ella, cuánto cuesta realmente cuidarla y si está preparada para adoptar.

> Proyecto académico. Los datos de contacto y el envío del formulario son simulados; no existe un sistema real de adopción.

## 👥 Equipo

| Integrantes |  |
|---|---|
| Veronica Ovalle | 
| Sheriet Ramos | 
| Reinaldo Danna | 

## ✨ Funcionalidades

**Contenido solicitado en el caso**
- **Inicio** con propuesta de valor, contadores de impacto y mitos y verdades.
- **Mascotas**: 6 mascotas (3 perros y 3 gatos) con ficha detallada.
- **Proceso de adopción** en 6 pasos, separado en "antes" y "después" de postular.
- **Preguntas frecuentes** con acordeones accesibles.
- **Contacto** con datos y mapa.
- **Formulario de solicitud de adopción** con validación.

**Funcionalidad con JavaScript**
- Búsqueda por nombre y filtros por especie, edad y tamaño, con resultados que se actualizan sin recargar la página.
- Favoritos con contador y filtro "Solo favoritos".
- **Test Match**: 5 preguntas que calculan un porcentaje de compatibilidad con cada mascota. El perfil se guarda y se usa en todo el sitio (insignia en cada tarjeta, orden por compatibilidad, ficha y mensaje del formulario).
- Calculadora de costo mensual y anual según especie y tamaño.
- Checklist "¿Estoy listo para adoptar?" con barra de progreso.
- Quiz de **Mitos y verdades** con explicación de cada respuesta.
- **Comprobante de solicitud** descargable en PNG, generado con `<canvas>`.
- Modo claro y oscuro, recordado entre visitas.

**Experiencia de uso**
- Diseño responsivo para escritorio y celular, con menú móvil.
- Navegación por vistas mediante el hash de la URL (`#mascotas`, `#proceso`, etc.).
- Accesibilidad básica: etiquetas ARIA, foco visible, cierre de modales con Escape y respeto de `prefers-reduced-motion`.

## 🗂️ Estructura del proyecto

```
petconnect/
├── index.html        # Estructura de todas las vistas y modales
├── css/
│   └── styles.css    # Estilos; paleta y tipografías en :root
├── js/
│   ├── data.js       # Datos: mascotas, costos, preguntas, checklist y mitos
│   └── app.js        # Lógica e interacción
├── img/              # Fotos de las mascotas y logo
└── README.md
```

## 🧠 Decisiones de diseño

- **Sin frameworks ni librerías:** HTML, CSS y JavaScript puros, para que el código sea simple de leer, explicar y mantener.
- **Sitio dirigido por datos:** casi todo se genera desde `data.js`. Agregar una mascota, una pregunta del test o un ítem del checklist no requiere tocar el HTML ni la lógica.
- **Una sola página con vistas:** cada sección funciona como una "página" que se muestra u oculta según el hash de la URL, sin recargar.
- **Paleta cálida:** naranja, verde y amarillo, con variables CSS para cambiar el estilo desde un solo lugar y un tema oscuro propio.
- **Persistencia con `localStorage`:** se guardan tema, favoritos, perfil del adoptante y progreso del checklist. Si el navegador bloquea el almacenamiento, el sitio sigue funcionando.
- **Seguridad básica:** el texto escrito por la persona se escapa antes de mostrarse como HTML.
- **Fallback de imágenes:** si una foto no carga, se muestra el emoji de la mascota.

### Cómo se calcula la compatibilidad

Cada una de las 5 respuestas (espacio, tiempo, energía, niños y presupuesto) aporta hasta 20 puntos, para un máximo de 100. Tener más espacio, tiempo o presupuesto del que la mascota necesita suma todo; tener menos descuenta puntos. En energía, mientras más parecida, mejor.

> El resultado es una **orientación**, no un veredicto. La decisión final es siempre de la persona, y tiene consecuencias para el animal.

## ⚖️ Sello valórico

- **Adoptar, no comprar:** una adopción le da una segunda oportunidad a un animal que ya espera.
- **Compromiso a largo plazo:** una mascota puede vivir entre 10 y 20 años, por eso el sitio insiste en que la decisión se piense bien.
- **Enviar el formulario no aprueba la adopción:** cada solicitud se revisa y se coordina con el voluntariado.
- **Información con fuente:** las cifras sobre abandono y microchip provienen del estudio de población animal de la Facultad de Medicina Veterinaria UC y el programa Mascota Protegida (Subdere), 2022. Son estimaciones.
- **Marco legal:** se menciona la Ley 21.020 de tenencia responsable de mascotas.

## 🤖 Uso de inteligencia artificial

- **Herramienta usada:** Claude.
- **Para qué:** Fue utilizada para la organización del código y como apoyo para el diseño.
- **Qué decidimos nosotros:** Nosotros elegimos toda la estética, el orden y como queremos que el usuario interactue dentro de nuestra página.

## ▶️ Cómo ejecutarlo

1. Descarga o clona el repositorio.
2. Abre `index.html` en el navegador (doble clic), o usa la extensión **Live Server** de VS Code.
3. No requiere instalar nada ni conexión a internet, salvo para las tipografías de Google Fonts y el mapa; sin internet se usan las del sistema.

## 🔧 Cómo modificarlo

- **Agregar una mascota:** añade un objeto al arreglo `MASCOTAS` en `js/data.js` y guarda su foto en `img/`.
- **Cambiar colores o tipografías:** edita las variables de `:root` en `css/styles.css`.
- **Cambiar las preguntas del test:** edita `PREGUNTAS` en `js/data.js`.
- **Ajustar costos:** edita `COSTOS` y `COSTO_ANUAL_VACUNAS` en `js/data.js`.

## 📌 Notas

- Los costos son valores referenciales en pesos chilenos.
- Datos de contacto simulados para el Desafío Web 2026.

---
Desafío Web 2026 · IP Santo Tomás, sede San Joaquín