using FluentValidation;
using PcBuilderBackend.Application.Build.Queries;

namespace PcBuilderBackend.Application.Build.Validators;

public class ListBuildPicturesQueryValidator : AbstractValidator<ListBuildPicturesQuery>
{
    public ListBuildPicturesQueryValidator()
    {
        RuleFor(query => query.BuildId).NotEmpty();
    }
}
