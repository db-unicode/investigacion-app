// Genera entregable/Workshop2_ParteII_Punto3_Asistente.docx
// Uso: node scripts/build_docx.js   (desde la raíz del repositorio)
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, AlignmentType, Footer, Header, PageNumber, PageBreak,
  BorderStyle,
} = require('docx');
const h = require('./docx_helpers');
const { P, H1, H2, H3, B, N, Caption, table, box, image, readCSV, NAVY } = h;

const R = p => path.join(__dirname, '..', p);
const csv3c = n => readCSV(R(`artefactos/3c_vacio/csv/${n}.csv`));
const csv3d = n => readCSV(R(`artefactos/3d_diligenciado/csv/${n}.csv`));
const csv3e = n => readCSV(R(`artefactos/3e_preocupaciones/csv/${n}.csv`));
const short = (s, n = 140) => (s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s);
const H1pb = t => new Paragraph({ heading: 'Heading1', pageBreakBefore: true, children: [new TextRun(t)] });
const pageBreak = () => new Paragraph({ children: [new PageBreak()] });
const sp = () => new Paragraph({ children: [], spacing: { after: 60 } });

// ---------- Datos ----------
const config = fs.readFileSync(R('asistente/configuracion.md'), 'utf8');
const instrucciones = config.split('```text')[1].split('```')[0].trim().split('\n');
const descripcion = config.split('## Descripción')[1].split('\n').slice(1).join(' ').split('## ')[0].trim();

const hojas3c = fs.readdirSync(R('artefactos/3c_vacio/csv')).map(f => f.replace('.csv', ''));
const sis = csv3d('Sistema').objs, intc = csv3d('Intercambio').objs, prb = csv3d('Problema').objs;
const grp = csv3d('GrupoInformacion').objs, est = csv3d('EstadoPedido').objs, sig = csv3d('EstadoPedido_siguientes').objs;
const ip = csv3d('Intercambio_problemas').objs, pr = csv3d('Problema_reportadoPor').objs;
const porLevantar3d = csv3d('POR_LEVANTAR').objs;
const pre = csv3e('Preocupacion').objs, ten = csv3e('Tension').objs, pl3e = csv3e('POR_LEVANTAR').objs;
const nombre = id => (sis.find(s => s.id === id) || {}).nombre || ({ 'EXT-01': 'Marketplace', 'EXT-02': 'Transportadora aliada', 'ARE-01': 'Atención al cliente' })[id] || id;
const countPL = rows => rows.reduce((a, r) => a + Object.values(r).filter(v => /^POR[ _]LEVANTAR/.test(v)).length, 0);
const totalPL3d = fs.readdirSync(R('artefactos/3d_diligenciado/csv')).filter(f => !/POR_LEVANTAR|00_GUIA|Catalogos/.test(f))
  .reduce((a, f) => a + countPL(readCSV(R(`artefactos/3d_diligenciado/csv/${f}`)).objs), 0);

// ---------- Portada ----------
const portada = [
  new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { after: 0 }, children: [new TextRun({ text: 'Universidad de los Andes · Departamento de Ingeniería de Sistemas y Computación', size: 18, color: '595959' })] }),
  new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { after: 240 }, children: [new TextRun({ text: 'Maestría en Arquitecturas de TI · ARTI 4104 – Fundamentos de Arquitectura', size: 18, color: '595959' })] }),
  new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: 'Desarrollado por:', bold: true })] }),
  ...['Diego Juan Vicente Benavides Roch – dj.benavides@uniandes.edu.co', 'Jonnathan Andrés Sandino Angulo – j.sandinoa@uniandes.edu.co', 'Edgar Javier Ríos Molina – ej.riosm@uniandes.edu.co']
    .map(t => new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: t, size: 20 })] })),
  new Paragraph({ spacing: { before: 120, after: 240 }, children: [new TextRun({ text: 'Fecha: 23/10/2026', bold: true })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, shading: { fill: NAVY, type: 'clear', color: 'auto' }, spacing: { after: 200 },
    children: [new TextRun({ text: 'WORKSHOP 2 – PROCESO DE ARQUITECTURA RUTAEXPRESS – PARTE II', bold: true, color: 'FFFFFF', size: 26 })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: 'Puntos 3.a a 3.e: asistente "Arquitecto Junior RutaExpress" y artefactos generados', bold: true, size: 24, color: NAVY })] }),
  P('Este documento presenta la configuración del asistente de IA (Project de Claude) que actúa como arquitecto junior del equipo, y los tres artefactos que produjo: el formato de levantamiento del dominio de **Integración** vacío y conforme al metamodelo, ese mismo formato diligenciado solo con el enunciado del caso, y el formato de preocupaciones de negocio y TI de las áreas. En cada artefacto se indica qué se pidió, qué entregó el asistente, qué se tuvo que iterar y por qué.'),
  P('**Cómo se generó.** El asistente se ejecutó con las instrucciones exactas de la sección 1 y con los seis archivos de conocimiento listados en 1.3. Todas las respuestas, tablas y diagramas de las secciones 2 a 4 salieron del asistente. Los ajustes que hizo el equipo están señalados de forma explícita. Los diagramas están escritos en **Mermaid** con el motor de layout **ELK**, según el toolbox. Siguen la notación de Villalobos (BAC-09 a BAC-16) y todos los archivos fuente están en el repositorio (Anexo A).'),
];

