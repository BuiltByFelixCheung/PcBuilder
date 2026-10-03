using System.Reflection;
using FluentValidation;

namespace PcBuilderBackend.Api.Filters;

public static class ValidationFilter
{
    public static EndpointFilterDelegate ValidationFilterFactory(
        EndpointFilterFactoryContext context,
        EndpointFilterDelegate next)
    {
        var validatedParameters = context.MethodInfo.GetParameters()
            .Select((parameter, index) => (parameter, index))
            .Where(item => item.parameter.GetCustomAttribute<ValidateAttribute>() is not null)
            .ToList();

        if (validatedParameters.Count == 0)
            return next;

        return invocationContext => Validate(validatedParameters, invocationContext, next);
    }

    private static async ValueTask<object?> Validate(
        IReadOnlyList<(ParameterInfo Parameter, int Index)> validatedParameters,
        EndpointFilterInvocationContext invocationContext,
        EndpointFilterDelegate next)
    {
        foreach (var (parameter, index) in validatedParameters)
        {
            var argument = invocationContext.Arguments[index];
            if (argument is null)
                continue;

            var validatorType = typeof(IValidator<>).MakeGenericType(parameter.ParameterType);
            if (invocationContext.HttpContext.RequestServices.GetService(validatorType) is not IValidator validator)
                continue;

            var validationResult = await validator.ValidateAsync(
                new ValidationContext<object>(argument),
                invocationContext.HttpContext.RequestAborted);

            if (!validationResult.IsValid)
                return TypedResults.ValidationProblem(validationResult.ToDictionary());
        }

        return await next.Invoke(invocationContext);
    }
}
