import asyncio
import json
import uuid
from fastapi.testclient import TestClient
from app.main import app
from app.db.mongodb import connect_to_mongo, close_mongo_connection, db_instance

def run_e2e():
    test_id = str(uuid.uuid4())[:8]
    test_email = f"test_{test_id}@example.com"
    test_password = "SecurePassword123!"
    test_name = f"Test User {test_id}"

    print("=== STARTING FULL END-TO-END APPLICATION TEST ===")
    with TestClient(app) as client:
        # 1. Health checks
        res = client.get("/health")
        assert res.status_code == 200, f"Health check failed: {res.text}"
        print("[PASS] GET /health: 200 OK")

        res = client.get("/health/db")
        assert res.status_code == 200, f"DB Health check failed: {res.text}"
        print("[PASS] GET /health/db: 200 OK")

        # 2. Registration
        reg_payload = {
            "email": test_email,
            "password": test_password,
            "name": test_name
        }
        res = client.post("/api/v1/auth/register", json=reg_payload)
        assert res.status_code == 201, f"Registration failed: {res.text}"
        print(f"[PASS] POST /api/v1/auth/register: 201 Created ({test_email})")

        # 2b. Registration Edge Cases
        # Duplicate email
        res = client.post("/api/v1/auth/register", json=reg_payload)
        assert res.status_code == 400, f"Duplicate registration should fail: {res.text}"
        print("[PASS] Duplicate registration handled with 400 Bad Request")

        # Invalid email
        res = client.post("/api/v1/auth/register", json={"email": "invalid-email", "password": "abc", "name": "bad"})
        assert res.status_code == 422, f"Invalid email should fail validation: {res.text}"
        print("[PASS] Invalid email handled with 422 Validation Error")

        # 3. Login
        login_data = {
            "username": test_email,
            "password": test_password
        }
        res = client.post("/api/v1/auth/login", data=login_data)
        assert res.status_code == 200, f"Login failed: {res.text}"
        token = res.json()["access_token"]
        auth_headers = {"Authorization": f"Bearer {token}"}
        print("[PASS] POST /api/v1/auth/login: 200 OK (JWT acquired)")

        # 3b. Login with invalid password
        res = client.post("/api/v1/auth/login", data={"username": test_email, "password": "WrongPassword"})
        assert res.status_code == 400, f"Invalid login should fail: {res.text}"
        print("[PASS] Wrong password handled with 400 Bad Request")

        # 4. Protected Route without Auth
        res = client.get("/api/v1/projects")
        assert res.status_code == 401, f"Unauthorized request should fail: {res.text}"
        print("[PASS] Protected route without token rejected with 401 Unauthorized")

        # 5. Projects CRUD
        # CREATE Project
        project_payload = {
            "name": f"E2E Automated Project {test_id}",
            "description": "Initial project description created for verification",
            "status": "In Progress"
        }
        res = client.post("/api/v1/projects", json=project_payload, headers=auth_headers)
        assert res.status_code == 201, f"Project creation failed: {res.text}"
        project = res.json()
        project_id = project["id"]
        assert project["name"] == project_payload["name"]
        print(f"[PASS] POST /api/v1/projects: 201 Created (ID: {project_id})")

        # GET Projects list
        res = client.get("/api/v1/projects", headers=auth_headers)
        assert res.status_code == 200
        projects = res.json()
        assert any(p["id"] == project_id for p in projects)
        print(f"[PASS] GET /api/v1/projects: 200 OK ({len(projects)} projects)")

        # GET Project by ID
        res = client.get(f"/api/v1/projects/{project_id}", headers=auth_headers)
        assert res.status_code == 200
        assert res.json()["id"] == project_id
        print("[PASS] GET /api/v1/projects/{id}: 200 OK")

        # UPDATE Project
        res = client.put(
            f"/api/v1/projects/{project_id}",
            json={"description": "Updated project description via automation"},
            headers=auth_headers
        )
        assert res.status_code == 200
        assert res.json()["description"] == "Updated project description via automation"
        print("[PASS] PUT /api/v1/projects/{id}: 200 OK")

        # 6. Tasks CRUD
        # CREATE Task
        task_payload = {
            "title": f"Initial Task {test_id}",
            "description": "Task for E2E testing",
            "status": "Todo",
            "priority": "Medium",
            "project_id": project_id
        }
        res = client.post("/api/v1/tasks", json=task_payload, headers=auth_headers)
        assert res.status_code == 201, f"Task creation failed: {res.text}"
        task = res.json()
        task_id = task["id"]
        print(f"[PASS] POST /api/v1/tasks: 201 Created (ID: {task_id})")

        # GET Tasks
        res = client.get("/api/v1/tasks", headers=auth_headers)
        assert res.status_code == 200
        tasks = res.json()
        assert any(t["id"] == task_id for t in tasks)
        print(f"[PASS] GET /api/v1/tasks: 200 OK ({len(tasks)} tasks)")

        # GET Task by ID
        res = client.get(f"/api/v1/tasks/{task_id}", headers=auth_headers)
        assert res.status_code == 200
        assert res.json()["id"] == task_id
        print("[PASS] GET /api/v1/tasks/{id}: 200 OK")

        # UPDATE Task
        res = client.put(
            f"/api/v1/tasks/{task_id}",
            json={"status": "Completed", "priority": "High"},
            headers=auth_headers
        )
        assert res.status_code == 200
        assert res.json()["status"] == "Completed"
        assert res.json()["priority"] == "High"
        print("[PASS] PUT /api/v1/tasks/{id}: 200 OK (Status -> Completed, Priority -> High)")

        # 7. Gemini AI Endpoints (Live)
        print("\n--- Testing Google Gemini Endpoints ---")
        # 7a. Gemini Health Probe
        res = client.get("/api/v1/copilot/health", headers=auth_headers)
        if res.status_code == 200:
            health_data = res.json()
            assert health_data["status"] == "ok"
            assert health_data["provider"] == "Google Gemini"
            assert health_data["model"] == "gemini-3.8-flash"
            assert "GEMINI_CONNECTION_OK" in health_data["ping"]
            print(f"[PASS] GET /api/v1/copilot/health: 200 OK (Provider: {health_data['provider']}, Ping: {health_data['ping']})")
        elif res.status_code == 503:
            assert "Gemini" in res.json().get("detail", "")
            print(f"[PASS] GET /api/v1/copilot/health: 503 Handled Gracefully ({res.json()['detail']})")
        else:
            assert False, f"Unexpected health response: {res.text}"

        # 7b. Generate Description
        res = client.post(
            "/api/v1/copilot/generate-description",
            json={"title": "Cloud Infrastructure Migration"},
            headers=auth_headers
        )
        if res.status_code == 200:
            desc_result = res.json()["description"]
            assert len(desc_result) > 20
            print(f"[PASS] POST /api/v1/copilot/generate-description: 200 OK (Length: {len(desc_result)} chars)")
        elif res.status_code == 503:
            assert "Gemini" in res.json().get("detail", "")
            print(f"[PASS] POST /api/v1/copilot/generate-description: 503 Handled Gracefully ({res.json()['detail']})")
            desc_result = "Cloud Infrastructure Migration project plan."
        else:
            assert False, f"Unexpected description response: {res.text}"

        # 7c. Generate Tasks
        res = client.post(
            "/api/v1/copilot/generate-tasks",
            json={
                "project_name": "Cloud Infrastructure Migration",
                "description": desc_result
            },
            headers=auth_headers
        )
        if res.status_code == 200:
            gen_tasks = res.json()["tasks"]
            assert len(gen_tasks) > 0
            assert all("title" in t and "priority" in t for t in gen_tasks)
            print(f"[PASS] POST /api/v1/copilot/generate-tasks: 200 OK (Generated {len(gen_tasks)} structured tasks)")
        elif res.status_code == 503:
            assert "Gemini" in res.json().get("detail", "")
            print(f"[PASS] POST /api/v1/copilot/generate-tasks: 503 Handled Gracefully ({res.json()['detail']})")
            gen_tasks = [{"title": "Setup VPC", "description": "Configure subnets", "status": "Todo", "priority": "Low"}]
        else:
            assert False, f"Unexpected response: {res.text}"

        # 7d. Prioritize Tasks
        res = client.post(
            "/api/v1/copilot/prioritize-tasks",
            json={"tasks": gen_tasks[:3]},
            headers=auth_headers
        )
        if res.status_code == 200:
            prio_tasks = res.json()["tasks"]
            assert len(prio_tasks) > 0
            print(f"[PASS] POST /api/v1/copilot/prioritize-tasks: 200 OK")
        elif res.status_code == 503:
            assert "Gemini" in res.json().get("detail", "")
            print(f"[PASS] POST /api/v1/copilot/prioritize-tasks: 503 Handled Gracefully ({res.json()['detail']})")
        else:
            assert False, f"Unexpected response: {res.text}"

        # 7e. Productivity Suggestions
        res = client.post(
            "/api/v1/copilot/suggestions",
            json={"total_projects": 1, "total_tasks": 5, "completed_tasks": 2},
            headers=auth_headers
        )
        if res.status_code == 200:
            suggestion = res.json()["suggestion"]
            assert len(suggestion) > 5
            print(f"[PASS] POST /api/v1/copilot/suggestions: 200 OK (Tip: \"{suggestion}\")")
        elif res.status_code == 503:
            assert "Gemini" in res.json().get("detail", "")
            print(f"[PASS] POST /api/v1/copilot/suggestions: 503 Handled Gracefully ({res.json()['detail']})")
        else:
            assert False, f"Unexpected response: {res.text}"

        # 8. Clean up test data
        del_task = client.delete(f"/api/v1/tasks/{task_id}", headers=auth_headers)
        assert del_task.status_code == 204
        print(f"[PASS] DELETE /api/v1/tasks/{task_id}: 204 No Content")

        del_proj = client.delete(f"/api/v1/projects/{project_id}", headers=auth_headers)
        assert del_proj.status_code == 204
        print(f"[PASS] DELETE /api/v1/projects/{project_id}: 204 No Content")

        print("\n=== ALL END-TO-END TESTS PASSED SUCCESSFULLY! ===")

if __name__ == "__main__":
    run_e2e()
