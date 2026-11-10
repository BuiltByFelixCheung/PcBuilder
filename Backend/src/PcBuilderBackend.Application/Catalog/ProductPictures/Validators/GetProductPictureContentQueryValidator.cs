using FluentValidation;
using PcBuilderBackend.Application.Catalog.ProductPictures.Queries;

namespace PcBuilderBackend.Application.Catalog.ProductPictures.Validators;

public class GetProductPictureContentQueryValidator : AbstractValidator<GetProductPictureContentQuery>
{
    public GetProductPictureContentQueryValidator()
    {
        RuleFor(query => query.Id).NotEmpty();
    }
}
