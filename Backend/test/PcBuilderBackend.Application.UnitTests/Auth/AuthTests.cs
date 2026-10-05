using FluentAssertions;
using NSubstitute;
using PcBuilderBackend.Application.Auth.Commands.ChangePassword;
using PcBuilderBackend.Application.Auth.Commands.ForgotPassword;
using PcBuilderBackend.Application.Auth.Commands.Login;
using PcBuilderBackend.Application.Auth.Commands.Logout;
using PcBuilderBackend.Application.Auth.Commands.RefreshToken;
using PcBuilderBackend.Application.Auth.Commands.Register;
using PcBuilderBackend.Application.Auth.Commands.ResetPassword;
using PcBuilderBackend.Application.Auth.Dto;
using PcBuilderBackend.Application.Auth.Queries;
using PcBuilderBackend.Application.Auth.Validators;
using PcBuilderBackend.Application.Common.Interfaces;
using PcBuilderBackend.Application.Common.Options;

namespace PcBuilderBackend.Application.UnitTests.Auth;

public class AuthTests
{
    [Fact]
    public void Register_validator_requires_email_password_and_username()
    {
        var validator = new RegisterCommandValidator();

        validator.Validate(new RegisterCommand("", "short", "")).IsValid.Should().BeFalse();
        validator.Validate(new RegisterCommand("user@localhost", "ChangeMe!12", "Ada"))
            .IsValid.Should().BeTrue();
        validator.Validate(new RegisterCommand("user@localhost", "ChangeMe!12", "user@localhost"))
            .IsValid.Should().BeFalse();
    }

    [Fact]
    public void Login_and_refresh_validators_reject_empty_fields()
    {
        new LoginCommandValidator().Validate(new LoginCommand("", "")).IsValid.Should().BeFalse();
        new LoginCommandValidator().Validate(new LoginCommand("a@b.c", "secret")).IsValid.Should().BeTrue();
        new RefreshTokenCommandValidator().Validate(new RefreshTokenCommand("")).IsValid.Should().BeFalse();
        new RefreshTokenCommandValidator().Validate(new RefreshTokenCommand("token")).IsValid.Should().BeTrue();
    }

    [Fact]
    public async Task Register_handler_delegates_to_identity_service()
    {
        var identity = Substitute.For<IIdentityService>();
        var expected = new RegisterResultDto(
            true,
            new CurrentUserDto(Guid.NewGuid(), "a@b.c", "Ada", ["Member"]),
            new Dictionary<string, string[]>());
        identity.RegisterMemberAsync("a@b.c", "pw", "Ada", Arg.Any<CancellationToken>())
            .Returns(expected);

        var result = await new RegisterHandler(identity)
            .Handle(new RegisterCommand("a@b.c", "pw", "Ada"), CancellationToken.None);

        result.Should().Be(expected);
    }

    [Fact]
    public async Task Login_handler_returns_locked_failed_or_tokens()
    {
        var identity = Substitute.For<IIdentityService>();
        var tokens = Substitute.For<ITokenService>();
        var user = new CurrentUserDto(Guid.NewGuid(), "a@b.c", "Ada", ["Member"]);

        identity.PasswordSignInAsync("a@b.c", "pw", Arg.Any<CancellationToken>())
            .Returns(new PasswordSignInResultDto(false, true, null));
        var locked = await new LoginHandler(identity, tokens)
            .Handle(new LoginCommand("a@b.c", "pw"), CancellationToken.None);
        locked.IsLockedOut.Should().BeTrue();
        locked.Succeeded.Should().BeFalse();

        identity.PasswordSignInAsync("a@b.c", "bad", Arg.Any<CancellationToken>())
            .Returns(new PasswordSignInResultDto(false, false, null));
        var failed = await new LoginHandler(identity, tokens)
            .Handle(new LoginCommand("a@b.c", "bad"), CancellationToken.None);
        failed.Succeeded.Should().BeFalse();

        var issued = new AuthTokensDto("access", "refresh", 3600, user);
        identity.PasswordSignInAsync("a@b.c", "pw", Arg.Any<CancellationToken>())
            .Returns(new PasswordSignInResultDto(true, false, user));
        tokens.IssueTokenPairAsync(user, Arg.Any<CancellationToken>()).Returns(issued);
        var ok = await new LoginHandler(identity, tokens)
            .Handle(new LoginCommand("a@b.c", "pw"), CancellationToken.None);
        ok.Succeeded.Should().BeTrue();
        ok.Tokens.Should().Be(issued);
    }

    [Fact]
    public async Task Refresh_logout_and_current_user_handlers_delegate()
    {
        var tokens = Substitute.For<ITokenService>();
        var identity = Substitute.For<IIdentityService>();
        var current = Substitute.For<ICurrentUser>();
        var user = new CurrentUserDto(Guid.NewGuid(), "a@b.c", "Ada", ["Member"]);
        var pair = new AuthTokensDto("a", "b", 1, user);

        tokens.RotateAsync("old", Arg.Any<CancellationToken>()).Returns(pair);
        (await new RefreshTokenHandler(tokens).Handle(new RefreshTokenCommand("old"), CancellationToken.None))
            .Should().Be(pair);

        await new LogoutHandler(tokens).Handle(new LogoutCommand(null), CancellationToken.None);
        await tokens.DidNotReceive().RevokeAsync(Arg.Any<string>(), Arg.Any<CancellationToken>());

        await new LogoutHandler(tokens).Handle(new LogoutCommand("refresh"), CancellationToken.None);
        await tokens.Received(1).RevokeAsync("refresh", Arg.Any<CancellationToken>());

        current.UserId.Returns((Guid?)null);
        (await new GetCurrentUserHandler(current, identity).Handle(new GetCurrentUserQuery(), CancellationToken.None))
            .Should().BeNull();

        current.UserId.Returns(user.Id);
        identity.GetUserAsync(user.Id, Arg.Any<CancellationToken>()).Returns(user);
        (await new GetCurrentUserHandler(current, identity).Handle(new GetCurrentUserQuery(), CancellationToken.None))
            .Should().Be(user);
    }

