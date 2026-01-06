# Mintify -- Report

## 1) Motivation: what makes the system a dynamic web system
Mintify supports:
- **User-specific data** for budgets, transactions and notifications that changes continuously
- **Real-time updates** as notifications are pushed to clients via WebSockets when new spending events occur
- **Event-driven processing** where creating a transaction triggers asynchronous workflows through RabbitMQ
- **External API integration** that creates dynamic finanical advice based on user transaction history
- **Secure request flow** as end users authenticate via Keycloak

## 2) High-level Architecture

### 2.1 Services overview
- **frontend**         : UI
- **gateway-service**  : single entry point that validates tokens and routes to internal services
- **Keycloak**         : authentication, identity provider
- **budget-service**   : CRUD budgets; consumes spending events to update spent
- **transact-service** : CRUD transactions + CSV import; publishes spending events
- **notif-service**    : stores notifications; consumes events; pushes WebSocket notifications
- **rabbitmq**         : event broker
- **mongodb**          : persistent storage for service data

### 2.2 System diagram
```mermaid
flowchart LR
  U[User Browser] -->|HTTPS| FE[frontend]
  FE -->|HTTPS REST| GW[gateway-service]

  GW -->|OIDC JWT validate| KC[Keycloak]
  GW -->|REST| TS[transact-service]
  GW -->|REST| BS[budget-service]
  GW -->|REST| NS[notif-service]

  TS -->|Publish spending events| RMQ[(RabbitMQ Exchange)]
  RMQ -->|Consume| BS
  RMQ -->|Consume| NS

  TS -->|MongoDB| MDB1[(MongoDB)]
  BS -->|MongoDB| MDB2[(MongoDB)]
  NS -->|MongoDB| MDB3[(MongoDB)]

  NS -->|WebSocket push| FE
```

### 2.3 Communication patterns
- **Synchronous (REST)**    : frontend --> gateway-service --> internal services
- **Asynchronous (events)** : transact-service --> RabbitMQ --> budget-service/notif-service
- **Real-time**             : notif-service --> frontend via WebSocket

## 3) GitOps CI/CD Pipeline
```mermaid
flowchart LR
  DEV[Developer Push/PR] --> GH[GitHub Repo]
  GH --> CI[CI: Lint/Test]
  CI --> BUILD[Build Docker Images]
  BUILD --> REG[Container Registry]
  BUILD --> GITOPS[Update K8s Manifests/Helm Values in GitOps Repo]
  GITOPS --> CD[GitOps Controller - ArgoCD/Fleet]
  CD --> K8S[Rancher/Kubernetes Cluster]
  K8S --> OBS[Monitoring/Logs/Tracing]
```

## 4) Security Model

### 4.1 Security design
- Authentication: Keycloak OIDC
- Gateway validates JWT signature using JWKS and checks issuer
- Gateway derives user id from token claims and propagates identity downstream (x-user-id header)
- Services enforce multi-tenancy by scoping DB queries to userId

### 4.2 Request flow diagram
```mermaid
sequenceDiagram
  participant FE as Frontend
  participant KC as Keycloak
  participant GW as Gateway
  participant SVC as Internal Service
  participant DB as MongoDB

  FE->>KC: Login (OIDC)
  KC-->>FE: Access Token (JWT)
  FE->>GW: REST request + Authorization: Bearer JWT
  GW->>KC: Fetch JWKS (cached) / verify token
  GW->>SVC: Forward request + x-user-id derived from JWT
  SVC->>DB: Query scoped by userId
  DB-->>SVC: User-specific data
  SVC-->>GW: Response
  GW-->>FE: Response
```

### 4.3 Notes
- In dev mode, gateway can allow fallback identity to speed up development
- In production, fallback should be disabled

## 5) Monitoring Set-up

## 6) Database Schemas
```mermaid
erDiagram
  TRANSACTION {
    string _id
    string userId
    string type        "expense|income"
    number amount
    string category
    date   date
    string description
    string source      "manual|csv"
    date   createdAt
    date   updatedAt
  }

  BUDGET {
    string _id
    string userId
    string category
    number limit
    number spent
    string period      "YYYY-MM"
    date   createdAt
    date   updatedAt
  }

  NOTIFICATION {
    string _id
    string userId
    string type        "info|threshold|..."
    string title
    string message
    boolean read
    date   createdAt
    date   updatedAt
  }

  TRANSACTION ||--o{ BUDGET : "updates spent by category/period"
  TRANSACTION ||--o{ NOTIFICATION : "creates notifications"
```
