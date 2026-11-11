using FluentAssertions;
using PcBuilderBackend.Application.Auth.Commands.CreateApiKey;
using PcBuilderBackend.Application.Auth.Validators;
using PcBuilderBackend.Application.Common.Authorization;

namespace PcBuilderBackend.Application.UnitTests.Auth;

public class ImporterAuthorizationTests
{
    [Fact]
    public void Importer_can_create_and_import_but_cannot_delete_update_or_write_builds()
    {
        var deletePolicy = MutationAuthorizationRules.PolicyFor(
            ["DELETE"],
            "cpu/{id}",
            AuthPolicies.CatalogWrite,
            AuthPolicies.CatalogImport);
        deletePolicy.Should().Be(AuthPolicies.CatalogWrite);
        AuthPolicyRules.Allows(deletePolicy!, AuthRoles.Importer).Should().BeFalse();
        AuthPolicyRules.Allows(deletePolicy!, AuthRoles.Admin).Should().BeTrue();

        var updatePolicy = MutationAuthorizationRules.PolicyFor(
            ["PUT"],
            "cpu",
            AuthPolicies.CatalogWrite,
            AuthPolicies.CatalogImport);
        updatePolicy.Should().Be(AuthPolicies.CatalogWrite);
        AuthPolicyRules.Allows(updatePolicy!, AuthRoles.Importer).Should().BeFalse();

        var createPolicy = MutationAuthorizationRules.PolicyFor(
            ["POST"],
            "cpu",
            AuthPolicies.CatalogWrite,
            AuthPolicies.CatalogImport);
        createPolicy.Should().Be(AuthPolicies.CatalogImport);
        AuthPolicyRules.Allows(createPolicy!, AuthRoles.Importer).Should().BeTrue();
        AuthPolicyRules.Allows(createPolicy!, AuthRoles.Admin).Should().BeTrue();

        var importPolicy = MutationAuthorizationRules.PolicyFor(
            ["POST"],
            "cpu/import",
            AuthPolicies.CatalogWrite,
            AuthPolicies.CatalogImport);
        AuthPolicyRules.Allows(importPolicy!, AuthRoles.Importer).Should().BeTrue();

        var masterDataDelete = MutationAuthorizationRules.PolicyFor(
            ["DELETE"],
            "manufacturer/{id}",
            AuthPolicies.MasterDataWrite,
            AuthPolicies.MasterDataImport);
        AuthPolicyRules.Allows(masterDataDelete!, AuthRoles.Importer).Should().BeFalse();
        AuthPolicyRules.Allows(AuthPolicies.MasterDataImport, AuthRoles.Importer).Should().BeTrue();

        MutationAuthorizationRules.PolicyFor(
                ["POST"],
                "cpu/query",
                AuthPolicies.CatalogWrite,
                AuthPolicies.CatalogImport)
            .Should().BeNull();
        MutationAuthorizationRules.PolicyFor(
                ["GET"],
                "cpu",
                AuthPolicies.CatalogWrite,
                AuthPolicies.CatalogImport)
            .Should().BeNull();

        AuthPolicyRules.Allows(AuthPolicies.BuildWrite, AuthRoles.Importer).Should().BeFalse();
        AuthPolicyRules.Allows(AuthPolicies.BuildWrite, AuthRoles.Member).Should().BeTrue();
        AuthPolicyRules.Allows(AuthPolicies.ApiKeyManage, AuthRoles.Importer).Should().BeFalse();
        AuthPolicyRules.Allows(AuthPolicies.ApiKeyManage, AuthRoles.Admin).Should().BeTrue();
    }

    [Fact]
    public void Create_api_key_validator_rejects_a_blank_name_and_a_past_expiry()
    {
        var validator = new CreateApiKeyCommandValidator();

        validator.Validate(new CreateApiKeyCommand("", null)).IsValid.Should().BeFalse();
        validator.Validate(new CreateApiKeyCommand("agent", DateTime.UtcNow.AddMinutes(-1))).IsValid.Should().BeFalse();
        validator.Validate(new CreateApiKeyCommand("agent", null)).IsValid.Should().BeTrue();
        validator.Validate(new CreateApiKeyCommand("agent", DateTime.UtcNow.AddHours(1))).IsValid.Should().BeTrue();

        var unspecifiedFuture = DateTime.SpecifyKind(DateTime.UtcNow.AddHours(2), DateTimeKind.Unspecified);
        validator.Validate(new CreateApiKeyCommand("agent", unspecifiedFuture)).IsValid.Should().BeTrue();
        var unspecifiedPast = DateTime.SpecifyKind(DateTime.UtcNow.AddMinutes(-2), DateTimeKind.Unspecified);
        validator.Validate(new CreateApiKeyCommand("agent", unspecifiedPast)).IsValid.Should().BeFalse();

        validator.Validate(new CreateApiKeyCommand("agent", DateTime.UtcNow.AddHours(2).ToLocalTime()))
            .IsValid.Should().BeTrue();
        validator.Validate(new CreateApiKeyCommand("agent", DateTime.UtcNow.AddHours(-2).ToLocalTime()))
            .IsValid.Should().BeFalse();
    }
}
