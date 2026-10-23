# Iteración 2 – Formato de preocupaciones y matriz de tensiones (F5)

Para el arquitecto líder. Nada de esto está aprobado ni validado hasta que usted lo decida (R1). Releí los conocimientos 05 y 06 (metamodelo v1.1, con R7 y R8 y `RutaExpress.problemas`) y el 03.

## 0. Qué cambió frente a la iteración 1

| # | Su ajuste | Cómo quedó |
|---|---|---|
| 1 | Simplificar y dividir | Dos artefactos: una hoja de preocupaciones (10 columnas, la llena cada área) y una matriz de tensiones (9 columnas, la consolida el equipo de arquitectura). Solo se conservan `Catalogos` y `POR_LEVANTAR`. Se eliminan TipoTension y Excluyencia. |
| 2 | Extensión mínima | Preocupacion, Tension y NivelInformacion, con BAC-09 en `iter2_metamodelo_extension.mmd`. Sus columnas exigen además dos enumeraciones, TipoPreocupacion y OrigenTension (pregunta Q-28). Son 3 enumeraciones nuevas, no 5. |
| 3 | Ids alineados con 3.d | ARE-01 a ARE-06 y SIS-01 a SIS-05 con los nombres que usted dio. Cambió el orden de SIS-03 y SIS-04 respecto de la iteración 1. La cita de Fuente sigue el estilo de `Intercambio.csv`: `FUE-01 §Caso de estudio, párr. N: «…»`. Los INT usados están abajo. |
| 4 | Tensiones faltantes | Pasan de 3 a 7: las 4 que pidió, más TEN-01 (Operaciones vs Producto) y TEN-04 (Comercial vs Gerencia), que vienen de la iteración 1. |
| 5 | Vista ilegible | Dos vistas: tabla Área × ubicación y grafo con etiquetas cortas. Las citas largas salieron del grafo. |
| 6 | Verificar con el 03 | Sección 4.3. |

Dos precisiones sobre sus instrucciones:

- Usted dice que Finanzas "pide" validar entregas en liquidación. El enunciado dice que Finanzas afirma que liquidación "no tiene cómo validar entregas de forma independiente". Registré la cita literal, no una petición (TEN-02).
- Las cuatro tensiones que pidió no incluyen una posición del área en dos casos (las disputas externas). Dejé la posición B en POR LEVANTAR en vez de atribuirla.

---

## 1. Propósito del artefacto y conceptos que cubre

**Propósito.** Recoger sin juzgar la preocupación de negocio o de TI de cada área (formato a), y consolidar dónde las posiciones difieren y qué dato las resolvería (matriz b). La matriz no propone soluciones ni elige entre posiciones (R4, R6).

**Conceptos vigentes que usa (v1.1):** Area, Sistema, Intercambio, ModalidadEntrega, Fuente, Extremo.

**Conceptos nuevos aprobados por usted:** Preocupacion, Tension, NivelInformacion. **Añadidos por sus columnas:** TipoPreocupacion y OrigenTension.

| ID | Punto de vista | Regla | Lenguaje |
|---|---|---|---|
| PV-PRE-1a | Edición: Preocupacion | Ninguna | Formato Excel/CSV, una hoja, la llena el área |
| PV-PRE-1b | Edición: Tension | Ninguna | Formato Excel/CSV, una hoja, la llena el equipo de arquitectura |
| PV-PRE-2 | Consulta: Area, Sistema, Intercambio y Tension | Solo lo que aparece en `ubicaEn` o en una Tension | Tabla Área × ubicación y grafo Mermaid `flowchart` con ELK |

---

## 2. El artefacto

### 2.1 Formato vacío

Archivos: `csv/Preocupacion_vacio.csv` y `csv/Tension_vacio.csv` (solo encabezados). En el libro Excel van como dos hojas más `Catalogos` y `POR_LEVANTAR`.

**Preocupacion** (la llena cada área en su entrevista). Una fila por preocupación.

| Columna | Qué se escribe | Tipo |
|---|---|---|
| id | PRE-nn | EString |
| area | ARE-nn | llave → Area |
| tipo | NEGOCIO o TI | TipoPreocupacion |
| preocupacion | Texto literal de lo que dice el área | EString |
| ubicaEn | Ids SIS-nn o INT-nn separados por `;`, o POR LEVANTAR | llaves → Sistema, Intercambio |
| impactoDeclarado | Efecto que el área dice que tiene, o POR LEVANTAR | EString |
| modalidadesAfectadas | Flota propia, Afiliado, Transportadora aliada, separados por `;`, o POR LEVANTAR | llaves → ModalidadEntrega |
| evidenciaQuePuedeAportar | Registro o documento que el área puede entregar, o POR LEVANTAR | EString |
| nivel | HECHO, AFIRMACION_AREA o HIPOTESIS | NivelInformacion |
| Fuente | `FUE-nn §sección: «cita»` | cita |