// ---------- 0. Insumos ----------
const insumos = [
  H1pb('0. Insumos que recibe el asistente (resumen de los puntos 1 y 2)'),
  P('El asistente solo puede trabajar sobre lo que el equipo decidió, así que las instrucciones se apoyan en dos insumos. El primero es el toolbox: un **repositorio Git privado** como fuente de verdad, ya que RutaExpress no tiene herramienta de arquitectura y no va a comprar una; **Mermaid + ELK** para diagramas; **Excel/CSV** para los formatos que llenan las áreas; y **Word** para el documento consolidado. El segundo es el **metamodelo del dominio de Integración**. Se eligió este dominio porque tres de las cuatro posiciones de las áreas caen sobre intercambios: el conector de terceros, la confirmación de la app hacia el marketplace y lo que liquidación recibe aguas arriba. Además, el SLA de trazabilidad depende de que los estados viajen entre sistemas.'),
  image(R('diagramas/img/metamodelo_integracion.png'), { maxH: 640 }),
  Caption('Figura 0. BAC-09 – Metamodelo de Integración v1.1. La relación RutaExpress → problemas se agregó en la iteración 2 de 3.d (ver 3.4).'),
  P('Restricciones clave (BAC-12) que el asistente debe hacer cumplir:'),
  B('**R2:** todo Intercambio y todo Problema tiene al menos una Fuente.'),
  B('**R3:** un intercambio por correo o por consulta manual no puede ser TIEMPO_REAL.'),
  B('**R5:** un Problema sustentado solo en el enunciado o en la palabra de un área es **hipótesis**.'),
  B('**R6:** un dato sin fuente se registra como **POR LEVANTAR** y nunca se infiere.'),
  B('**R7 y R8**, agregadas en v1.1: el conector es un extremo, y un intercambio tiene un solo origen.'),
];

