// Textos tipo examen (Listening & Reading), como el «TEXT 2 PRACTICE» del 1er trimestre.
// Líneas: ['quién', 'inglés con los [huecos]', 'traducción']. Un hueco [respuesta|otra que también vale] es lo que
// hay que escribir en el listening (la primera es la que se oye).
// Preguntas: ['pregunta', 'respuesta modelo', [[palabras clave, sinónimos], …], [líneas donde está], [respuestas falsas para el test],
//             'traducción', 'respuesta corta para el test' (si la modelo es larga)]
// Verdadero/falso: ['frase', true/false, 'explicación', [líneas]]
const TEXTS = [
  {
    id: 'live', icon: '🔴', title: 'A Problem During a Live Broadcast', es: 'Un problema durante una emisión en directo',
    cast: { FM: ['Floor Manager', 'Regidor/a'], TD: ['Technical Director', 'Director/a técnico/a'], CO: ['Camera Operator', 'Operador/a de cámara'] },
    lines: [
      ['FM', "[Quiet on set|Quiet on set, please|Quiet, please|Stand by], everyone. We're going live in two minutes.", 'Silencio en el plató, todos. Entramos en directo en dos minutos.'],
      ['TD', 'Camera one is ready. What about camera two?', 'La cámara uno está preparada. ¿Y la cámara dos?'],
      ['CO', 'Camera two is ready, but we have a [problem|technical issue|issue] with the monitor.', 'La cámara dos está preparada, pero tenemos un problema con el monitor.'],
      ['TD', 'What kind of problem?', '¿Qué tipo de problema?'],
      ['CO', 'The image keeps disappearing.', 'La imagen desaparece todo el rato.'],
      ['TD', "OK. [Let's troubleshoot the problem|Let's see what we can do]. Check the connection.", 'Vale. Vamos a solucionar el problema. Comprueba la conexión.'],
      ['CO', "I'm checking it now. The cable looks fine.", 'Lo estoy comprobando. El cable parece estar bien.'],
      ['TD', '[Do we have a spare|Do we have a backup|Do we have a spare cable]?', '¿Tenemos uno de repuesto?'],
      ['CO', 'Yes, we do.', 'Sí, tenemos.'],
      ['TD', 'Try the spare cable.', 'Prueba el cable de repuesto.'],
      ['CO', "One moment... OK, [the problem has been solved|the problem is solved|it's working now].", 'Un momento... Vale, el problema se ha solucionado.'],
      ['TD', 'Good. [Keep me updated|Keep me posted|Let me know] if there are any more problems.', 'Bien. Mantenme informado/a si hay más problemas.'],
      ['FM', "Everyone, stand by. We're ready for the [next segment|next cue].", 'Todos, preparados. Estamos listos para la siguiente sección.'],
      ['TD', '[Camera ready|Sound ready|Lights ready|Stand by].', 'Cámara preparada.'],
      ['CO', '[Rolling|Camera ready|Ready when you are].', 'Grabando.'],
      ['FM', 'And... [action]!', 'Y... ¡acción!'],
      ['TD', 'Take camera two.', 'Pasamos a cámara dos.'],
      ['FM', "Good. We're back on schedule.", 'Bien. Volvemos a ir según el calendario.'],
      ['TD', 'Great. Everything is under control.', 'Genial. Todo está bajo control.'],
    ],
    questions: [
      ['What problem does the camera operator have with camera two?', 'There is a problem with the monitor: the image keeps disappearing.',
        [['monitor', 'image', 'picture'], ['disappear']], [2, 4], ['There is a problem with the battery.', 'There is a problem with the sound.', 'There is a problem with the lens.'],
        '¿Qué problema tiene el operador de cámara con la cámara dos?', 'There is a problem with the monitor.'],
      ['What does the technical director ask the camera operator to check?', 'The technical director asks the camera operator to check the connection.',
        [['connection', 'cable']], [5], ['The battery.', 'The microphone.', 'The lighting.'], '¿Qué le pide el director técnico al operador de cámara que compruebe?', 'The connection.'],
      ['What does the team use to solve the problem?', 'They use the spare cable.',
        [['spare', 'backup', 'new', 'another', 'second'], ['cable']], [7, 8, 9], ['A new camera.', 'A different monitor.', 'A wireless microphone.'], '¿Qué usa el equipo para solucionar el problema?', 'The spare cable.'],
      ['What happens when the problem is fixed?', 'Everyone stands by, they get ready for the next segment and go live again with camera two. They are back on schedule.',
        [['stand by', 'ready', 'next segment', 'action', 'camera two', 'schedule', 'live']], [12, 15, 16, 17],
        ['They stop the broadcast and go home.', 'They go to commercial for ten minutes.', 'They change the presenter and the camera.'],
        '¿Qué pasa cuando se arregla el problema?', 'They get ready for the next segment and go live again.'],
      ['What does the technical director say at the end of the conversation?', 'Great. Everything is under control.',
        [['under control']], [18], ["Great. We're ahead of schedule.", "OK. Let's do another take.", 'Cut! We need to start again.'], '¿Qué dice el director técnico al final de la conversación?'],
    ],
    tf: [
      ['Camera one has a problem with the monitor.', false, 'Es la cámara dos (camera two) la que tiene el problema.', [2]],
      ['The image on the monitor keeps disappearing.', true, 'Lo dice el operador: «The image keeps disappearing».', [4]],
      ['The cable looks broken.', false, 'El cable parece estar bien: «The cable looks fine».', [6]],
      ["They don't have a spare cable.", false, 'Sí que tienen: «Yes, we do».', [7, 8]],
      ['The technical director wants to be informed about more problems.', true, '«Keep me updated if there are any more problems».', [11]],
      ['At the end, they are behind schedule.', false, 'Al final van bien de tiempo: «We\'re back on schedule».', [17]],
    ],
  },
  {
    id: 'meeting', icon: '📋', title: 'The Production Meeting', es: 'La reunión de producción',
    cast: { PR: ['Producer', 'Productor/a'], DI: ['Director', 'Director/a'], PC: ['Production Coordinator', 'Coordinador/a de producción'] },
    lines: [
      ['PR', "Good morning, everyone. [Let's get started|Shall we start].", 'Buenos días a todos. Empecemos.'],
      ['PR', "First, let's go over the agenda. We have three items today.", 'Primero, repasemos el orden del día. Hoy tenemos tres puntos.'],
      ['PC', "Before we start, [what's the deadline] for the final script?", 'Antes de empezar, ¿cuál es la fecha límite del guion final?'],
      ['PR', "Next Friday. We're [working to a tight deadline], so we can't waste time.", 'El viernes que viene. Trabajamos con un plazo muy ajustado, así que no podemos perder tiempo.'],
      ['DI', "The problem is that we're [running behind schedule]. Two scenes still need changes.", 'El problema es que vamos retrasados respecto al calendario. Todavía hay que cambiar dos escenas.'],
      ['PR', "OK. [We need to stick to the schedule], but let's look at the changes.", 'Vale. Tenemos que ajustarnos al calendario, pero veamos los cambios.'],
      ['DI', 'I want to shoot the final scene at night. It looks much better.', 'Quiero rodar la escena final de noche. Queda mucho mejor.'],
      ['PC', "[I see your point|That's a good point], but night shoots are more expensive.", 'Entiendo tu punto de vista, pero los rodajes de noche son más caros.'],
      ['PR', "That's a good point. [We need to discuss this further].", 'Es un buen punto. Tenemos que hablar más sobre esto.'],
      ['DI', '[Could you clarify that|Could you explain that in more detail]? How much more expensive?', '¿Podrías aclararlo? ¿Cuánto más caro?'],
      ['PC', "About twenty per cent. [I'll check and let you know] tomorrow.", 'Un veinte por ciento, más o menos. Lo comprobaré y te lo comunicaré mañana.'],
      ['PR', "Perfect. [Let's move on to the next item]: the budget.", 'Perfecto. Pasemos al siguiente punto: el presupuesto.'],
      ['PC', "The budget is fine for now. I'll keep you posted.", 'El presupuesto está bien por ahora. Te mantendré informado/a.'],
      ['PR', 'Great. Are we all on the same page? Thank you, everyone.', 'Genial. ¿Estamos todos de acuerdo? Gracias a todos.'],
    ],
    questions: [
      ['When is the deadline for the final script?', 'Next Friday.', [['friday']], [2, 3], ['Next Monday.', 'Tomorrow.', 'In two weeks.'], '¿Cuándo es la fecha límite del guion final?'],
      ['Why does the director want to shoot the final scene at night?', 'Because it looks much better.', [['better', 'looks']], [6], ['Because it is cheaper.', 'Because the actors prefer it.', 'Because the location is free at night.'], '¿Por qué quiere el director rodar la escena final de noche?'],
      ['What is the problem with night shoots?', 'They are more expensive (about twenty per cent more).', [['expensive', 'cost', 'money', 'price']], [7, 10], ['They are too dark.', 'They need more actors.', 'They take two days.'], '¿Qué problema tienen los rodajes de noche?', 'They are more expensive.'],
      ['What will the production coordinator do tomorrow?', 'The production coordinator will check the cost and let them know.', [['check', 'let', 'know', 'tell', 'inform']], [10], ['Write the final script.', 'Shoot the night scene.', 'Find a new location.'], '¿Qué hará mañana el coordinador de producción?', 'Check the cost and let them know.'],
      ['What is the next item they talk about?', 'The budget.', [['budget']], [11, 12], ['The script.', 'The location.', 'The cast.'], '¿De qué punto hablan después?'],
    ],
    tf: [
      ['The deadline for the final script is next Friday.', true, '«Next Friday».', [2, 3]],
      ['The team is ahead of schedule.', false, 'Van retrasados: «we\'re running behind schedule».', [4]],
      ['The director wants to shoot the final scene during the day.', false, 'La quiere rodar de noche: «at night».', [6]],
      ['Night shoots are cheaper.', false, 'Son más caros: «more expensive».', [7]],
      ['The production coordinator will give an answer tomorrow.', true, '«I\'ll check and let you know tomorrow».', [10]],
      ['The budget is a big problem.', false, 'El presupuesto está bien por ahora: «The budget is fine for now».', [12]],
    ],
  },
  {
    id: 'set', icon: '🎬', title: 'First Day on Set', es: 'Primer día en el plató',
    cast: { AD: ['Assistant Director', 'Ayudante de dirección'], DI: ['Director', 'Director/a'], SO: ['Sound Mixer', 'Técnico/a de sonido'], AC: ['Actor', 'Actor / actriz'] },
    lines: [
      ['AD', "[Quiet on set, please|Quiet on set|Quiet, please]! We're about to start.", '¡Silencio en el plató, por favor! Vamos a empezar.'],
      ['DI', '[Are we ready to shoot]?', '¿Estamos preparados para rodar?'],
      ['SO', '[Sound ready].', 'Sonido preparado.'],
      ['AD', 'Camera is ready too. Stand by, everyone.', 'La cámara también está preparada. Preparados, todos.'],
      ['DI', 'And... [action]!', 'Y... ¡acción!'],
      ['AC', 'Sorry, I forgot my line!', '¡Perdón, se me ha olvidado el texto!'],
      ['DI', "Cut! Don't worry. [Let's do another take|Let's go again].", '¡Corten! No te preocupes. Hagamos otra toma.'],
      ['AD', '[Back to one], everybody!', '¡Volvemos al principio, todos!'],
      ['DI', 'This time, [move slightly to the left], please.', 'Esta vez, muévete ligeramente a la izquierda, por favor.'],
      ['AC', 'Here? Is this OK?', '¿Aquí? ¿Así está bien?'],
      ['DI', 'Perfect. [Hold that position|Stay where you are].', 'Perfecto. Mantén esa posición.'],
      ['AD', "And remember: don't [look into camera].", 'Y recuerda: no mires a cámara.'],
      ['DI', 'Cut! [That was a good take]!', '¡Corten! ¡Ha sido una buena toma!'],
      ['AD', 'Shall we do one more, just in case?', '¿Hacemos una más, por si acaso?'],
      ['DI', "Yes, let's do one more.", 'Sí, hagamos una más.'],
    ],
    questions: [
      ['What does the assistant director ask for at the beginning?', 'Silence on set: "Quiet on set, please!"', [['quiet', 'silence']], [0], ['A new camera.', 'More light.', 'Another actor.'], '¿Qué pide el ayudante de dirección al principio?', 'Silence on set.'],
      ['What problem does the actor have in the first take?', 'The actor forgets the line.', [['forgot', 'forget', 'line', 'text']], [5], ['The actor falls over.', 'The actor is late.', 'The actor looks into the camera.'], '¿Qué problema tiene el actor en la primera toma?'],
      ['What does the director ask the actor to do in the second take?', 'To move slightly to the left.', [['left']], [8], ['To speak louder.', 'To look into camera.', 'To move to the right.'], '¿Qué le pide el director al actor en la segunda toma?'],
      ['What must the actor not do?', 'Look into the camera.', [['look'], ['camera']], [11], ['Move to the left.', 'Speak louder.', 'Stand up.'], '¿Qué no debe hacer el actor?'],
      ['Why do they do one more take?', 'Just in case (to be safe).', [['case', 'safe', 'sure']], [13], ['Because the take was bad.', 'Because the sound was wrong.', 'Because the actor asked.'], '¿Por qué hacen una toma más?', 'Just in case.'],
    ],
    tf: [
      ['The sound is not ready.', false, 'El técnico dice «Sound ready».', [2]],
      ['The actor forgets the line in the first take.', true, '«Sorry, I forgot my line!».', [5]],
      ['The director tells the actor not to worry.', true, '«Don\'t worry».', [6]],
      ['In the second take, the actor must move to the right.', false, 'A la izquierda: «to the left».', [8]],
      ['The second take is good.', true, '«That was a good take!».', [12]],
      ["They don't do any more takes.", false, 'Hacen una más, por si acaso.', [13, 14]],
    ],
  },
  {
    id: 'camera', icon: '🎥', title: 'Setting Up the Shot', es: 'Preparando el plano',
    cast: { DP: ['Director of Photography', 'Director/a de fotografía'], CO: ['Camera Operator', 'Operador/a de cámara'], FP: ['Focus Puller', 'Foquista'] },
    lines: [
      ['DP', 'OK, team. [Get the shot ready], please. We start with the interview.', 'Vale, equipo. Preparad el plano, por favor. Empezamos con la entrevista.'],
      ['CO', 'Shall we start with a wide shot?', '¿Empezamos con un plano general?'],
      ['DP', "Yes. [Let's get a wide shot] first, and then a close-up.", 'Sí. Primero hagamos un plano general y luego un primer plano.'],
      ['CO', 'OK. Let me check the framing.', 'Vale. Déjame comprobar el encuadre.'],
      ['DP', 'The subject moves a lot, so [keep the subject in frame].', 'El sujeto se mueve mucho, así que mantén al sujeto en el encuadre.'],
      ['FP', 'Should I [check the focus]?', '¿Compruebo el enfoque?'],
      ['DP', 'Yes, please. And when she stands up, [pull focus].', 'Sí, por favor. Y cuando se levante, haz un cambio de foco.'],
      ['CO', 'The garden looks great. Can I [go wider]?', 'El jardín queda genial. ¿Puedo abrir el plano?'],
      ['DP', 'Yes, but only a little. Now [pan left] slowly.', 'Sí, pero solo un poco. Ahora haz una panorámica hacia la izquierda, despacio.'],
      ['CO', 'Like this?', '¿Así?'],
      ['DP', 'Perfect. [Hold the shot]!', '¡Perfecto! ¡Mantén el plano!'],
      ['FP', 'For the next shot, [we need another angle].', 'Para el siguiente plano, necesitamos otro ángulo.'],
      ['DP', "Agreed. [Let's get a close-up] of her hands.", 'De acuerdo. Hagamos un primer plano de sus manos.'],
      ['CO', "OK, I'll move in a bit.", 'Vale, me acercaré un poco.'],
    ],
    questions: [
      ['What type of shot do they start with?', 'A wide shot.', [['wide', 'long']], [1, 2], ['A close-up.', 'A tracking shot.', 'A low-angle shot.'], '¿Con qué tipo de plano empiezan?'],
      ['Why must the camera operator keep the subject in frame?', 'Because the subject moves a lot.', [['move']], [4], ['Because the light is bad.', 'Because the lens is broken.', 'Because the subject is very small.'], '¿Por qué tiene que mantener al sujeto en el encuadre?'],
      ['When does the focus puller need to pull focus?', 'When she (the subject) stands up.', [['stand', 'get up', 'gets up']], [6], ['When she sits down.', 'At the end of the interview.', 'When the director says cut.'], '¿Cuándo tiene que hacer el cambio de foco el foquista?', 'When she stands up.'],
      ['Which direction does the camera pan?', 'Left, slowly.', [['left']], [8], ['Right.', 'Up.', 'Down.'], '¿Hacia dónde hace la panorámica la cámara?', 'Left.'],
      ['What is the close-up of?', 'Her hands.', [['hand']], [12], ['Her face.', 'The garden.', 'The camera.'], '¿De qué es el primer plano?'],
    ],
    tf: [
      ['They start with a close-up.', false, 'Empiezan con un plano general: «a wide shot».', [2]],
      ["The subject doesn't move.", false, 'Se mueve mucho: «moves a lot».', [4]],
      ['The focus puller checks the focus.', true, '«Should I check the focus? – Yes, please».', [5, 6]],
      ['The camera operator can go much wider.', false, 'Solo un poco: «only a little».', [8]],
      ['The camera pans slowly.', true, '«Pan left slowly».', [8]],
      ['The next shot is a close-up of her hands.', true, '«Let\'s get a close-up of her hands».', [12]],
    ],
  },
  {
    id: 'sound', icon: '🎙️', title: 'Noise on Location', es: 'Ruido en la localización',
    cast: { DI: ['Director', 'Director/a'], SM: ['Sound Mixer', 'Técnico/a de sonido'], BO: ['Boom Operator', 'Técnico/a de pértiga'] },
    lines: [
      ['DI', '[Sound ready]?', '¿Sonido preparado?'],
      ['SM', 'Not yet. Check the sound levels, please.', 'Todavía no. Comprueba los niveles de sonido, por favor.'],
      ['BO', "Levels are OK, but [we're getting some background noise].", 'Los niveles están bien, pero estamos captando algo de ruido de fondo.'],
      ['DI', 'Where is it coming from?', '¿De dónde viene?'],
      ['BO', "There's a road behind the building. [There's too much noise].", 'Hay una carretera detrás del edificio. Hay demasiado ruido.'],
      ['DI', "Let's try anyway.", 'Probemos igualmente.'],
      ['SM', 'OK... Stop! [The dialogue is too quiet].', 'Vale... ¡Para! El diálogo está demasiado bajo.'],
      ['DI', 'Can the actor speak louder?', '¿Puede el actor hablar más alto?'],
      ['SM', 'Yes, but [we need another take for sound].', 'Sí, pero necesitamos otra toma para sonido.'],
      ['BO', 'Sorry, I think the boom was in the shot.', 'Perdón, creo que la pértiga salía en el plano.'],
      ['DI', '[Keep the microphone out of shot], please!', '¡Mantén el micrófono fuera de plano, por favor!'],
      ['SM', "Second take... Now [we're getting clipping]. He's shouting!", 'Segunda toma... Ahora estamos teniendo saturación. ¡Está gritando!'],
      ['BO', "I'll reduce the gain. [Watch the levels].", 'Bajaré la ganancia. Vigila los niveles.'],
      ['SM', 'Third take... Great. [The signal is clean].', 'Tercera toma... Genial. La señal está limpia.'],
      ['DI', 'So we have good sound?', '¿Entonces tenemos buen sonido?'],
      ['SM', 'Yes. But before we leave, [we need room tone].', 'Sí. Pero antes de irnos, necesitamos grabar tono de sala.'],
    ],
    questions: [
      ['Where does the background noise come from?', 'From a road behind the building.', [['road']], [2, 4], ['From a bar across the street.', 'From the generator.', 'From the actors.'], '¿De dónde viene el ruido de fondo?'],
      ['What is the problem in the first take?', 'The dialogue is too quiet.', [['quiet', 'low']], [6], ['The dialogue is too loud.', 'The camera is not ready.', 'The light is too bright.'], '¿Qué problema hay en la primera toma?'],
      ['What did the boom operator do wrong?', 'The boom was in the shot.', [['boom', 'microphone', 'mic'], ['shot', 'frame', 'picture', 'image']], [9, 10], ['The headphones were off.', 'The recorder was off.', 'The cable was broken.'], '¿Qué hizo mal el técnico de pértiga?'],
      ['Why is there clipping in the second take?', 'Because the actor is shouting.', [['shout', 'loud', 'yell', 'scream']], [11], ['Because the actor is whispering.', 'Because the cable is broken.', 'Because of the traffic.'], '¿Por qué hay saturación en la segunda toma?'],
      ['What do they need to record before they leave?', 'Room tone.', [['room tone']], [15], ['Another take.', 'A sound effect.', 'The voice-over.'], '¿Qué tienen que grabar antes de irse?'],
    ],
    tf: [
      ['The sound is ready at the beginning.', false, 'Todavía no: «Not yet».', [0, 1]],
      ["There's a road behind the building.", true, '«There\'s a road behind the building».', [4]],
      ['In the first take, the dialogue is too loud.', false, 'Está demasiado bajo: «too quiet».', [6]],
      ['The boom appeared in the shot.', true, '«I think the boom was in the shot».', [9]],
      ['The boom operator increases the gain.', false, 'La baja: «I\'ll reduce the gain».', [12]],
      ['They need room tone before they leave.', true, '«Before we leave, we need room tone».', [15]],
    ],
  },
  {
    id: 'lighting', icon: '💡', title: 'Lighting a Night Scene', es: 'Iluminando una escena nocturna',
    cast: { DP: ['Director of Photography', 'Director/a de fotografía'], GA: ['Gaffer', 'Jefe/a de eléctricos'], LT: ['Lighting Technician', 'Técnico/a de iluminación'] },
    lines: [
      ['DP', 'Check the lighting before the actors arrive.', 'Comprueba la iluminación antes de que lleguen los actores.'],
      ['GA', 'The scene is at night, so we need a dark, blue look.', 'La escena es de noche, así que necesitamos un aspecto oscuro y azul.'],
      ['DP', "Right, but [the subject is underexposed]. I can't see his face.", 'Ya, pero el sujeto está subexpuesto. No le veo la cara.'],
      ['GA', 'OK. [Adjust the key light], please.', 'Vale. Ajusta la luz principal, por favor.'],
      ['LT', 'Done. Is that better?', 'Hecho. ¿Está mejor?'],
      ['DP', 'Better. But there are hard shadows. [Add some fill light].', 'Mejor. Pero hay sombras duras. Añade algo de luz de relleno.'],
      ['LT', 'Should I [move the light closer]?', '¿Acerco la luz?'],
      ['DP', 'Yes, a little... Too much! Now [the image is overexposed].', 'Sí, un poco... ¡Demasiado! Ahora la imagen está sobreexpuesta.'],
      ['GA', '[Move the light further away], please.', 'Aleja la luz, por favor.'],
      ['LT', 'And should I reduce the intensity?', '¿Y reduzco la intensidad?'],
      ['DP', 'Yes. And [watch the shadows] on the wall.', 'Sí. Y vigila las sombras de la pared.'],
      ['GA', 'The window is a problem. [We need less light] from outside.', 'La ventana es un problema. Necesitamos menos luz de fuera.'],
      ['DP', 'Put a flag there. And [check the colour temperature].', 'Pon una bandera ahí. Y comprueba la temperatura de color.'],
      ['LT', 'Done. How does it look now?', 'Hecho. ¿Cómo se ve ahora?'],
      ['DP', 'Perfect. [The lighting looks good].', 'Perfecto. La iluminación tiene buen aspecto.'],
    ],
    questions: [
      ['What look do they need for the scene?', 'A dark, blue look, because it is a night scene.', [['dark', 'blue', 'night']], [1], ['A bright, warm look.', 'A natural daylight look.', 'A red, dramatic look.'], '¿Qué aspecto necesitan para la escena?', 'A dark, blue look.'],
      ["Why can't the director of photography see the actor's face?", 'Because the subject is underexposed.', [['underexposed', 'dark', 'not enough light']], [2], ['Because the image is overexposed.', 'Because the actor is not there.', 'Because the camera is broken.'], '¿Por qué no le ve la cara al actor el director de fotografía?'],
      ['What do they add to remove the hard shadows?', 'Some fill light.', [['fill']], [5], ['A key light.', 'A green filter.', 'A second camera.'], '¿Qué añaden para quitar las sombras duras?'],
      ['What happens when the technician moves the light too close?', 'The image is overexposed.', [['overexposed', 'too bright', 'bright']], [7], ['The image is underexposed.', 'The light breaks.', 'The colour changes to blue.'], '¿Qué pasa cuando el técnico acerca demasiado la luz?'],
      ['What do they put in front of the window?', 'A flag.', [['flag']], [12], ['A reflector.', 'A diffuser.', 'A curtain.'], '¿Qué ponen delante de la ventana?'],
    ],
    tf: [
      ['The scene takes place during the day.', false, 'Es de noche: «at night».', [1]],
      ['At first, the subject is underexposed.', true, '«The subject is underexposed».', [2]],
      ['The director of photography asks for some fill light.', true, '«Add some fill light».', [5]],
      ['When the light is too close, the image is overexposed.', true, '«Too much! Now the image is overexposed».', [7]],
      ['They need more light from the window.', false, 'Necesitan menos: «we need less light from outside».', [11]],
      ['At the end, the lighting looks good.', true, '«The lighting looks good».', [14]],
    ],
  },
  {
    id: 'location', icon: '📍', title: 'Scouting a Location', es: 'Buscando una localización',
    cast: { PR: ['Producer', 'Productor/a'], LM: ['Location Manager', 'Responsable de localizaciones'], OW: ['Owner', 'Dueño/a'] },
    lines: [
      ['PR', '[We need to scout the location] before Friday.', 'Tenemos que visitar la localización antes del viernes.'],
      ['LM', "No problem. [Let's check the location] tomorrow morning.", 'Sin problema. Vamos a comprobar la localización mañana por la mañana.'],
      ['OW', 'Good morning! Welcome to the old factory.', '¡Buenos días! Bienvenidos a la antigua fábrica.'],
      ['PR', "It's perfect for the final scene. [Is the location available] next month?", 'Es perfecta para la escena final. ¿Está disponible la localización el mes que viene?'],
      ['OW', "Yes, it's free from the tenth to the fifteenth.", 'Sí, está libre del diez al quince.'],
      ['LM', 'Great. And [we have permission to shoot here], right?', 'Genial. Y tenemos permiso para rodar aquí, ¿verdad?'],
      ['OW', 'Yes. I can sign the [location release] today.', 'Sí. Puedo firmar la autorización de localización hoy.'],
      ['PR', 'Perfect. [Where is the crew parking]?', 'Perfecto. ¿Dónde aparca el equipo?'],
      ['OW', "Behind the factory. There's space for twenty cars.", 'Detrás de la fábrica. Hay sitio para veinte coches.'],
      ['LM', 'And [where is the equipment being delivered]?', '¿Y dónde se entrega el equipo?'],
      ['OW', 'At the main door. The trucks can get in easily.', 'En la puerta principal. Los camiones pueden entrar fácilmente.'],
      ['PR', "Great. [What's the call time] on the first day?", 'Genial. ¿A qué hora es la convocatoria el primer día?'],
      ['LM', '[Call time is at seven]. We start shooting at eight.', 'La convocatoria es a las siete. Empezamos a rodar a las ocho.'],
      ['PR', 'And [what time do we wrap]?', '¿Y a qué hora terminamos el rodaje?'],
      ['LM', 'At about nine in the evening.', 'Sobre las nueve de la noche.'],
      ['OW', "That's fine. See you next month!", 'Me parece bien. ¡Hasta el mes que viene!'],
    ],
    questions: [
      ['What is the location?', 'An old factory.', [['factory']], [2], ['A warehouse.', 'A hotel.', 'A TV studio.'], '¿Qué es la localización?'],
      ['When is the location free?', 'From the tenth to the fifteenth of next month.', [['tenth', '10'], ['fifteenth', '15']], [3, 4], ['From the first to the fifth.', 'Every weekend.', 'Only on Friday.'], '¿Cuándo está libre la localización?', 'From the tenth to the fifteenth.'],
      ['What can the owner sign today?', 'The location release.', [['release', 'permission', 'authori']], [6], ['The budget.', 'The contract with the actors.', 'The call sheet.'], '¿Qué puede firmar hoy el dueño?'],
      ['Where is the equipment delivered?', 'At the main door.', [['main', 'front']], [9, 10], ['Behind the factory.', 'At the back door.', 'In the car park.'], '¿Dónde se entrega el equipo?'],
      ['What time is the call time, and when do they start shooting?', 'Call time is at seven and they start shooting at eight.', [['seven', '7'], ['eight', '8']], [12], ['At six and at seven.', 'At eight and at nine.', 'At nine and at ten.'], '¿A qué hora es la convocatoria y cuándo empiezan a rodar?', 'At seven and at eight.'],
    ],
    tf: [
      ['They want to use the factory for the first scene.', false, 'Es para la escena final: «the final scene».', [3]],
      ['The location is free next month.', true, '«It\'s free from the tenth to the fifteenth».', [3, 4]],
      ["They don't have permission to shoot there.", false, 'Sí tienen permiso y el dueño firma la autorización.', [5, 6]],
      ['The crew can park behind the factory.', true, '«Behind the factory».', [8]],
      ["The trucks can't get in easily.", false, 'Sí pueden: «The trucks can get in easily».', [10]],
      ['Call time is at eight.', false, 'Es a las siete: «at seven».', [12]],
    ],
  },
  {
    id: 'show', icon: '📺', title: 'A Live TV Show', es: 'Un programa de televisión en directo',
    cast: { TD: ['TV Director', 'Realizador/a'], FM: ['Floor Manager', 'Regidor/a'], PS: ['Presenter', 'Presentador/a'] },
    lines: [
      ['TD', "Thirty seconds to air. We're going live soon!", 'Treinta segundos para salir al aire. ¡Vamos a entrar en directo pronto!'],
      ['FM', 'The studio is ready. [Stand by camera one].', 'El estudio está listo. Cámara uno, preparada.'],
      ['TD', "Five, four, three... [We're live]!", 'Cinco, cuatro, tres... ¡Estamos en directo!'],
      ['FM', "Laura, [you're on]!", 'Laura, ¡estás en antena!'],
      ['PS', 'Good evening and welcome to the show. Tonight we have a very special guest.', 'Buenas noches y bienvenidos al programa. Esta noche tenemos un invitado muy especial.'],
      ['TD', "[Take camera two]. Camera two, you're live.", 'Pasamos a cámara dos. Cámara dos, estás en directo.'],
      ['FM', 'Laura, [follow the running order]. The interview is next.', 'Laura, sigue la escaleta. Ahora va la entrevista.'],
      ['PS', "[What's the next cue]?", '¿Cuál es la siguiente señal?'],
      ['FM', '[On my cue]. Three, two, one... now.', 'A mi señal. Tres, dos, uno... ya.'],
      ['TD', 'Great. After the interview, [go to commercial].', 'Genial. Después de la entrevista, vamos a publicidad.'],
      ['FM', "Commercial break. Laura, [you're off].", 'Pausa publicitaria. Laura, ya no estás en antena.'],
      ['PS', 'Thanks. How long is the break?', 'Gracias. ¿Cuánto dura la pausa?'],
      ['FM', 'Two minutes. Then back to the studio for the music.', 'Dos minutos. Luego volvemos al estudio para la música.'],
      ['TD', "OK, everyone. [We're ready for the next segment].", 'Vale, todos. Estamos preparados para la siguiente sección.'],
    ],
    questions: [
      ["What is the presenter's name?", 'Laura.', [['laura']], [3], ['Julia.', 'Emma.', 'Sara.'], '¿Cómo se llama la presentadora?'],
      ['Who is on the show tonight?', 'A very special guest.', [['guest']], [4], ['A famous band.', 'The director.', 'Nobody.'], '¿Quién viene al programa esta noche?'],
      ['What comes next in the running order after camera two?', 'The interview.', [['interview']], [6], ['The weather.', 'The music.', 'The news.'], '¿Qué viene después en la escaleta?'],
      ['What happens after the interview?', 'They go to commercial (there is a commercial break).', [['commercial', 'break', 'advert', 'ads']], [9, 10], ['The show ends.', 'They take camera one.', 'The presenter goes home.'], '¿Qué pasa después de la entrevista?', 'They go to commercial.'],
      ['How long is the break?', 'Two minutes.', [['two', '2']], [11, 12], ['Five minutes.', 'Thirty seconds.', 'Ten minutes.'], '¿Cuánto dura la pausa?'],
    ],
    tf: [
      ['There are thirty seconds to air at the beginning.', true, '«Thirty seconds to air».', [0]],
      ['The floor manager tells camera one to stand by.', true, '«Stand by camera one».', [1]],
      ['The presenter asks about the next cue.', true, '«What\'s the next cue?».', [7]],
      ['The interview comes after the commercial break.', false, 'La entrevista va antes de la pausa.', [6, 9]],
      ['The break lasts five minutes.', false, 'Dura dos minutos.', [12]],
      ['After the break, there is music.', true, '«Then back to the studio for the music».', [12]],
    ],
  },
  {
    id: 'editing', icon: '🎞️', title: 'In the Editing Room', es: 'En la sala de montaje',
    cast: { DI: ['Director', 'Director/a'], ED: ['Editor', 'Montador/a'], PR: ['Producer', 'Productor/a'] },
    lines: [
      ['DI', "Hi! [Let's review the footage] from yesterday.", '¡Hola! Vamos a revisar el material grabado de ayer.'],
      ['ED', 'OK. For scene five we have four takes.', 'Vale. Para la escena cinco tenemos cuatro tomas.'],
      ['DI', 'Take three is the best. [Keep this take].', 'La toma tres es la mejor. Conserva esta toma.'],
      ['ED', 'The end of the scene is too long.', 'El final de la escena es demasiado largo.'],
      ['DI', 'I agree. [Cut this shot].', 'Estoy de acuerdo. Corta este plano.'],
      ['ED', 'Should I [use the previous take] for the ending?', '¿Uso la toma anterior para el final?'],
      ['DI', 'Yes. And [add a transition here], between the two scenes.', 'Sí. Y añade una transición aquí, entre las dos escenas.'],
      ['ED', 'A dissolve? OK. This shot looks very blue.', '¿Un fundido encadenado? Vale. Este plano se ve muy azul.'],
      ['DI', 'Yes, [we need to colour-correct this shot].', 'Sí, tenemos que corregir el color de este plano.'],
      ['PR', 'When can I see a version?', '¿Cuándo puedo ver una versión?'],
      ['ED', "Now. [Let's render a preview].", 'Ahora. Vamos a renderizar una previsualización.'],
      ['PR', 'It looks great! Now add the titles and the credits.', '¡Queda genial! Ahora añade los títulos y los créditos.'],
      ['DI', 'Then [export a high-resolution version] for the festival.', 'Luego exporta una versión de alta resolución para el festival.'],
      ['ED', "OK. But first I'll [make a backup of the project].", 'Vale. Pero primero haré una copia de seguridad del proyecto.'],
      ['PR', "Good idea. And [don't overwrite the original file]!", 'Buena idea. ¡Y no sobrescribas el archivo original!'],
      ['ED', "Don't worry. The file also needs to be compressed for the website.", 'No te preocupes. Además, hay que comprimir el archivo para la web.'],
    ],
    questions: [
      ['How many takes do they have for scene five?', 'Four takes.', [['four', '4']], [1], ['Three.', 'Two.', 'Five.'], '¿Cuántas tomas tienen de la escena cinco?', 'Four.'],
      ['Which take is the best?', 'Take three.', [['three', '3']], [2], ['Take one.', 'Take two.', 'Take four.'], '¿Qué toma es la mejor?'],
      ['What is the problem with the end of the scene?', 'It is too long.', [['long']], [3], ['It is too short.', 'It is too dark.', 'It has no sound.'], '¿Qué problema tiene el final de la escena?'],
      ['What is wrong with the colour of one shot?', 'It looks very blue.', [['blue']], [7, 8], ['It looks too red.', 'It is black and white.', 'It is overexposed.'], '¿Qué le pasa al color de un plano?'],
      ['What version do they export, and what is it for?', 'A high-resolution version for the festival.', [['high', 'resolution'], ['festival']], [12], ['A low-resolution version for the website.', 'A preview for the actors.', 'A trailer for TV.'], '¿Qué versión exportan y para qué es?'],
    ],
    tf: [
      ['They review the footage from yesterday.', true, '«Let\'s review the footage from yesterday».', [0]],
      ['Take one is the best.', false, 'La mejor es la tres.', [2]],
      ['The end of the scene is too short.', false, 'Es demasiado largo: «too long».', [3]],
      ['They add a transition between two scenes.', true, '«Add a transition here, between the two scenes».', [6]],
      ['The editor makes a backup before exporting.', true, '«First I\'ll make a backup of the project».', [13]],
      ['The producer wants the editor to overwrite the original file.', false, 'Al revés: «Don\'t overwrite the original file!».', [14]],
    ],
  },
  {
    id: 'broken', icon: '⚠️', title: "The Camera Won't Turn On", es: 'La cámara no se enciende',
    cast: { AC: ['Camera Assistant', 'Ayudante de cámara'], PM: ['Production Manager', 'Jefe/a de producción'], DP: ['Director of Photography', 'Director/a de fotografía'] },
    lines: [
      ['AC', "[We have a technical issue]. The camera won't turn on.", 'Tenemos un problema técnico. La cámara no se enciende.'],
      ['PM', "What? We're shooting in ten minutes! [Can we fix it]?", '¿Qué? ¡Rodamos en diez minutos! ¿Podemos arreglarlo?'],
      ['DP', "[Let's see what we can do]. Maybe it's the battery.", 'Veamos qué podemos hacer. Quizá es la batería.'],
      ['AC', "No, the battery is full. The equipment isn't working.", 'No, la batería está llena. El equipo no funciona.'],
      ['DP', "OK. [Let's troubleshoot the problem]. Check the cables.", 'Vale. Vamos a solucionar el problema. Revisa los cables.'],
      ['AC', 'The power cable is broken.', 'El cable de alimentación está roto.'],
      ['PM', '[Do we have a spare]?', '¿Tenemos uno de repuesto?'],
      ['AC', 'No, [we need a replacement].', 'No, necesitamos uno de repuesto.'],
      ['PM', '[How long will it take] to get one?', '¿Cuánto tiempo llevará conseguir uno?'],
      ['DP', "About an hour. [We don't have much time].", 'Más o menos una hora. No tenemos mucho tiempo.'],
      ['PM', '[Do we have a backup] camera?', '¿Tenemos una cámara de respaldo?'],
      ['AC', "Yes! There's a second camera in the van.", '¡Sí! Hay una segunda cámara en la furgoneta.'],
      ['DP', 'Great. We need to act quickly. Bring it now.', 'Genial. Tenemos que actuar rápido. Tráela ya.'],
      ['AC', "It's working! [The problem has been solved].", '¡Funciona! El problema se ha solucionado.'],
      ['PM', 'Perfect. Everything is under control.', 'Perfecto. Todo está bajo control.'],
    ],
    questions: [
      ['What is the technical issue?', "The camera won't turn on.", [['turn on', 'switch on', 'start', 'work']], [0], ['The sound is too quiet.', 'The lights are broken.', 'The monitor has no image.'], '¿Cuál es el problema técnico?'],
      ['Is the battery the problem? Why or why not?', 'No, because the battery is full.', [['full']], [2, 3], ['Yes, the battery is empty.', 'Yes, the battery is broken.', "They don't check the battery."], '¿El problema es la batería? ¿Por qué?'],
      ['What is broken?', 'The power cable.', [['cable']], [5], ['The lens.', 'The battery.', 'The tripod.'], '¿Qué está roto?'],
      ['How long will it take to get a replacement?', 'About an hour.', [['an hour', 'one hour', '1 hour', 'sixty minutes', '60 minutes']], [8, 9], ['Ten minutes.', 'A day.', 'Two hours.'], '¿Cuánto tiempo llevará conseguir un repuesto?'],
      ['How do they solve the problem?', 'They use the second (backup) camera from the van.', [['second', 'backup', 'another', 'other'], ['camera']], [10, 11, 13], ['They repair the power cable.', 'They buy a new camera.', 'They cancel the shoot.'], '¿Cómo solucionan el problema?', 'They use a second camera from the van.'],
    ],
    tf: [
      ["The camera won't turn on.", true, '«The camera won\'t turn on».', [0]],
      ["They're shooting in one hour.", false, 'Ruedan en diez minutos: «in ten minutes».', [1]],
      ['The battery is empty.', false, 'Está llena: «the battery is full».', [3]],
      ['They have a spare power cable.', false, 'No tienen: «No, we need a replacement».', [6, 7]],
      ["There's a second camera in the van.", true, '«There\'s a second camera in the van».', [11]],
      ['At the end, the problem is solved.', true, '«The problem has been solved».', [13]],
    ],
  },
  {
    id: 'lastday', icon: '🤝', title: 'The Last Day of Filming', es: 'El último día de rodaje',
    cast: { PR: ['Producer', 'Productor/a'], PM: ['Production Manager', 'Jefe/a de producción'], AD: ['Assistant Director', 'Ayudante de dirección'], GA: ['Gaffer', 'Jefe/a de eléctricos'] },
    lines: [
      ['PR', "It's the last day of filming. [Who is in charge] today?", 'Es el último día de rodaje. ¿Quién está al cargo hoy?'],
      ['PM', "I am. Don't worry, everything is under control.", 'Yo. No te preocupes, todo está bajo control.'],
      ['AD', "The catering hasn't arrived. [Who's responsible for this]?", 'El catering no ha llegado. ¿Quién es responsable de esto?'],
      ['PM', "[Leave it with me|I'll take care of it|I'll handle it]. I'll call them now.", 'Déjamelo a mí. Les llamo ahora.'],
      ['GA', 'We have a problem with the lights on the second floor.', 'Tenemos un problema con las luces del segundo piso.'],
      ['PM', '[Can you take care of this]?', '¿Puedes encargarte de esto?'],
      ['GA', "Sure. [I'll sort it out].", 'Claro. Yo lo soluciono.'],
      ['PR', '[We need to coordinate with the crew] for the last scene.', 'Tenemos que coordinarnos con el equipo para la última escena.'],
      ['PM', 'Yes. Please, [keep the team informed].', 'Sí. Por favor, mantén informado al equipo.'],
      ['AD', "OK. I'll let the team know about the changes.", 'Vale. Informaré al equipo de los cambios.'],
      ['PM', 'And [make sure everyone is ready] at five.', 'Y asegúrate de que todos estén preparados a las cinco.'],
      ['AD', "Everyone is here. [We're good to go|We're all set]!", 'Están todos aquí. ¡Estamos listos para empezar!'],
      ['PM', "Great. [Let's get this show on the road]!", 'Genial. ¡Vamos a poner esto en marcha!'],
    ],
    questions: [
      ['Who is in charge on the last day?', 'The production manager.', [['production manager', 'manager']], [0, 1], ['The producer.', 'The gaffer.', 'The assistant director.'], '¿Quién está al cargo el último día?'],
      ["What hasn't arrived?", 'The catering.', [['catering', 'food']], [2], ['The lights.', 'The actors.', 'The camera.'], '¿Qué no ha llegado?'],
      ['Where is the problem with the lights?', 'On the second floor.', [['second']], [4], ['On the first floor.', 'In the car park.', 'On the stage.'], '¿Dónde está el problema con las luces?'],
      ['What does the assistant director have to do?', 'Keep the team informed about the changes and make sure everyone is ready at five.', [['inform', 'know', 'tell', 'ready']], [8, 9, 10], ['Call the catering company.', 'Fix the lights.', 'Write the call sheet.'], '¿Qué tiene que hacer el ayudante de dirección?', 'Keep the team informed.'],
      ['What time does everyone need to be ready?', 'At five.', [['five', '5']], [10], ['At six.', 'At seven.', 'At four.'], '¿A qué hora tienen que estar todos preparados?'],
    ],
    tf: [
      ["It's the first day of filming.", false, 'Es el último: «the last day of filming».', [0]],
      ['The production manager will call the catering company.', true, '«I\'ll call them now».', [3]],
      ['The gaffer refuses to help.', false, 'Ayuda: «Sure. I\'ll sort it out».', [6]],
      ['The assistant director will tell the team about the changes.', true, '«I\'ll let the team know about the changes».', [9]],
      ['Everyone must be ready at five.', true, '«Make sure everyone is ready at five».', [10]],
      ['Some people are missing at the end.', false, 'Están todos: «Everyone is here».', [11]],
    ],
  },
  {
    id: 'interview', icon: '💼', title: 'A Job Interview', es: 'Una entrevista de trabajo',
    cast: { HM: ['Hiring Manager', 'Responsable de selección'], CA: ['Candidate', 'Candidato/a'] },
    lines: [
      ['HM', 'Good morning. Thanks for sending your CV and your portfolio.', 'Buenos días. Gracias por enviar tu currículum y tu portfolio.'],
      ['CA', 'Thank you for inviting me.', 'Gracias por invitarme.'],
      ['HM', 'Tell me about your [work experience].', 'Háblame de tu experiencia laboral.'],
      ['CA', 'I worked as a production assistant on a TV series for six months.', 'Trabajé como ayudante de producción en una serie de televisión durante seis meses.'],
      ['HM', 'This job is stressful. Are you good at [working under pressure]?', 'Este trabajo es estresante. ¿Trabajas bien bajo presión?'],
      ['CA', "Yes. I'm calm and very [responsible].", 'Sí. Soy una persona tranquila y muy responsable.'],
      ['HM', 'Do you like [teamwork]?', '¿Te gusta el trabajo en equipo?'],
      ['CA', 'Yes, I love it. I have good [communication skills].', 'Sí, me encanta. Tengo buenas habilidades comunicativas.'],
      ['HM', 'Our projects are [deadline-driven]. Is that OK?', 'Nuestros proyectos van con plazos muy marcados. ¿Te parece bien?'],
      ['CA', 'Of course. I always meet deadlines.', 'Claro. Siempre cumplo los plazos.'],
      ['HM', 'Would you work [freelance] or with a contract?', '¿Trabajarías como autónomo/a o con contrato?'],
      ['CA', "I'm [flexible]. Both options are fine.", 'Soy flexible. Las dos opciones me parecen bien.'],
      ['HM', 'Do you have any questions?', '¿Tienes alguna pregunta?'],
      ['CA', 'Yes. What are the [working hours]?', 'Sí. ¿Cuál es el horario laboral?'],
      ['HM', 'From nine to six, but on shooting days we work in [shifts].', 'De nueve a seis, pero los días de rodaje trabajamos por turnos.'],
      ['HM', "Thank you. We'll get back to you next week.", 'Gracias. Nos pondremos en contacto contigo la semana que viene.'],
    ],
    questions: [
      ['What did the candidate send?', 'A CV and a portfolio.', [['cv', 'resume', 'résumé'], ['portfolio']], [0], ['A video and a letter.', 'A contract.', 'A script.'], '¿Qué envió el candidato?'],
      ["What was the candidate's job before?", 'Production assistant on a TV series, for six months.', [['production assistant', 'assistant']], [3], ['Camera operator in a film.', 'Editor for a TV channel.', 'Presenter of a show.'], '¿En qué trabajaba antes el candidato?', 'Production assistant on a TV series.'],
      ['How does the candidate describe their personality?', 'Calm, very responsible and flexible.', [['calm', 'responsible', 'flexible']], [5, 11], ['Shy and quiet.', 'Very creative but slow.', 'Nervous under pressure.'], '¿Cómo describe el candidato su forma de ser?'],
      ["What are the company's projects like?", 'Deadline-driven.', [['deadline']], [8], ['Very relaxed.', 'Always late.', 'Only for TV.'], '¿Cómo son los proyectos de la empresa?'],
      ['What are the working hours?', 'From nine to six, but they work in shifts on shooting days.', [['nine', '9'], ['six', '6']], [14], ['From eight to three.', 'From ten to eight.', 'Only at night.'], '¿Cuál es el horario laboral?', 'From nine to six.'],
    ],
    tf: [
      ['The candidate worked on a TV series.', true, '«I worked as a production assistant on a TV series».', [3]],
      ['The candidate is not good at working under pressure.', false, 'Sí: «Yes. I\'m calm and very responsible».', [4, 5]],
      ["The candidate doesn't like teamwork.", false, 'Le encanta: «Yes, I love it».', [6, 7]],
      ["The company's projects are deadline-driven.", true, '«Our projects are deadline-driven».', [8]],
      ['The candidate only wants a contract.', false, 'Es flexible: las dos opciones le parecen bien.', [11]],
      ['On shooting days, they work in shifts.', true, '«On shooting days we work in shifts».', [14]],
    ],
  },
];

