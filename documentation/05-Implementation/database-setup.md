# Description
The database provider used for this project is PostgreSQL. It offers performance, scalability 
and easy configuration due to its complete docker support. Hence the following will be a set
of instruction guiding you to create the necessary database for this application without the need
to physically install any other packages/applications. Everything is configured and managed by docker :)

## Folder structure:
**.\scripts:** Contains ```init.sql``` and ```seed.sql``` which will create and populate the necessary tables for the application.

**.\\.env:** Contains the user postgres login information.
<br>
<span style="color:red">**Note:**</span> You need to create this file and write the login information yourself.
```
# Database
POSTGRES_USER=aaa
POSTGRES_PASSWORD=aaa
POSTGRES_DB=swapstreet-db

# pgAdmin
PGADMIN_DEFAULT_EMAIL=aaa@aaa.com
PGADMIN_DEFAULT_PASSWORD=aaa
```

**.\compose.yaml:** Contains the required information for docker to build the postgres database and also the database manager pgAdmin.

**.\gitignore:** Ensures ```.env``` is ignored by git.

## Setup instructions
While being inside the directory ```.\database``` run:
<br>
```
    docker compose up -d
```
<br>

This will create the database container (you should see it appear in your docker desktop application) with both the database running as well as pgAdmin.
It will also create the tables from ```init.sql``` and populate it with the data from ```seed.sql```.
<br>
<br>
Now to setup pgAdmin:

- Go to: ```http://localhost:5050```
- Login with your postgress email and password (from the ```.env```)
- Add New Server -> Name: swapstreet-db
- Connection tab -> 
  - Host name: postgres
  - Port: 5432
  - Username: env-username
  - Password: env-password (optional: save password)
- Save
<br>

Now you have a PostgreSQL database running and you can manage it through pgAdmin.
<br>
<span style="color:red">**Note:**</span> Every time you modify the files ```init.sql``` and ```seed.sql```, you need to delete and rebuild the container so run:
<br>
```
    docker compose down -v
    docker compose up -d
```
<br>
This will delete and the database container with data volumes and re-build the container.