// ---------- 1. Configuración ----------
const shot = t => [box([`[ INSERTAR PANTALLAZO – ${t} ]`], { dashed: true, center: true, fill: 'FFFFFF', border: 'C00000', color: 'C00000', size: 18 }), sp()];
const configuracion = [
  H1pb('1. Configuración del asistente (puntos 3.a y 3.b)'),
  H2('1.1 Nombre y descripción (3.a)'),
  table(['Campo del Project', 'Valor configurado'], [
    ['Nombre', 'Arquitecto Junior RutaExpress'],
    ['Descripción', descripcion],
    ['Herramienta', 'Project de Claude (claude.ai): instrucciones del Project y archivos de conocimiento'],
  ], [22, 78], { size: 18 }),
  sp(),
  ...shot('Pantalla del Project con nombre y descripción'),
  H2('1.2 Instrucciones del Project (3.b.i a 3.b.iii)'),
  P('Las instrucciones se organizan en los bloques que pide el enunciado. La tabla resume cada bloque y el recuadro reproduce el texto completo que se cargó en el campo "Instructions".'),
  table(['Bloque', 'Contenido', 'Por qué así'], [
    ['Perfil profesional (3.b.i)', 'Ingeniero de sistemas con formación en análisis de procesos y modelado conceptual (UML y metamodelos de Villalobos). Conoce el vocabulario de EIP y DAMA-DMBOK2, lee BPMN 2.0 y tiene 2 años de levantamiento en logística y última milla.', 'Es el perfil de un junior que levanta información; no es un arquitecto que decide. Los cuerpos de conocimiento coinciden con el toolbox de los dominios de Integración y Datos.'],
    ['Funciones (3.b.ii)', 'F1 diseñar formatos BAC-14 desde el metamodelo · F2 generar la vista Mermaid + ELK · F3 diligenciar solo con fuentes · F4 consolidar catálogos y detectar contradicciones y vacíos · F5 proponer el formato de preocupaciones · F6 verificar la conformidad con el metamodelo.', 'Corresponden a las etapas 2 y 3 del proceso (comprender el recorrido; revisar sistemas, datos e integraciones) y alimentan la etapa 4 (causas).'],
    ['Responsabilidades y límites (3.b.iii)', 'R1 responde al Arquitecto Líder, que es el único que aprueba · R2 no completa modelos con supuestos: cita la fuente o escribe POR LEVANTAR · R3 distingue HECHO, AFIRMACIÓN DE ÁREA e HIPÓTESIS · R4 no propone soluciones ni opina sobre firmar · R5 no modifica el metamodelo y reporta las brechas · R6 es neutral entre áreas · R7 pregunta si hay ambigüedad · R8 respeta el toolbox.', 'R2, R3 y R4 traducen la condición de la gerencia ("no quiero ideas de soluciones") y el riesgo que vimos en la Parte I: la IA asumió plazos y latencias que el caso no daba.'],
    ['Formato de respuesta', 'Propósito → artefacto → POR LEVANTAR con su destinatario → control de conformidad.', 'Obliga a que cada entrega deje explícitos los vacíos y su verificación contra el metamodelo.'],
  ], [17, 48, 35], { size: 16 }),
  sp(),
  box(instrucciones, { mono: true, size: 14 }),
  Caption('Recuadro 1. Texto completo de las instrucciones del Project.'),
  ...shot('Campo "Instructions" del Project, que muestre el perfil, las funciones y las responsabilidades (si no cabe, tomar varias capturas)'),
  H2('1.3 Recursos de contexto y conocimiento (3.b.iv)'),
  table(['#', 'Archivo cargado', 'Para qué lo usa el asistente'], [
    ['01', 'Enunciado Workshop 2 Parte I – caso RutaExpress (PDF)', 'Única fuente de hechos del caso (FUE-01).'],
    ['02', 'Solución Workshop 2 Parte I – proceso del equipo (PDF)', 'Etapas y actividades: fija en qué etapa actúa el asistente.'],
    ['03', 'Enunciado Workshop 2 Parte II (PDF)', 'Alcance y resultados esperados del asistente.'],
    ['04', 'Villalobos, Modelos y Metamodelos v1.2 (PDF)', 'Notación BAC-09 a BAC-16, lenguaje de formatos y vistas.'],
    ['05', 'Toolbox y metamodelo de Integración (Markdown)', 'Repositorio, editores, cuerpos de conocimiento, conceptos, atributos, relaciones, restricciones y puntos de vista.'],
    ['06', 'Diagrama del metamodelo BAC-09 (Mermaid)', 'Estructura de clases, herencia y roles. Se agregó en la iteración 1, porque sin él el asistente no podía confirmar la herencia de Extremo y lo marcó como supuesto.'],
  ], [6, 40, 54], { size: 17 }),
  sp(),
  ...shot('Sección "Project knowledge" con los archivos 01 a 06 cargados'),
  H2('1.4 Coherencia con el proceso y límites frente a completar información'),
  table(['Riesgo identificado', 'Instrucción que lo controla', 'Evidencia de que funcionó'], [
    ['Inventar datos para "llenar" el formato', 'R2 + R6 del metamodelo (POR LEVANTAR con pregunta y destinatario)', `3.d deja ${totalPL3d} celdas en POR LEVANTAR con ${porLevantar3d.length} preguntas dirigidas. No hay cifras, latencias, tecnologías ni nombres inventados.`],
    ['Tomar la opinión de un área como causa', 'R3 + R5 del metamodelo', 'Ningún problema queda confirmado: todos son HIPÓTESIS o AFIRMACIÓN DE ÁREA.'],
    ['Proponer soluciones o recomendar firmar', 'R4', 'En 3.e, la columna "evidenciaQueLaResolveria" pide el dato que permite decidir y no propone el cambio.'],
    ['Cambiar el metamodelo por su cuenta', 'R5 (reporta brechas)', 'El asistente reportó brechas de B1 a B14 y el arquitecto líder decidió sobre cada una (ver 2.3 y 3.4).'],
    ['Que la instrucción del líder sesgue el resultado', 'R2 aplicado también al líder', 'El asistente marcó que "consulta manual" venía del líder y no del enunciado (ver 3.4).'],
  ], [26, 30, 44], { size: 16 }),
];

// ---------- 2. 3.c ----------
const sheetDesc = {
  Sistema: 'Concepto', ParticipanteExterno: 'Concepto', Area: 'Concepto', Intercambio: 'Concepto', GrupoInformacion: 'Concepto',
  EstadoPedido: 'Concepto', ModalidadEntrega: 'Concepto', Problema: 'Concepto', Fuente: 'Concepto',
};
const conceptRows = Object.keys(sheetDesc).map(n => [n, csv3c(n).header.join(', ')]);
const bridgeRows = hojas3c.filter(n => n.includes('_') && !['00_GUIA', 'POR_LEVANTAR'].includes(n))
  .map(n => { const [a, b] = n.split('_'); return [n, `${a} → ${b} (*)`, csv3c(n).header.join(', ')]; });
