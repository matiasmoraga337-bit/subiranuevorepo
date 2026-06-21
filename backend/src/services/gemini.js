import crypto from 'crypto'

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function generateContextHash(day, flags, food, water, health, morale) {
  const data = JSON.stringify({ day, flags, food, water, health, morale })
  return crypto.createHash('sha256').update(data).digest('hex')
}

export function buildGamePrompt(day, flags, food, water, health, morale, previousEvents, dayContext) {
  const flagSummary = Object.entries(flags || {})
    .filter(([, v]) => v)
    .map(([k]) => k)
    .join(', ') || 'ninguno'

  const stage = day <= 4 ? 'supervivencia temprana: el caos reina, hay saqueos, el jugador se está adaptando' :
    day <= 9 ? 'mitad del camino: los recursos escasean, la tensión crece, aparecen amenazas externas' :
    'recta final: el rescate se acerca, la desesperación y el agotamiento son extremos'

  return `
Eres el narrador de un juego de supervivencia post-apocalíptico llamado "15 Días".
El jugador está en el día ${day} de 15, esperando un rescate en helicóptero.
IMPORTANTE: El jugador está dentro de su CASA/REFUGIO la mayor parte del tiempo. Solo sale en ocasiones especiales.

CONTEXTO NARRATIVO: ${dayContext || `Día ${day} en el refugio. Etapa: ${stage}`}

Estado actual:
- Comida: ${food}/20
- Agua: ${water}/20  
- Salud: ${health}/100
- Moral: ${morale}/100
- Eventos previos hoy: ${previousEvents || 'ninguno'}
- Flags de historia: ${flagSummary}

Genera UN nuevo evento narrativo para este día. La historia DEBE transcurrir en el refugio/casa (location: "casa") a menos que el contexto indique explícitamente otra ubicación. El evento debe tener:
1. Un título corto y dramático (máximo 40 caracteres)
2. Una ubicación (casa, calle, supermercado, farmacia, refugio)
3. Una imagen: usa "casa_con_tablones" para eventos en casa, "superme" para supermercado, "FARMACIA1" para farmacia, "plaza" para calle, "antes_final" para días finales, "helicóptero_irse" para rescate
4. De 2 a 3 párrafos de narración inmersiva en español, COHERENTE con la imagen/ubicación elegida
5. Dos decisiones que el jugador puede tomar, cada una con:
   - Texto descriptivo de la acción (máximo 60 caracteres)
   - Efectos sobre los recursos (objeto con food, water, health, morale como números)
   - Texto de resultado (qué pasa si elige esa opción)

Responde SOLO con un objeto JSON válido, sin markdown ni texto adicional:
{
  "title": "...",
  "location": "casa",
  "image": "casa_con_tablones",
  "segments": [{"text": "..."}, {"text": "..."}],
  "decisions": [
    {
      "text": "...",
      "effects": {"food": 0, "water": 0, "health": 0, "morale": 0},
      "result": "..."
    }
  ]
}`
}

export { clamp, generateContextHash }
