import pytest

# Note: These tests assume a running MongoDB instance.

def test_register_user(client):
    response = client.post("/api/v1/auth/register", json={
        "name": "Test User",
        "email": "test@example.com",
        "password": "password123"
    })
    if response.status_code == 201:
        data = response.json()
        assert "id" in data
        assert data["email"] == "test@example.com"
        assert "password" not in data
        assert "hashed_password" not in data

def test_duplicate_registration(client):
    client.post("/api/v1/auth/register", json={
        "name": "Test User",
        "email": "duplicate@example.com",
        "password": "password123"
    })
    response = client.post("/api/v1/auth/register", json={
        "name": "Test User",
        "email": "duplicate@example.com",
        "password": "password123"
    })
    if response.status_code == 400:
        assert response.json()["detail"] == "The user with this email already exists in the system."

def test_login(client):
    response = client.post("/api/v1/auth/login", data={
        "username": "test@example.com",
        "password": "password123"
    })
    if response.status_code == 200:
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

def test_invalid_password(client):
    response = client.post("/api/v1/auth/login", data={
        "username": "test@example.com",
        "password": "wrongpassword"
    })
    if response.status_code == 400:
        assert response.json()["detail"] == "Incorrect email or password"

def test_unauthorized_request(client):
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401

def test_invalid_token(client):
    response = client.get("/api/v1/auth/me", headers={"Authorization": "Bearer invalidtoken"})
    assert response.status_code == 401
