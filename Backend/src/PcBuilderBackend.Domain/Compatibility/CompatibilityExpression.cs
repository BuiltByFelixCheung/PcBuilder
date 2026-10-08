using System.Linq.Expressions;

namespace PcBuilderBackend.Domain.Compatibility;

public static class CompatibilityExpression
{
    public static Expression<Func<T, bool>> Bind<T, T1>(
        Expression<Func<T, T1, bool>> expression,
        T1 arg1)
    {
        var body = Replace(expression.Body, expression.Parameters[1], Constant(arg1));
        return Expression.Lambda<Func<T, bool>>(body, expression.Parameters[0]);
    }

    public static Expression<Func<T, bool>> Bind<T, T1, T2>(
        Expression<Func<T, T1, T2, bool>> expression,
        T1 arg1,
        T2 arg2)
    {
        var body = Replace(expression.Body, expression.Parameters[1], Constant(arg1));
        body = Replace(body, expression.Parameters[2], Constant(arg2));
        return Expression.Lambda<Func<T, bool>>(body, expression.Parameters[0]);
    }

    public static Expression<Func<T, bool>> Bind<T, T1, T2, T3>(
        Expression<Func<T, T1, T2, T3, bool>> expression,
        T1 arg1,
        T2 arg2,
        T3 arg3)
    {
        var body = Replace(expression.Body, expression.Parameters[1], Constant(arg1));
        body = Replace(body, expression.Parameters[2], Constant(arg2));
        body = Replace(body, expression.Parameters[3], Constant(arg3));
        return Expression.Lambda<Func<T, bool>>(body, expression.Parameters[0]);
    }

    public static Expression<Func<T, bool>> Bind<T, T1, T2, T3, T4>(
        Expression<Func<T, T1, T2, T3, T4, bool>> expression,
        T1 arg1,
        T2 arg2,
        T3 arg3,
        T4 arg4)
    {
        var body = Replace(expression.Body, expression.Parameters[1], Constant(arg1));
        body = Replace(body, expression.Parameters[2], Constant(arg2));
        body = Replace(body, expression.Parameters[3], Constant(arg3));
        body = Replace(body, expression.Parameters[4], Constant(arg4));
        return Expression.Lambda<Func<T, bool>>(body, expression.Parameters[0]);
    }

    public static Expression<Func<T, bool>> Bind<T, T1, T2, T3, T4, T5>(
        Expression<Func<T, T1, T2, T3, T4, T5, bool>> expression,
        T1 arg1,
        T2 arg2,
        T3 arg3,
        T4 arg4,
        T5 arg5)
    {
        var body = Replace(expression.Body, expression.Parameters[1], Constant(arg1));
        body = Replace(body, expression.Parameters[2], Constant(arg2));
        body = Replace(body, expression.Parameters[3], Constant(arg3));
        body = Replace(body, expression.Parameters[4], Constant(arg4));
        body = Replace(body, expression.Parameters[5], Constant(arg5));
        return Expression.Lambda<Func<T, bool>>(body, expression.Parameters[0]);
    }

    public static Expression<Func<T, bool>> Not<T>(Expression<Func<T, bool>> predicate) =>
        Expression.Lambda<Func<T, bool>>(Expression.Not(predicate.Body), predicate.Parameters);

    public static Expression<Func<T, bool>> And<T>(
        Expression<Func<T, bool>> left,
        Expression<Func<T, bool>> right)
    {
        var shared = Expression.Parameter(typeof(T), "row");
        var body = Expression.AndAlso(
            Replace(left.Body, left.Parameters[0], shared),
            Replace(right.Body, right.Parameters[0], shared));
        return Expression.Lambda<Func<T, bool>>(body, shared);
    }

    public static Expression<Func<T, bool>> Or<T>(params Expression<Func<T, bool>>[] predicates)
    {
        if (predicates.Length == 0)
        {
            var parameter = Expression.Parameter(typeof(T), "row");
            return Expression.Lambda<Func<T, bool>>(Expression.Constant(false), parameter);
        }

        var shared = Expression.Parameter(typeof(T), "row");
        Expression body = Expression.Constant(false);
        foreach (var predicate in predicates)
            body = Expression.OrElse(body, Replace(predicate.Body, predicate.Parameters[0], shared));

        return Expression.Lambda<Func<T, bool>>(body, shared);
    }

    public static Expression<Func<T, bool>> Embed<T>(
        Expression<Func<int, int, int, int, int, bool>> rule,
        Expression<Func<T, int>> first,
        Expression<Func<T, int>> second,
        int third,
        int fourth,
        int fifth)
    {
        var entity = Expression.Parameter(typeof(T), "row");
        var body = rule.Body;
        body = Replace(body, rule.Parameters[0], Replace(first.Body, first.Parameters[0], entity));
        body = Replace(body, rule.Parameters[1], Replace(second.Body, second.Parameters[0], entity));
        body = Replace(body, rule.Parameters[2], Expression.Constant(third));
        body = Replace(body, rule.Parameters[3], Expression.Constant(fourth));
        body = Replace(body, rule.Parameters[4], Expression.Constant(fifth));
        return Expression.Lambda<Func<T, bool>>(body, entity);
    }

    public static Expression Inline<T, TResult>(Expression<Func<T, TResult>> expression, Expression argument) =>
        Replace(expression.Body, expression.Parameters[0], argument);

    public static Expression Inline<T1, T2, TResult>(
        Expression<Func<T1, T2, TResult>> expression,
        Expression arg1,
        Expression arg2)
    {
        var body = Replace(expression.Body, expression.Parameters[0], arg1);
        return Replace(body, expression.Parameters[1], arg2);
    }

    private static Expression Replace(Expression body, ParameterExpression parameter, Expression argument) =>
        new ParameterReplacer(parameter, argument).Visit(body)!;

    private static ConstantExpression Constant<T>(T value) => Expression.Constant(value, typeof(T));

    private sealed class ParameterReplacer(ParameterExpression parameter, Expression argument) : ExpressionVisitor
    {
        protected override Expression VisitParameter(ParameterExpression node) =>
            node == parameter ? argument : base.VisitParameter(node);
    }
}
