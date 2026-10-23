Recibido. Incorporé a la plantilla las decisiones que aprobaste y la confirmación del conocimiento 06. Esta es la versión v1.1 VACÍA: solo encabezados, sin datos del caso. Las preguntas P7, P8 y P9 quedan abiertas y no las resolví.

# 1. Propósito del artefacto y conceptos que cubre

**Propósito.** Plantilla de levantamiento v1.1 del dominio de Integración (PV-INT-1, BAC-14), vacía, con los ajustes que decidiste. Es la base para diligenciar con FUE-01 (entrega 3d) y, después, con las áreas.

**Conceptos cubiertos.** Los 11 del metamodelo (conocimiento 06): RutaExpress, Extremo (abstracto), Sistema, ParticipanteExterno, Area, Intercambio, GrupoInformacion, EstadoPedido, ModalidadEntrega, Problema y Fuente. El libro mantiene 23 hojas: `00_GUIA`, 9 de concepto, 11 puente, `Catalogos` y `POR_LEVANTAR`.

**Decisiones incorporadas.**
- B4/P2: Sistema, ParticipanteExterno y Area especializan a Extremo (06). Ids `SIS-nn`, `EXT-nn`, `ARE-nn`, únicos entre las tres hojas.
- B5/P1: la raíz no tiene hoja; solo `RutaExpress_marketplaces` y `RutaExpress_aliados`.
- B1/P3: `Fuente` es columna de trazabilidad del formato; el metamodelo no se toca.
- B3/P4: `nombre` es la llave de `EstadoPedido` y `ModalidadEntrega`.
- B7/P5: ausencia confirmada se escribe `NO APLICA (Fuente-id)`. `POR LEVANTAR` significa que no se sabe.
- B6/P6: la flecha punteada, roja y gruesa queda aprobada.
- B2/P10: nueva columna `Nivel` junto a `Fuente`.

# 2. El artefacto

## 2.1 Encabezados de cada hoja (CSV, UTF-8, separador coma)

Archivos en `artefactos/3c_vacio/csv/<Hoja>.csv`. Solo encabezados; `Catalogos` lleva sus valores.

```text
00_GUIA.csv: Hoja,Campo,"Tipo o destino",Card.,"Cómo se llena"
Sistema.csv: id,nombre,funcion,tecnologia,responsable,Fuente,Nivel
ParticipanteExterno.csv: id,nombre,pais,Fuente,Nivel
Area.csv: id,nombre,lider,Fuente,Nivel
Intercambio.csv: id,nombre,mecanismo,oportunidad,latenciaObservada,transformaFormato,volumenDiario,origen,destino,Fuente,Nivel
GrupoInformacion.csv: id,nombre,descripcion,productor,Fuente,Nivel
EstadoPedido.csv: nombre,descripcion,Fuente,Nivel
ModalidadEntrega.csv: nombre,Fuente,Nivel
Problema.csv: id,descripcion,efecto,Fuente,Nivel
Fuente.csv: id,nombre,tipo,fecha
RutaExpress_marketplaces.csv: marketplaces,Fuente,Nivel
RutaExpress_aliados.csv: aliados,Fuente,Nivel
Intercambio_transporta.csv: Intercambio,transporta,Fuente,Nivel
Intercambio_estadosReportados.csv: Intercambio,estadosReportados,Fuente,Nivel
Intercambio_modalidades.csv: Intercambio,modalidades,Fuente,Nivel
Intercambio_problemas.csv: Intercambio,problemas,Fuente,Nivel
Intercambio_fuentes.csv: Intercambio,fuentes
Problema_reportadoPor.csv: Problema,reportadoPor,Fuente,Nivel
Problema_afectados.csv: Problema,afectados,Fuente,Nivel
Problema_fuentes.csv: Problema,fuentes
EstadoPedido_siguientes.csv: EstadoPedido,siguientes,Fuente,Nivel
POR_LEVANTAR.csv: Hoja,"Llave de la fila","Atributo o relación","Pregunta de levantamiento","Dirigida a",Estado,Fecha
Catalogos.csv: Enumeracion,Valor   (con sus valores, ver tabla)
```

**Hoja `Catalogos` (v1.1)**

| Enumeracion | Valor |
|---|---|
| Mecanismo | INTEGRACION_SISTEMA |
| Mecanismo | CONECTOR_TERCEROS |
| Mecanismo | CORREO_ELECTRONICO |
| Mecanismo | CONSULTA_MANUAL |
| Mecanismo | POR_LEVANTAR |
| Oportunidad | TIEMPO_REAL |
| Oportunidad | DIFERIDA |
| Oportunidad | POR_LEVANTAR |
| TipoFuente | ENUNCIADO_CASO |
| TipoFuente | DOCUMENTO |
| TipoFuente | ENTREVISTA |
| TipoFuente | REGISTRO_SISTEMA |
| EBoolean (`transformaFormato`) | VERDADERO |
| EBoolean (`transformaFormato`) | FALSO |
| EBoolean (`transformaFormato`) | POR LEVANTAR |
| Nivel (columna de formato) | HECHO |
| Nivel (columna de formato) | AFIRMACION_AREA |
| Nivel (columna de formato) | HIPOTESIS |

## 2.2 Qué cambió frente a v1.0

