# Workshop 2 – Parte II · Asistente "Arquitecto Junior RutaExpress"

ARTI 4104 – Fundamentos de Arquitectura (Uniandes). Esta rama contiene los puntos 3.a a 3.e del taller.

- `entregable/Workshop2_ParteII_Punto3_Asistente.docx`: documento de entrega. El `.pdf` del mismo nombre es una vista previa.
- `asistente/configuracion.md`: nombre, descripción, instrucciones y conocimiento del Project.
- `conocimiento/`: los archivos 01 a 06 que se cargan al Project.
- `diagramas/`: metamodelo de Integración (BAC-09, Mermaid + ELK).
- `artefactos/3c_vacio`, `3d_diligenciado`, `3e_preocupaciones`: respuestas del asistente en cada iteración, CSV, `.xlsx` y `.mmd`.
- `scripts/`: `csv_to_xlsx.py` arma los libros Excel y `build_docx.js` arma el documento (`node scripts/build_docx.js`).

Los `.mmd` usan `config: layout: elk`. Para renderizarlos se necesitan `mermaid` y `@mermaid-js/layout-elk`, registrando `elkLayouts` con `mermaid.registerLayoutLoaders`.
