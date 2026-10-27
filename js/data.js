// ============================================================
// DATOS DE PETCONNECT
// Toda la página se genera desde estos arreglos. Si mañana piden
// agregar una mascota, un campo o un filtro nuevo, se cambia AQUÍ.
// Escala usada en espacio / tiempo / energia: 1 = bajo, 2 = medio, 3 = alto
// ============================================================

const MASCOTAS = [
  {
    id: 1, nombre: "Luna", especie: "perro", edad: "2 años", tamano: "grande",
    caracteristicas: "Sociable y cariñosa",
    energia: 3, espacio: 2, tiempo: 2, ninos: true, costoMensual: 55000,
    emoji: "🐶", imagen: "img/Luna.jpeg",
    historia: "Hola, me llamo Luna. Soy muy sociable y cariñosa. Busco una familia que me quiera como parte de ella."
  },
  {
    id: 2, nombre: "Milo", especie: "gato", edad: "1 año", tamano: "mediano",
    caracteristicas: "Adaptado a vida de interior",
    energia: 2, espacio: 1, tiempo: 3, ninos: true, costoMensual: 44000,
    emoji: "🐱", imagen: "img/Milo.jpeg",
    historia: "Soy Milo, estoy adaptado a la vida interior, un departamento pequeño y una ventana con sol son todo lo que necesito."
  },
  {
    id: 3, nombre: "Simba", especie: "perro", edad: "4 años", tamano: "mediano",
    caracteristicas: "Tranquilo y obediente",
    energia: 1, espacio: 1, tiempo: 1, ninos: false, costoMensual: 30000,
    emoji: "🐕‍🦺", imagen: "img/Simba.jpeg",
    historia: "Soy Simba, tranquilo y obediente, me gusta salir a pasear."
  },
  {
    id: 4, nombre: "Nina", especie: "gato", edad: "3 años", tamano: "pequeno",
    caracteristicas: "Esterilizada y sociable",
    energia: 3, espacio: 1, tiempo: 2, ninos: true, costoMensual: 32000,
    emoji: "😺", imagen: "img/Nina.jpeg",
    historia: "Soy Nina, esterilizada y sociable. Me encanta la compañía y llevarme bien con todos."
  },
  {
    id: 5, nombre: "Rocky", especie: "perro", edad: "8 meses", tamano: "pequeno",
    caracteristicas: "Activo y juguetón",
    energia: 3, espacio: 1, tiempo: 2, ninos: true, costoMensual: 45000,
    emoji: "🐩", imagen: "img/Rocky.jpeg",
    historia: "Soy Rocky, un cachorro con un corazón enorme. Soy activo, juguetón y curioso: busco una familia con energía para jugar conmigo."
  },
  {
    id: 6, nombre: "Canela", especie: "gato", edad: "5 meses", tamano: "mediano",
    caracteristicas: "Juguetona y curiosa",
    energia: 3, espacio: 2, tiempo: 3, ninos: true, costoMensual: 50000,
    emoji: "😺", imagen: "img/Canela.jpeg",
    historia: "Soy Canela, una gatita juguetona y curiosa que está aprendiendo todo. Necesito una familia con tiempo para enseñarme."
  }
];

// Costos mensuales estimados en CLP (referenciales, ajustar mañana si el anexo trae datos)
const COSTOS = {
  perro: {
    pequeno: { alimento: 25000, veterinario: 10000, higiene: 8000, accesorios: 5000 },
    mediano: { alimento: 38000, veterinario: 12000, higiene: 10000, accesorios: 6000 },
    grande: { alimento: 55000, veterinario: 15000, higiene: 12000, accesorios: 8000 }
  },
  gato: {
    pequeno: { alimento: 18000, veterinario: 8000, higiene: 8000, accesorios: 3000 },
    mediano: { alimento: 22000, veterinario: 9000, higiene: 9000, accesorios: 4000 },
    grande: { alimento: 28000, veterinario: 10000, higiene: 10000, accesorios: 5000 }
  }
};
const COSTO_ANUAL_VACUNAS = 60000; // vacunas + desparasitación al año
// Hace que costoMensual de cada mascota coincida con la calculadora
MASCOTAS.forEach((m) => {
  const c = COSTOS[m.especie][m.tamano];
  m.costoMensual = c.alimento + c.veterinario + c.higiene + c.accesorios;
});