**Tension** (la consolida el equipo de arquitectura, no las áreas).

| Columna | Qué se escribe | Tipo |
|---|---|---|
| id | TEN-nn | EString |
| areasEnTension | ARE-nn separados por `;`, o POR LEVANTAR | llaves → Area |
| posicionA, posicionB | La posición con su id PRE-nn y su cita, o POR LEVANTAR si el enunciado no la atribuye | EString |
| puntoDeContradiccion | En qué difieren y si se sabe que se excluyen | EString |
| hechoDelCasoRelacionado | Cita del enunciado o documento que toca la tensión | EString |
| evidenciaQueLaResolveria | Dato o registro que permitiría saber qué posición se sostiene. No es una acción de cambio | EString |
| origen | DECLARADA_EN_FUENTE o DERIVADA_POR_ANALISTA | OrigenTension |
| Fuente | `FUE-nn §sección: «cita»` | cita |

**Por qué esta estructura**

1. La preocupación va literal y separada de `nivel`, para que una opinión de un área nunca quede como causa confirmada (R3).
2. Todo lo que el área puede responder cabe en una fila. Las tres columnas de detalle (`impactoDeclarado`, `modalidadesAfectadas`, `evidenciaQuePuedeAportar`) preparan la verificación posterior sin pedirle al área que juzgue a otra.
3. `ubicaEn` usa los mismos ids del levantamiento de Integración, así que la ubicación de cada área se puede comparar y dibujar.
4. Las tensiones las arma el equipo, no las áreas: cada posición se copia de `Preocupacion` con su cita, y `puntoDeContradiccion` dice en qué difieren sin decidir quién tiene razón.
5. `origen` separa lo que la fuente declara de lo que lee el analista.

### 2.2 Levantamiento inicial (solo con el enunciado)

Archivos: `csv/Preocupacion.csv` (5 filas), `csv/Tension.csv` (7 filas). Los textos completos están en los CSV; aquí van resumidos.

Las afirmaciones llegan **indirectas**: el enunciado las reporta ("Operaciones dice que…"). No hay entrevista con ninguna área. Por eso las 5 quedan en AFIRMACION_AREA con Fuente `FUE-01 §Caso de estudio, párr. 5`.

**Preocupacion**

| id | area | tipo | preocupacion (literal, abreviada) | ubicaEn | nivel |
|---|---|---|---|---|---|
| PRE-01 | ARE-02 Operaciones | TI | «el problema es el conector de terceros, que traduce mal y tarde» | SIS-03; INT-03 | AFIRMACION_AREA |
| PRE-02 | ARE-03 Producto | TI | «el problema es que la app de conductor no fuerza actualización de estado en tiempo real» | SIS-04; INT-05 | AFIRMACION_AREA |
| PRE-03 | ARE-04 Finanzas | TI | «el verdadero problema es que liquidación no tiene cómo validar entregas de forma independiente» | SIS-05; INT-10 | AFIRMACION_AREA |
| PRE-04 | ARE-05 Comercial | NEGOCIO | «presiona porque el contrato se firma en 10 semanas y no puede esperar un rediseño completo» | POR LEVANTAR | AFIRMACION_AREA |
| PRE-05 | ARE-06 Gerencia | NEGOCIO | «No quiero ideas de soluciones. Quiero saber cómo van a abordar el problema […]» | POR LEVANTAR | AFIRMACION_AREA |

`impactoDeclarado`, `modalidadesAfectadas` y `evidenciaQuePuedeAportar` están en POR LEVANTAR en las 5 filas: el enunciado no atribuye ninguno a un área. PRE-05 es una condición de la gerencia, no una afirmación sobre la causa.

**INT usados en `ubicaEn`.** Solo uso los INT de `Intercambio.csv` cuya cita literal respalda la ubicación:

| INT | Se usa en | Qué respalda su cita |
|---|---|---|
| INT-03 | PRE-01 | El pedido a la aliada se envía «a través de un conector de terceros que traduce el formato interno». |
| INT-05 | PRE-02 | El conductor puede marcar la entrega como completada en la app sin que el marketplace reciba la confirmación a tiempo. |
| INT-10 | PRE-03 | El sistema de liquidación consolida lo anterior y sufre la inconsistencia aguas arriba. |

