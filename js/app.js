// ============================================================
// LÓGICA DE PETCONNECT
// Secciones: utilidades, tema, menú, perfil del adoptante, catálogo,
// favoritos, modal, mitos y verdades, test match, calculadora,
// checklist, formulario + pasaporte, contadores, animaciones.
// ============================================================

// ---------- Utilidades ----------
const $ = (sel) => document.querySelector(sel);
const formatoCLP = (n) => "$" + Math.round(n).toLocaleString("es-CL");
const etiquetaTamano = { pequeno: "Pequeño", mediano: "Mediano", grande: "Grande" };
const etiquetaEnergia = { 1: "Tranquila", 2: "Moderada", 3: "Muy activa" };
const capitalizar = (t) => t.charAt(0).toUpperCase() + t.slice(1);

// Evita que texto escrito por el usuario se interprete como HTML
function escapar(texto) {
  return String(texto).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// localStorage seguro (puede fallar en modo privado)
function leerStorage(clave, defecto) {
  try {
    const v = localStorage.getItem(clave);
    return v ? JSON.parse(v) : defecto;
  } catch (e) { return defecto; }
}
function guardarStorage(clave, valor) {
  try { localStorage.setItem(clave, JSON.stringify(valor)); } catch (e) { /* ignorar */ }
}

// Foto de la mascota. Si no hay ruta en `imagen` (o la imagen no carga),
// se muestra el emoji de respaldo.
function fotoHTML(m) {
  if (!m.imagen) return `<span class="emoji-foto" role="img" aria-label="${m.especie}">${m.emoji}</span>`;
  return `<img src="${m.imagen}" alt="Foto de ${m.nombre}, ${m.especie} en adopción" loading="lazy" data-emoji="${m.emoji}">`;
}
// Medidor visual de energía (3 puntos)
function puntosEnergia(nivel) {
  return [1, 2, 3].map((n) => `<span class="punto ${n <= nivel ? "on" : ""}"></span>`).join("");
}
// Si una <img> con data-emoji falla al cargar, la reemplaza por el emoji
function iniciarFallbackImagenes() {
  document.addEventListener("error", (e) => {
    const img = e.target;
    if (!img || img.tagName !== "IMG" || !img.dataset.emoji) return;
    const span = document.createElement("span");
    span.className = "emoji-foto";
    span.setAttribute("aria-hidden", "true");
    span.textContent = img.dataset.emoji;
    img.replaceWith(span);
  }, true);
}

// ---------- Tema claro / oscuro ----------
function iniciarTema() {
  const guardado = leerStorage("tema", "claro");
  aplicarTema(guardado);
  $("#btnTema").addEventListener("click", () => {
    const nuevo = document.documentElement.dataset.tema === "oscuro" ? "claro" : "oscuro";
    aplicarTema(nuevo);
    guardarStorage("tema", nuevo);
  });
}
function aplicarTema(tema) {
  document.documentElement.dataset.tema = tema;
  $("#btnTema").textContent = tema === "oscuro" ? "☀️" : "🌙";
}

// ---------- Menú móvil ----------
function iniciarMenu() {
  const boton = $("#navToggle");
  const lista = $("#navLinks");
  boton.addEventListener("click", () => {
    const abierto = lista.classList.toggle("abierto");
    boton.setAttribute("aria-expanded", abierto);
  });
  lista.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => {
      lista.classList.remove("abierto");
      boton.setAttribute("aria-expanded", "false");
    })
  );
}

// ============================================================
// PERFIL DEL ADOPTANTE
// El test Match guarda las respuestas. Desde ahí, todo el sitio las usa:
// compatibilidad en cada tarjeta, orden del catálogo, ficha y mensaje del formulario.
// ============================================================
function perfilValido(p) {
  return Boolean(p) && PREGUNTAS.every((q) => typeof p[q.clave] === "number");
}
let perfil = leerStorage("perfil", null);
if (!perfilValido(perfil)) perfil = null;

function etiquetaRespuesta(clave, valor) {
  const pregunta = PREGUNTAS.find((x) => x.clave === clave);
  const opcion = pregunta && pregunta.opciones.find(([, v]) => v === valor);
  return opcion ? opcion[0] : "";
}

// Puntaje de compatibilidad (0 a 100). Cada criterio aporta hasta 20 puntos.
function calcularCompatibilidad(m, p) {
  let puntos = 0;
  // espacio: si tienes más espacio del que necesita, sumas todo; si tienes menos, pierdes puntos
  puntos += p.espacio >= m.espacio ? 20 : 20 - (m.espacio - p.espacio) * 10;
  // tiempo disponible vs. tiempo que requiere
  puntos += p.tiempo >= m.tiempo ? 20 : 20 - (m.tiempo - p.tiempo) * 10;
  // energía: mientras más parecida, mejor
  puntos += 20 - Math.abs(p.energia - m.energia) * 10;
  // niños
  puntos += p.ninos === 1 && !m.ninos ? 0 : 20;
  // presupuesto
  puntos += p.presupuesto >= m.costoMensual ? 20 : Math.max(0, 20 - ((m.costoMensual - p.presupuesto) / 10000) * 5);
  return Math.max(0, Math.min(100, Math.round(puntos)));
}
function compatibilidadDe(m) {
  return perfil ? calcularCompatibilidad(m, perfil) : null;
}

function guardarPerfil(nuevo) {
  perfil = nuevo;
  guardarStorage("perfil", nuevo);
  $("#optCompat").disabled = false;
  $("#ordenar").value = "compat";
  actualizarPerfilUI();
  actualizarHerramientas();
}

