import asyncio
from datetime import datetime, timedelta
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient
import certifi
import bcrypt
import os
import sys

# Ensure backend root is on sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from app.core.config import settings

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

async def seed_database():
    print(f"Connecting to MongoDB: {settings.mongodb_url[:30]}...")
    client_kwargs = {}
    if settings.mongodb_url.startswith("mongodb+srv://") or "tls=true" in settings.mongodb_url.lower():
        client_kwargs["tlsCAFile"] = certifi.where()

    client = AsyncIOMotorClient(settings.mongodb_url, **client_kwargs)
    db = client[settings.mongodb_database]

    # Verify connection
    await client.admin.command('ping')
    print("Connected to MongoDB successfully!")

    # 1. Create or retrieve Demo User
    demo_email = "demo@example.com"
    existing_user = await db.users.find_one({"email": demo_email})
    
    if existing_user:
        user_id = str(existing_user["_id"])
        print(f"Existing demo user found with ID: {user_id}")
    else:
        user_doc = {
            "name": "Alex Taylor",
            "email": demo_email,
            "hashed_password": hash_password("Password123!"),
            "created_at": datetime.utcnow()
        }
        res = await db.users.insert_one(user_doc)
        user_id = str(res.inserted_id)
        print(f"Created demo user ({demo_email}) with ID: {user_id}")

    now = datetime.utcnow()

    # 2. Five sample projects
    projects_data = [
        {
            "name": "AI Customer Support Copilot",
            "description": "Develop an intelligent real-time customer support assistant powered by Google Gemini to automate tier-1 inquiries and sentiment tracking.",
            "status": "in_progress",
            "start_date": now - timedelta(days=14),
            "due_date": now + timedelta(days=30),
        },
        {
            "name": "Cloud Infrastructure Migration",
            "description": "Migrate legacy on-prem services to AWS containerized microservices with zero downtime and strict compliance auditing.",
            "status": "completed",
            "start_date": now - timedelta(days=45),
            "due_date": now - timedelta(days=2),
        },
        {
            "name": "Mobile Application Redesign v2",
            "description": "Revamp the iOS and Android mobile app interface to introduce dark mode, micro-animations, and offline synchronization.",
            "status": "in_progress",
            "start_date": now - timedelta(days=10),
            "due_date": now + timedelta(days=20),
        },
        {
            "name": "Enterprise Security & Compliance Audit",
            "description": "Perform end-to-end vulnerability scanning, implement automated OAuth/JWT token rotation, and prepare SOC2 Type II compliance reports.",
            "status": "pending",
            "start_date": now - timedelta(days=3),
            "due_date": now + timedelta(days=45),
        },
        {
            "name": "Real-time Analytics Dashboard",
            "description": "Build dynamic analytics charts and aggregation pipelines for tracking team velocity, task completion rates, and AI productivity tips.",
            "status": "in_progress",
            "start_date": now - timedelta(days=7),
            "due_date": now + timedelta(days=15),
        },
    ]

    # Insert projects
    created_projects = []
    for p in projects_data:
        p_doc = {
            "name": p["name"],
            "description": p["description"],
            "status": p["status"],
            "start_date": p["start_date"],
            "due_date": p["due_date"],
            "owner": user_id,
            "created_date": p["start_date"],
            "updated_date": now,
        }
        res = await db.projects.insert_one(p_doc)
        p_id = str(res.inserted_id)
        created_projects.append((p_id, p["name"]))
        print(f"Created project: {p['name']} (ID: {p_id})")

    # 3. Tasks for each project (5 tasks per project = 25 tasks)
    tasks_by_project = [
        # Project 1: AI Customer Support Copilot
        [
            ("Design Gemini Prompt Engineering Pipeline", "Formulate system instructions and response schemas for support queries.", "Completed", "High"),
            ("Implement Support Webhook Gateway", "Handle incoming customer tickets from webhooks with HMAC validation.", "In Progress", "High"),
            ("Integrate Ticket Sentiment Classifier", "Classify ticket urgency and customer sentiment into Low, Medium, High.", "Todo", "Medium"),
            ("Build Support Agent Dashboard UI", "Interface for human review of AI-suggested responses before dispatching.", "Todo", "Medium"),
            ("Design Gemini Prompt Engineering Pipeline (Staging Duplicate)", "Backup duplicate pipeline for A/B testing variations.", "Todo", "Low"),
        ],
        # Project 2: Cloud Infrastructure Migration
        [
            ("Provision EKS Kubernetes Cluster", "Setup multi-zone AWS EKS cluster with managed node groups.", "Completed", "High"),
            ("Migrate Relational Database to Cloud RDS", "Execute zero-downtime replication of customer records.", "Completed", "High"),
            ("Configure CloudWatch Monitoring & Alarms", "Setup CPU, memory, and error-rate threshold alerts.", "Completed", "Medium"),
            ("Decommission Legacy On-Premises Servers", "Verify all traffic routed through cloud load balancer before teardown.", "Completed", "Low"),
            ("Migrate Relational Database to Cloud RDS (Snapshot Duplicate)", "Cold backup validation run on replica.", "Completed", "Low"),
        ],
        # Project 3: Mobile Application Redesign v2
        [
            ("Implement Dark Mode Design Tokens", "Audit all Tailwind and native colors for high contrast dark theme.", "In Progress", "High"),
            ("Build Gesture-Based Task Drag & Drop", "Enable fluid card dragging across Todo, In Progress, and Completed columns.", "In Progress", "Medium"),
            ("Integrate Offline SQLite Cache", "Store tasks locally on device and reconcile changes on network reconnect.", "Todo", "High"),
            ("Conduct Mobile Usability Testing", "Gather feedback from 20 internal beta testers on navigation layout.", "Todo", "Medium"),
            ("Implement Dark Mode Design Tokens (Tablet Duplicate)", "Responsive scale adaptation for tablet form factor.", "Todo", "Low"),
        ],
        # Project 4: Enterprise Security & Compliance Audit
        [
            ("Execute Penetration Testing on Auth Endpoints", "Scan for injection, brute force, and token leakage vectors.", "In Progress", "High"),
            ("Implement Automatic Refresh Token Rotation", "Enforce one-time use tokens with family revocation.", "Todo", "High"),
            ("Generate SOC2 Audit Evidence Archive", "Export CI/CD deploy logs and access control records.", "Todo", "Medium"),
            ("Setup Mandatory 2FA for Admin Accounts", "Enforce TOTP authenticator setup for administrative roles.", "Todo", "Medium"),
            ("Execute Penetration Testing on Auth Endpoints (Duplicate Run)", "Secondary audit run using automated OWASP ZAP.", "Todo", "Low"),
        ],
        # Project 5: Real-time Analytics Dashboard
        [
            ("Build Workload Velocity Chart", "Interactive line chart showing task burn-down velocity per sprint.", "Completed", "High"),
            ("Connect WebSocket Pipeline for Task Metrics", "Push live updates to dashboard when tasks change status.", "In Progress", "High"),
            ("Embed Gemini Productivity Tips Widget", "AI coach offering dynamic recommendations based on completion velocity.", "In Progress", "Medium"),
            ("Export Analytics to PDF & CSV", "One-click download of project progress reports for stakeholders.", "Todo", "Low"),
            ("Build Workload Velocity Chart (Secondary Metric Duplicate)", "Duplicate chart variation tracking story points vs task counts.", "Todo", "Low"),
        ]
    ]

    total_tasks = 0
    for idx, (p_id, p_name) in enumerate(created_projects):
        task_list = tasks_by_project[idx]
        for title, desc, status, priority in task_list:
            task_doc = {
                "title": title,
                "description": desc,
                "project_id": p_id,
                "assigned_to": "Alex Taylor",
                "status": status,
                "priority": priority,
                "due_date": now + timedelta(days=7),
                "owner_id": user_id,
                "created_at": now,
                "updated_at": now,
            }
            await db.tasks.insert_one(task_doc)
            total_tasks += 1

    print(f"\nSuccessfully seeded {len(created_projects)} projects and {total_tasks} tasks for user '{demo_email}'!")
    print(f"Credentials: Email: {demo_email} | Password: Password123!")

if __name__ == "__main__":
    asyncio.run(seed_database())