No usé INT-06 (retorno de estados por el conector) para PRE-01: su cita no respalda lo que Operaciones dice de "tarde" (pregunta Q-02). INT-03 e INT-10 pueden cambiar por R7 y R8; si la revisión de 3.d los divide, hay que actualizar `ubicaEn` (Q-25).

**Tension** (resumen; el texto completo, las citas y la evidencia están en `csv/Tension.csv`)

| id | areasEnTension | Posición A frente a posición B | origen |
|---|---|---|---|
| TEN-01 | ARE-02; ARE-03 | Operaciones ubica el problema en el conector (SIS-03). Producto lo ubica en la app (SIS-04). Ambas hablan de la oportunidad del estado. | DECLARADA_EN_FUENTE |
| TEN-02 | ARE-04; ARE-02; ARE-03 | Finanzas: liquidación no tiene cómo validar (aguas abajo). Operaciones y Producto: el problema está en SIS-03 y SIS-04 (aguas arriba). | DERIVADA_POR_ANALISTA |
| TEN-03 | ARE-05; ARE-02; ARE-03; ARE-04 | Comercial: 10 semanas, sin rediseño completo. Operaciones, Producto y Finanzas: las ubicaciones de PRE-01 a PRE-03. La profundidad de cada una es POR LEVANTAR. | DERIVADA_POR_ANALISTA |
| TEN-04 | ARE-05; ARE-06 | Comercial presenta el plazo como dato. La gerencia pregunta si es razonable. | DERIVADA_POR_ANALISTA |
| TEN-05 | POR LEVANTAR | Requisito contractual de trazabilidad en tiempo real para las tres modalidades, frente al hecho de que una aliada puede reportar por correo (INT-07). | DERIVADA_POR_ANALISTA |
| TEN-06 | ARE-04 (toca) | Conductores reclaman pagos por entregas que el sistema no reconoce. Posición B: POR LEVANTAR. | DECLARADA_EN_FUENTE |
| TEN-07 | ARE-05; ARE-04 (tocan) | Marketplaces disputan cobros por SLAs que según ellos no se cumplieron. Posición B: POR LEVANTAR. | DECLARADA_EN_FUENTE |

Notas:

- **Posiciones no atribuidas.** En TEN-05, TEN-06 y TEN-07 el enunciado no atribuye una posición a un área. En TEN-06 y TEN-07 la posición A es la de un tercero (conductores, marketplaces) y la B queda POR LEVANTAR. En TEN-05 la posición A es el requisito contractual y la B es un hecho del caso.
- **TEN-05.** `areasEnTension` queda en POR LEVANTAR porque el enunciado no dice qué área responde por el requisito ni por la relación con aliadas (Q-19).
- **TEN-03.** Ninguna área dice que pida un rediseño. La tensión es entre el plazo de Comercial y lo que podrían implicar las ubicaciones, que el enunciado no mide. Por eso es DERIVADA.
- **Hechos del caso que tocan las tensiones** (columna `hechoDelCasoRelacionado`): el conector «traduce y a veces pierde información»; «una falla en la integración» sin sistema nombrado; la aliada que reporta por correo; liquidación como «el que más sufre» la inconsistencia aguas arriba; los reclamos de conductores y las disputas de marketplaces. Ninguno confirma una afirmación de área.
- **`evidenciaQueLaResolveria`.** Describe registros que existirían (marcas de tiempo por estado, listado de reclamos, cumplimiento del SLA, texto del contrato). No sé si existen, y lo pregunto en Q-23.

**Hoja `Catalogos`** (`csv/Catalogos.csv`, 14 filas): NivelInformacion (3), TipoPreocupacion (2), OrigenTension (2), TipoFuente (4, vigente) y los 3 valores de ModalidadEntrega que se admiten en `modalidadesAfectadas`.

**Hoja `POR_LEVANTAR`** (`csv/POR_LEVANTAR.csv`, 28 filas): ver la parte 3.

### 2.3 Vista 1: tabla Área × ubicación

`X` marca dónde ubica el problema cada área, según `ubicaEn`. Solo se muestran los sistemas e intercambios que alguna área ubicó.

| Área | Preocupación | SIS-03 Conector | SIS-04 App | SIS-05 Liquidación | INT-03 | INT-05 | INT-10 | Sin ubicación |
|---|---|---|---|---|---|---|---|---|
| ARE-01 Centro de atención al cliente | sin preocupación registrada | | | | | | | POR LEVANTAR |
| ARE-02 Operaciones | PRE-01 | X | | | X | | | |
| ARE-03 Producto | PRE-02 | | X | | | X | | |
| ARE-04 Finanzas | PRE-03 | | | X | | | X | |
| ARE-05 Comercial | PRE-04 | | | | | | | POR LEVANTAR |
| ARE-06 Gerencia | PRE-05 | | | | | | | POR LEVANTAR (pide determinarlo) |

