# RutaExpress – Toolbox y metamodelo del dominio de Integración

Documento de contexto para el asistente "Arquitecto Junior RutaExpress". Resume las decisiones del equipo de arquitectura (puntos 1 y 2 del Workshop 2 – Parte II). Si algo de este documento entra en conflicto con lo que pida el arquitecto líder, se pregunta al arquitecto líder.

## 1. Decisiones de toolbox

RutaExpress no tiene herramienta de arquitectura y no va a comprar una. Por eso el toolbox usa herramientas sin costo y formatos abiertos que cualquier área pueda abrir.

| Elemento | Decisión | Por qué en RutaExpress |
|---|---|---|
| Repositorio central | Repositorio Git privado `arquitectura-rutaexpress` (un solo repositorio, carpetas por etapa del proceso). Es la única fuente de verdad. | Versiona y deja trazabilidad de cambios sin licencias. El estudio dura 10 semanas y muchas personas aportan versiones. Los diagramas como código (`.mmd`) se pueden comparar entre versiones. |
| Distribución a las áreas | Los formatos `.xlsx` se envían a las áreas y se reciben por la carpeta compartida corporativa (por confirmar con TI cuál usa la empresa). La versión válida se sube al repositorio. | Operaciones, Finanzas, Comercial y Atención no trabajan con Git, pero sí con hojas de cálculo. |
| Editor de diagramas | Mermaid con motor de layout ELK (`layout: elk`). Los metamodelos van como `classDiagram` y los mapas como `flowchart`. | Es texto plano, gratuito y versionable. Reemplaza al editor UML/Ecore que no existe en la empresa. ELK ordena grafos densos con menos cruces de líneas (guía P8 de Villalobos). |
| Editor de formatos | Excel / Google Sheets. Hay una hoja por concepto, con llaves entre hojas (lenguaje de formatos, BAC-14). | Las áreas pueden diligenciarlos directamente y luego se pueden consolidar. |
| Documento consolidado | Word (`.docx`). | Es el formato de entrega a la gerencia y a la universidad. |

**Cuerpos de conocimiento por dominio**

| Dominio | Cuerpo de conocimiento | Uso concreto |
|---|---|---|
| Negocio | BPMN 2.0 | Representar el recorrido del pedido en las 3 modalidades, incluidos los reingresos a ruteo y las excepciones. |
| Aplicaciones | ArchiMate 3.2, capa de aplicación (solo el vocabulario) | Nombrar sistemas, funciones e interfaces de forma homogénea, sin herramienta ArchiMate. |
| Datos | DAMA-DMBOK2 (calidad, linaje, responsable del dato) | Seguir los 5 grupos de información y dónde se pierden o desfasan. |
| Integración | Enterprise Integration Patterns (Hohpe y Woolf) | Describir los intercambios con un vocabulario estándar: traductor de mensajes, canal, confirmación y entrega garantizada. |
| Infraestructura | No hay uno específico. El caso no describe infraestructura. | Se levanta solo lo que afecte la oportunidad de los estados, como latencia o disponibilidad del conector. |
| Transversal | Villalobos, *Modelos y Metamodelos* (v1.2) | Notación y método de metamodelos (BAC-09 a BAC-16), formatos y vistas. |

## 2. Metamodelo del dominio de Integración (AS-IS)

**Por qué este dominio.** Tres de las cuatro tensiones del caso caen sobre intercambios entre sistemas y terceros:

- Operaciones señala al conector de terceros.
- Producto señala la confirmación de estado de la app hacia el marketplace.
- Finanzas dice que liquidación no puede validar entregas con lo que recibe aguas arriba.

Además, el SLA de trazabilidad en tiempo real depende de que los estados viajen entre sistemas.

**Propósito.** Guiar el levantamiento de **qué información de estado del pedido viaja entre quién, por qué mecanismo, con qué oportunidad, y dónde se reportan problemas**. Altura: el intercambio. No baja a campos de mensaje ni a protocolos.

### 2.1 Diagrama (BAC-09) – ver `diagramas/metamodelo_integracion.mmd`

### 2.2 Conceptos (BAC-10)

| Concepto | Descripción | Sinónimos |
|---|---|---|
| RutaExpress | Raíz. Representa el ecosistema de integración de la empresa. Tiene una sola instancia. | Empresa |
| Extremo (abstracto) | Cualquier parte que envía o recibe información en un intercambio. | Participante, endpoint |
| Sistema | Aplicación interna de RutaExpress. | Aplicación, plataforma |
| ParticipanteExterno | Empresa externa que intercambia información con RutaExpress (marketplace o transportadora aliada). | Tercero, aliado, cliente B2B |
| Area | Equipo interno que recibe o aporta información, o que reporta problemas. | Equipo, dependencia |
| Intercambio | Flujo de información dirigido de un extremo origen a un extremo destino. | Integración, interfaz, flujo |
| GrupoInformacion | Uno de los grupos de datos del caso (pedido, ruteo y asignación, evidencia, terceros, liquidación). | Grupo de datos |
| EstadoPedido | Estado del ciclo de vida del pedido que un intercambio comunica. | Estatus |
| ModalidadEntrega | Flota propia, afiliado o transportadora aliada. | Tipo de entrega |
| Problema | Falla o desfase reportado sobre un intercambio. | Hallazgo, incidente |
| Fuente | Origen verificable del dato registrado: documento, entrevista, registro de sistema o enunciado. | Evidencia |