function borrarPerfil() {
  perfil = null;
  guardarStorage("perfil", null);
  $("#optCompat").disabled = true;
  $("#ordenar").value = "";
  $("#formMatch").reset();
  $("#resultadoMatch").innerHTML = "";
  actualizarPerfilUI();
  actualizarHerramientas();
}

// Banner del catálogo + re-dibujo de tarjetas
function actualizarPerfilUI() {
  const banner = $("#bannerPerfil");
  if (perfil) {
    const chips = PREGUNTAS.map((q) =>
      `<span class="tag">${escapar(etiquetaRespuesta(q.clave, perfil[q.clave]))}</span>`).join("");
    banner.innerHTML = `
      <div class="banner-perfil">
        <div>
          <strong>🎯 Tu perfil de adoptante está activo</strong>
          <div class="etiquetas">${chips}</div>
        </div>
        <div class="banner-acciones">
          <a href="#match" class="btn btn-secundario btn-chico">Rehacer test</a>
          <button type="button" class="btn btn-secundario btn-chico" data-borrar-perfil>Borrar perfil</button>
        </div>
      </div>`;
  } else {
    banner.innerHTML = `
      <div class="banner-perfil">
        <div>
          <strong>🎯 ¿Qué tan compatible eres con cada mascota?</strong>
          <p>Haz el test Match y verás tu porcentaje en cada tarjeta.</p>
        </div>
        <a href="#match" class="btn btn-primario btn-chico">Hacer el test</a>
      </div>`;
  }
  renderMascotas();
}

// ---------- Favoritos ----------
let favoritos = leerStorage("favoritos", []);

function alternarFavorito(id) {
  favoritos = favoritos.includes(id) ? favoritos.filter((f) => f !== id) : [...favoritos, id];
  guardarStorage("favoritos", favoritos);
  $("#favCount").textContent = favoritos.length;
  renderMascotas();
}

// ---------- Catálogo con filtros ----------
// Convierte "8 meses" / "2 años" a meses para poder filtrar por rangos
function edadEnMeses(texto) {
  const n = parseInt(texto, 10);
  return /mes/i.test(texto) ? n : n * 12;
}
function coincideEdad(m, rango) {
  if (!rango) return true;
  const [min, max] = rango.split("-").map(Number);
  const meses = edadEnMeses(m.edad);
  return meses >= min && meses <= max;
}

function mascotasFiltradas() {
  const texto = $("#buscador").value.trim().toLowerCase();
  const especie = $("#filtroEspecie").value;
  const edad = $("#filtroEdad").value;
  const tamano = $("#filtroTamano").value;
  const soloFav = $("#soloFavoritos").checked;

  const lista = MASCOTAS.filter((m) =>
    (!texto || m.nombre.toLowerCase().includes(texto)) &&
    (!especie || m.especie === especie) &&
    coincideEdad(m, edad) &&
    (!tamano || m.tamano === tamano) &&
    (!soloFav || favoritos.includes(m.id))
  );
  if ($("#ordenar").value === "compat" && perfil) {
    lista.sort((a, b) => compatibilidadDe(b) - compatibilidadDe(a));
  }
  return lista;
}

function tarjetaMascota(m) {
  const esFav = favoritos.includes(m.id);
  const pct = compatibilidadDe(m);
  return `
    <article class="card">
      <div class="card-img">
        ${fotoHTML(m)}
        <span class="badge-edad">${m.edad}</span>
        ${pct !== null ? `<span class="badge-match">🎯 ${pct}% compatible</span>` : ""}
        <button class="card-fav" data-fav="${m.id}" aria-pressed="${esFav}"
          aria-label="${esFav ? "Quitar de favoritos" : "Agregar a favoritos"}">${esFav ? "❤️" : "🤍"}</button>
      </div>
      <div class="card-cuerpo">
        <h3>${m.nombre}</h3>
        <p class="card-carac">${m.caracteristicas}</p>
        <div class="etiquetas">
          <span class="tag">${m.especie}</span>
          <span class="tag">${etiquetaTamano[m.tamano]}</span>
        </div>
        <div class="energia" title="Nivel de energía">${puntosEnergia(m.energia)} <span>${etiquetaEnergia[m.energia]}</span></div>
        <div class="card-acciones">
          <button class="btn btn-secundario btn-chico" data-ver="${m.id}">Ver ficha</button>
          <button class="btn btn-primario btn-chico" data-adoptar="${m.id}">Adoptar</button>
        </div>
      </div>
    </article>`;
}

function renderMascotas() {
  const lista = mascotasFiltradas();
  const grid = $("#gridMascotas");
  grid.innerHTML = lista.length
    ? lista.map(tarjetaMascota).join("")
    : `<p class="vacio">No encontramos mascotas con esos filtros. Prueba con otros 🐾</p>`;
  $("#resultadosInfo").textContent = `Mostrando ${lista.length} de ${MASCOTAS.length} mascotas`;
}

function iniciarCatalogo() {
  ["#buscador", "#filtroEspecie", "#filtroEdad", "#filtroTamano", "#soloFavoritos", "#ordenar"].forEach((s) =>
    $(s).addEventListener("input", renderMascotas)
  );
  // Delegación de eventos: un solo listener para todos los botones de las tarjetas
  $("#gridMascotas").addEventListener("click", (e) => {
    const fav = e.target.closest("[data-fav]");
    const ver = e.target.closest("[data-ver]");
    const adoptar = e.target.closest("[data-adoptar]");
    if (fav) alternarFavorito(Number(fav.dataset.fav));
    if (ver) abrirModal(Number(ver.dataset.ver));
    if (adoptar) irAFormulario(Number(adoptar.dataset.adoptar));
  });
  $("#bannerPerfil").addEventListener("click", (e) => {
    if (e.target.closest("[data-borrar-perfil]")) borrarPerfil();
  });
  $("#favCount").textContent = favoritos.length;
  // Si ya hay un perfil guardado, se activa el orden por compatibilidad
  if (perfil) { $("#optCompat").disabled = false; $("#ordenar").value = "compat"; }
  actualizarPerfilUI();
}

