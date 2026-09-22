import pytest

def test_create_project_unauthorized(client):
    response = client.post("/api/v1/projects/", json={
        "name": "Test Project",
        "status": "pending"
    })
    assert response.status_code == 401

def test_get_projects_unauthorized(client):
    response = client.get("/api/v1/projects/")
    assert response.status_code == 401
    
def test_get_project_unauthorized(client):
    response = client.get("/api/v1/projects/dummyid")
    assert response.status_code == 401

def test_update_project_unauthorized(client):
    response = client.put("/api/v1/projects/dummyid", json={"name": "New name"})
    assert response.status_code == 401

def test_delete_project_unauthorized(client):
    response = client.delete("/api/v1/projects/dummyid")
    assert response.status_code == 401
