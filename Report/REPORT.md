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