Se lee así: no hay ninguna celda marcada por dos áreas. SIS-01, SIS-02 e INT-01, INT-02, INT-04, INT-06 a INT-09 no los ubica ninguna área. Esa ausencia es un dato del enunciado, no un descarte.

### 2.4 Vista 2: grafo de áreas, ubicaciones y tensiones

Archivo: `iter2_vista.mmd` (Mermaid puro con frontmatter ELK). Etiquetas de máximo 5 palabras; las citas están en los CSV. No pude renderizarlo en este entorno; revisé la sintaxis a mano y los 21 enlaces tienen su `linkStyle` (0 a 5 "ubica", 6 a 20 tensión).

| Elemento | Representación | Origen |
|---|---|---|
| Area | Hexágono | Vigente (PV-INT-2) |
| Sistema | Rectángulo | Vigente (PV-INT-2) |
| Intercambio (como destino de "ubica") | Rectángulo con barras laterales | PROPUESTA |
| Tension | Rombo con borde naranja, con su id y 3 a 5 palabras | PROPUESTA |
| El área ubica el problema | Flecha rotulada "ubica" | PROPUESTA |
| El área participa en o es tocada por la tensión | Línea gruesa naranja | PROPUESTA |
| Área sin preocupación registrada | Borde punteado | PROPUESTA |

Evité la flecha punteada y la flecha roja gruesa porque PV-INT-2 las reserva a Intercambio.

---

## 3. POR LEVANTAR / Preguntas

La hoja completa es `csv/POR_LEVANTAR.csv` (28 filas, columnas q; hoja; id; campo; pregunta; destinatario). Las preguntas pasan por usted, que decide a quién se envían (R1). Resumen por tema:

| Tema | Filas | Destinatarios |
|---|---|---|
| Detalle de cada preocupación (impacto, modalidades, evidencia, significado de los términos) | 8 | Operaciones, Producto, Finanzas, Comercial y Gerencia |
| Preocupaciones que faltan (Atención al cliente completa; negocio de Operaciones, Producto y Finanzas; TI de Comercial y Gerencia) | 6 | Cada área |
| Tensiones: posiciones no atribuidas, excluyencia, profundidad, áreas de TEN-05, texto del SLA, existencia de los registros | 9 | Áreas involucradas, líderes de aplicaciones y de datos, y usted |
| Metamodelo y repositorio: ARE-06, INT-03 e INT-10 frente a R7 y R8, entrevistas como fuente, ids en una celda, enumeraciones | 5 | Usted |

---

## 4. Control de conformidad

### 4.1 Restricciones verificadas

**Metamodelo v1.1 (BAC-12)**

| Restricción | Resultado |
|---|---|
| R1 a R4 (Intercambio) | No aplican: este artefacto no crea ni modifica Intercambios. |
| R5 (Problema como hipótesis) | No aplica: no se crea ningún Problema. Como R5, ninguna preocupación está en HECHO y todas son AFIRMACION_AREA. |
| R6 (sin dato, POR LEVANTAR) | Cumple: no se infirió ningún valor; los campos sin fuente están en POR LEVANTAR. |
| R7 (conector como Sistema) | Cumple: el conector se ubica como SIS-03. INT-03 pasa por el conector y R7 pide dos intercambios; es un tema de 3.d (Q-25). |
| R8 (un origen por Intercambio) | INT-10 consolida varios orígenes; es un tema de 3.d (Q-25). No lo modifico. |

**Restricciones propuestas para la extensión**

| ID | Restricción | Resultado |
|---|---|---|
| N1 | Toda Preocupacion tiene un Area y al menos una Fuente. | Cumple en las 5 filas. |
| N2 | Una Preocupacion con nivel HECHO exige Fuente REGISTRO_SISTEMA o DOCUMENTO. | Cumple: ninguna fila es HECHO y todas las fuentes son ENUNCIADO_CASO. |
| N3 | `ubicaEn` solo lleva ids existentes en 3.d cuya cita literal respalde la ubicación. Si no, POR LEVANTAR. | Cumple: SIS-03, SIS-04, SIS-05, INT-03, INT-05 e INT-10. Los ids SIS-nn vienen de su mensaje y los INT-nn de `Intercambio.csv`. |
| N4 | Una Tension tiene al menos una Fuente. Una posición que el enunciado no atribuye se escribe POR LEVANTAR. | Cumple en las 7 filas. |
| N5 | Una Tension DECLARADA_EN_FUENTE cita la frase que afirma el desacuerdo o la disputa. | Cumple en TEN-01, TEN-06 y TEN-07. Las otras 4 son DERIVADA_POR_ANALISTA. |
| N6 | `evidenciaQueLaResolveria` describe un dato o registro, nunca una acción de cambio (R4 del rol). | Cumple en las 7 filas. |