// ---------- Modal de ficha ----------
function abrirModal(id) {
  const m = MASCOTAS.find((x) => x.id === id);
  if (!m) return;
  const pct = compatibilidadDe(m);
  $("#modalContenido").innerHTML = `
    <div class="modal-foto">${fotoHTML(m)}</div>
    <div class="modal-cuerpo">
      <h3 id="modalTitulo">${m.nombre}</h3>
      <div class="etiquetas">
        <span class="tag">${m.especie}</span><span class="tag">${m.edad}</span>
        <span class="tag">${etiquetaTamano[m.tamano]}</span>
        <span class="tag">Energía: ${etiquetaEnergia[m.energia]}</span>
        <span class="tag">${m.ninos ? "Apta con niños" : "Mejor sin niños pequeños"}</span>
      </div>
      <p>“${m.historia}”</p>
      <p><strong>Costo mensual aproximado:</strong> ${formatoCLP(m.costoMensual)}</p>
      ${pct !== null ? `<p class="compat-linea">🎯 Compatibilidad contigo: <strong>${pct}%</strong></p>` : ""}
      <button class="btn btn-primario" data-modal-adoptar="${m.id}">Quiero adoptar a ${m.nombre}</button>
    </div>`;
  $("#modal").hidden = false;
  $("#modalCerrar").focus();
}
function cerrarModal() { $("#modal").hidden = true; }

