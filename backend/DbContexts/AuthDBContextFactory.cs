using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using backend.DbContexts;

namespace backend.DbContexts
{
    public class AuthDbContextFactory : IDesignTimeDbContextFactory<AuthDbContext>
    {
        public AuthDbContext CreateDbContext(string[] args)
        {
            var optionsBuilder = new DbContextOptionsBuilder<AuthDbContext>();

            optionsBuilder.UseNpgsql(Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection"));

            return new AuthDbContext(optionsBuilder.Options);
        }
    }
}