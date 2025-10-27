# Working In The Backend

### Local Build

Before running or testing the project locally, you should ensure the application builds successfully. It’s also good practice to clean previous builds and clear caches before starting fresh.

#### Steps:

1. **Clean previous builds**:

<div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary" id="bkmrk-dotnet-clean"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs">  
</div></div></div><div class="overflow-y-auto p-4" dir="ltr">`dotnet clean`</div></div>2. **Clear NuGet caches** (optional but recommended if you had dependency issues before):

<div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary" id="bkmrk-dotnet-nuget-locals-"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs">  
</div></div></div><div class="overflow-y-auto p-4" dir="ltr">`dotnet nuget locals all --clear`</div></div>3. **Restore all dependencies**:

<div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary" id="bkmrk-dotnet-restore"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs">  
</div></div></div><div class="overflow-y-auto p-4" dir="ltr">`dotnet restore`</div></div>4. **Build the project**:

<div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary" id="bkmrk-dotnet-build"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs">  
</div></div></div><div class="overflow-y-auto p-4" dir="ltr">`dotnet build`</div></div>5. **Run the application locally** (for Web API):

<div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary" id="bkmrk-dotnet-run---project"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs">  
</div></div></div><div class="overflow-y-auto p-4" dir="ltr">`dotnet run --project ./backend/backend.csproj`</div></div>### Migrations

Anytime you change or add to the database schema, you must run a migration. This ensures that your database stays in sync with your application models.

#### Steps:

1. **Install EF Core CLI tools** (if not already installed):

<div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary" id="bkmrk-dotnet-tool-install-"><div class="overflow-y-auto p-4" dir="ltr">`dotnet tool install --global dotnet-ef`</div></div>2. **Add a migration** after changing models:

<div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary" id="bkmrk-dotnet-ef-migrations"><div class="overflow-y-auto p-4" dir="ltr">`dotnet ef migrations add <MigrationName>`</div></div>3. **Update the database** with the latest migration:

<div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary" id="bkmrk-dotnet-ef-database-u"><div class="overflow-y-auto p-4" dir="ltr">`dotnet ef database update`</div></div>> Replace `MigrationName` with a descriptive name for your change.

---

### Code Formatter

To keep code consistent and clean, use `dotnet format`.

#### Steps:

1. **Install the formatter tool** (if not already installed):

<div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary" id="bkmrk-dotnet-tool-install--1"><div class="sticky top-9">  
</div><div class="overflow-y-auto p-4" dir="ltr">`dotnet tool install -g dotnet-format`</div></div>2. **Run the formatter** on the solution or project:

<div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary" id="bkmrk-dotnet-format-backen"><div class="overflow-y-auto p-4" dir="ltr">`dotnet format backend.sln `</div></div>---

### Testing

Testing ensures your code works as expected. We use **xUnit** for unit tests and **Coverlet** for code coverage.

#### Steps:

1. **Restore dependencies**:

<div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary" id="bkmrk-dotnet-restore-1"><div class="overflow-y-auto p-4" dir="ltr">`dotnet restore`</div></div>2. **Run tests**:

<div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary" id="bkmrk-dotnet-test"><div class="overflow-y-auto p-4" dir="ltr">`dotnet <span class="hljs-built_in">test</span>`</div></div>3. **Run coverage report** (using Coverlet):

<div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary" id="bkmrk-coverlet-.%2Fbackend.t"><div class="overflow-y-auto p-4" dir="ltr">`coverlet ./backend.Tests/bin/Debug/net9.0/backend.Tests.dll `  --target <span class="hljs-string">"dotnet"</span> `  --targetargs <span class="hljs-string">"test ./backend.Tests/backend.Tests.csproj"</span> `  --format opencover `  --output ./coverage/coverage.xml`</div></div>4. **Generate HTML report** (optional, using ReportGenerator):

<div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary" id="bkmrk-reportgenerator--rep"><div class="overflow-y-auto p-4" dir="ltr">`reportgenerator -reports:./coverage/coverage.xml -targetdir:./coverage/html -reporttypes:Html`</div></div>> Open the `./coverage/html/index.html` file in your browser to see the coverage report.