function iniciarModal() {
  $("#modalCerrar").addEventListener("click", cerrarModal);
  $("#modal").addEventListener("click", (e) => { if (e.target.id === "modal") cerrarModal(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") { cerrarModal(); cerrarAdopcion(); } });
  $("#modalContenido").addEventListener("click", (e) => {
    const b = e.target.closest("[data-modal-adoptar]");
    if (b) { cerrarModal(); irAFormulario(Number(b.dataset.modalAdoptar)); }
  });
}

// ============================================================
// MITOS Y VERDADES (quiz de pensamiento crítico)
// ============================================================
function iniciarMitos() {
  const cont = $("#mitosContenido");
  let indice = 0;
  let aciertos = 0;
  let respondida = false;

  function pintarPregunta() {
    const q = MITOS[indice];
    respondida = false;
    cont.innerHTML = `
      <p class="mito-progreso">Afirmación ${indice + 1} de ${MITOS.length}</p>
      <div class="barra"><div class="barra-relleno" style="width:${(indice / MITOS.length) * 100}%"></div></div>
      <blockquote class="mito-texto">“${q.texto}”</blockquote>
      <div class="mito-botones">
        <button type="button" class="btn btn-secundario" data-resp="mito">❌ Mito</button>
        <button type="button" class="btn btn-secundario" data-resp="verdad">✅ Verdad</button>
      </div>
      <div class="mito-feedback"></div>`;
  }

  function pintarFinal() {
    const mensaje =
      aciertos >= 5 ? "¡Excelente! Ya piensas como un adoptante responsable."
        : aciertos >= 3 ? "Vas bien. Revisa las explicaciones para desmontar los mitos que quedan."
          : "Hay varios mitos por desmontar. Una buena decisión empieza por informarse.";
    cont.innerHTML = `
      <div class="mito-final">
        <h3>🏆 ${aciertos} de ${MITOS.length} correctas</h3>
        <p>${mensaje}</p>
        <div class="mito-botones">
          <button type="button" class="btn btn-secundario" data-reiniciar>Reintentar</button>
          <a href="#match" class="btn btn-primario">Hacer el test Match</a>
        </div>
      </div>`;
  }

  cont.addEventListener("click", (e) => {
    const resp = e.target.closest("[data-resp]");
    if (resp && !respondida) {
      respondida = true;
      const q = MITOS[indice];
      const dijoVerdad = resp.dataset.resp === "verdad";
      const acerto = dijoVerdad === q.esVerdad;
      if (acerto) aciertos++;
      cont.querySelectorAll("[data-resp]").forEach((b) => {
        b.disabled = true;
        if ((b.dataset.resp === "verdad") === q.esVerdad) b.classList.add("correcto");
        else if (b === resp) b.classList.add("incorrecto");
      });
      const ultima = indice === MITOS.length - 1;
      cont.querySelector(".mito-feedback").innerHTML = `
        <div class="caja ${acerto ? "" : "mal"}">
          <strong>${acerto ? "¡Correcto!" : "Casi."}</strong>
          Es ${q.esVerdad ? "una verdad" : "un mito"}. ${q.explicacion}
        </div>
        <button type="button" class="btn btn-primario btn-chico" data-sig>${ultima ? "Ver resultado" : "Siguiente"}</button>`;
    }
    if (e.target.closest("[data-sig]")) {
      indice++;
      indice >= MITOS.length ? pintarFinal() : pintarPregunta();
    }
    if (e.target.closest("[data-reiniciar]")) {
      indice = 0; aciertos = 0;
      pintarPregunta();
    }
  });

  pintarPregunta();
}

// ---------- Test Match ----------
function iniciarMatch() {
  const form = $("#formMatch");
  form.innerHTML =
    PREGUNTAS.map((p, i) => `
      <fieldset class="pregunta">
        <legend>${i + 1}. ${p.texto}</legend>
        <div class="opciones">
          ${p.opciones.map(([txt, val]) => `
            <label class="opcion">
              <input type="radio" name="${p.clave}" value="${val}">
              <span>${txt}</span>
            </label>`).join("")}
        </div>
      </fieldset>`).join("") +
    `<button type="submit" class="btn btn-primario">Ver mis resultados</button>`;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const datos = new FormData(form);
    const nuevo = {};
    for (const p of PREGUNTAS) {
      if (!datos.has(p.clave)) {
        $("#resultadoMatch").innerHTML = `<p class="aviso">Responde todas las preguntas para calcular tu compatibilidad 🐾</p>`;
        return;
      }
      nuevo[p.clave] = Number(datos.get(p.clave));
    }
    guardarPerfil(nuevo);                      // el perfil queda disponible para todo el sitio
    mostrarResultadosMatch({ scroll: true });
  });

  // Si ya había un perfil guardado, se restauran las respuestas y el ranking
  if (perfil) {
    PREGUNTAS.forEach((q) => {
      const radio = form.querySelector(`input[name="${q.clave}"][value="${perfil[q.clave]}"]`);
      if (radio) radio.checked = true;
    });
    mostrarResultadosMatch({ scroll: false });
  }
}

function mostrarResultadosMatch({ scroll }) {
  const ranking = MASCOTAS
    .map((m) => ({ m, pct: calcularCompatibilidad(m, perfil) }))
    .sort((a, b) => b.pct - a.pct);

  const cont = $("#resultadoMatch");
  cont.innerHTML = ranking.map(({ m, pct }, i) => `
    <article class="match-item ${i === 0 ? "top" : ""}">
      <div class="match-foto">${fotoHTML(m)}</div>
      <div>
        <strong>${i === 0 ? "🏆 Tu mejor match: " : ""}${m.nombre}</strong>
        <div class="match-barra"><div data-ancho="${pct}"></div></div>
        <button class="btn btn-secundario btn-chico" data-match-adoptar="${m.id}" style="margin-top:.6rem">Solicitar adopción</button>
      </div>
      <div class="match-pct">${pct}%</div>
    </article>`).join("") +
    `<div class="match-cta">
       <p class="aviso">Tu perfil quedó guardado: el catálogo ya muestra tu compatibilidad en cada mascota.</p>
       <a href="#mascotas" class="btn btn-primario">Ver mascotas ordenadas para mí</a>
     </div>`;

  // Animar barras después de pintar
  requestAnimationFrame(() => {
    cont.querySelectorAll("[data-ancho]").forEach((b) => (b.style.width = b.dataset.ancho + "%"));
  });
  cont.querySelectorAll("[data-match-adoptar]").forEach((b) =>
    b.addEventListener("click", () => irAFormulario(Number(b.dataset.matchAdoptar)))
  );
  if (scroll) cont.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ---------- Calculadora de costos ----------
const TOPE_PRESUPUESTO_ALTO = 60000; // la opción "Más de $60.000" no tiene tope definido

function iniciarCalculadora() {
  const selMascota = $("#calcMascota");
  selMascota.innerHTML =
    `<option value="">Elegir especie y tamaño manualmente</option>` +
    MASCOTAS.map((m) => `<option value="${m.id}">${m.emoji} Calcular para ${m.nombre}</option>`).join("");

  // Al elegir una mascota se rellenan especie y tamaño
  selMascota.addEventListener("input", () => {
    const m = MASCOTAS.find((x) => x.id === Number(selMascota.value));
    if (m) {
      $("#calcEspecie").value = m.especie;
      $("#calcTamano").value = m.tamano;
    }
    calcularCostos(true);
  });
  // Si se cambia a mano, se deja de calcular para una mascota en particular
  ["#calcEspecie", "#calcTamano"].forEach((s) =>
    $(s).addEventListener("input", () => {
      selMascota.value = "";
      calcularCostos(true);
    })
  );
  calcularCostos();
}

// Compara el gasto mensual con el presupuesto del test Match
function mensajePresupuesto(mensual) {
  if (!perfil) {
    return `<p class="calc-presupuesto">💡 Haz el <a href="#match">test Match</a> para comparar este gasto con tu presupuesto.</p>`;
  }
  const etiqueta = etiquetaRespuesta("presupuesto", perfil.presupuesto);
  if (perfil.presupuesto > TOPE_PRESUPUESTO_ALTO) {
    return mensual <= TOPE_PRESUPUESTO_ALTO
      ? `<p class="calc-presupuesto ok">✅ Este gasto entra en tu presupuesto (${etiqueta}).</p>`
      : `<p class="calc-presupuesto">💡 Indicaste "${etiqueta}". Revisa que ${formatoCLP(mensual)} al mes sean cómodos para ti.</p>`;
  }
  return mensual <= perfil.presupuesto
    ? `<p class="calc-presupuesto ok">✅ Tu presupuesto (${etiqueta}) cubre este gasto.</p>`
    : `<p class="calc-presupuesto mal">⚠️ Te faltarían ${formatoCLP(mensual - perfil.presupuesto)} al mes respecto de tu presupuesto (${etiqueta}).</p>`;
}

function calcularCostos(interaccion = false) {
  const c = COSTOS[$("#calcEspecie").value][$("#calcTamano").value];
  const partes = [
    ["Alimento", c.alimento],
    ["Veterinario", c.veterinario],
    ["Higiene", c.higiene],
    ["Accesorios y juguetes", c.accesorios]
  ];
  const mensual = partes.reduce((suma, [, v]) => suma + v, 0);
  const anual = mensual * 12 + COSTO_ANUAL_VACUNAS;
  const diezAnios = anual * 10;
  const inicial = COSTOS_INICIALES.reduce((suma, [, v]) => suma + v, 0);
  const resumen = partes.map(([n, v]) => `${n} ${formatoCLP(v)}`).join(", ");
  const abierto = document.querySelector("#calcResultado details")?.open;  // conserva el desplegable

  $("#calcResultado").innerHTML = `
    <div class="costo-barra" role="img" aria-label="Distribución del gasto mensual: ${resumen}">
      ${partes.map(([n, v], i) =>
    `<div class="seg seg-${i + 1}" style="width:${(v / mensual) * 100}%" title="${n}: ${formatoCLP(v)}"></div>`).join("")}
    </div>
    ${partes.map(([n, v], i) => `
      <div class="calc-fila">
        <span><i class="punto-color seg-${i + 1}"></i>${n}</span>
        <span>${formatoCLP(v)} <small>(${Math.round((v / mensual) * 100)}%)</small></span>
      </div>`).join("")}
    <div class="calc-fila calc-total"><span>Total mensual</span><span>${formatoCLP(mensual)}</span></div>
    <div class="calc-fila calc-total"><span>Total anual (con vacunas)</span><span>${formatoCLP(anual)}</span></div>
    <div class="calc-fila calc-total"><span>En 10 años (aprox.)</span><span>${formatoCLP(diezAnios)}</span></div>
    ${mensajePresupuesto(mensual)}
    <details class="calc-iniciales" ${abierto ? "open" : ""}>
      <summary>🧰 Gastos iniciales (una sola vez): ${formatoCLP(inicial)}</summary>
      ${COSTOS_INICIALES.map(([n, v]) =>
      `<div class="calc-fila"><span>${n}</span><span>${formatoCLP(v)}</span></div>`).join("")}
    </details>
    <p class="nota">Valores referenciales en pesos chilenos, sin considerar inflación.</p>`;

  // Solo cuenta como "costo calculado" si la persona usó la calculadora
  if (interaccion) {
    guardarStorage("costoCalculado", true);
    actualizarRuta();
  }
}

// ---------- Checklist ----------
function iniciarChecklist() {
  const marcados = leerStorage("checklist", []);
  $("#listaCheck").innerHTML = CHECKLIST.map((item, i) => `
    <li>
      <label>
        <input type="checkbox" data-i="${i}" ${marcados.includes(i) ? "checked" : ""}>
        <span>${item.texto}<small class="check-porque">${item.porque}</small></span>
      </label>
    </li>`).join("");
  $("#listaCheck").addEventListener("change", () => {
    const actuales = [...document.querySelectorAll("#listaCheck input:checked")].map((c) => Number(c.dataset.i));
    guardarStorage("checklist", actuales);
    actualizarProgreso();
  });
  actualizarProgreso();
}

function actualizarProgreso() {
  const total = CHECKLIST.length;
  const hechos = document.querySelectorAll("#listaCheck input:checked").length;
  const faltan = total - hechos;
  const proporcion = hechos / total;
  const estado = hechos === total ? "listo" : proporcion >= 0.5 ? "casi" : "pensando";
  const titulos = {
    pensando: "🤔 Aún lo estás pensando",
    casi: "🙂 Casi listo",
    listo: "🎉 ¡Listo para adoptar!"
  };

  const barra = $("#barraProgreso");
  barra.style.width = proporcion * 100 + "%";
  barra.className = "barra-relleno estado-" + estado;

  $("#textoProgreso").innerHTML =
    `<strong>${titulos[estado]}</strong> · ${hechos} de ${total} puntos` +
    (faltan
      ? `<br><span class="nota-falta">${faltan === 1 ? "Te falta 1 punto" : `Te faltan ${faltan} puntos`}.
         Si aún no puedes cumplirlos, quizás conviene esperar: adoptar es un compromiso para siempre.</span>`
      : "");

  // Al completar todo, aparecen acciones para seguir avanzando
  $("#checkAcciones").innerHTML = faltan === 0 ? `
    <div class="check-listo">
      <p><strong>¡Diste el primer paso!</strong> Ahora puedes
        ${perfil ? "ver tus mascotas más compatibles" : "descubrir qué mascota va contigo"} o enviar tu solicitud.</p>
      <div class="check-botones">
        ${perfil
      ? `<a href="#mascotas" class="btn btn-secundario btn-chico">Ver mascotas compatibles contigo</a>`
      : `<a href="#match" class="btn btn-secundario btn-chico">Hacer el test Match</a>`}
        <button type="button" class="btn btn-primario btn-chico" data-solicitar>Solicitar adopción</button>
      </div>
    </div>` : "";

  actualizarRuta();
}

// ---------- Tu ruta hacia la adopción ----------
function actualizarRuta() {
  const caja = $("#rutaAdopcion");
  if (!caja) return;
  const checklistCompleto =
    leerStorage("checklist", []).filter((i) => i < CHECKLIST.length).length === CHECKLIST.length;
  const costoListo = leerStorage("costoCalculado", false);

  const pasos = [
    {
      ok: Boolean(perfil), nombre: "Test Match",
      texto: perfil ? "Perfil guardado." : "Aún no lo haces.",
      enlace: perfil ? "" : `<a href="#match">Hacer el test</a>`
    },
    {
      ok: costoListo, nombre: "Costo calculado",
      texto: costoListo ? "Ya revisaste cuánto cuesta." : "Prueba la calculadora.", enlace: ""
    },
    {
      ok: checklistCompleto, nombre: "Checklist completo",
      texto: checklistCompleto ? "Todo marcado." : "Marca los puntos que cumples.", enlace: ""
    }
  ];
  const listos = pasos.filter((p) => p.ok).length;

  caja.innerHTML = `
    <h3>🧭 Tu ruta hacia la adopción</h3>
    <ol class="ruta-pasos">
      ${pasos.map((p, i) => `
        <li class="${p.ok ? "ok" : ""}">
          <span class="ruta-icono" aria-hidden="true">${p.ok ? "✅" : i + 1}</span>
          <div><strong>${p.nombre}</strong><span>${p.texto} ${p.enlace}</span></div>
        </li>`).join("")}
    </ol>
    <div class="ruta-pie">
      <span>${listos} de ${pasos.length} pasos completados</span>
      <button type="button" class="btn btn-primario btn-chico" data-solicitar
        ${listos === pasos.length ? "" : "disabled"}>Solicitar adopción</button>
    </div>`;
}

// Cuando cambia el perfil, se refrescan la calculadora, el checklist y la ruta
function actualizarHerramientas() {
  calcularCostos();
  actualizarProgreso();
}

// Cualquier botón con data-solicitar abre el formulario (sin mascota preseleccionada)
function iniciarAccionesGlobales() {
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-solicitar]")) irAFormulario();
  });
}

