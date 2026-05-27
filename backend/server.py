from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Literal
import uuid
from datetime import datetime, timezone, date, timedelta

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="PsiCare API")
api_router = APIRouter(prefix="/api")

# ---------- Helpers ----------
def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

def gen_id() -> str:
    return str(uuid.uuid4())

# ---------- Models ----------
class Psicologa(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=gen_id)
    nombre: str
    email: str
    cedula: Optional[str] = ""
    foto: Optional[str] = ""
    duracion_default: int = 50  # min
    horario_inicio: str = "09:00"
    horario_fin: str = "19:00"
    created_at: str = Field(default_factory=now_iso)

class LoginInput(BaseModel):
    email: str
    password: str

class PatientBase(BaseModel):
    nombre: str
    edad: Optional[int] = None
    telefono: Optional[str] = ""
    email: Optional[str] = ""
    modalidad: Literal["presencial", "online", "mixta"] = "presencial"
    motivo_consulta: str = ""
    estado: Literal["activo", "pausa", "alta"] = "activo"
    color: str = "#E8A0BF"
    notas_generales: Optional[str] = ""
    fecha_nacimiento: Optional[str] = ""
    direccion: Optional[str] = ""
    contacto_emergencia: Optional[str] = ""

class Patient(PatientBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=gen_id)
    psicologa_id: str
    fecha_inicio: str = Field(default_factory=now_iso)
    created_at: str = Field(default_factory=now_iso)
    updated_at: str = Field(default_factory=now_iso)

class PatientCreate(PatientBase):
    pass

class PatientUpdate(BaseModel):
    nombre: Optional[str] = None
    edad: Optional[int] = None
    telefono: Optional[str] = None
    email: Optional[str] = None
    modalidad: Optional[str] = None
    motivo_consulta: Optional[str] = None
    estado: Optional[str] = None
    color: Optional[str] = None
    notas_generales: Optional[str] = None
    fecha_nacimiento: Optional[str] = None
    direccion: Optional[str] = None
    contacto_emergencia: Optional[str] = None

class TaskBase(BaseModel):
    titulo: str
    descripcion: Optional[str] = ""
    estado: Literal["pendiente", "visto"] = "pendiente"
    orden: int = 0
    sesion_id: Optional[str] = None  # sesión donde se vio
    notas: Optional[str] = ""

class Task(TaskBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=gen_id)
    patient_id: str
    created_at: str = Field(default_factory=now_iso)
    updated_at: str = Field(default_factory=now_iso)

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    titulo: Optional[str] = None
    descripcion: Optional[str] = None
    estado: Optional[str] = None
    orden: Optional[int] = None
    sesion_id: Optional[str] = None
    notas: Optional[str] = None

class SessionBase(BaseModel):
    patient_id: str
    fecha: str  # ISO datetime
    duracion: int = 50
    tipo: Literal["presencial", "online"] = "presencial"
    estado: Literal["programada", "completada", "cancelada"] = "programada"
    notas_previas: Optional[str] = ""
    notas_sesion: Optional[str] = ""
    estado_animo: Optional[int] = None  # 1-5
    proxima_sesion: Optional[str] = ""
    tareas_vistas: List[str] = []  # task ids

class Session(SessionBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=gen_id)
    psicologa_id: str
    created_at: str = Field(default_factory=now_iso)
    updated_at: str = Field(default_factory=now_iso)

class SessionCreate(SessionBase):
    pass

class SessionUpdate(BaseModel):
    fecha: Optional[str] = None
    duracion: Optional[int] = None
    tipo: Optional[str] = None
    estado: Optional[str] = None
    notas_previas: Optional[str] = None
    notas_sesion: Optional[str] = None
    estado_animo: Optional[int] = None
    proxima_sesion: Optional[str] = None
    tareas_vistas: Optional[List[str]] = None