    [Fact]
    public void Password_validators_require_matching_new_passwords()
    {
        new ForgotPasswordCommandValidator().Validate(new ForgotPasswordCommand("")).IsValid.Should().BeFalse();
        new ForgotPasswordCommandValidator().Validate(new ForgotPasswordCommand("a@b.c")).IsValid.Should().BeTrue();

        new ResetPasswordCommandValidator()
            .Validate(new ResetPasswordCommand("a@b.c", "token", "ChangeMe!12", "mismatch"))
            .IsValid.Should().BeFalse();
        new ResetPasswordCommandValidator()
            .Validate(new ResetPasswordCommand("a@b.c", "token", "ChangeMe!12", "ChangeMe!12"))
            .IsValid.Should().BeTrue();

        new ChangePasswordCommandValidator()
            .Validate(new ChangePasswordCommand("old-password", "old-password", "old-password"))
            .IsValid.Should().BeFalse();
        new ChangePasswordCommandValidator()
            .Validate(new ChangePasswordCommand("old-password", "ChangeMe!12", "ChangeMe!12"))
            .IsValid.Should().BeTrue();
    }

    [Fact]
    public async Task Forgot_password_sends_email_only_when_the_account_exists()
    {
        var identity = Substitute.For<IIdentityService>();
        var email = Substitute.For<IEmailSender>();
        var app = new AppOptions { PublicBaseUrl = "http://localhost:5173/" };
        var handler = new ForgotPasswordHandler(identity, email, app);

        identity.GeneratePasswordResetTokenAsync("missing@b.c", Arg.Any<CancellationToken>())
            .Returns((PasswordResetTokenDto?)null);
        await handler.Handle(new ForgotPasswordCommand("missing@b.c"), CancellationToken.None);
        await email.DidNotReceive()
            .SendAsync(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<string>(), Arg.Any<CancellationToken>());

        var userId = Guid.NewGuid();
        identity.GeneratePasswordResetTokenAsync("a@b.c", Arg.Any<CancellationToken>())
            .Returns(new PasswordResetTokenDto(userId, "a@b.c", "reset-token"));
        await handler.Handle(new ForgotPasswordCommand("a@b.c"), CancellationToken.None);
        await email.Received(1).SendAsync(
            "a@b.c",
            Arg.Any<string>(),
            Arg.Is<string>(body =>
                body.Contains("http://localhost:5173/reset-password?email=a%40b.c&token=reset-token")),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Reset_password_revokes_refresh_tokens_on_success()
    {
        var identity = Substitute.For<IIdentityService>();
        var tokens = Substitute.For<ITokenService>();
        var userId = Guid.NewGuid();
        var handler = new ResetPasswordHandler(identity, tokens);
        var command = new ResetPasswordCommand("a@b.c", "token", "ChangeMe!12", "ChangeMe!12");

        identity.ResetPasswordAsync("a@b.c", "token", "ChangeMe!12", Arg.Any<CancellationToken>())
            .Returns(new IdentityOperationResultDto(false, null, new Dictionary<string, string[]>()));
        (await handler.Handle(command, CancellationToken.None)).Succeeded.Should().BeFalse();
        await tokens.DidNotReceive().RevokeAllForUserAsync(Arg.Any<Guid>(), Arg.Any<CancellationToken>());

        identity.ResetPasswordAsync("a@b.c", "token", "ChangeMe!12", Arg.Any<CancellationToken>())
            .Returns(new IdentityOperationResultDto(true, userId, new Dictionary<string, string[]>()));
        (await handler.Handle(command, CancellationToken.None)).Succeeded.Should().BeTrue();
        await tokens.Received(1).RevokeAllForUserAsync(userId, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Change_password_requires_sign_in_and_revokes_tokens_on_success()
    {
        var identity = Substitute.For<IIdentityService>();
        var current = Substitute.For<ICurrentUser>();
        var tokens = Substitute.For<ITokenService>();
        var handler = new ChangePasswordHandler(identity, current, tokens);
        var command = new ChangePasswordCommand("old", "ChangeMe!12", "ChangeMe!12");

        current.UserId.Returns((Guid?)null);
        var anonymous = await handler.Handle(command, CancellationToken.None);
        anonymous.Succeeded.Should().BeFalse();
        await identity.DidNotReceive().ChangePasswordAsync(
            Arg.Any<Guid>(), Arg.Any<string>(), Arg.Any<string>(), Arg.Any<CancellationToken>());

        var userId = Guid.NewGuid();
        current.UserId.Returns(userId);
        identity.ChangePasswordAsync(userId, "old", "ChangeMe!12", Arg.Any<CancellationToken>())
            .Returns(new IdentityOperationResultDto(false, userId, new Dictionary<string, string[]>()));
        (await handler.Handle(command, CancellationToken.None)).Succeeded.Should().BeFalse();
        await tokens.DidNotReceive().RevokeAllForUserAsync(Arg.Any<Guid>(), Arg.Any<CancellationToken>());

        identity.ChangePasswordAsync(userId, "old", "ChangeMe!12", Arg.Any<CancellationToken>())
            .Returns(new IdentityOperationResultDto(true, userId, new Dictionary<string, string[]>()));
        (await handler.Handle(command, CancellationToken.None)).Succeeded.Should().BeTrue();
        await tokens.Received(1).RevokeAllForUserAsync(userId, Arg.Any<CancellationToken>());
    }
}