const cat = csv3c('Catalogos').rows;
const enumRows = [...new Set(cat.map(r => r[0]))].map(e => [e, cat.filter(r => r[0] === e).map(r => r[1]).join(' · ')]);

const art3c = [
  H1pb('2. Artefacto conforme al metamodelo – vacío (punto 3.c)'),
  H2('2.1 Solicitud al asistente'),
  box(['"Necesito que generes el artefacto de levantamiento para el dominio de Integración, conforme al metamodelo vigente (conocimiento 05). Debe salir VACÍO, como plantilla lista para que las áreas lo diligencien. Debe ser compatible con nuestro toolbox: hojas de Excel/CSV con llaves entre hojas, y la plantilla del mapa de integración en Mermaid con ELK. No llenes datos del caso todavía."'], { italic: true, size: 18 }),
  sp(),
  H2('2.2 Resultado: libro de levantamiento PV-INT-1 (BAC-14), versión v1.1'),
  P(`El asistente aplicó el lenguaje de formatos de Villalobos al metamodelo. El libro tiene ${hojas3c.length} hojas:`),
  B('una hoja por concepto concreto, en la que los atributos heredados de Extremo se repiten;'),
  B('una hoja puente por cada relación múltiple;'),
  B('`Catalogos` con las enumeraciones;'),
  B('`POR_LEVANTAR` como hoja de control;'),
  B('`00_GUIA` con la instrucción de llenado de cada campo.'),
  P('Todas las hojas llevan además dos columnas de trazabilidad: `Fuente` (cita) y `Nivel` (HECHO, AFIRMACION_AREA o HIPOTESIS).'),
  H3('Hojas de concepto (encabezados = nombres del metamodelo)'),
  table(['Hoja', 'Columnas'], conceptRows, [22, 78], { size: 16 }),
  sp(),
  H3('Hojas puente (una por relación múltiple)'),
  table(['Hoja', 'Relación del metamodelo', 'Columnas'], bridgeRows, [30, 32, 38], { size: 15 }),
  sp(),
  H3('Catálogos y hoja de control'),
  table(['Enumeración', 'Valores admitidos'], enumRows, [32, 68], { size: 16 }),
  sp(),
  P(`**POR_LEVANTAR:** ${csv3c('POR_LEVANTAR').header.join(', ')}. Hay una fila por cada dato pendiente.`),
  H2('2.3 Plantilla del mapa de integración (PV-INT-2, BAC-13)'),
  image(R('artefactos/3c_vacio/img/mapa_integracion_plantilla.png'), { maxH: 200 }),
  Caption('Figura 1. Plantilla vacía del mapa de integración (Mermaid + ELK).'),
  P('Lenguaje gráfico (BAC-13): Sistema = rectángulo; ParticipanteExterno = estadio; Área = hexágono; Intercambio = flecha rotulada "id / grupos / mecanismo"; correo o consulta manual = flecha punteada; intercambio con problema = flecha roja gruesa.'),
  H2('2.4 Compatibilidad con el toolbox y conformidad'),
  B('**Repositorio:** el libro `.xlsx` y un `.csv` por hoja quedan en el repositorio Git (`artefactos/3c_vacio/`). La plantilla del mapa es un `.mmd` versionable. No requiere ninguna herramienta de arquitectura.'),
  B('**Editores:** el libro se abre en Excel o Google Sheets, con listas desplegables que se alimentan de `Catalogos`. El mapa se edita en Mermaid con ELK.'),
  B('**Conformidad (F6):** 11 de 11 conceptos, todos los atributos con su mismo nombre, las 4 relaciones de cardinalidad 1 o 0..1 como columnas llave y las 12 relaciones múltiples como hojas puente. Las únicas columnas fuera del metamodelo son `Fuente` y `Nivel`, que el líder aprobó como columnas de trazabilidad del formato.'),
  P('**Iteración.** La v1.0 detectó siete brechas (B1 a B7). Entre ellas: no tenía forma de confirmar la herencia de Extremo porque el diagrama no estaba en su conocimiento, y el metamodelo no ofrecía dónde registrar el nivel de información. Ninguna la resolvió por su cuenta y todas las escaló. Con las decisiones del líder se emitió la v1.1, que agrega la columna `Nivel`, prefijos de id por tipo de extremo y la convención "NO APLICA (fuente)". Después, la iteración 2 de 3.d agregó la hoja `RutaExpress_problemas`.'),
];