// ============================================================
// PASAPORTE DE ADOPCIÓN (imagen PNG generada con <canvas>)
// ============================================================
function cargarImagen(src) {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}
function trazoRedondeado(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}
function fechaHoy() {
  return new Date().toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" });
}

function dibujarPasaporte(m, nombre, img, pct) {
  const c = document.createElement("canvas");
  c.width = 1000; c.height = 700;
  const g = c.getContext("2d");
  const FUENTE = "'Fredoka', 'Segoe UI', system-ui, sans-serif";
  const EMOJI = "'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif";

  // fondo
  const fondo = g.createLinearGradient(0, 0, 1000, 700);
  fondo.addColorStop(0, "#fff8f1"); fondo.addColorStop(1, "#fdeee0");
  g.fillStyle = fondo; g.fillRect(0, 0, 1000, 700);

  // banda superior
  g.fillStyle = "#f2622b"; g.fillRect(0, 0, 1000, 110);
  g.fillStyle = "#ffffff"; g.textBaseline = "middle";
  g.textAlign = "left"; g.font = `700 40px ${FUENTE}`; g.fillText("🐾 PetConnect", 40, 56);
  g.textAlign = "right"; g.font = `600 26px ${FUENTE}`; g.fillText("COMPROBANTE DE SOLICITUD", 960, 56);

  // marco
  g.strokeStyle = "#f2622b"; g.lineWidth = 6;
  trazoRedondeado(g, 12, 12, 976, 676, 28); g.stroke();

  // foto (o emoji) en círculo
  const cx = 200, cy = 285, r = 110;
  g.fillStyle = "#ffc857"; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill();
  if (img) {
    g.save();
    g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.clip();
    const escala = Math.max((2 * r) / img.width, (2 * r) / img.height);
    const w = img.width * escala, h = img.height * escala;
    g.drawImage(img, cx - w / 2, cy - h / 2, w, h);
    g.restore();
  } else {
    g.textAlign = "center"; g.fillStyle = "#2b2622";
    g.font = `120px ${EMOJI}`; g.fillText(m.emoji, cx, cy + 6);
  }
  g.strokeStyle = "#ffffff"; g.lineWidth = 8;
  g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.stroke();

  // compatibilidad
  if (pct !== null) {
    g.fillStyle = "#1f9d84"; trazoRedondeado(g, 65, 420, 270, 48, 24); g.fill();
    g.fillStyle = "#ffffff"; g.textAlign = "center"; g.font = `700 24px ${FUENTE}`;
    g.fillText(`🎯 ${pct}% compatible`, 200, 445);
  }

  // datos
  const X = 360;
  g.textAlign = "left";
  const etiqueta = (t, y) => { g.fillStyle = "#8a7f73"; g.font = `600 20px ${FUENTE}`; g.fillText(t, X, y); };
  etiqueta("MASCOTA", 165);
  g.fillStyle = "#2b2622"; g.font = `700 64px ${FUENTE}`; g.fillText(m.nombre, X, 225);
  g.fillStyle = "#6d645b"; g.font = `500 26px ${FUENTE}`;
  g.fillText(`${capitalizar(m.especie)} · ${capitalizar(m.edad)} · ${etiquetaTamano[m.tamano]}`, X, 272);
  etiqueta("ADOPTANTE", 330);
  let tam = 38;
  g.fillStyle = "#2b2622"; g.font = `700 ${tam}px ${FUENTE}`;
  while (g.measureText(nombre).width > 600 && tam > 20) { tam -= 2; g.font = `700 ${tam}px ${FUENTE}`; }
  g.fillText(nombre, X, 376);
  etiqueta("FECHA", 430);
  g.fillStyle = "#2b2622"; g.font = `500 26px ${FUENTE}`; g.fillText(fechaHoy(), X, 466);

  // compromiso
  g.strokeStyle = "#f0dfcf"; g.lineWidth = 3;
  g.beginPath(); g.moveTo(50, 505); g.lineTo(950, 505); g.stroke();
  g.fillStyle = "#f2622b"; g.font = `700 28px ${FUENTE}`; g.fillText("Mi compromiso", 50, 540);
  g.fillStyle = "#2b2622"; g.font = `500 22px ${FUENTE}`;
  [
    "• Le daré un hogar seguro, cariño y tiempo todos los días.",
    "• Cuidaré su salud: vacunas, control veterinario y esterilización.",
    "• Será parte de mi familia para siempre."
  ].forEach((t, i) => g.fillText(t, 50, 578 + i * 32));

  g.textAlign = "center"; g.fillStyle = "#8a7f73"; g.font = `500 16px ${FUENTE}`;
  g.fillText("PetConnect · Desafío Web 2026 · Documento simbólico de compromiso", 500, 672);
  return c;
}

