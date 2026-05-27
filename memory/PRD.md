# PsiCare 🌸 — Product Requirements Document

## Problema original
App web de gestión de pacientes para psicólogas (uso exclusivo de la psicóloga). Estética **macOS Sonoma + rosa pastel**, profesional y cálido. El usuario eligió: React + FastAPI + MongoDB, login mock simple, seed data, alcance P0 completo.

## Stack
- **Frontend**: React 19 + React Router 7 + Tailwind + lucide-react + axios
- **Backend**: FastAPI + Motor (MongoDB async)
- **DB**: MongoDB local (auto-seed al startup si no hay psicólogas)
- **Auth**: Mock (cualquier password con `demo@psicare.com` funciona)

## Arquitectura
- `/app/backend/server.py` — API completa con endpoints REST (auth, patients, tasks, sessions, dashboard, stats, seed)
- `/app/frontend/src/`
  - `App.js` — routing protegido
  - `lib/` — api, auth context, helpers
  - `components/` — Sidebar, Layout, Overlay (Modal/Drawer), Toast, Avatar
  - `pages/` — Login, Dashboard, Calendar, Patients, PatientProfile, Stats, Settings

## User personas
- **Psicóloga clínica**: agenda sesiones, lleva expediente, plan de intervención y notas por sesión

## Core requirements (P0 — completados ✅)
1. ✅ Login mock (demo@psicare.com + cualquier password)
2. ✅ Dashboard con métricas (sesiones hoy, pacientes activos, tareas pendientes, próxima sesión)
3. ✅ Calendario vista mes y semana, sesiones color-coded por paciente, drawer del día
4. ✅ CRUD de sesiones (modal de nueva/editar con paciente, fecha, hora, duración, tipo, notas)
5. ✅ Lista de pacientes con búsqueda + filtros (todos/activo/pausa/alta)
6. ✅ Crear/editar/eliminar paciente con color identificador
7. ✅ Perfil de paciente con 4 tabs: Datos, Motivo, Plan de intervención (TodoList), Historial
8. ✅ Plan de intervención: checkbox pendiente/visto, edición inline título y notas, drag&drop reorder, eliminar
9. ✅ Modal de notas de sesión con estado de ánimo (5 emojis), tareas vistas (marca tasks como visto), notas, próxima sesión
10. ✅ Estadísticas: barras por mes + distribución por modalidad
11. ✅ Ajustes de perfil (nombre, cédula, duración default, horario)
12. ✅ Seed automático con 1 psicóloga, 7 pacientes (con motivos reales), tareas y sesiones pasadas/hoy/futuras

## Diseño aplicado
- Paleta: #F9D4D4, #FCEAEA, #E8A0BF, #FFF6F6, #FDE8F0, #3D2B35, #9B7B87, #A8D5A2, #F4C6A0
- Tipografía: **Cormorant Garamond** (headings) + **DM Sans** (body)
- Glassmorphism en sidebar + drawers + modales
- Traffic lights estilo macOS en modales/drawers
- Sombras suaves rosadas, border-radius 16-24px, transiciones 200ms
- Animaciones fade-up escalonadas

## Tests
- Backend: 12/12 (100%) — tests en `/app/backend/tests/test_psicare_backend.py`
- Frontend: 100% flujos críticos validados (login, nav, calendar, patients, tasks, sessions, stats, logout)

## Backlog / Next actions
**P1 (siguiente iteración sugerida)**
- Real auth (JWT con bcrypt) — actualmente mock
- Recordatorios push/email antes de sesiones
- Plantillas SOAP/DAP para notas (un click rellena estructura)
- Exportar expediente a PDF
- Adjuntar archivos (consentimientos, evaluaciones)
- Modo privacidad (toggle para ocultar nombres)
- Dark mode con rosas saturados sobre carbón

**P2 (futuro)**
- Seguimiento de medicación
- Objetivos terapéuticos a largo plazo
- Multi-tenant real (cada psicóloga con DB aislada)
- App móvil

## Credenciales de prueba
Ver `/app/memory/test_credentials.md`

## Fechas
- 2026-01: MVP completado y validado por testing agent (12/12 backend, 100% frontend)