// ---------- 3. 3.d ----------
const ext = id => (id.startsWith('POR') ? 'POR LEVANTAR' : `${id}`);
const art3d = [
  H1pb('3. Artefacto diligenciado con la información del caso (punto 3.d)'),
  H2('3.1 Solicitud al asistente'),
  box(['"Diligencia esa plantilla con la información disponible del caso (conocimiento 01, la única fuente de hechos). Registra todos los extremos e intercambios que el enunciado describe, incluidos los informales, los problemas y los estados con sus transiciones, también el reingreso. No inventes nada: lo que el enunciado no diga va como POR LEVANTAR, con su pregunta en la hoja POR_LEVANTAR. Entrega también el mapa de integración diligenciado y tu evaluación de conformidad."'], { italic: true, size: 18 }),
  sp(),
  H2('3.2 Resultado (iteración 2, vigente)'),
  P('Cada fila del libro cita textualmente el párrafo del enunciado del que sale. Por ejemplo, para SIS-03 la columna Fuente dice: «FUE-01 §Caso de estudio, párr. 2: «Si el pedido va por transportadora aliada, se envía a través de un conector de terceros que traduce el formato interno al que cada aliado requiere»». Por espacio, las tablas siguientes muestran solo el Nivel; la cita completa está en el `.xlsx`.'),
  H3('Hoja Intercambio (13 filas)'),
  table(['id', 'Intercambio', 'Origen → destino', 'Mecanismo', 'Oportunidad', 'Nivel'],
    intc.map(r => [r.id, short(r.nombre, 80), `${ext(r.origen)} → ${ext(r.destino)}`, r.mecanismo, r.oportunidad, r.Nivel]),
    [8, 38, 20, 14, 12, 10], { size: 14 }),
  sp(),
  P('Atributos de todos los intercambios que siguen en **POR LEVANTAR**, porque el enunciado no los trae: `latenciaObservada` y `volumenDiario`. `transformaFormato` también está en POR LEVANTAR en todos los intercambios menos INT-11 (VERDADERO: «traduce el formato interno al que cada aliado requiere»).'),
  H3('Hojas Sistema y GrupoInformacion'),
  table(['id', 'Sistema', 'Función (resumen de la cita)', 'Tecnología / responsable'],
    sis.map(r => [r.id, r.nombre, short(r.funcion, 120), `${r.tecnologia} / ${r.responsable}`]), [8, 24, 50, 18], { size: 14 }),
  sp(),
  table(['id', 'Grupo de información', 'Productor', 'Nivel'], grp.map(r => [r.id, r.nombre, r.productor, r.Nivel]), [10, 45, 25, 20], { size: 15 }),
  sp(),
  H3('Hojas Problema y EstadoPedido'),
  table(['id', 'Problema', 'Intercambio', 'Reportado por', 'Nivel'],
    prb.map(r => [r.id, short(r.descripcion, 120), ip.filter(x => x.problemas === r.id).map(x => x.Intercambio).join(', ') || '— (cuelga de la raíz)', pr.filter(x => x.Problema === r.id).map(x => x.reportadoPor).join(', ') || 'POR LEVANTAR', r.Nivel]),
    [8, 52, 14, 13, 13], { size: 14 }),
  sp(),
  P(`**Estados:** ${est.map(e => e.nombre).join(' · ')}. **Transiciones:** ${sig.map(s => `${s.EstadoPedido} → ${s.siguientes}`).join('; ')}. La transición Entrega fallida → En ruteo es el reingreso que describe el enunciado.`),
  H2('3.3 Mapa de integración diligenciado (PV-INT-2)'),
  image(R('artefactos/3d_diligenciado/img/mapa_integracion_TB.png'), { maxH: 780 }),
  Caption('Figura 2. Mapa de integración AS-IS diligenciado con FUE-01 (Mermaid + ELK, presentado de arriba hacia abajo). Los círculos punteados son extremos POR LEVANTAR. Las flechas rojas son intercambios con problema: INT-05, INT-07 e INT-11.'),
  P(`**POR LEVANTAR:** ${totalPL3d} celdas con ${porLevantar3d.length} preguntas dirigidas. Las cinco que más pesan para el SLA de trazabilidad son:`),
  ...['INT-05', 'INT-07', 'INT-09', 'PRB-05', 'EXT-01'].map(k => {
    const q = porLevantar3d.find(r => r['Llave de la fila'].startsWith(k) && (k !== 'PRB-05' || r['Atributo o relación'] === 'problemas'));
    return q ? B(`${k} → ${q['Dirigida a']}: ${short(q['Pregunta de levantamiento'], 300)}`) : sp();
  }),
  H2('3.4 Evaluación del resultado'),
  H3('Qué funcionó'),
  B('**Sin supuestos inventados.** Revisamos las 13 filas de Intercambio, los 6 problemas y las 5 transiciones contra el enunciado. Todo dato tiene cita literal, y no hay latencias, volúmenes, tecnologías, responsables ni nombres de aliados. Los participantes externos quedaron como genéricos ("Marketplace", "Transportadora aliada") porque el caso no los nombra.'),
  B('**Separó el nivel de la información.** Lo que narra el enunciado (PRB-01 a PRB-03) quedó como HIPÓTESIS, según R5, y lo que dice cada área (PRB-04 a PRB-06) como AFIRMACIÓN DE ÁREA. Ninguna versión de un área quedó como causa.'),
  B('**Hizo visibles los vacíos que importan para el contrato.** No se sabe qué sistema envía la confirmación al marketplace (INT-05), a quién llega el correo de la aliada (INT-07) ni cómo consulta Atención el "estado real" (INT-09). Son justamente los puntos que la etapa 3 del proceso debe levantar.'),
  H3('Qué tuvimos que iterar'),
  table(['Hallazgo en la iteración 1', 'Causa', 'Ajuste en la iteración 2'], [
    ['INT-09 quedó como CONSULTA_MANUAL', 'Error del líder: el prompt decía "consultas manuales". El asistente lo marcó en la Fuente ("por indicación del Arquitecto Líder").', 'Se volvió a POR_LEVANTAR. Lección: el prompt del líder también puede introducir supuestos.'],
    ['PRB-05 y PRB-06 no se alcanzaban desde la raíz', 'Brecha del metamodelo: Problema solo colgaba de Intercambio. El control de conformidad del asistente no lo detectó.', 'Metamodelo v1.1 con RutaExpress → problemas (*), hoja `RutaExpress_problemas` y verificación explícita de alcanzabilidad.'],
    ['El conector (SIS-03) aparecía aislado en el mapa', 'Ambigüedad del metamodelo: el conector era a la vez Sistema y valor de mecanismo.', 'R7: el conector es un extremo y su flujo se parte en dos (INT-03 e INT-11). INT-06 llega al conector.'],
    ['INT-10 tenía origen POR LEVANTAR', 'Un intercambio tiene un solo origen y liquidación consolida de varios sistemas.', 'R8: INT-10, INT-12 e INT-13, uno por productor, con Nivel HIPÓTESIS y pregunta de validación.'],
    ['Extremos no registrados aunque la secuencia del texto los fija', 'Literalidad estricta de R2.', 'Se permitió derivar un extremo de una secuencia explícita del mismo párrafo, siempre como HIPÓTESIS y con su pregunta (INT-04).'],
  ], [28, 36, 36], { size: 15 }),
  sp(),
  P('**Lo que sigue pendiente.** El mapa dibuja igual un intercambio derivado (HIPÓTESIS) y uno textual (HECHO); el lenguaje BAC-13 debería distinguirlos, y queda para la v2. El comprador final y los canales WhatsApp, teléfono y chat no tienen un concepto en el metamodelo (brecha B10, aceptada para la v2).'),
];