**Formato (F1, BAC-14)**

- Cada archivo tiene la columna `Fuente`, con cita de FUE-01, sección y texto.
- Los encabezados coinciden con las columnas que usted fijó, en el mismo orden.
- Las dos hojas vacías tienen 10 y 9 columnas.
- Las celdas con ids múltiples (`ubicaEn`, `modalidadesAfectadas`, `areasEnTension`) llevan ids separados por `;` en una celda, no una tabla puente por relación múltiple. Es desviación de F1 que usted pidió con esta estructura; la dejo registrada en Q-27.
- Tension no tiene una relación directa a Preocupacion. La conexión es el id PRE-nn escrito dentro de `posicionA` y `posicionB`. Es una llave blanda: si una preocupación cambia de id, hay que corregir la tensión a mano.

### 4.2 Brechas de metamodelo

| ID | Brecha | Estado |
|---|---|---|
| B-1 | Preocupacion y Tension no estaban en el metamodelo. | Resuelta: aprobadas por usted; BAC-09 en `iter2_metamodelo_extension.mmd`. |
| B-2 | El nivel de información de R3 no era un atributo. | Resuelta: NivelInformacion con HECHO, AFIRMACION_AREA e HIPOTESIS. |
| B-3 | Sus columnas `tipo` y `origen` necesitan enumeraciones. | Abierta: propongo TipoPreocupacion y OrigenTension (Q-28). |
| B-4 | La gerencia no está en el levantamiento de Integración. | Abierta: se agrega como ARE-06 por su indicación, sin líder (Q-24). |
| B-5 | Los hechos del caso (disputas externas, reporte por correo) no tienen hoja propia. | Se registran en `hechoDelCasoRelacionado`. Si quiere separarlos, es otra decisión de metamodelo. |
| B-6 | No hay concepto para un contrato, un SLA o un plazo (caso de Comercial). | Abierta: PRE-04 y PRE-05 quedan con `ubicaEn` en POR LEVANTAR. |

### 4.3 Verificación contra el conocimiento 03

| Lo que pide el 03 | Resultado |
|---|---|
| 3.e: un artefacto para recolectar preocupaciones de negocio y TI de los distintos equipos | Cumple en estructura: `tipo` separa NEGOCIO y TI y hay una fila por preocupación de cada área. En datos cubre 5 de las 12 combinaciones (6 áreas por 2 tipos). Las 7 restantes están en POR LEVANTAR. |
| 3.c: compatible con las decisiones de toolbox | Cumple: CSV y Excel, Mermaid con ELK, rutas para el repositorio. |
| 3.c y rúbrica: conforme al metamodelo | Cumple con la extensión que usted aprobó; abiertas B-3, B-4 y B-6. |
| 3.d y rúbrica: consistente con el enunciado, sin supuestos inventados | Cumple: cada fila cita el párrafo y el texto; ninguna cifra, latencia, tecnología ni nombre. |
| Rúbrica: captura las tensiones entre áreas descritas en el caso | Las 4 posiciones de áreas y la condición de la gerencia están registradas. Las tensiones cubren las ubicaciones distintas, el plazo, las disputas externas y el requisito de tiempo real frente al reporte por correo. |
| 3.e: evaluar el resultado e iterar | Esa evaluación la hace el equipo. Lo que cambió entre iteraciones está en la parte 0. |
| 3.e: "si el asistente no logra incluir datos, seleccionar un dominio" | No aplica: el enunciado permite un levantamiento inicial. |
| Alcance del asistente (responsabilidades) | Sin soluciones (R4), sin tomar partido (R6), todo dato con fuente o POR LEVANTAR (R2). |

### 4.4 Límites

- No se propuso ninguna solución ni se tomó posición sobre firmar el contrato.
- Las posiciones B de TEN-06 y TEN-07 están vacías por diseño. Si el enunciado no las atribuye, no las invento.
- La clasificación TI de PRE-03 es mía y está por validar con Finanzas.
- Los INT-nn pueden cambiar si 3.d está en revisión.
