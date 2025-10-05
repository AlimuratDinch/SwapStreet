# Setting Up Backend

#### Step 1: Install .NET SDK 9.0

.NET SDK is required to build, run, and test the SwapStreet backend project.

##### **Windows**

1. Go to the official .NET download page:  
    [https://dotnet.microsoft.com/en-us/download/dotnet/9.0<span aria-hidden="true" class="ms-0.5 inline-block align-middle leading-none"><svg class="block h-[0.75em] w-[0.75em] stroke-current stroke-[0.75]" data-rtl-flip="" fill="currentColor" height="20" viewbox="0 0 20 20" width="20" xmlns="http://www.w3.org/2000/svg"><path d="M14.3349 13.3301V6.60645L5.47065 15.4707C5.21095 15.7304 4.78895 15.7304 4.52925 15.4707C4.26955 15.211 4.26955 14.789 4.52925 14.5293L13.3935 5.66504H6.66011C6.29284 5.66504 5.99507 5.36727 5.99507 5C5.99507 4.63273 6.29284 4.33496 6.66011 4.33496H14.9999L15.1337 4.34863C15.4369 4.41057 15.665 4.67857 15.665 5V13.3301C15.6649 13.6973 15.3672 13.9951 14.9999 13.9951C14.6327 13.9951 14.335 13.6973 14.3349 13.3301Z"></path></svg></span>](https://dotnet.microsoft.com/en-us/download/dotnet/9.0)
2. Download **.NET SDK 9.0** for Windows (`x64` installer).
3. Run the installer and follow the prompts.
4. Open **PowerShell** and verify the installation:

<div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary" id="bkmrk-dotnet---version"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs">  
</div></div></div><div class="overflow-y-auto p-4" dir="ltr">`dotnet --version`</div></div>You should see:

<div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary" id="bkmrk-9.0.x"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs">  
</div></div></div><div class="overflow-y-auto p-4" dir="ltr">`9.0.x`</div></div>---

##### **macOS**

1. Go to the official .NET download page:  
    [https://dotnet.microsoft.com/en-us/download/dotnet/9.0<span aria-hidden="true" class="ms-0.5 inline-block align-middle leading-none"><svg class="block h-[0.75em] w-[0.75em] stroke-current stroke-[0.75]" data-rtl-flip="" fill="currentColor" height="20" viewbox="0 0 20 20" width="20" xmlns="http://www.w3.org/2000/svg"><path d="M14.3349 13.3301V6.60645L5.47065 15.4707C5.21095 15.7304 4.78895 15.7304 4.52925 15.4707C4.26955 15.211 4.26955 14.789 4.52925 14.5293L13.3935 5.66504H6.66011C6.29284 5.66504 5.99507 5.36727 5.99507 5C5.99507 4.63273 6.29284 4.33496 6.66011 4.33496H14.9999L15.1337 4.34863C15.4369 4.41057 15.665 4.67857 15.665 5V13.3301C15.6649 13.6973 15.3672 13.9951 14.9999 13.9951C14.6327 13.9951 14.335 13.6973 14.3349 13.3301Z"></path></svg></span>](https://dotnet.microsoft.com/en-us/download/dotnet/9.0)
2. Download the **.NET SDK 9.0** `.pkg` installer for macOS.
3. Open the downloaded file and follow the installer instructions.
4. Open **Terminal** and verify the installation:

<div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary" id="bkmrk-dotnet---version-1"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs">  
</div></div></div><div class="overflow-y-auto p-4" dir="ltr">`dotnet --version`</div></div>You should see:

<div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary" id="bkmrk-9.0.x-1"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs">  
</div></div></div><div class="overflow-y-auto p-4" dir="ltr">`9.0.x`</div></div>> Alternatively, if using Homebrew, you can install via:
> 
> <div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs">  
> </div></div></div><div class="overflow-y-auto p-4" dir="ltr">`brew install --cask dotnet-sdk`</div></div>

---

##### **Linux (Ubuntu / Debian-based)**

1. Open a terminal.
2. Add Microsoft’s package repository:

<div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary" id="bkmrk-wget-https%3A%2F%2Fpackage"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs">  
</div></div></div><div class="overflow-y-auto p-4" dir="ltr">`wget https://packages.microsoft.com/config/ubuntu/22.04/packages-microsoft-prod.deb -O packages-microsoft-prod.debsudo dpkg -i packages-microsoft-prod.deb<span class="hljs-built_in">rm</span> packages-microsoft-prod.deb`</div></div>3. Install the .NET SDK 9.0:

<div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary" id="bkmrk-sudo-apt-get-update-"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs">  
</div></div></div><div class="overflow-y-auto p-4" dir="ltr">`sudo apt-get updatesudo apt-get install -y dotnet-sdk-9.0`</div></div>4. Verify installation:

<div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary" id="bkmrk-dotnet---version-2"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs">  
</div></div></div><div class="overflow-y-auto p-4" dir="ltr">`dotnet --version`</div></div>You should see:

<div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary" id="bkmrk-9.0.x-2"><div class="sticky top-9"><div class="absolute end-0 bottom-0 flex h-9 items-center pe-2"><div class="bg-token-bg-elevated-secondary text-token-text-secondary flex items-center gap-4 rounded-sm px-2 font-sans text-xs">  
</div></div></div><div class="overflow-y-auto p-4" dir="ltr">`9.0.x`</div></div>> For other distributions (Fedora, CentOS, Arch, etc.), follow Microsoft’s official instructions:  
> [https://docs.microsoft.com/dotnet/core/install/linux](https://docs.microsoft.com/dotnet/core/install/linux)

---

#### Step 2: Install All Dependencies

##### 1. Open a terminal / PowerShell

- **Windows**: PowerShell
- **macOS / Linux**: Terminal

Navigate to the `backend` folder (where the `.sln` file is):

<div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary" id="bkmrk-cd-swapstreet%2Fbacken"><div class="overflow-y-auto p-4" dir="ltr">`<span class="hljs-built_in">cd</span> SwapStreet/backend`</div></div>##### 2. Restore dependencies for the solution

Run:

<div class="contain-inline-size rounded-2xl relative bg-token-sidebar-surface-primary" id="bkmrk-dotnet-restore"><div class="overflow-y-auto p-4" dir="ltr">`dotnet restore`</div></div>- This will download **all NuGet packages** referenced in both `backend.csproj` and `backend.Tests.csproj`.
- If the restore succeeds, you’ll see `Restore completed` messages.
- If there are warnings about package versions, they are usually safe as long as the build succeeds.

---

#### **Step 3: Set Up Environment Variables**

##### 1. In the root folder `swapstreet`

Add a `.env` file with the following structure:

*\# ================================*  
*\# PostgreSQL Database Configuration*  
*\# ================================*  
*POSTGRES\_USER=postgres*  
*POSTGRES\_PASSWORD=\*\*\*\*\*\*\*\**  
*POSTGRES\_DB=swapstreet-db*

*\# ================================*  
*\# pgAdmin Configuration*  
*\# ================================*  
*PGADMIN\_DEFAULT\_EMAIL= example@e mail.com*  
*PGADMIN\_DEFAULT\_PASSWORD=\*\*\*\*\*\*\**

##### 2. Run the docker compose

**Build images and start all containers in foreground**  
`docker compose -f server_docker_compose.yml up --build`

**Build images and start all containers in background (detached)**

`docker compose -f server_docker_compose.yml up -d --build`

**To set up database if not already done go to**: [https://github.com/AlimuratDinch/SwapStreet/blob/main/documentation/05-Implementation/database-setup.md](https://github.com/AlimuratDinch/SwapStreet/blob/main/documentation/05-Implementation/database-setup.md)