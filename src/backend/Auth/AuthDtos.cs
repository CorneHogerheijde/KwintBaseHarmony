namespace KwintBaseHarmony.Auth;

public sealed record RegisterRequest(string Email, string Password, string Role = "Student");
public sealed record LoginRequest(string Email, string Password);
public sealed record AuthResponse(string Token, Guid UserId, string Email, string Role);
public sealed record MeResponse(Guid UserId, string Email, string Role);