// Gastos que se pagan una sola vez al adoptar (valores referenciales en CLP: ajustar)
const COSTOS_INICIALES = [
  ["Esterilización", 60000],
  ["Microchip y registro", 25000],
  ["Chequeo veterinario inicial", 20000],
  ["Kit inicial (cama, transportador, collar y platos)", 35000]
];

// Preguntas del test de compatibilidad
const PREGUNTAS = [
  {
    clave: "espacio", texto: "¿Cuánto espacio tienes en casa?",
    opciones: [["Departamento pequeño", 1], ["Casa o departamento amplio", 2], ["Casa con patio", 3]]
  },
  {
    clave: "tiempo", texto: "¿Cuánto tiempo al día puedes dedicarle?",
    opciones: [["Poco (1-2 horas)", 1], ["Medio (3-4 horas)", 2], ["Mucho (5 horas o más)", 3]]
  },
  {
    clave: "energia", texto: "¿Qué nivel de energía prefieres en tu mascota?",
    opciones: [["Tranquila", 1], ["Moderada", 2], ["Muy activa", 3]]
  },
  {
    clave: "ninos", texto: "¿Hay niños pequeños en casa?",
    opciones: [["Sí", 1], ["No", 0]]
  },
  {
    clave: "presupuesto", texto: "¿Qué presupuesto mensual tienes para su cuidado?",
    opciones: [["Hasta $40.000", 40000], ["Hasta $60.000", 60000], ["Más de $60.000", 100000]]
  }
];

// Checklist de adopción responsable 
const CHECKLIST = [
  {
    texto: "Entiendo que una mascota es un compromiso de 10 a 15 años o más.",
    porque: "Muchos perros y gatos viven entre 10 y 20 años: adoptar es una decisión de largo plazo."
  },
  {
    texto: "Todas las personas de mi hogar están de acuerdo con adoptar.",
    porque: "Si alguien no está de acuerdo, aumentan los conflictos y el riesgo de devolución o abandono."
  },
  {
    texto: "Tengo tiempo diario para paseos, juego y compañía.",
    porque: "Pasear, jugar y acompañar todos los días es parte esencial de su bienestar."
  },
  {
    texto: "Puedo cubrir alimento, vacunas y gastos veterinarios.",
    porque: "Los gastos son mensuales y además pueden aparecer imprevistos de salud."
  },
  {
    texto: "Mi vivienda permite mascotas y tiene espacio adecuado.",
    porque: "Si el contrato o el reglamento no lo permite, podrías verte obligado/a a entregarla."
  },
  {
    texto: "Estoy dispuesto/a a esterilizar y mantener sus vacunas al día.",
    porque: "Evita camadas no planificadas, que alimentan el abandono, y previene problemas de salud."
  },
  {
    texto: "Tengo un plan para cuidarla cuando viaje o me enferme.",
    porque: "Alguien de confianza debe poder cuidarla cuando tú no puedas."
  }
];

// Mitos y verdades sobre la adopción (esVerdad: true = la afirmación es verdadera)
const MITOS = [
  {
    texto: "Los gatos adultos no se encariñan con su nueva familia.", esVerdad: false,
    explicacion: "Los gatos adultos se adaptan muy bien y suelen ser muy cariñosos; solo necesitan tiempo y paciencia."
  },
  {
    texto: "Un perro adulto ya no puede aprender cosas nuevas.", esVerdad: false,
    explicacion: "Los perros pueden aprender a cualquier edad. Con constancia y refuerzo positivo aprenden normas y trucos nuevos."
  },
  {
    texto: "Esterilizar ayuda a reducir la sobrepoblación y el abandono de mascotas.", esVerdad: true,
    explicacion: "Menos camadas no planificadas significa menos animales en la calle y en refugios, además de beneficios para su salud."
  },
  {
    texto: "Las mascotas de refugio siempre tienen problemas de salud o de conducta.", esVerdad: false,
    explicacion: "Muchas llegan a refugios por situaciones de sus antiguos dueños, no por su comportamiento. Es clave conocer su historia y control veterinario."
  },
  {
    texto: "Un perro pequeño no necesita salir a pasear.", esVerdad: false,
    explicacion: "Todos los perros necesitan ejercicio, estimulación y salidas, sin importar su tamaño."
  },
  {
    texto: "Adoptar una mascota puede ser un compromiso de más de 10 años.", esVerdad: true,
    explicacion: "Muchos perros y gatos viven entre 10 y 20 años, por eso la decisión debe pensarse a largo plazo."
  }
];