async function generarPasaporte(m, nombre) {
  try {
    await Promise.all([document.fonts.load("700 40px Fredoka"), document.fonts.load("500 22px Fredoka")]);
  } catch (e) { /* si no hay fuentes, se usa la del sistema */ }
  const img = await cargarImagen(m.imagen);
  const pct = compatibilidadDe(m);
  let canvas = dibujarPasaporte(m, nombre, img, pct);
  try {
    canvas.toDataURL("image/png");               // si la foto "ensucia" el canvas (archivo local), falla aquí
  } catch (e) {
    canvas = dibujarPasaporte(m, nombre, null, pct);  // se redibuja con el emoji
  }
  return canvas;
}

function nombreArchivo(texto) {
  return texto.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// ---------- Formulario de adopción ----------
function llenarSelectMascotas() {
  $("#mascotaInteres").innerHTML =
    `<option value="">Selecciona una mascota</option>` +
    MASCOTAS.map((m) => `<option value="${m.id}">${m.emoji} ${m.nombre} (${m.especie})</option>`).join("");
}

function irAFormulario(idMascota) {
  const m = idMascota ? MASCOTAS.find((x) => x.id === idMascota) : null;
  if (idMascota && !m) return;
  $("#formAdopcion").reset();
  $("#formAdopcion").hidden = false;
  $("#confirmacion").hidden = true;
  $("#confirmacion").innerHTML = "";
  $("#contadorMensaje").textContent = "0 / 400";
  document.querySelectorAll("#formAdopcion .error").forEach((e) => (e.textContent = ""));
  document.querySelectorAll("#formAdopcion .invalido").forEach((e) => e.classList.remove("invalido"));
  $("#mascotaInteres").value = m ? String(idMascota) : "";
  $("#subtituloAdopcion").textContent = m
    ? `Estás postulando para adoptar a ${m.nombre}. Completa tus datos y te contactaremos.`
    : "Completa tus datos, elige la mascota que te interesa y te contactaremos.";
  $("#modalAdopcion").hidden = false;
  setTimeout(() => $("#nombre").focus(), 100);
}

function cerrarAdopcion() { $("#modalAdopcion").hidden = true; }
function iniciarModalAdopcion() {
  $("#modalAdopcionCerrar").addEventListener("click", cerrarAdopcion);
  $("#modalAdopcion").addEventListener("click", (e) => { if (e.target.id === "modalAdopcion") cerrarAdopcion(); });
}

function marcarError(idCampo, idError, mensaje) {
  $(idCampo).classList.toggle("invalido", Boolean(mensaje));
  $(idError).textContent = mensaje || "";
  return !mensaje;
}

function validarFormulario() {
  const nombre = $("#nombre").value.trim();
  const correo = $("#correo").value.trim();
  const mascota = $("#mascotaInteres").value;
  const mensaje = $("#mensaje").value.trim();
  const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  const resultados = [
    marcarError("#nombre", "#errNombre", nombre.length < 3 ? "Ingresa tu nombre (mínimo 3 caracteres)." : ""),
    marcarError("#correo", "#errCorreo", !regexCorreo.test(correo) ? "Ingresa un correo válido." : ""),
    marcarError("#mascotaInteres", "#errMascota", !mascota ? "Selecciona una mascota." : ""),
    marcarError("#mensaje", "#errMensaje", mensaje.length < 10 ? "Cuéntanos un poco más (mínimo 10 caracteres)." : "")
  ];
  return resultados.every(Boolean);
}

// Arma un mensaje usando el perfil del adoptante y la mascota elegida
function generarMensaje() {
  const m = MASCOTAS.find((x) => x.id === Number($("#mascotaInteres").value));
  if (!m) {
    marcarError("#mascotaInteres", "#errMascota", "Primero elige la mascota de interés.");
    $("#mascotaInteres").focus();
    return;
  }
  marcarError("#mascotaInteres", "#errMascota", "");
  const nombre = $("#nombre").value.trim();
  let t = `Hola${nombre ? ", soy " + nombre : ""}. Quiero adoptar a ${m.nombre}.`;
  if (perfil) {
    t += ` Mi hogar: ${etiquetaRespuesta("espacio", perfil.espacio).toLowerCase()}.`;
    t += ` Tiempo diario para ${m.nombre}: ${etiquetaRespuesta("tiempo", perfil.tiempo).toLowerCase()}.`;
    t += perfil.ninos === 1 ? " Hay niños en casa." : " No hay niños pequeños en casa.";
    t += ` Presupuesto mensual: ${etiquetaRespuesta("presupuesto", perfil.presupuesto).toLowerCase()}.`;
    t += ` En el test de PetConnect nuestra compatibilidad fue de ${calcularCompatibilidad(m, perfil)}%.`;
  }
  t += " Me comprometo a darle un hogar responsable, con vacunas, control veterinario y mucho cariño.";
  $("#mensaje").value = t.slice(0, 400);
  $("#mensaje").dispatchEvent(new Event("input"));   // actualiza el contador
  marcarError("#mensaje", "#errMensaje", "");
}

function iniciarFormulario() {
  llenarSelectMascotas();
  $("#mensaje").addEventListener("input", (e) => {
    $("#contadorMensaje").textContent = `${e.target.value.length} / 400`;
  });
  $("#btnGenerarMensaje").addEventListener("click", generarMensaje);

  $("#formAdopcion").addEventListener("submit", (e) => {
    e.preventDefault();
    if (!validarFormulario()) return;

    const m = MASCOTAS.find((x) => x.id === Number($("#mascotaInteres").value));
    const nombre = $("#nombre").value.trim();
    const correo = $("#correo").value.trim();
    const conf = $("#confirmacion");
    conf.hidden = false;
    conf.innerHTML = `<strong>¡Gracias, ${escapar(nombre)}! 🎉</strong><br>
      Recibimos tu solicitud de interés por <strong>${m.nombre}</strong>. Te escribiremos a
      <strong>${escapar(correo)}</strong> para conversar los siguientes pasos.
      <p class="nota"><strong>Importante:</strong> enviar este formulario no significa que la adopción esté aprobada. Cada solicitud se revisa y se coordina con el voluntariado. (Envío simulado)</p>
      <div class="pasaporte" id="pasaporteCaja"><p class="nota">Preparando tu comprobante…</p></div>`;
    $("#formAdopcion").hidden = true;
    $("#formAdopcion").reset();
    $("#contadorMensaje").textContent = "0 / 400";

    // Comprobante descargable
    generarPasaporte(m, nombre).then((canvas) => {
      const url = canvas.toDataURL("image/png");
      $("#pasaporteCaja").innerHTML = `
        <img src="${url}" alt="Comprobante de solicitud de ${m.nombre} a nombre de ${escapar(nombre)}">
        <a class="btn btn-primario btn-chico" href="${url}" download="comprobante-${nombreArchivo(m.nombre)}.png">⬇ Descargar mi comprobante</a>`;
    }).catch(() => { $("#pasaporteCaja").innerHTML = ""; });
  });
}

// ---------- Contadores animados de impacto ----------
function animarContador(el) {
  const meta = Number(el.dataset.meta);
  const duracion = 1200;
  const inicio = performance.now();
  function paso(ahora) {
    const prog = Math.min((ahora - inicio) / duracion, 1);
    el.textContent = Math.round(meta * prog);
    if (prog < 1) requestAnimationFrame(paso);
  }
  requestAnimationFrame(paso);
}
function iniciarContadores() {
  const elementos = document.querySelectorAll("[data-meta]");
  if (!("IntersectionObserver" in window)) { elementos.forEach((el) => (el.textContent = el.dataset.meta)); return; }
  const obs = new IntersectionObserver((entradas) => {
    entradas.forEach((en) => {
      if (en.isIntersecting) { animarContador(en.target); obs.unobserve(en.target); }
    });
  }, { threshold: 0.5 });
  elementos.forEach((el) => obs.observe(el));
}

// ---------- Animación de entrada al hacer scroll ----------
function iniciarReveal() {
  if (!("IntersectionObserver" in window)) return;
  const elementos = document.querySelectorAll(".paso, .beneficio, .impacto-item, .tarjeta");
  elementos.forEach((el) => el.classList.add("reveal"));
  const obs = new IntersectionObserver((entradas) => {
    entradas.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add("visible"); obs.unobserve(en.target); }
    });
  }, { threshold: 0.12 });
  elementos.forEach((el) => obs.observe(el));
}

