// Vocabulario: [inglés, español, otras respuestas en inglés, otras respuestas en español]
// " / " (con espacios) separa sinónimos: vale poner uno o los dos. "o/a", "e/a" o "r/a" pegado a una
// palabra = masculino/femenino. "group" (opcional) agrupa los temas en las casillas; sin él van a "De clase".
const FAMILIAS = '📘 Familias de vocabulario (PDF)';
const VOCAB = {
  skills: {
    name: 'Soft skills',
    words: [
      ['Communicative skills', 'Habilidades comunicativas', ['communication skills'], ['habilidades de comunicación', 'competencias comunicativas', 'capacidad de comunicación']],
      ['Teamwork', 'Trabajo en equipo', ['team work'], []],
      ['Working under pressure', 'Trabajar bajo presión', ['work under pressure'], ['trabajo bajo presión']],
      ['Take initiative', 'Tomar la iniciativa', ['take the initiative', 'taking initiative'], ['tomar iniciativa', 'tener iniciativa']],
      ['Enthusiastic', 'Entusiasta', [], []],
      ['Motivated', 'Motivado/a', [], []],
      ['Dedicated', 'Dedicado/a', [], ['entregado/a']],
      ['Energetic', 'Enérgico/a', [], []],
      ['Flexible', 'Flexible', [], []],
      ['Responsible', 'Responsable', [], []],
      ['Committed', 'Comprometido/a', [], []],
      ['Passionate', 'Apasionado/a', [], []],
      ['Consistent / Hard-working', 'Constante / Trabajador/a', ['hardworking'], ['consistente', 'perseverante']],
      ['Resourceful', 'Resolutivo/a', [], ['ingenioso/a', 'con recursos']],
      ['Polite', 'Educado/a', [], ['cortés']],
      ['Generous', 'Generoso/a', [], []],
      ['Empathetic', 'Empático/a', ['empathic'], []],
      ['Intelligent', 'Inteligente', [], []],
      ['Focused', 'Centrado/a', [], ['concentrado/a', 'enfocado/a']],
      ['Careful', 'Cuidadoso/a', [], ['prudente']],
      ['Digital competence', 'Competencia digital', ['digital skills'], ['competencias digitales']],
      ['Optimistic', 'Optimista', [], []],
      ['Respectful', 'Respetuoso/a', [], []],
      ['Calm / Serene', 'Tranquilo/a / Sereno/a', [], ['calmado/a']],
    ],
  },
  film: {
    name: 'Audiovisual',
    words: [
      ['Audiovisual production', 'Producción audiovisual', [], ['Productora audiovisual']],
      ['Film production', 'Producción cinematográfica', [], ['producción de cine']],
      ['Film slesh movie', 'Cortometraje', ['short film', 'film', 'movie', 'film slash movie'], ['película', 'cine']],
      ['Tv programme', 'Programa de televisión', [], []],
      ['Series', 'Serie', [], []],
      ['Live Broadcast', 'Transmision en vivo', [], ['directo', 'transmisión en vivo', 'emisión en directo']],
      ['Production Team', 'Equipo de producción', [], []],
      ['Live Producer', 'Producción en directo', [], []],
      ['Production designer', 'Diseñadores de producción', [], ['diseñador/a de producción', 'director/a de arte']],
      ['Focus puller', 'Foquista', [], []],
      ['Gaffer', 'Jefe de electricos', [], ['jefe de eléctricos', 'jefe/a de eléctricos']],
      ['Sound mixer', 'Mezclador de sonido', [], ['técnico/a de sonido directo', 'técnico/a de sonido', 'mezclador/a']],
      ['Boom operator', 'Operador de pertiga', [], ['operador de pértiga', 'técnico/a de pértiga']],
      ['Location manager', 'Manager de localización', [], ['Jefe de localización', 'responsable de localizaciones']],
      ['Costume designer', 'Diseñador de vestuario', [], ['diseñador/a de vestuario']],
      ['Set designer', 'Escenógrafo', [], ['escenógrafo/a']],
      ['Project management', 'Gestión de proyectos', [], []],
      ['Production schedule', 'Calendario de producción', [], []],
      ['Screenplay', 'Guión cinematográfico', [], ['guion cinematográfico']],
      ['Script', 'Guión', [], ['guion']],
      ['Plot', 'Argumento', [], ['trama']],
      ['Storyline', 'Linea argumental', [], ['línea argumental']],
      ['Treatment', 'Tratamiento', [], []],
      ['Sypnosis', 'Sinopsis', ['synopsis'], []],
      ['Scene', 'Escena', [], []],
      ['Sequence', 'Secuencia', [], []],
      ['Take', 'Toma', [], []],
      ['Footage', 'Material grabado', [], []],
      ['Rushes', 'Brutos', [], []],
      ['close up', 'Primer plano', [], []],
      ['Camera framing', 'Encuadre', [], []],
      ['Shutter speed', 'Velocidad de obturación', [], []],
      ['Voice-over', 'Voz en off', [], []],
      ['Rehearsal', 'Ensayo', ['rehearsal'], []],
      ['Venue', 'Recinto', ['venue'], ['lugar del evento']],
      ['Stage manager', 'Regidor', [], ['regidora']],
      ['Budget', 'Presupuesto', [], []],
      ['Deadline', 'Fecha limite', [], ['fecha límite']],
      ['Personal protective equipment (PPE)', 'Equipo de producción audiovisual (EPI)', ['personal protective equipment', 'PPE'], ['equipo de protección individual (EPI)', 'equipo de protección individual', 'equipo de producción audiovisual', 'EPI']],
      
    ],
  },
  f01: {
    name: '1 · Sector audiovisual y producción',
    group: FAMILIAS,
    words: [
      ['audiovisual', 'audiovisual', [], []],
      ['television production', 'producción televisiva', [], []],
      ['feature film', 'largometraje', [], []],
      ['documentary', 'documental', [], []],
      ['TV show', 'programa televisivo / espectáculo televisivo', [], []],
      ['episode', 'episodio', [], []],
      ['broadcast', 'emisión / retransmisión', [], []],
      ['streaming', 'streaming / retransmisión en línea', [], []],
      ['production company', 'productora', [], []],
    ],
  },
  f02: {
    name: '2 · Profesionales y departamentos',
    group: FAMILIAS,
    words: [
      ['production manager', 'jefe/a de producción', [], []],
      ['executive producer', 'productor/a ejecutivo/a', [], []],
      ['producer', 'productor/a', [], []],
      ['line producer', 'director/a de producción', [], []],
      ['production coordinator', 'coordinador/a de producción', [], []],
      ['production assistant', 'ayudante de producción', [], []],
      ['director', 'director/a', [], []],
      ['assistant director', 'ayudante de dirección', [], []],
      ['first assistant director (1st AD)', 'primer/a ayudante de dirección', ['first assistant director', '1st AD'], []],
      ['second assistant director (2nd AD)', 'segundo/a ayudante de dirección', ['second assistant director', '2nd AD'], []],
      ['director of photography (DoP)', 'director/a de fotografía', ['director of photography', 'DoP'], []],
      ['cinematographer', 'director/a de fotografía', [], []],
      ['camera operator', 'operador/a de cámara', [], []],
      ['camera assistant', 'ayudante de cámara', [], []],
      ['grip', 'técnico/a de grip', [], []],
      ['script supervisor', 'supervisor/a de continuidad', [], []],
      ['casting director', 'director/a de casting', [], []],
      ['make-up artist', 'maquillador/a', ['makeup artist'], []],
      ['hair stylist', 'peluquero/a', [], []],
      ['art director', 'director/a de arte', [], []],
      ['editor', 'editor/a', [], []],
      ['film editor', 'montador/a cinematográfico/a', [], []],
      ['sound editor', 'editor/a de sonido', [], []],
      ['post-production supervisor', 'supervisor/a de postproducción', ['postproduction supervisor'], []],
    ],
  },
  f03: {
    name: '3 · Fases de producción',
    group: FAMILIAS,
    words: [
      ['development', 'desarrollo', [], []],
      ['pre-production', 'preproducción', ['preproduction'], []],
      ['production', 'producción', [], []],
      ['post-production', 'postproducción', ['postproduction'], []],
      ['distribution', 'distribución', [], []],
      ['workflow', 'flujo de trabajo', [], []],
      ['digital workflow', 'flujo de trabajo digital', [], []],
      ['production planning', 'planificación de producción', [], []],
      ['production plan', 'plan de producción', [], []],
    ],
  },
  f04: {
    name: '4 · Guion y narrativa',
    group: FAMILIAS,
    words: [
      ['screenwriter', 'guionista', [], []],
      ['writer', 'escritor/a / guionista', [], []],
      ['story', 'historia', [], []],
      ['storyboard', 'storyboard / guion gráfico', [], ['guión gráfico']],
      ['script breakdown', 'desglose de guion', [], ['desglose de guión']],
      ['shot breakdown', 'desglose de planos', [], []],
      ['shot list', 'lista de planos', [], []],
    ],
  },
  f05: {
    name: '5 · Planos y lenguaje cinematográfico',
    group: FAMILIAS,
    words: [
      ['shot', 'plano / toma', [], []],
      ['frame', 'fotograma', [], []],
      ['raw footage', 'material bruto', [], []],
      ['master shot', 'plano máster', [], []],
      ['establishing shot', 'plano de establecimiento', [], []],
      ['wide shot', 'plano general', [], []],
      ['long shot', 'plano general', [], []],
      ['medium shot', 'plano medio', [], []],
      ['medium close-up', 'plano medio corto', [], []],
      ['extreme close-up', 'primerísimo primer plano', [], []],
      ['two-shot', 'plano de dos personajes', [], []],
      ['over-the-shoulder shot', 'plano sobre el hombro', [], []],
      ['point-of-view shot (POV)', 'plano subjetivo', ['point-of-view shot', 'POV'], []],
      ['cutaway', 'plano recurso', [], []],
      ['insert shot', 'plano detalle', [], []],
    ],
  },
  f06: {
    name: '6 · Cámara y composición',
    group: FAMILIAS,
    words: [
      ['camera angle', 'ángulo de cámara', [], []],
      ['high-angle shot', 'plano picado', [], []],
      ['low-angle shot', 'plano contrapicado', [], []],
      ['eye-level shot', 'plano a la altura de los ojos', [], []],
      ['bird\'s-eye view', 'vista cenital / plano cenital', [], []],
      ['camera movement', 'movimiento de cámara', [], []],
      ['pan', 'panorámica horizontal', [], []],
      ['tilt', 'panorámica vertical', [], []],
      ['tracking shot', 'travelling', [], []],
      ['dolly shot', 'movimiento de travelling', [], []],
      ['crane shot', 'movimiento de grúa', [], []],
      ['handheld shot', 'plano con cámara en mano', ['hand-held shot'], []],
      ['steadicam shot', 'plano con Steadicam', [], []],
      ['composition', 'composición', [], []],
      ['rule of thirds', 'regla de los tercios', [], []],
    ],
  },
  f07: {
    name: '7 · Técnica de cámara',
    group: FAMILIAS,
    words: [
      ['depth of field', 'profundidad de campo', [], []],
      ['focus', 'enfoque', [], []],
      ['sharpness', 'nitidez', [], []],
      ['rack focus', 'cambio de foco', [], []],
      ['exposure', 'exposición', [], []],
      ['aperture', 'apertura / diafragma', [], []],
      ['ISO', 'ISO / sensibilidad', [], []],
      ['white balance', 'balance de blancos', [], []],
      ['colour temperature', 'temperatura de color', ['color temperature'], []],
      ['lens', 'objetivo', [], []],
      ['wide-angle lens', 'objetivo gran angular', [], []],
      ['telephoto lens', 'teleobjetivo', [], []],
      ['zoom lens', 'objetivo zoom', [], []],
      ['prime lens', 'objetivo de focal fija', [], []],
      ['camera body', 'cuerpo de cámara', [], []],
      ['camera rig', 'configuración de cámara / soporte de cámara', [], []],
      ['tripod', 'trípode', [], []],
      ['monopod', 'monopié', [], []],
      ['gimbal', 'estabilizador / gimbal', [], []],
      ['dolly', 'travelling / plataforma móvil', [], []],
      ['crane', 'grúa', [], []],
      ['slider', 'slider / deslizadera', [], []],
    ],
  },
  f08: {
    name: '8 · Iluminación cinematográfica',
    group: FAMILIAS,
    words: [
      ['lighting', 'iluminación', [], []],
      ['lighting design', 'diseño de iluminación', [], []],
      ['lighting technician', 'técnico/a de iluminación', [], []],
      ['key light', 'luz principal', [], []],
      ['fill light', 'luz de relleno', [], []],
      ['backlight', 'contraluz', ['back light'], []],
      ['three-point lighting', 'iluminación de tres puntos', [], []],
      ['soft light', 'luz suave', [], []],
      ['hard light', 'luz dura', [], []],
      ['natural light', 'luz natural', [], []],
      ['practical light', 'luz práctica', [], []],
      ['spotlight', 'foco / proyector', [], []],
      ['floodlight', 'foco de iluminación general', [], []],
      ['LED panel', 'panel LED', [], []],
      ['lighting fixture', 'aparato de iluminación', [], []],
      ['dimmer', 'regulador de intensidad', [], []],
      ['light stand', 'pie de iluminación', [], []],
      ['reflector', 'reflector', [], []],
      ['diffuser', 'difusor', [], []],
      ['flag', 'bandera / pantalla de control de luz', [], []],
      ['colour filter', 'filtro de color', ['color filter'], []],
      ['lighting rig', 'estructura de iluminación', [], []],
    ],
  },
  f09: {
    name: '9 · Sonido en producción',
    group: FAMILIAS,
    words: [
      ['sound recording', 'grabación de sonido', [], []],
      ['production sound', 'sonido de producción', [], []],
      ['location sound', 'sonido en localización', [], []],
      ['dialogue', 'diálogo', ['dialog'], []],
      ['narration', 'narración', [], []],
      ['ambient sound', 'sonido ambiente', [], []],
      ['room tone', 'tono de sala', [], []],
      ['background noise', 'ruido de fondo', [], []],
      ['sound effect', 'efecto de sonido', [], []],
      ['sound effects', 'efectos de sonido', [], []],
      ['Foley', 'efectos Foley', [], []],
      ['soundtrack', 'banda sonora', [], []],
      ['score', 'música original / banda sonora', [], []],
    ],
  },
  f10: {
    name: '10 · Microfonía y grabación',
    group: FAMILIAS,
    words: [
      ['microphone', 'micrófono', [], []],
      ['boom microphone', 'micrófono de pértiga', [], []],
      ['shotgun microphone', 'micrófono de cañón', [], []],
      ['lavalier microphone', 'micrófono de solapa', [], []],
      ['wireless microphone', 'micrófono inalámbrico', [], []],
      ['boom pole', 'pértiga de micrófono', [], []],
      ['headphones', 'auriculares', [], []],
      ['audio recorder', 'grabadora de audio', [], []],
      ['mixer', 'mesa de mezclas', [], []],
      ['audio level', 'nivel de audio', [], []],
      ['gain', 'ganancia', [], []],
      ['volume', 'volumen', [], []],
      ['peak', 'pico de señal', [], []],
      ['clipping', 'saturación', [], []],
      ['distortion', 'distorsión', [], []],
    ],
  },
  f11: {
    name: '11 · Postproducción y montaje',
    group: FAMILIAS,
    words: [
      ['editing', 'edición / montaje', [], []],
      ['video editing', 'edición de vídeo', [], []],
      ['non-linear editing (NLE)', 'edición no lineal', ['non-linear editing', 'NLE', 'nonlinear editing'], []],
      ['editing software', 'software de edición', [], []],
      ['editing suite', 'sala de edición / estación de edición', [], []],
      ['timeline', 'línea de tiempo', [], []],
      ['clip', 'clip / fragmento', [], []],
      ['cut', 'corte', [], []],
      ['jump cut', 'salto de montaje', [], []],
      ['match cut', 'corte por correspondencia', [], []],
      ['continuity editing', 'montaje de continuidad', [], []],
      ['cross-cutting', 'montaje paralelo', ['crosscutting'], []],
      ['montage', 'montaje', [], []],
      ['transition', 'transición', [], []],
      ['dissolve', 'fundido encadenado', [], []],
      ['fade-in', 'fundido de entrada', [], []],
      ['fade-out', 'fundido de salida', [], []],
      ['rough cut', 'primer montaje', [], []],
      ['fine cut', 'montaje afinado', [], []],
      ['final cut', 'montaje definitivo', [], []],
    ],
  },
  f12: {
    name: '12 · Color, VFX y gráficos',
    group: FAMILIAS,
    words: [
      ['colour grading', 'etalonaje / corrección creativa de color', ['color grading'], []],
      ['colour correction', 'corrección de color', ['color correction'], []],
      ['visual effects (VFX)', 'efectos visuales', ['visual effects', 'VFX'], []],
      ['special effects (SFX)', 'efectos especiales', ['special effects', 'SFX'], []],
      ['compositing', 'composición / integración de imágenes', [], []],
      ['green screen', 'pantalla verde', [], []],
      ['chroma key', 'incrustación por croma', [], []],
      ['motion graphics', 'gráficos en movimiento', [], []],
      ['title sequence', 'secuencia de títulos', [], []],
      ['credits', 'créditos', [], []],
      ['opening credits', 'créditos iniciales', [], []],
      ['closing credits', 'créditos finales', [], []],
      ['rendering', 'renderizado', [], []],
    ],
  },
  f13: {
    name: '13 · Formatos y gestión de archivos',
    group: FAMILIAS,
    words: [
      ['export', 'exportación', [], []],
      ['media file', 'archivo multimedia', [], []],
      ['file format', 'formato de archivo', [], []],
      ['resolution', 'resolución', [], []],
      ['aspect ratio', 'relación de aspecto', [], []],
      ['frame rate', 'frecuencia de imagen', [], []],
      ['bit rate', 'tasa de bits', [], []],
      ['codec', 'códec', [], []],
      ['compression', 'compresión', [], []],
      ['digital cinema', 'cine digital', [], []],
      ['data management', 'gestión de datos', [], []],
      ['backup', 'copia de seguridad', ['back-up'], []],
      ['media storage', 'almacenamiento de medios', [], []],
      ['hard drive', 'disco duro', [], []],
      ['solid-state drive (SSD)', 'unidad de estado sólido', ['solid-state drive', 'SSD'], []],
      ['memory card', 'tarjeta de memoria', [], []],
      ['data transfer', 'transferencia de datos', [], []],
      ['file management', 'gestión de archivos', [], []],
    ],
  },
  f14: {
    name: '14 · Rodaje y localizaciones',
    group: FAMILIAS,
    words: [
      ['location', 'localización', [], []],
      ['filming location', 'localización de rodaje', [], []],
      ['location scouting', 'búsqueda de localizaciones', [], []],
      ['location scout', 'responsable de localizaciones', [], []],
      ['set', 'plató / escenario / set', [], []],
      ['film set', 'plató / lugar de rodaje', [], []],
      ['studio set', 'decorado de estudio', [], []],
      ['shooting schedule', 'plan de rodaje', [], []],
      ['call sheet', 'hoja de convocatoria', [], []],
      ['shooting day', 'jornada de rodaje', [], []],
      ['call time', 'hora de convocatoria', [], []],
      ['wrap', 'fin del rodaje', [], []],
      ['shooting', 'rodaje / grabación', [], []],
      ['retake', 'repetición de una toma', [], []],
    ],
  },
  f15: {
    name: '15 · Lenguaje de plató',
    group: FAMILIAS,
    words: [
      ['action!', '¡acción!', [], []],
      ['cut!', '¡corten!', [], []],
      ['rolling', 'grabando', [], []],
      ['stand by', 'preparados / en espera', ['standby'], []],
      ['quiet on set', 'silencio en el plató', [], []],
      ['ready to shoot', 'listo para rodar', [], []],
      ['on set', 'en el plató / en el rodaje', [], []],
      ['off set', 'fuera del plató', [], []],
      ['behind the scenes (BTS)', 'detrás de las cámaras', ['behind the scenes', 'BTS'], []],
      ['rehearsal room', 'sala de ensayo', [], []],
      ['dressing room', 'camerino', [], []],
      ['green room', 'sala de espera de artistas', [], []],
    ],
  },
  f16: {
    name: '16 · Espectáculos y realización en directo',
    group: FAMILIAS,
    words: [
      ['stage', 'escenario', [], []],
      ['backstage', 'bastidores / entre bastidores', [], []],
      ['live event', 'evento en directo', [], []],
      ['live performance', 'actuación en directo', [], []],
      ['show', 'espectáculo', [], []],
      ['stage crew', 'equipo técnico de escenario', [], []],
      ['technical crew', 'equipo técnico', [], []],
      ['crew member', 'miembro del equipo', [], []],
      ['technical director', 'director/a técnico/a', [], []],
      ['floor manager', 'regidor/a de plató', [], []],
      ['floor assistant', 'auxiliar de plató', [], []],
      ['teleprompter', 'teleprompter / autocue', [], []],
      ['autocue', 'teleprompter', [], []],
      ['presenter', 'presentador/a', [], []],
      ['host', 'presentador/a / conductor/a', [], []],
      ['guest', 'invitado/a', [], []],
      ['audience', 'público', [], []],
      ['cue', 'señal / indicación', [], []],
      ['cue sheet', 'hoja de señales', [], []],
      ['running order', 'orden de emisión / escaleta', [], []],
      ['rundown', 'escaleta', [], []],
    ],
  },
  f17: {
    name: '17 · Escenografía, vestuario y casting',
    group: FAMILIAS,
    words: [
      ['floor plan', 'plano de planta', [], []],
      ['stage plan', 'plano de escenario', [], []],
      ['technical rider', 'ficha técnica', [], []],
      ['equipment list', 'lista de equipos', [], []],
      ['equipment', 'equipamiento', [], []],
      ['props', 'atrezzo / utilería', [], ['atrezo']],
      ['prop', 'elemento de atrezzo', [], ['elemento de atrezo']],
      ['set design', 'diseño de decorado', [], []],
      ['scenery', 'escenografía / decorado', [], []],
      ['costume', 'vestuario', [], []],
      ['wardrobe', 'vestuario', [], []],
      ['make-up', 'maquillaje', ['makeup'], []],
      ['special make-up effects', 'efectos especiales de maquillaje', ['special makeup effects'], []],
      ['casting', 'selección de actores / casting', [], []],
      ['audition', 'audición / prueba', [], []],
      ['actor', 'actor / actriz', [], []],
      ['actress', 'actriz', [], []],
      ['extra', 'figurante', [], []],
      ['cast', 'reparto', [], []],
      ['talent', 'artista / talento', [], []],
    ],
  },
  f18: {
    name: '18 · Derechos y aspectos legales',
    group: FAMILIAS,
    words: [
      ['location release', 'autorización de localización', [], []],
      ['release form', 'autorización / cesión de derechos', [], []],
      ['copyright', 'derechos de autor', [], []],
      ['intellectual property', 'propiedad intelectual', [], []],
      ['licensing', 'concesión de licencias', [], []],
      ['rights', 'derechos', [], []],
      ['image rights', 'derechos de imagen', [], []],
      ['music rights', 'derechos musicales', [], []],
      ['clearance', 'autorización de derechos', [], []],
    ],
  },
  f19: {
    name: '19 · Producción y gestión económica',
    group: FAMILIAS,
    words: [
      ['production budget', 'presupuesto de producción', [], []],
      ['cost', 'coste', [], []],
      ['expense', 'gasto', [], []],
      ['invoice', 'factura', [], []],
      ['quotation', 'presupuesto / cotización', [], []],
      ['contract', 'contrato', [], []],
      ['schedule', 'calendario / horario', [], []],
      ['meeting', 'reunión', [], []],
      ['briefing', 'sesión informativa', [], []],
      ['production meeting', 'reunión de producción', [], []],
      ['client', 'cliente', [], []],
      ['stakeholder', 'parte interesada', [], []],
      ['project', 'proyecto', [], []],
    ],
  },
  f20: {
    name: '20 · Empleabilidad y competencias profesionales',
    group: FAMILIAS,
    words: [
      ['problem-solving', 'resolución de problemas', [], []],
      ['deadline-driven', 'orientado/a al cumplimiento de plazos', [], []],
      ['workload', 'carga de trabajo', [], []],
      ['shift', 'turno', [], []],
      ['working hours', 'horario laboral', [], []],
      ['freelance', 'autónomo/a / freelance', [], []],
      ['portfolio', 'portfolio / portafolio', [], []],
      ['CV / résumé', 'currículum', [], ['currículo', 'currículum vitae', 'CV']],
      ['job interview', 'entrevista de trabajo', [], []],
      ['job application', 'solicitud de empleo', [], []],
      ['work experience', 'experiencia laboral', [], []],
      ['professional skills', 'competencias profesionales', [], []],
      ['technical skills', 'competencias técnicas', [], []],
      ['creative skills', 'habilidades creativas', [], []],
    ],
  },
  f21: {
    name: '21 · Seguridad en producción',
    group: FAMILIAS,
    words: [
      ['health and safety', 'seguridad y salud', [], []],
      ['risk assessment', 'evaluación de riesgos', [], []],
      ['safety equipment', 'equipo de seguridad', [], []],
      ['emergency exit', 'salida de emergencia', [], []],
      ['fire extinguisher', 'extintor', [], []],
      ['first aid', 'primeros auxilios', [], []],
      ['hazard', 'peligro / riesgo', [], []],
      ['accident', 'accidente', [], []],
      ['emergency', 'emergencia', [], []],
      ['electrical safety', 'seguridad eléctrica', [], []],
      ['cable management', 'gestión del cableado', [], []],
      ['trip hazard', 'riesgo de tropiezo', [], []],
      ['heavy equipment', 'equipo pesado', [], []],
    ],
  },
};