### 2.3 Atributos y relaciones (BAC-11)

| Clase | Atributo / Relación | Descripción |
|---|---|---|
| RutaExpress | sistemas, marketplaces, aliados, areas, intercambios, gruposInformacion, estados, modalidades, fuentes (*) | Agrupaciones desde la raíz. Los roles `marketplaces` y `aliados` distinguen a los participantes externos sin usar un atributo de tipo (guía P2). |
| Extremo | id: EString; nombre: EString | Identificador único y nombre usado en la empresa. |
| Sistema | funcion: EString | Qué hace el sistema en el flujo del pedido. |
| Sistema | tecnologia: EString | Plataforma o tecnología, solo si una fuente la menciona. |
| Sistema | responsable (0..1) → Area | Área dueña del sistema. |
| ParticipanteExterno | pais: EString | País donde opera con RutaExpress (Colombia o Perú). |
| Area | lider: EString | Persona o cargo líder, que es el interlocutor para el levantamiento. |
| Intercambio | id: EString; nombre: EString | Identificador (INT-nn) y nombre corto. |
| Intercambio | mecanismo: Mecanismo | Cómo viaja la información. |
| Intercambio | oportunidad: Oportunidad | Si la información llega en tiempo real o diferida. |
| Intercambio | latenciaObservada: EString | Retraso observado, en texto, con su fuente. |
| Intercambio | transformaFormato: EBoolean | Si el intercambio traduce el formato entre origen y destino. |
| Intercambio | volumenDiario: EInt | Cantidad de mensajes o pedidos al día. |
| Intercambio | origen (1), destino (1) → Extremo | Dirección del flujo. |
| Intercambio | transporta (*) → GrupoInformacion | Grupos de información que viajan. |
| Intercambio | estadosReportados (*) → EstadoPedido | Estados del pedido que comunica. |
| Intercambio | modalidades (*) → ModalidadEntrega | Modalidades en las que ocurre. |
| Intercambio | problemas (*) → Problema | Problemas reportados sobre el intercambio. |
| Intercambio | fuentes (*) → Fuente | De dónde se obtuvo la información. |
| GrupoInformacion | id, nombre, descripcion: EString; productor (0..1) → Sistema | Sistema que genera el grupo de información. |
| EstadoPedido | nombre, descripcion: EString; siguientes (*) → EstadoPedido | Transiciones posibles, incluidos los reingresos. |
| ModalidadEntrega | nombre: EString | — |
| Problema | id, descripcion, efecto: EString | Qué falla y qué consecuencia tiene. |
| Problema | reportadoPor (*) → Area | Áreas que lo señalan. |
| Problema | afectados (*) → Sistema | Sistemas que sufren el efecto aguas abajo. |
| Problema | fuentes (*) → Fuente | Evidencia del problema. |
| Fuente | id, nombre: EString; tipo: TipoFuente; fecha: EDate | Trazabilidad de cada dato. |

**Enumeraciones**

- Mecanismo = {INTEGRACION_SISTEMA, CONECTOR_TERCEROS, CORREO_ELECTRONICO, CONSULTA_MANUAL, POR_LEVANTAR}
- Oportunidad = {TIEMPO_REAL, DIFERIDA, POR_LEVANTAR}
- TipoFuente = {ENUNCIADO_CASO, DOCUMENTO, ENTREVISTA, REGISTRO_SISTEMA}

### 2.4 Restricciones (BAC-12)

| ID | Descripción |
|---|---|
| R1 | El origen y el destino de un Intercambio son distintos. |
| R2 | Todo Intercambio transporta al menos un GrupoInformacion y tiene al menos una Fuente. Todo Problema tiene al menos una Fuente. |
| R3 | Si mecanismo es CORREO_ELECTRONICO o CONSULTA_MANUAL, la oportunidad no puede ser TIEMPO_REAL. |
| R4 | Si un extremo del Intercambio pertenece a `aliados`, sus modalidades incluyen "Transportadora aliada". |
| R5 | Un Problema cuyas fuentes son solo ENUNCIADO_CASO o la afirmación de un área es una **hipótesis**. Solo se confirma con REGISTRO_SISTEMA o con DOCUMENTO. |
| R6 | Un atributo sin dato en una fuente se registra como `POR LEVANTAR`. Nunca se infiere. |

### 2.5 Puntos de vista y lenguajes (BAC-16, BAC-13, BAC-14)

| ID | Punto de vista | Regla | Lenguaje |
|---|---|---|---|
| PV-INT-1 | Edición: el metamodelo completo | Ninguna | Formato Excel (BAC-14). Lleva una hoja por concepto con llaves `id`, una hoja de catálogos de enumeraciones y una hoja de control "POR LEVANTAR". |
| PV-INT-2 | Consulta: Extremo + Intercambio + Problema | Ninguna | Mapa de integración en Mermaid `flowchart` con ELK (BAC-13). |

**Lenguaje gráfico (BAC-13) del mapa de integración**

| Elemento | Representación |
|---|---|
| Sistema | Rectángulo. |
| ParticipanteExterno | Rectángulo redondeado (estadio). |
| Area | Hexágono. |
| Intercambio | Flecha de origen a destino, rotulada con `id`, grupos transportados y mecanismo. |
| Mecanismo CORREO_ELECTRONICO o CONSULTA_MANUAL | Flecha punteada. |
| Intercambio con Problema | Flecha roja gruesa. |