// ---------- Sombra del header al hacer scroll ----------
function iniciarScrollHeader() {
  const header = $(".header");
  const actualizar = () => header.classList.toggle("scrolled", window.scrollY > 10);
  window.addEventListener("scroll", actualizar, { passive: true });
  actualizar();
}

// ---------- Navegación por vistas ----------
const VISTAS = ["inicio", "mascotas", "proceso", "match", "herramientas", "faq", "contacto"];

function mostrarVista() {
  let id = location.hash.slice(1);
  if (!VISTAS.includes(id)) id = "inicio";
  document.querySelectorAll(".vista").forEach((v) => (v.hidden = v.id !== id));
  document.querySelectorAll(".nav-links a[href^='#']:not(.chip-fav)").forEach((a) =>
    a.classList.toggle("activo", a.getAttribute("href") === "#" + id));
  window.scrollTo({ top: 0, behavior: "instant" });
}
function iniciarVistas() {
  window.addEventListener("hashchange", mostrarVista);
  mostrarVista();
}
// ---------- Slider de fotos del inicio ----------
function iniciarSlider() {
  const slides = document.querySelectorAll("#heroSlider .slide");
  if (slides.length < 2) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  let actual = 0;
  setInterval(() => {
    slides[actual].classList.remove("activa");
    actual = (actual + 1) % slides.length;
    slides[actual].classList.add("activa");
  }, 3500);
}

// ---------- Inicio ----------
document.addEventListener("DOMContentLoaded", () => {
  iniciarFallbackImagenes();
  iniciarScrollHeader();
  iniciarTema();
  iniciarMenu();
  iniciarVistas();
  iniciarCatalogo();
  iniciarModal();
  iniciarModalAdopcion();
  iniciarMitos();
  iniciarMatch();
  iniciarCalculadora();
  iniciarChecklist();
  iniciarFormulario();
  iniciarAccionesGlobales();
  iniciarContadores();
  iniciarReveal();
  iniciarSlider();
});
