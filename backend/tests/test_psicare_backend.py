"""PsiCare backend test suite - tests all endpoints with CRUD + persistence verification."""
import os
import pytest
import requests
from datetime import datetime, timezone, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://therapy-hub-221.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def psicologa(session):
    """Login fixture - returns psicologa data."""
    r = session.post(f"{API}/auth/login", json={"email": "demo@psicare.com", "password": "anything"})
    assert r.status_code == 200, f"Login failed: {r.text}"
    data = r.json()
    assert "token" in data and "psicologa" in data
    return data["psicologa"]


# ---------- Auth ----------
class TestAuth:
    def test_login_with_demo(self, session):
        r = session.post(f"{API}/auth/login", json={"email": "demo@psicare.com", "password": "whatever"})
        assert r.status_code == 200
        data = r.json()
        assert data["token"].startswith("mock-token-")
        assert data["psicologa"]["email"] == "demo@psicare.com"
        assert "id" in data["psicologa"]

    def test_login_with_unknown_email_falls_back(self, session):
        # As per server: any unknown email falls back to demo
        r = session.post(f"{API}/auth/login", json={"email": "ghost@example.com", "password": "x"})
        assert r.status_code == 200
        assert r.json()["psicologa"]["email"] == "demo@psicare.com"

    def test_auth_me(self, session, psicologa):
        r = session.get(f"{API}/auth/me/{psicologa['id']}")
        assert r.status_code == 200
        assert r.json()["email"] == "demo@psicare.com"


# ---------- Patients ----------
class TestPatients:
    def test_list_patients_seed_count(self, session, psicologa):
        r = session.get(f"{API}/patients", params={"psicologa_id": psicologa["id"]})
        assert r.status_code == 200
        patients = r.json()
        assert len(patients) == 7, f"Expected 7 seed patients, got {len(patients)}"
        # Validate shape
        p = patients[0]
        for k in ["id", "nombre", "modalidad", "estado", "color", "psicologa_id"]:
            assert k in p

    def test_create_update_delete_patient(self, session, psicologa):
        # CREATE
        payload = {"nombre": "TEST_Patient", "edad": 30, "modalidad": "online",
                   "motivo_consulta": "Test", "estado": "activo", "color": "#E8A0BF"}
        r = session.post(f"{API}/patients", params={"psicologa_id": psicologa["id"]}, json=payload)
        assert r.status_code == 200, r.text
        created = r.json()
        pid = created["id"]
        assert created["nombre"] == "TEST_Patient"
        assert created["psicologa_id"] == psicologa["id"]

        # GET to verify persistence
        r = session.get(f"{API}/patients/{pid}")
        assert r.status_code == 200
        assert r.json()["nombre"] == "TEST_Patient"

        # UPDATE
        r = session.put(f"{API}/patients/{pid}", json={"nombre": "TEST_Updated", "estado": "pausa"})
        assert r.status_code == 200
        assert r.json()["nombre"] == "TEST_Updated"
        assert r.json()["estado"] == "pausa"

        # GET to verify update persisted
        r = session.get(f"{API}/patients/{pid}")
        assert r.json()["nombre"] == "TEST_Updated"

        # DELETE
        r = session.delete(f"{API}/patients/{pid}")
        assert r.status_code == 200

        # Verify deleted
        r = session.get(f"{API}/patients/{pid}")
        assert r.status_code == 404


# ---------- Tasks ----------
class TestTasks:
    def test_task_crud_and_reorder(self, session, psicologa):
        # Get a patient
        r = session.get(f"{API}/patients", params={"psicologa_id": psicologa["id"]})
        patient = r.json()[0]
        pid = patient["id"]

        # CREATE task
        r = session.post(f"{API}/patients/{pid}/tasks", json={"titulo": "TEST_Task_1"})
        assert r.status_code == 200
        t1 = r.json()
        assert t1["titulo"] == "TEST_Task_1"
        assert t1["estado"] == "pendiente"

        r = session.post(f"{API}/patients/{pid}/tasks", json={"titulo": "TEST_Task_2"})
        t2 = r.json()

        # LIST tasks
        r = session.get(f"{API}/patients/{pid}/tasks")
        assert r.status_code == 200
        tasks = r.json()
        ids = [t["id"] for t in tasks]
        assert t1["id"] in ids and t2["id"] in ids

        # UPDATE (toggle estado)
        r = session.put(f"{API}/tasks/{t1['id']}", json={"estado": "visto"})
        assert r.status_code == 200
        assert r.json()["estado"] == "visto"

        # REORDER
        r = session.post(f"{API}/tasks/reorder", json=[
            {"id": t1["id"], "orden": 99},
            {"id": t2["id"], "orden": 98},
        ])
        assert r.status_code == 200

        # Verify reorder persisted
        r = session.get(f"{API}/patients/{pid}/tasks")
        order_map = {t["id"]: t["orden"] for t in r.json()}
        assert order_map[t1["id"]] == 99
        assert order_map[t2["id"]] == 98

        # CLEANUP
        session.delete(f"{API}/tasks/{t1['id']}")
        session.delete(f"{API}/tasks/{t2['id']}")