// ---------- Leer los textos ----------
// "Tenemos un [problema|issue]" -> trozos de texto y huecos (con todas las respuestas que valen)
function parseLine(raw) {
  const parts = [];
  let at = 0;
  for (const m of raw.matchAll(/\[([^\]]+)\]/g)) {
    if (m.index > at) parts.push({ text: raw.slice(at, m.index) });
    parts.push({ gap: m[1].split('|').map(s => s.trim()) });
    at = m.index + m[0].length;
  }
  if (at < raw.length) parts.push({ text: raw.slice(at) });
  return parts;
}
const plainLine = raw => parseLine(raw).map(p => (p.gap ? p.gap[0] : p.text)).join('');

// Todos los textos ya preparados: los de examen y los diálogos de las conversaciones (con huecos automáticos)
let TEXT_CACHE = null;
function allTexts() {
  if (TEXT_CACHE) return TEXT_CACHE;
  const out = [];
  for (const t of TEXTS) out.push(prepText({ ...t, group: 'exam' }));
  for (const cv of CONVOS) out.push(prepText(convoText(cv)));
  return (TEXT_CACHE = out);
}
const textById = id => allTexts().find(t => t.id === id);
const ALL_TSETS = () => allTexts().map(t => t.id);
const validTsets = sets => (Array.isArray(sets) ? sets : []).filter(id => allTexts().some(t => t.id === id));

