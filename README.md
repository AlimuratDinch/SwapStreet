# SwapStreet

[![Vercel Status](https://therealsujitk-vercel-badge.vercel.app/?app=swapstreet)](https://swap-street.vercel.app)
[![codecov](https://codecov.io/gh/AlimuratDinch/SwapStreet/branch/main/graph/badge.svg)](https://codecov.io/gh/AlimuratDinch/SwapStreet)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=swapstreet&metric=alert_status)](https://sonarcloud.io/dashboard?id=swapstreet)

## Product Demo
[Product Demo SWAPSTREET](https://drive.google.com/file/d/1L4cA14vKWZ4HPJrBnsa_4RdevloLQnVY/view?usp=sharing)

## Release Demos
- [Release 1](https://drive.google.com/file/d/1Fg40fxtmJ5qpnbLegLKkTHmqGPsn3B3i/view?usp=sharing)  
- [Release 2](https://drive.google.com/file/d/1MHEXG4C85XE_gmDWyNeA2yooyW76ip4_/view?usp=sharing)  
- Release 3  

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

3- Build & Run with Docker
- Create a `.env` file at the root level of the repository
```
# ================================
# Frontend
# ================================
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:8080
API_URL=http://backend:8080

# ================================
# PostgreSQL Database Configuration
# ================================
POSTGRES_USER=admin
POSTGRES_PASSWORD=Password123
POSTGRES_DB=swapstreet-db

# ================================
# pgAdmin Configuration
# ================================
PGADMIN_DEFAULT_EMAIL=admin@example.com
PGADMIN_DEFAULT_PASSWORD=Password123

# ================================
# .NET Backend
# ================================
DOTNET_ENVIRONMENT=Development
ConnectionStrings__DefaultConnection=Host=postgres;Port=5432;Database=swapstreet-db;Username=admin;Password=Password123
ASPNETCORE_URLS=http://+:8080
MINIO_ENDPOINT=minio:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
JWT_SECRET=13d0a95d51d9e78934cfba29210183a90620c23d
REFRESH_TOKEN_EXPIRATION_DAYS=30
JWT_ACCESS_TOKEN_EXPIRATION_MINUTES=60

# ================================
# Minio
# ================================
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin
MINIO_PUBLIC_BUCKET=public
MINIO_PRIVATE_BUCKET=private
MINIO_USE_SSL=false
```
- Create a `.env` file in the swapstreet directory
```
NEXT_PUBLIC_API_URL=http://localhost:8080
```
Depending on your OS, you may need to change "localhost" to "backend". 
we have found Mac/unix users need "backend" and others need "localhost"

- Make sure `Docker Desktop` is running, then:
```
docker compose -f docker-compose.local.staging.yml up --build
```

## Wiki Table of Contents
- [Meeting Minutes](https://github.com/AlimuratDinch/SwapStreet/wiki#1-meeting-minutes)
- [Risks](https://github.com/AlimuratDinch/SwapStreet/wiki#2-risks)
- [User Consent and End-User License Agreemenet](https://github.com/AlimuratDinch/SwapStreet/wiki#3-user-consent-and-end-user-license-agreement)
- [Legal and Ethical Issues](https://github.com/AlimuratDinch/SwapStreet/wiki#4-legal-and-ethical-issues)
- [Economic](https://github.com/AlimuratDinch/SwapStreet/wiki#5-economic)
- [Budget](https://github.com/AlimuratDinch/SwapStreet/wiki#6-budget)
- [Personas](https://github.com/AlimuratDinch/SwapStreet/wiki#7-personas)
- [Wireframes](https://github.com/AlimuratDinch/SwapStreet/wiki#8-wireframes)
- [Diversity Statement](https://github.com/AlimuratDinch/SwapStreet/wiki#9-diversity-statement)
- [Overall Architecture and Class Diagrams](https://github.com/AlimuratDinch/SwapStreet/wiki#10-overall-architecture-and-class-diagrams)
- [Infrastructure and Tools](https://github.com/AlimuratDinch/SwapStreet/wiki#11-infrastructure-and-tools)
- [Name Conventions](https://github.com/AlimuratDinch/SwapStreet/wiki#12-naming-conventions)
- [Testing Plan and Continuous Integration](https://github.com/AlimuratDinch/SwapStreet/wiki#13-testing-plan-and-continuous-integration)
- [Security](https://github.com/AlimuratDinch/SwapStreet/wiki#14-security)
- [Performance](https://github.com/AlimuratDinch/SwapStreet/wiki#15-performance)
- [Deployment Plan and Infrastructure](https://github.com/AlimuratDinch/SwapStreet/wiki#16-deployment-plan-and-infrastructure)
- [Missing Knowledge and Independent Learning](https://github.com/AlimuratDinch/SwapStreet/wiki#17-missing-knowledge-and-independent-learning)

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



Location data retrieved from: https://simplemaps.com/data/canada-cities
