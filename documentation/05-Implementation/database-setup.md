# Description
The database provider used for this project is PostgreSQL. It offers performance, scalability and easy configuration due to its complete docker support. Hence, the following will be a set of instruction guiding you to create the necessary database for this application without the need to physically install any other packages/applications. Everything is configured and managed by docker :)

## Folder structure:
**.\scripts:** Contains `init.sql` and `seed.sql` which will create and populate the necessary tables for the application (docker runs them automatically).

**SwapStreet\\.env:** Contains the user postgres login information.
<br>
<span style="color:red">**Note:**</span> You need to create this file at the root level and write the login information yourself (if not done already).
```
# ================================
# PostgreSQL Database Configuration
# ================================
POSTGRES_USER=<your-db-username>
POSTGRES_PASSWORD=<your-db-password>
POSTGRES_DB=swapstreet_db

# ================================
# pgAdmin Configuration
# ================================
PGADMIN_DEFAULT_EMAIL=<your@email.com>
PGADMIN_DEFAULT_PASSWORD=<your-pgAdmin-password>

# ================================
# Backend connection string
# ================================
ConnectionStrings__DefaultConnection=Host=postgres;Port=5432;Database=swapstreet_db;Username=<your-db-username>;Password=<your-db-password>
```

## Setup instructions
While being inside the root directory ```.\SwapStreet``` run:
<br>

`docker compose up --build`
<br>

This will create the database container (you should see it appear in your docker desktop application) with both the database running as well as pgAdmin.
It will also create the tables from `init.sql` and populate it with the data from `seed.sql`.
<br>
<br>
Now to setup pgAdmin:

- Go to: `http://localhost:5050` (it can take some time so dont panic if nothing loads yet)
- Login with your pgAdmin email and password
  - **Email:** `<your@email.com>`
  - **Password:** `<your-pgAdmin-password>` 
- Click `Add New Server` -> **Name:** `swapstreet-server`
- Inside `Add New Server` go to `Connection` tab -> 
  - **Host name:** postgres
  - **Port:** 5432
  - **Username:** `<your-username>`
  - **Password:** `<your-db-password>`
  - Turn on `Save Password`
- Click on `Save`
<br>

Now you have a PostgreSQL database running and you can manage it through pgAdmin.
<br>

<span style="color:red">**Note:**</span> Every time you modify the files `init.sql` and `seed.sql`, you need to delete and rebuild the container so run:
<br>
```
    docker compose down -v
    docker compose up --build
```
This will delete the database container with its data volumes and re-build the container.