# ---------- Auth (mock) ----------
@api_router.post("/auth/login")
async def login(data: LoginInput):
    # Mock: cualquier email registrado devuelve la psicóloga; sino crea seed
    psico = await db.psicologas.find_one({"email": data.email}, {"_id": 0})
    if not psico:
        # Si email == demo@psicare.com, devolver la seed
        psico = await db.psicologas.find_one({"email": "demo@psicare.com"}, {"_id": 0})
        if not psico:
            raise HTTPException(status_code=404, detail="Psicóloga no encontrada. Usa demo@psicare.com")
    return {"token": f"mock-token-{psico['id']}", "psicologa": psico}

@api_router.get("/auth/me/{psicologa_id}")
async def get_me(psicologa_id: str):
    psico = await db.psicologas.find_one({"id": psicologa_id}, {"_id": 0})
    if not psico:
        raise HTTPException(status_code=404, detail="No encontrada")
    return psico

@api_router.put("/auth/me/{psicologa_id}")
async def update_me(psicologa_id: str, data: dict):
    data["updated_at"] = now_iso()
    await db.psicologas.update_one({"id": psicologa_id}, {"$set": data})
    psico = await db.psicologas.find_one({"id": psicologa_id}, {"_id": 0})
    return psico

# ---------- Patients ----------
@api_router.get("/patients", response_model=List[Patient])
async def list_patients(psicologa_id: str):
    patients = await db.patients.find({"psicologa_id": psicologa_id}, {"_id": 0}).sort("nombre", 1).to_list(1000)
    return patients

@api_router.get("/patients/{patient_id}", response_model=Patient)
async def get_patient(patient_id: str):
    p = await db.patients.find_one({"id": patient_id}, {"_id": 0})
    if not p:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")
    return p

@api_router.post("/patients", response_model=Patient)
async def create_patient(data: PatientCreate, psicologa_id: str):
    patient = Patient(**data.model_dump(), psicologa_id=psicologa_id)
    await db.patients.insert_one(patient.model_dump())
    return patient

@api_router.put("/patients/{patient_id}", response_model=Patient)
async def update_patient(patient_id: str, data: PatientUpdate):
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    update_data["updated_at"] = now_iso()
    await db.patients.update_one({"id": patient_id}, {"$set": update_data})
    p = await db.patients.find_one({"id": patient_id}, {"_id": 0})
    if not p:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")
    return p

@api_router.delete("/patients/{patient_id}")
async def delete_patient(patient_id: str):
    await db.patients.delete_one({"id": patient_id})
    await db.tasks.delete_many({"patient_id": patient_id})
    await db.sessions.delete_many({"patient_id": patient_id})
    return {"ok": True}

# ---------- Tasks (intervention plan) ----------
@api_router.get("/patients/{patient_id}/tasks", response_model=List[Task])
async def list_tasks(patient_id: str):
    tasks = await db.tasks.find({"patient_id": patient_id}, {"_id": 0}).sort("orden", 1).to_list(1000)
    return tasks

@api_router.post("/patients/{patient_id}/tasks", response_model=Task)
async def create_task(patient_id: str, data: TaskCreate):
    # Determine order
    count = await db.tasks.count_documents({"patient_id": patient_id})
    payload = data.model_dump()
    if not payload.get("orden"):
        payload["orden"] = count
    task = Task(**payload, patient_id=patient_id)
    await db.tasks.insert_one(task.model_dump())
    return task

@api_router.put("/tasks/{task_id}", response_model=Task)
async def update_task(task_id: str, data: TaskUpdate):
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    update_data["updated_at"] = now_iso()
    await db.tasks.update_one({"id": task_id}, {"$set": update_data})
    t = await db.tasks.find_one({"id": task_id}, {"_id": 0})
    if not t:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")
    return t

@api_router.delete("/tasks/{task_id}")
async def delete_task(task_id: str):
    await db.tasks.delete_one({"id": task_id})
    return {"ok": True}

class ReorderItem(BaseModel):
    id: str
    orden: int

@api_router.post("/tasks/reorder")
async def reorder_tasks(items: List[ReorderItem]):
    for item in items:
        await db.tasks.update_one({"id": item.id}, {"$set": {"orden": item.orden}})
    return {"ok": True}

