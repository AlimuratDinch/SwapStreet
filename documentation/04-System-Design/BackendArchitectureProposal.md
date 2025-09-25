# Backend Architecture Proposal - Monolith + MicroServices Hybrid

**Author:** Nektarios Zampetoulakis

[![CAP490-Architecture-Proposal-Nektarios.drawio(1).png](https://bookstack.nekzampehomelab.org/uploads/images/gallery/2025-09/scaled-1680-/cap490-architecture-proposal-nektarios-drawio1.png)](https://bookstack.nekzampehomelab.org/uploads/images/gallery/2025-09/cap490-architecture-proposal-nektarios-drawio1.png)

### Overview

Instead of fully committing to either a monolithic or microservices architecture, I propose a hybrid approach. Core functionality, such as the catalog, authentication, and image processing, will run together as a single modular monolith (in one Docker container as a single service). Other services such as the virtual try-on feature, which is resource-intensive and requires independent scaling, will be built as a separate microservice. Both will communicate through the WebAPI Gateway, which serves as the single entry point. Clients (users of the React WebApp) will interact with the system over HTTPS, while internal communication can use gRPC.

---

### Pros

- **Balanced complexity:** Fewer moving parts than a full microservices setup, but more flexibility than a strict monolith.
- **Scalable where needed:** The virtual try-on service can scale independently (e.g., spin up more instances during peak demand) without affecting the stability of the catalog or authentication.
- **Performance efficiency:** Catalog, authentication, and image processing remain in a tightly integrated monolith, avoiding unnecessary network overhead for common interactions.
- **Gradual transition path:** If needed in the future, other parts of the monolith can be split into independent microservices without a full redesign.
- **Lower operational overhead:** Only one service (virtual try-on) requires advanced orchestration, while the rest can be managed as a simpler unit.
- **Technology flexibility:** The virtual try-on service could be implemented with specialized frameworks (e.g., computer vision/ML libraries) different from the core stack.

---

### Cons

- **Limited modularity compared to full microservices:** Catalog, authentication, and image processing remain coupled; scaling one requires scaling them all.
- **Potential bottlenecks:** If the monolith grows too large, performance and maintainability may degrade over time.
- **Dual deployment model:** The team must manage both a monolith and a microservice within Kubernetes.
- **Future refactoring risk:** If additional services later require independent scaling, breaking them out of the monolith will add development overhead.

---

**Note**: I would include the gateway WebAPI within the monolith service to start. The diagram acts as an example and is subject to change.