// Un diálogo de las conversaciones como texto de listening: los huecos son las expresiones del PDF que salen
function convoText(cv) {
  const lines = [];
  for (const l of cv.lines) {
    if (Array.isArray(l)) { if (l[0] !== 'narr') lines.push([l[0], l[1], l[2]]); continue; }
    if (l.task === 'choose') lines.push(['you', l.options[0][0], l.options[0][1]]);
    else lines.push(['you', l.en.replace(/\[(.+?)\]/g, '$1'), l.es]);
  }
  // primero las expresiones del PDF; si salen pocas, también palabras del vocabulario
  let gaps = 0;
  const pickGapIn = (en, type) => findTerms(en, type === 'xp').find(f => f.type === type);
  const addGaps = (list, type) => list.map(([who, en, es]) => {
    const f = gaps < 10 && !en.includes('[') && pickGapIn(en, type);
    if (!f) return [who, en, es];
    gaps++;
    const core = en.slice(f.start, f.end);
    const alt = type === 'xp' ? f.item.en.replace(/[.!?]+$/, '') : core;
    const answers = [...new Set([core, alt])].map(s => s.replace(/[[\]|]/g, ''));
    return [who, en.slice(0, f.start) + '[' + answers.join('|') + ']' + en.slice(f.end), es];
  });
  let withGaps = addGaps(lines, 'xp');
  if (gaps < 6) withGaps = addGaps(withGaps, 'vt');
  const cast = { you: [`You (${cv.you})`, 'Tú'] };
  for (const [k, p] of Object.entries(cv.cast)) cast[k] = [`${p.name} (${p.role})`, p.role];
  return { id: 'c-' + cv.id, icon: cv.icon, title: cv.title, es: cv.desc, group: 'convo', cast, lines: withGaps, questions: [], tf: [] };
}