1. **Columna `Nivel`** (HECHO / AFIRMACION_AREA / HIPOTESIS) a la derecha de `Fuente`, en las 17 hojas que llevan `Fuente`: las 8 de concepto (Sistema, ParticipanteExterno, Area, Intercambio, GrupoInformacion, EstadoPedido, ModalidadEntrega, Problema) y las 9 puente (RutaExpress_marketplaces, RutaExpress_aliados, Intercambio_transporta, Intercambio_estadosReportados, Intercambio_modalidades, Intercambio_problemas, Problema_reportadoPor, Problema_afectados, EstadoPedido_siguientes). No la llevan `Fuente`, `Intercambio_fuentes` ni `Problema_fuentes`.
2. **`Catalogos`:** nueva enumeración de formato `Nivel` con 3 valores. Pasa de 15 a 18 filas.
3. **Ids de extremos con prefijo:** `SIS-nn`, `EXT-nn`, `ARE-nn`. Herencia de Extremo confirmada. `nombre` queda como llave de `EstadoPedido` y `ModalidadEntrega`.
4. **`00_GUIA`:** nuevas convenciones `NO APLICA (Fuente-id)` y `POR LEVANTAR` (= no se sabe), descripción de `Nivel`, y `Fuente` como columna de trazabilidad aprobada. Varias citas en una celda se separan con ` · `.
5. **Mapa de integración:** sin cambios en la plantilla; la flecha provisional queda aprobada (el comentario PROVISIONAL de `mapa_integracion_plantilla.mmd` puede retirarse en la próxima edición; no lo toqué).
6. Sin cambios en las demás columnas, en las llaves ni en `POR_LEVANTAR`.

# 3. POR LEVANTAR / Preguntas

Quedan abiertas, sin resolver, las preguntas anteriores:

| # | Pregunta | Dirigida a |
|---|---|---|
| P7 | ¿Qué área o rol diligencia cada hoja y quién consolida las hojas devueltas? | Arquitecto Líder |
| P8 | ¿Cuál es la carpeta compartida corporativa para enviar y recibir los `.xlsx`? | TI (por medio del Arquitecto Líder) |
| P9 | ¿Confirma los nombres de archivo y la carpeta por etapa propuestos para `arquitectura-rutaexpress`? | Arquitecto Líder |

Preguntas nuevas de esta versión:

| # | Pregunta | Dirigida a |
|---|---|---|
| P11 | ¿Se admite `POR LEVANTAR` en `Nivel` cuando la fila no tiene dato? Lo dejé así por R6, pero el catálogo de `Nivel` solo tiene tres valores. | Arquitecto Líder |
| P12 | ¿Confirma los prefijos `GRP-nn` para GrupoInformacion y `PRB-nn` para Problema? Tú fijaste `SIS`, `EXT`, `ARE`, `INT` y `FUE`; esos dos los asumí por analogía. | Arquitecto Líder |

# 4. Control de conformidad

| Verificación | Resultado |
|---|---|
| Todo concepto, atributo y relación del metamodelo 06 tiene su hoja o columna | Cumple. Extremo (abstracto) y la raíz no tienen hoja propia (decisión aprobada). |
| Toda relación 1 o 0..1 tiene columna llave | Cumple: `responsable`, `productor`, `origen`, `destino`. |
| Toda relación múltiple tiene hoja puente | Cumple: 11 hojas puente (9 desde conceptos y 2 desde la raíz). |
| Enumeraciones con valores exactos | Cumple: Mecanismo (5), Oportunidad (3), TipoFuente (4). Agregados de formato: EBoolean (3) y Nivel (3). |
| Sin conceptos, atributos ni relaciones fuera del metamodelo | Cumple. Columnas de formato fuera del metamodelo, declaradas y aprobadas: `Fuente` y `Nivel` (más las de la hoja `POR_LEVANTAR`, exigida por PV-INT-1). |
| Sin datos del caso | Cumple. Todas las hojas salen con encabezados; `Catalogos` solo tiene valores de enumeración. |
| Encabezados iguales a los nombres del metamodelo | Cumple. |

**Brechas.** B1 a B7 quedan cerradas con tus decisiones. Brecha nueva:
- **B8. Brecha de metamodelo: `Nivel` y R5 se solapan en Problema.** R5 ya deriva que un Problema con fuentes solo ENUNCIADO_CASO o afirmación de área es hipótesis. `Nivel=HECHO` no tiene sentido para un Problema sin REGISTRO_SISTEMA o DOCUMENTO. *Ajuste propuesto:* para Problema, `Nivel` toma HIPOTESIS o AFIRMACION_AREA hasta que exista evidencia de sistema o documento. Lo apliqué así en la entrega 3d; tú decides.

Este borrador es para tu revisión. No lo envío a las áreas.

## Ajuste iteración 2

Metamodelo v1.1 (conocimientos 05 y 06): nueva relación `RutaExpress -> problemas (*)` y restricciones R7 y R8.

- **Hoja nueva `RutaExpress_problemas`**, con encabezados `problemas,Fuente,Nivel` (archivo `csv/RutaExpress_problemas.csv`). Registra todos los Problema, tengan o no intercambio, para que sean alcanzables desde la raíz. El libro pasa de 23 a 24 hojas (12 puente).
- Los encabezados de las otras 23 hojas no cambian.
- R7 y R8 no cambian columnas: el conector (SIS-03) se registra como Sistema y un intercambio tiene un solo origen. Se reflejan en la hoja `00_GUIA` (descripción de `mecanismo`, `origen` y `destino`).
- `Nivel` admite `POR LEVANTAR` (P11 cerrada); `Nivel=HIPOTESIS` también se usa en un intercambio cuando su extremo se deriva de una secuencia del enunciado. Prefijos `GRP-nn` y `PRB-nn` aprobados (P12 cerrada).
- Control de conformidad: se agrega la verificación de alcanzabilidad desde la raíz. B9 y B11 quedan cerradas con R7 y R8; B10 queda aceptada para la v2 del metamodelo; B12 se mantiene.
