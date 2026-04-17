using System;
using KwintBaseHarmony.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace KwintBaseHarmony.Tests.Infrastructure;

public class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    private readonly string _databaseName = $"kwintbaseharmony-tests-{Guid.NewGuid()}";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        builder.ConfigureServices(services =>
        {
            services.RemoveAll<DbContextOptions<CompositionContext>>();
            services.RemoveAll<CompositionContext>();
            services.RemoveAll<IDbContextOptionsConfiguration<CompositionContext>>();

            services.AddDbContext<CompositionContext>(options =>
                options.UseInMemoryDatabase(_databaseName));

            using var serviceProvider = services.BuildServiceProvider();
            using var scope = serviceProvider.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<CompositionContext>();
            dbContext.Database.EnsureCreated();
        });
    }
}