const ARTICLES = new Set(['the', 'a', 'an', 'el', 'la', 'los', 'las', 'un', 'una']);

// minúsculas, sin signos, guiones = espacio, sin artículo inicial ("la trama" = "trama")
function norm(s) {
  const parts = String(s || '').normalize('NFC').toLowerCase()
    .replace(/[‐-―_-]+/g, ' ')
    .replace(/[.,;:!?¿¡'"’‘“”()]/g, '')
    .replace(/\s+/g, ' ').trim().split(' ');
  if (parts.length > 1 && ARTICLES.has(parts[0])) parts.shift();
  return parts.join(' ');
}

const baseChar = ch => ch.normalize('NFD').replace(/[̀-ͯ]/g, '');
const stripAccents = s => Array.from(s, baseChar).join('');

// 0 = mal, 1 = perfecto, 2 = bien pero le falta alguna tilde.
// Una tilde que sobra o está mal puesta cuenta como fallo.
function compareAnswer(input, answer) {
  const A = Array.from(norm(input)), B = Array.from(norm(answer));
  if (!A.length || A.length !== B.length) return 0;
  let missing = false;
  for (let i = 0; i < A.length; i++) {
    if (A[i] === B[i]) continue;
    if (baseChar(A[i]) !== baseChar(B[i]) || A[i] !== baseChar(A[i])) return 0;
    missing = true;
  }
  return missing ? 2 : 1;
}

function checkAnswer(input, accepted) {
  let best = 0;
  for (const a of accepted) {
    const r = compareAnswer(input, a);
    if (r === 1) return 1;
    if (r === 2) best = 2;
  }
  return best;
}

function genderForms(tok) {
  let m;
  if ((m = tok.match(/^(.+)([oe])\/a$/))) return [m[1] + m[2], m[1] + 'a'];
  if ((m = tok.match(/^(.+)\/a$/))) return [m[1], m[1] + 'a'];
  return [tok];
}

// "Tranquilo/a / Sereno/a" -> ["tranquilo", "tranquila", "sereno", "serena"]
function expandForms(labels) {
  const out = new Set();
  for (const label of labels) {
    for (const syn of label.split(' / ')) {
      let combos = [''];
      for (const tok of syn.trim().split(/\s+/)) {
        const forms = genderForms(tok);
        combos = combos.flatMap(c => forms.map(f => (c ? c + ' ' : '') + f));
      }
      combos.forEach(c => out.add(norm(c)));
    }
  }
  return [...out];
}

const WORDS = [];
for (const [cat, group] of Object.entries(VOCAB)) {
  for (const [en, es, enX, esX] of group.words) {
    WORDS.push({
      cat,
      en: { label: en, extra: enX, forms: expandForms([en, ...enX]) },
      es: { label: es, extra: esX, forms: expandForms([es, ...esX]) },
    });
  }
}

function countWords(set) {
  return set === 'all' ? WORDS.length : WORDS.filter(w => w.cat === set).length;
}

// Grupos de temas para las casillas, en el orden de este archivo
const DEFAULT_GROUP = '📸 Vocabulario de clase';
const groupOf = k => VOCAB[k].group || DEFAULT_GROUP;
const GROUPS = [...new Set(Object.keys(VOCAB).map(groupOf))];

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Cuántas letras hay que cambiar, quitar o poner para pasar de a a b
function levenshtein(a, b) {
  const row = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return row[b.length];
}

// La tarjeta de una palabra en un sentido. Si la palabra en pantalla también es traducción de otra
// (p. ej. "Guion" = screenplay / script), se aceptan las respuestas de todas.
function cardFor(w, from) {
  const to = from === 'en' ? 'es' : 'en';
  const shown = new Set(expandForms([w[from].label]).map(stripAccents));
  const matches = WORDS.filter(o => o[from].forms.some(f => shown.has(stripAccents(f))));
  const accepted = [...new Set(matches.flatMap(o => o[to].forms))];
  const seen = new Set([norm(w[to].label)]);
  const also = [];
  for (const label of [...w[to].extra, ...matches.filter(o => o !== w).map(o => o[to].label)]) {
    const k = norm(label);
    if (!seen.has(k)) { seen.add(k); also.push(label); }
  }
  return { cat: w.cat, from, to, prompt: w[from].label, answer: w[to].label, also, accepted, key: w.en.label + '|' + w.es.label };
}

// Crea la lista de rondas (barajada), con el idioma de cada palabra según el ajuste
function buildDeck(settings) {
  const pool = shuffle(WORDS.filter(w => settings.set === 'all' || w.cat === settings.set));
  const dirs = pool.map((_, i) => (settings.dir === 'mix' ? (i % 2 ? 'en' : 'es') : settings.dir));
  shuffle(dirs);
  return pool.map((w, i) => cardFor(w, dirs[i]));
}