// Prepara un texto: líneas con sus trozos, huecos numerados, preguntas y verdadero/falso
function prepText(t) {
  const lines = t.lines.map(([who, raw, es], i) => ({ i, who, raw, es, parts: parseLine(raw), plain: plainLine(raw) }));
  const gaps = [];
  for (const l of lines) for (const p of l.parts) if (p.gap) { p.n = gaps.length; gaps.push({ n: gaps.length, line: l.i, answers: p.gap }); }
  const questions = (t.questions || []).map(([q, a, keys, ref, wrong, es, mc], n) => ({ n, q, a, keys, ref, wrong, es, mc: mc || a }));
  const tf = (t.tf || []).map(([s, ok, why, ref], n) => ({ n, s, ok, why, ref }));
  return { ...t, lines, gaps, questions, tf };
}

const roleOf = (t, who) => (t.cast[who] || [who, who]);
const roleName = (t, who) => roleOf(t, who)[0];

// Respuesta abierta del reading: 2 puntos si tiene todas las ideas clave, 1 si tiene la mitad, 0 si no
function gradeAnswer(text, q) {
  const a = ' ' + stripAccents(String(text || '').toLowerCase()).replace(/[^\p{L}\p{N}' ]+/gu, ' ').replace(/\s+/g, ' ') + ' ';
  if (a.trim().length < 2) return { points: 0, hit: [] };
  const hit = q.keys.map(group => group.some(k => a.includes(' ' + stripAccents(k.toLowerCase()))));
  const n = hit.filter(Boolean).length;
  return { points: n === q.keys.length ? 2 : n * 2 >= q.keys.length && n > 0 ? 1 : 0, hit };
}
