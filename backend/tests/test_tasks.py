import pytest

def test_create_task_unauthorized(client):
    response = client.post("/api/v1/tasks/", json={
        "title": "Test Task",
        "project_id": "dummy_project_id"
    })
    assert response.status_code == 401

def test_get_tasks_unauthorized(client):
    response = client.get("/api/v1/tasks/")
    assert response.status_code == 401

def test_get_task_unauthorized(client):
    response = client.get("/api/v1/tasks/dummyid")
    assert response.status_code == 401

def test_update_task_unauthorized(client):
    response = client.put("/api/v1/tasks/dummyid", json={"title": "New Title"})
    assert response.status_code == 401

def test_delete_task_unauthorized(client):
    response = client.delete("/api/v1/tasks/dummyid")
    assert response.status_code == 401