// ---------- 4. 3.e ----------
const areaN = { 'ARE-01': 'Atención al cliente', 'ARE-02': 'Operaciones', 'ARE-03': 'Producto', 'ARE-04': 'Finanzas', 'ARE-05': 'Comercial', 'ARE-06': 'Gerencia' };
const areaIds = s => s.replace(/\(.*?\)/g, '').split(';').map(x => x.trim()).filter(Boolean).map(x => areaN[x] || x).join(', ');
const art3e = [
  H1pb('4. Artefacto de preocupaciones de negocio y TI (punto 3.e)'),
  H2('4.1 Solicitud al asistente'),
  box(['"Propón y construye un artefacto para recolectar las preocupaciones de negocio y de TI de los equipos de RutaExpress: Operaciones, Producto, Finanzas, Comercial y Atención al cliente, más Gerencia como patrocinador. Debe ser compatible con el toolbox (formato Excel/CSV y una vista Mermaid con ELK) y dejar visibles las tensiones entre áreas: dónde ubica cada una el problema y en qué se contradicen. Primero define el artefacto vacío y explica por qué tiene esa estructura; luego haz el levantamiento inicial con lo que dice el enunciado."'], { italic: true, size: 18 }),
  sp(),
  H2('4.2 Artefacto vacío (versión final)'),
  P('Son dos formatos con responsables distintos. El primero lo llena **cada área** en su entrevista. El segundo lo consolida **el equipo de arquitectura**, porque una tensión no la declara un área: surge de comparar las posiciones. Se agregó una extensión mínima del metamodelo (Preocupacion, Tension y NivelInformacion), que el líder aprobó.'),
  table(['Formato', 'Columnas', 'Quién lo diligencia'], [
    ['Preocupacion', csv3e('Preocupacion_vacio').header.join(', '), 'Cada área, en la entrevista de la etapa 3'],
    ['Tension', csv3e('Tension_vacio').header.join(', '), 'Equipo de arquitectura, como insumo de la etapa 4'],
    ['Catalogos / POR_LEVANTAR', 'NivelInformacion, TipoPreocupacion, OrigenTension, TipoFuente, ModalidadEntrega / pregunta y destinatario', 'Sin cambios frente a 3.c'],
  ], [16, 60, 24], { size: 15 }),
  sp(),
  image(R('artefactos/3e_preocupaciones/img/iter2_metamodelo_extension.png'), { maxH: 420 }),
  Caption('Figura 3. BAC-09 – Extensión del metamodelo para preocupaciones y tensiones (Mermaid + ELK).'),
  H2('4.3 Levantamiento inicial con el enunciado'),
  H3('Preocupaciones registradas'),
  table(['id', 'Área', 'Tipo', 'Preocupación (literal)', 'Ubica en', 'Nivel'],
    pre.map(r => [r.id, areaN[r.area] || r.area, r.tipo, short(r.preocupacion, 150), r.ubicaEn, r.nivel]), [7, 13, 10, 48, 11, 11], { size: 14 }),
  sp(),
  P('Las columnas impactoDeclarado, modalidadesAfectadas y evidenciaQuePuedeAportar quedan en POR LEVANTAR en las cinco filas, porque el enunciado no las trae y se completan en la entrevista. Atención al cliente no tiene ninguna preocupación atribuida en el enunciado, y la pregunta está en POR_LEVANTAR.'),
  H3('Matriz de tensiones'),
  table(['id', 'Áreas', 'Punto de contradicción', 'Evidencia que la resolvería', 'Origen'],
    ten.map(r => [r.id, areaIds(r.areasEnTension), short(r.puntoDeContradiccion, 190), short(r.evidenciaQueLaResolveria, 170), r.origen === 'DECLARADA_EN_FUENTE' ? 'Declarada' : 'Derivada']),
    [7, 14, 38, 31, 10], { size: 14 }),
  sp(),
  H3('Vista: dónde ubica el problema cada área y en qué tensiona'),
  table(['Área', 'Ubica el problema en', 'Tensiones'],
    Object.entries(areaN).map(([id, n]) => {
      const p = pre.filter(x => x.area === id);
      const u = p.map(x => x.ubicaEn === 'POR LEVANTAR' ? 'POR LEVANTAR (plazo o decisión, no un componente)' : `${x.ubicaEn} ${nombre(x.ubicaEn)}`).join('; ') || 'POR LEVANTAR (sin afirmación en el enunciado)';
      const t = ten.filter(x => x.areasEnTension.includes(id)).map(x => x.id).join(', ') || '—';
      return [n, u, t];
    }), [20, 50, 30], { size: 15 }),
  sp(),
  image(R('artefactos/3e_preocupaciones/img/vista_final.png'), { maxH: 660 }),
  Caption('Figura 4. PV-PRE-2: tensiones (rombos), áreas (hexágonos) y lo que cada área señala como problema (Mermaid + ELK).'),
  H2('4.4 Evaluación del resultado'),
  H3('Qué funcionó'),
  B('**Capturó las tensiones del caso sin tomar partido.** Las cuatro posiciones aparecen en cita literal. TEN-01 y TEN-02 recogen el desacuerdo sobre dónde está el problema: conector, app o liquidación. TEN-03 y TEN-04 recogen la presión del plazo de Comercial frente a la pregunta de la gerencia. TEN-06 y TEN-07 recogen las disputas de conductores y marketplaces, que son las que golpean a Finanzas y Comercial.'),
  B('**Cada tensión termina en evidencia verificable, no en solución.** Por ejemplo, TEN-01 se resuelve comparando marcas de tiempo del estado en la app, a la salida del conector y en el marketplace para los mismos pedidos. Esto respeta la condición de la gerencia y conecta con la etapa 4 del proceso.'),
  B('**Corrigió al líder.** Señaló que el enunciado dice que Finanzas "afirma que liquidación no tiene cómo validar", no que "pida validar", y registró la cita textual.'),
  H3('Qué tuvimos que iterar o ajustar'),
  table(['Iteración 1 (problema)', 'Ajuste'], [
    ['Sobrediseño: 11 hojas y 5 enumeraciones nuevas, imposible de llenar para un área.', 'Dos formatos con responsables distintos (área / equipo de arquitectura) más catálogos. Se eliminaron TipoTension y Excluyencia.'],
    ['Matriz de 12 filas área × tipo, 7 de ellas vacías.', 'Solo se registran preocupaciones con dato. Lo que falta pasa a POR_LEVANTAR como pregunta.'],
    ['Faltaban tensiones del caso: disputas externas, tiempo real frente al correo de aliadas, plazo frente a la profundidad del problema.', 'Se pasó de 3 a 7 tensiones. Cada una indica si es DECLARADA en la fuente o DERIVADA por el analista (4 de 7 son derivadas y deben validarse).'],
    ['Faltaba la evidencia que permitiría validar cada posición.', 'Columnas evidenciaQuePuedeAportar (área) y evidenciaQueLaResolveria (tensión).'],
    ['Vista ilegible: citas largas dentro de los nodos.', 'Tabla Área × ubicación más un grafo ELK con etiquetas cortas.'],
    ['Los ids no coincidían con 3.d: SIS-03 y SIS-04 estaban invertidos.', 'Se alinearon con el catálogo de Integración, de modo que los formatos se cruzan por id.'],
    ['(Ajuste del equipo) ubicaEn apuntaba a INT-03, INT-05 e INT-10. INT-03 había cambiado de significado al partirse en la iteración 2 de 3.d, y esa asociación además era inferencia del asistente.', 'El equipo dejó ubicaEn solo con lo que el área nombra literalmente (SIS-03, SIS-04, SIS-05) y reorganizó la vista. La relación con intercambios se verifica en la etapa 3.'],
  ], [50, 50], { size: 15 }),
  sp(),
  P('**Criterio del equipo.** El asistente es fuerte en trazabilidad y prudencia, pero tiende a sobreestructurar y a extender el metamodelo. Necesitó dos rondas de dirección del líder y un ajuste manual para quedar utilizable. El límite real del artefacto es la fuente: las cinco preocupaciones vienen reportadas por el enunciado, no de entrevistas, así que todas son AFIRMACIÓN DE ÁREA. El formato está listo para pasarlas a ENTREVISTA o DOCUMENTO en la etapa 3.'),
];

