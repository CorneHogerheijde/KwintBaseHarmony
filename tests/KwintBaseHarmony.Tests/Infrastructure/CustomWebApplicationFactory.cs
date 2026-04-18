using System;
using KwintBaseHarmony.Data;
using Microsoft.AspNetCore.Authentication;
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
            // Replace real PostgreSQL DB with in-memory DB
            services.RemoveAll<DbContextOptions<CompositionContext>>();
            services.RemoveAll<CompositionContext>();
            services.RemoveAll<IDbContextOptionsConfiguration<CompositionContext>>();

            services.AddDbContext<CompositionContext>(options =>
                options.UseInMemoryDatabase(_databaseName));

            // Replace JWT auth with a test scheme that auto-authenticates every request
            // so existing tests remain green after RequireAuthorization() was added.
            services.AddAuthentication(defaultScheme: TestAuthHandler.SchemeName)
                .AddScheme<AuthenticationSchemeOptions, TestAuthHandler>(
                    TestAuthHandler.SchemeName, _ => { });

            using var serviceProvider = services.BuildServiceProvider();
            using var scope = serviceProvider.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<CompositionContext>();
            dbContext.Database.EnsureCreated();
        });
    }
}