# ---------- Sessions ----------
@api_router.get("/sessions", response_model=List[Session])
async def list_sessions(psicologa_id: str, patient_id: Optional[str] = None, start: Optional[str] = None, end: Optional[str] = None):
    query = {"psicologa_id": psicologa_id}
    if patient_id:
        query["patient_id"] = patient_id
    if start and end:
        query["fecha"] = {"$gte": start, "$lte": end}
    sessions = await db.sessions.find(query, {"_id": 0}).sort("fecha", 1).to_list(2000)
    return sessions

@api_router.get("/sessions/{session_id}", response_model=Session)
async def get_session(session_id: str):
    s = await db.sessions.find_one({"id": session_id}, {"_id": 0})
    if not s:
        raise HTTPException(status_code=404, detail="Sesión no encontrada")
    return s

@api_router.post("/sessions", response_model=Session)
async def create_session(data: SessionCreate, psicologa_id: str):
    session = Session(**data.model_dump(), psicologa_id=psicologa_id)
    await db.sessions.insert_one(session.model_dump())
    return session

@api_router.put("/sessions/{session_id}", response_model=Session)
async def update_session(session_id: str, data: SessionUpdate):
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    update_data["updated_at"] = now_iso()
    await db.sessions.update_one({"id": session_id}, {"$set": update_data})
    # If tareas_vistas was updated, also update tasks
    if "tareas_vistas" in update_data:
        for task_id in update_data["tareas_vistas"]:
            await db.tasks.update_one({"id": task_id}, {"$set": {"estado": "visto", "sesion_id": session_id}})
    s = await db.sessions.find_one({"id": session_id}, {"_id": 0})
    if not s:
        raise HTTPException(status_code=404, detail="Sesión no encontrada")
    return s

@api_router.delete("/sessions/{session_id}")
async def delete_session(session_id: str):
    await db.sessions.delete_one({"id": session_id})
    return {"ok": True}

# ---------- Dashboard / Stats ----------
@api_router.get("/dashboard/stats")
async def dashboard_stats(psicologa_id: str):
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)
    week_end = today_start + timedelta(days=7)

    sesiones_hoy = await db.sessions.count_documents({
        "psicologa_id": psicologa_id,
        "fecha": {"$gte": today_start.isoformat(), "$lt": today_end.isoformat()},
        "estado": {"$ne": "cancelada"}
    })
    pacientes_activos = await db.patients.count_documents({
        "psicologa_id": psicologa_id, "estado": "activo"
    })
    total_pacientes = await db.patients.count_documents({"psicologa_id": psicologa_id})

    # Pending tasks across all patients of this psicologa
    patient_ids = [p["id"] async for p in db.patients.find({"psicologa_id": psicologa_id}, {"id": 1, "_id": 0})]
    tareas_pendientes = await db.tasks.count_documents({
        "patient_id": {"$in": patient_ids}, "estado": "pendiente"
    })

    # Next session
    proxima = await db.sessions.find_one({
        "psicologa_id": psicologa_id,
        "fecha": {"$gte": datetime.now(timezone.utc).isoformat()},
        "estado": "programada"
    }, {"_id": 0}, sort=[("fecha", 1)])

    if proxima:
        patient = await db.patients.find_one({"id": proxima["patient_id"]}, {"_id": 0})
        proxima["patient"] = patient

    # Sessions for today (full data)
    sesiones_hoy_list = await db.sessions.find({
        "psicologa_id": psicologa_id,
        "fecha": {"$gte": today_start.isoformat(), "$lt": today_end.isoformat()}
    }, {"_id": 0}).sort("fecha", 1).to_list(50)
    for s in sesiones_hoy_list:
        s["patient"] = await db.patients.find_one({"id": s["patient_id"]}, {"_id": 0})

    # Weekly sessions count
    sesiones_semana = await db.sessions.count_documents({
        "psicologa_id": psicologa_id,
        "fecha": {"$gte": today_start.isoformat(), "$lt": week_end.isoformat()}
    })

    return {
        "sesiones_hoy": sesiones_hoy,
        "pacientes_activos": pacientes_activos,
        "total_pacientes": total_pacientes,
        "tareas_pendientes": tareas_pendientes,
        "proxima_sesion": proxima,
        "sesiones_hoy_list": sesiones_hoy_list,
        "sesiones_semana": sesiones_semana,
    }