// ---------- Anexo ----------
const anexo = [
  H1pb('Anexo A. Archivos en el repositorio'),
  P('Rama `workshop2-parte2` del repositorio Git del equipo. Todo es texto o formato abierto y se puede versionar.'),
  table(['Ruta', 'Contenido'], [
    ['asistente/configuracion.md', 'Nombre, descripción, instrucciones completas y lista de conocimiento del Project'],
    ['conocimiento/01…06', 'Archivos cargados como conocimiento del Project'],
    ['diagramas/metamodelo_integracion.mmd', 'BAC-09 del dominio de Integración (v1.1)'],
    ['artefactos/3c_vacio/', 'Respuestas del asistente (v1.0 y v1.1), CSV por hoja, .xlsx vacío y plantilla .mmd'],
    ['artefactos/3d_diligenciado/', 'Respuestas de las iteraciones 1 y 2, CSV, .xlsx diligenciado y mapa .mmd'],
    ['artefactos/3e_preocupaciones/', 'Respuestas de las iteraciones 1 y 2, CSV, .xlsx vacío y diligenciado, vistas .mmd'],
    ['scripts/', 'Generación de .xlsx desde CSV y de este documento'],
  ], [40, 60], { size: 16 }),
];

// ---------- Documento ----------
const doc = new Document({
  creator: 'Equipo ARTI 4104', title: 'Workshop 2 – Parte II – Asistente Arquitecto Junior RutaExpress',
  styles: h.styles, numbering: h.numbering,
  features: { updateFields: true },
  sections: [{
    properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1134, bottom: 1134, left: h.MARGIN, right: h.MARGIN } } },
    headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: NAVY, space: 1 } }, children: [new TextRun({ text: 'ARTI 4104 – Fundamentos de Arquitectura · Workshop 2 – Parte II', bold: true, size: 16, color: NAVY })] })] }) },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ children: [PageNumber.CURRENT], size: 16 }), new TextRun({ text: '   Información Pública', size: 16, color: '808080' })] })] }) },
    children: [...portada, ...insumos, ...configuracion, ...art3c, ...art3d, ...art3e, ...anexo],
  }],
});

const out = R('entregable/Workshop2_ParteII_Punto3_Asistente.docx');
Packer.toBuffer(doc).then(b => { fs.writeFileSync(out, b); console.log('OK', out); });
