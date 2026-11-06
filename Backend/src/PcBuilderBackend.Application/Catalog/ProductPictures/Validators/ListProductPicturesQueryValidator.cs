using FluentValidation;
using PcBuilderBackend.Application.Catalog.ProductPictures.Queries;

namespace PcBuilderBackend.Application.Catalog.ProductPictures.Validators;

public class ListProductPicturesQueryValidator : AbstractValidator<ListProductPicturesQuery>
{
    public ListProductPicturesQueryValidator()
    {
        RuleFor(query => query.ProductType).IsInEnum();
        RuleFor(query => query.ProductId).NotEmpty();
    }
}