# ---------- Sessions ----------
class TestSessions:
    def test_list_sessions(self, session, psicologa):
        r = session.get(f"{API}/sessions", params={"psicologa_id": psicologa["id"]})
        assert r.status_code == 200
        sessions = r.json()
        assert len(sessions) > 0
        assert "fecha" in sessions[0]
        assert "patient_id" in sessions[0]

    def test_list_sessions_with_date_filter(self, session, psicologa):
        now = datetime.now(timezone.utc)
        start = (now - timedelta(days=30)).isoformat()
        end = (now + timedelta(days=30)).isoformat()
        r = session.get(f"{API}/sessions", params={
            "psicologa_id": psicologa["id"], "start": start, "end": end
        })
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_session_crud_with_tareas_vistas_marks_tasks(self, session, psicologa):
        # Get a patient
        r = session.get(f"{API}/patients", params={"psicologa_id": psicologa["id"]})
        patient = r.json()[0]
        pid = patient["id"]

        # Create a task to be marked as visto
        r = session.post(f"{API}/patients/{pid}/tasks", json={"titulo": "TEST_TaskToMark"})
        task_id = r.json()["id"]

        # CREATE session
        fecha = datetime.now(timezone.utc).isoformat()
        r = session.post(f"{API}/sessions", params={"psicologa_id": psicologa["id"]}, json={
            "patient_id": pid, "fecha": fecha, "duracion": 50, "tipo": "presencial"
        })
        assert r.status_code == 200, r.text
        sid = r.json()["id"]

        # GET to verify persistence
        r = session.get(f"{API}/sessions/{sid}")
        assert r.status_code == 200

        # UPDATE with tareas_vistas and notas + estado_animo
        r = session.put(f"{API}/sessions/{sid}", json={
            "notas_sesion": "Buen avance",
            "estado_animo": 4,
            "tareas_vistas": [task_id],
            "estado": "completada"
        })
        assert r.status_code == 200
        s = r.json()
        assert s["notas_sesion"] == "Buen avance"
        assert s["estado_animo"] == 4

        # Verify task was marked as visto
        r = session.get(f"{API}/patients/{pid}/tasks")
        for t in r.json():
            if t["id"] == task_id:
                assert t["estado"] == "visto", "Task should be marked visto after tareas_vistas update"
                assert t["sesion_id"] == sid
                break
        else:
            pytest.fail("Task not found")

        # CLEANUP
        session.delete(f"{API}/sessions/{sid}")
        session.delete(f"{API}/tasks/{task_id}")


# ---------- Dashboard / Stats ----------
class TestDashboardStats:
    def test_dashboard_stats(self, session, psicologa):
        r = session.get(f"{API}/dashboard/stats", params={"psicologa_id": psicologa["id"]})
        assert r.status_code == 200
        data = r.json()
        for k in ["sesiones_hoy", "pacientes_activos", "tareas_pendientes", "proxima_sesion", "sesiones_hoy_list"]:
            assert k in data, f"Missing key {k}"
        assert isinstance(data["sesiones_hoy"], int)
        assert isinstance(data["pacientes_activos"], int)
        assert data["pacientes_activos"] >= 1

    def test_monthly_stats(self, session, psicologa):
        r = session.get(f"{API}/stats/monthly", params={"psicologa_id": psicologa["id"]})
        assert r.status_code == 200
        data = r.json()
        assert "meses" in data
        assert isinstance(data["meses"], list)
        assert len(data["meses"]) == 6
        for m in data["meses"]:
            assert "mes" in m and "sesiones" in m


# ---------- Health ----------
def test_root(session):
    r = session.get(f"{API}/")
    assert r.status_code == 200
    assert "PsiCare" in r.json().get("message", "")
