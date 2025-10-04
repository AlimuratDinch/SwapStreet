# SwapStreet

[![Vercel Status](https://therealsujitk-vercel-badge.vercel.app/?app=swapstreet)](https://swap-street.vercel.app)
[![codecov](https://codecov.io/gh/AlimuratDinch/SwapStreet/branch/main/graph/badge.svg)](https://codecov.io/gh/AlimuratDinch/SwapStreet)

## Release Demos
- Release 1:  
- Release 2:  
- Release 3:  

## Project Summary
SwapStreet is a web and mobile marketplace for refurbished and second-hand clothing, designed to make fashion more affordable, accessible and sustainable. 
The platform allows sellers to easily list items and buyers to discover clothing through easy-to-use filters, personalized collections and trending styles.
Beyond simple buying and selling, it envisions advanced features such as AI-powered virtual try-ons, outfit suggestions, secure in-app payments and social interactions to create a more engaging and trustworthy experience.
By combining convenience, personalization and eco-conscious values, the platform not only promotes sustainable fashion but also offers a scalable business model through transaction fees, premium subscriptions and partnerships with thrift stores and brands.

## Developer Getting Started Guide
📌 [Project Board](https://github.com/users/AlimuratDinch/projects/7)

1- Prerequisites
- Docker Desktop (running)
- Git
- Noed.js 20+

2- Clone & Change to the Project Directory
```
git clone https://github.com/AlimuratDinch/SwapStreet
```
```
cd SwapStreet
```

3- Build & Run with Docker
- Create a `.env` file at the root level of the repository
```
# ================================
# PostgreSQL Database Configuration
# ================================
POSTGRES_USER=<your-db-username>
POSTGRES_PASSWORD=<your-db-password>
POSTGRES_DB=swapstreet-db

# ================================
# pgAdmin Configuration
# ================================
PGADMIN_DEFAULT_EMAIL=<your@email.com>
PGADMIN_DEFAULT_PASSWORD=<your-pgAdmin-password>

# ================================
# Backend connection string
# ================================
ConnectionStrings__DefaultConnection=Host=postgres;Port=5432;Database=swapstreet-db;Username=<your-db-username>;Password=<your-db-password>
```

- Make sure `Docker Desktop` is running, then:
```
docker compose up --build
```

## Wiki Table of Contents
- [Meeting Minutes](https://github.com/AlimuratDinch/SwapStreet/wiki#meeting-minutes)
- [Risks](https://github.com/AlimuratDinch/SwapStreet/wiki#risks)
- [User Consent and End-User License Agreemenet](https://github.com/AlimuratDinch/SwapStreet/wiki#user-consent-and-end-user-license-agreement)
- [Legal and Ethical Issues](https://github.com/AlimuratDinch/SwapStreet/wiki#legal-and-ethical-issues)
- [Economic](https://github.com/AlimuratDinch/SwapStreet/wiki#economic)
- [Budget](https://github.com/AlimuratDinch/SwapStreet/wiki#budget)
- [Personas](https://github.com/AlimuratDinch/SwapStreet/wiki#personas)
- [Wireframes](https://github.com/AlimuratDinch/SwapStreet/wiki#wireframes)
- [Diversity Statement](https://github.com/AlimuratDinch/SwapStreet/wiki#diversity-statement)
- [Overall Architecture and Class Diagrams](https://github.com/AlimuratDinch/SwapStreet/wiki#overall-architecture-and-class-diagrams)
- [Infrastructure and Tools](https://github.com/AlimuratDinch/SwapStreet/wiki#infrastructure-and-tools)
- [Name Conventions](https://github.com/AlimuratDinch/SwapStreet/wiki#naming-conventions)
- [Testing Plan and Continuous Integration](https://github.com/AlimuratDinch/SwapStreet/wiki#testing-plan-and-continuous-integration)
- [Security](https://github.com/AlimuratDinch/SwapStreet/wiki#security)
- [Performance](https://github.com/AlimuratDinch/SwapStreet/wiki#performance)
- [Deployment Plan and Infrastructure](https://github.com/AlimuratDinch/SwapStreet/wiki#deployment-plan-and-infrastructure)
- [Missing Knowledge and Independent Learning](https://github.com/AlimuratDinch/SwapStreet/wiki#missing-knowledge-and-independent-learning)

## Team
| Name                     | ID        | GitHub Nicknames 
|--------------------------|-----------| -----------
| Bulat Abdullin          | 40264963  | bulabd
| Azmi Abidi              | 40248132  | Azmi-21
| Joseph Aladas           | 40156616  | JosephAladas
| Ryad Alla               | 40227731  | ryad-all
| William Charron-Boyle   | 40264407  | jws412
| Alimurat Dinchdonmez    | 40245310  | AlimuratDinch
| Marc-Yves Malchev       | 40265238  | Sawanoza
| Jainam Shah             | 40190627  | jainammshah12
| Evan Teboul             | 40238390  | M-a-a-d-man
| Nektarios Zampetoulakis | 40211948  | NekZampe
| Ali Zedan               | 40174606  | alizedan1

## Additional Documentation
https://bookstack.nekzampehomelab.org/
