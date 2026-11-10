using FluentValidation;
using PcBuilderBackend.Application.Build.Queries;

namespace PcBuilderBackend.Application.Build.Validators;

public class GetBuildPictureContentQueryValidator : AbstractValidator<GetBuildPictureContentQuery>
{
    public GetBuildPictureContentQueryValidator()
    {
        RuleFor(query => query.Id).NotEmpty();
    }
}