@api_router.get("/stats/monthly")
async def monthly_stats(psicologa_id: str):
    now = datetime.now(timezone.utc)
    months = []
    for i in range(5, -1, -1):
        month_date = now.replace(day=1) - timedelta(days=i * 30)
        m_start = month_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        # End of month
        if m_start.month == 12:
            m_end = m_start.replace(year=m_start.year + 1, month=1)
        else:
            m_end = m_start.replace(month=m_start.month + 1)
        count = await db.sessions.count_documents({
            "psicologa_id": psicologa_id,
            "fecha": {"$gte": m_start.isoformat(), "$lt": m_end.isoformat()},
            "estado": "completada"
        })
        months.append({
            "mes": m_start.strftime("%b"),
            "sesiones": count
        })
    return {"meses": months}

# ---------- Seed ----------
@api_router.post("/seed")
async def seed_data():
    # Reset
    await db.psicologas.delete_many({})
    await db.patients.delete_many({})
    await db.tasks.delete_many({})
    await db.sessions.delete_many({})

    psico = Psicologa(
        nombre="Dra. Sofía García",
        email="demo@psicare.com",
        cedula="12345678",
        duracion_default=50,
    )
    await db.psicologas.insert_one(psico.model_dump())

    colores = ["#E8A0BF", "#F4C6A0", "#A8D5A2", "#C8A2E8", "#A2C8E8", "#E8C5A0", "#D5A8C5"]
    pacientes_data = [
        {"nombre": "Valentina Ruiz", "edad": 28, "motivo_consulta": "Ansiedad generalizada y crisis de pánico recurrentes. Dificultad para conciliar el sueño.", "modalidad": "presencial", "telefono": "+52 555 123 4567", "email": "valentina@email.com"},
        {"nombre": "Mateo Hernández", "edad": 35, "motivo_consulta": "Manejo de estrés laboral y burnout. Búsqueda de herramientas para mejorar balance vida-trabajo.", "modalidad": "online", "telefono": "+52 555 234 5678", "email": "mateo@email.com"},
        {"nombre": "Isabella Torres", "edad": 22, "motivo_consulta": "Duelo por pérdida familiar. Tristeza prolongada y dificultad para retomar actividades.", "modalidad": "presencial", "telefono": "+52 555 345 6789", "email": "isabella@email.com"},
        {"nombre": "Diego Morales", "edad": 41, "motivo_consulta": "Terapia de pareja. Comunicación disfuncional y conflictos recurrentes.", "modalidad": "mixta", "telefono": "+52 555 456 7890", "email": "diego@email.com"},
        {"nombre": "Camila Vega", "edad": 19, "motivo_consulta": "Trastorno alimenticio. Relación conflictiva con la comida y autoimagen.", "modalidad": "presencial", "telefono": "+52 555 567 8901", "email": "camila@email.com", "estado": "activo"},
        {"nombre": "Sebastián López", "edad": 52, "motivo_consulta": "Depresión leve post-divorcio. Reconstrucción de identidad personal.", "modalidad": "online", "telefono": "+52 555 678 9012", "email": "sebastian@email.com"},
        {"nombre": "Lucía Mendoza", "edad": 31, "motivo_consulta": "Autoestima y asertividad. Dificultad para establecer límites en relaciones.", "modalidad": "presencial", "telefono": "+52 555 789 0123", "email": "lucia@email.com", "estado": "alta"},
    ]

    pacientes = []
    for i, pd in enumerate(pacientes_data):
        p = Patient(**pd, psicologa_id=psico.id, color=colores[i % len(colores)])
        await db.patients.insert_one(p.model_dump())
        pacientes.append(p)

    # Tasks per patient
    tareas_templates = [
        ["Psicoeducación sobre ansiedad", "Técnicas de respiración diafragmática", "Identificar pensamientos automáticos", "Reestructuración cognitiva", "Exposición gradual"],
        ["Evaluación inicial de burnout", "Higiene del sueño", "Establecer límites laborales", "Mindfulness diario", "Plan de autocuidado"],
        ["Validación emocional del duelo", "Carta de despedida", "Rituales de memoria", "Activación conductual", "Reconstrucción de significado"],
        ["Comunicación no violenta", "Escucha activa en pareja", "Ejercicio de gratitud diario", "Resolución de conflictos", "Cita semanal estructurada"],
        ["Diario alimenticio sin juicio", "Trabajo con imagen corporal", "Identificar gatillos emocionales", "Plan de alimentación intuitiva"],
        ["Procesamiento del divorcio", "Reconstrucción de red social", "Hobbies y nuevos intereses", "Trabajo con autoconcepto"],
        ["Asertividad básica", "Decir 'no' sin culpa", "Identificar relaciones tóxicas", "Plan de autocuidado emocional"],
    ]

    for i, p in enumerate(pacientes):
        templates = tareas_templates[i % len(tareas_templates)]
        for j, titulo in enumerate(templates):
            estado = "visto" if j < 2 else "pendiente"  # first 2 already done
            task = Task(titulo=titulo, patient_id=p.id, orden=j, estado=estado)
            await db.tasks.insert_one(task.model_dump())

    # Sessions - past, today, future
    now = datetime.now(timezone.utc)
    today = now.replace(hour=0, minute=0, second=0, microsecond=0)

    # Past sessions
    for i, p in enumerate(pacientes[:5]):
        for k in range(3):
            fecha = today - timedelta(days=7 * (k + 1), hours=-(10 + i))
            s = Session(
                patient_id=p.id,
                psicologa_id=psico.id,
                fecha=fecha.isoformat(),
                duracion=50,
                tipo=p.modalidad if p.modalidad != "mixta" else "presencial",
                estado="completada",
                notas_sesion=f"Sesión con avances. Se trabajó el tema central del plan de intervención.",
                estado_animo=3 + (k % 3),
            )
            await db.sessions.insert_one(s.model_dump())

    # Today's sessions
    horarios_hoy = [10, 12, 16, 18]
    for i, h in enumerate(horarios_hoy):
        if i >= len(pacientes):
            break
        p = pacientes[i]
        fecha = today.replace(hour=h, minute=0)
        s = Session(
            patient_id=p.id,
            psicologa_id=psico.id,
            fecha=fecha.isoformat(),
            duracion=50,
            tipo=p.modalidad if p.modalidad != "mixta" else "presencial",
            estado="programada",
            notas_previas="Revisar tareas pendientes del plan de intervención.",
        )
        await db.sessions.insert_one(s.model_dump())

    # Future sessions (next 14 days)
    import random
    random.seed(42)
    for i, p in enumerate(pacientes[:6]):
        for k in range(2):
            day_offset = random.randint(1, 14)
            hour = random.choice([9, 10, 11, 14, 15, 16, 17, 18])
            fecha = today + timedelta(days=day_offset, hours=hour)
            s = Session(
                patient_id=p.id,
                psicologa_id=psico.id,
                fecha=fecha.isoformat(),
                duracion=50,
                tipo=p.modalidad if p.modalidad != "mixta" else "presencial",
                estado="programada",
            )
            await db.sessions.insert_one(s.model_dump())

    return {
        "ok": True,
        "psicologa": psico.model_dump(),
        "patients_count": len(pacientes),
        "credentials": {"email": "demo@psicare.com", "password": "any-password-works"}
    }

# ---------- Health ----------
@api_router.get("/")
async def root():
    return {"message": "PsiCare API 🌸", "version": "1.0"}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_seed():
    # Auto-seed if no psicologas exist
    count = await db.psicologas.count_documents({})
    if count == 0:
        logger.info("No data found. Seeding...")
        await seed_data()
        logger.info("Seed complete.")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
