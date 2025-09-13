import { ZodFirstPartyTypeKind, z } from "zod/v3";
import { ConvexError, v } from "convex/values";
import { NoOp } from "./customFunctions.js";
import { pick } from "../index.js";
import { addFieldsToValidator } from "../validators.js";
/**
 * Create a validator for a Convex `Id`.
 *
 * When used as a validator, it will check that it's for the right table.
 * When used as a parser, it will only check that the Id is a string.
 *
 * @param tableName - The table that the `Id` references. i.e.` Id<tableName>`
 * @returns - A Zod object representing a Convex `Id`
 */
export const zid = (tableName) => new Zid({ typeName: "ConvexId", tableName });
/**
 * zCustomQuery is like customQuery, but allows validation via zod.
 * You can define custom behavior on top of `query` or `internalQuery`
 * by passing a function that modifies the ctx and args. Or NoOp to do nothing.
 *
 * Example usage:
 * ```js
 * const myQueryBuilder = zCustomQuery(query, {
 *   args: { sessionId: v.id("sessions") },
 *   input: async (ctx, args) => {
 *     const user = await getUserOrNull(ctx);
 *     const session = await db.get(sessionId);
 *     const db = wrapDatabaseReader({ user }, ctx.db, rlsRules);
 *     return { ctx: { db, user, session }, args: {} };
 *   },
 * });
 *
 * // Using the custom builder
 * export const getSomeData = myQueryBuilder({
 *   args: { someArg: z.string() },
 *   handler: async (ctx, args) => {
 *     const { db, user, session, scheduler } = ctx;
 *     const { someArg } = args;
 *     // ...
 *   }
 * });
 * ```
 *
 * Simple usage only modifying ctx:
 * ```js
 * const myInternalQuery = zCustomQuery(
 *   internalQuery,
 *   customCtx(async (ctx) => {
 *     return {
 *       // Throws an exception if the user isn't logged in
 *       user: await getUserByTokenIdentifier(ctx),
 *     };
 *   })
 * );
 *
 * // Using it
 * export const getUser = myInternalQuery({
 *   args: { email: z.string().email() },
 *   handler: async (ctx, args) => {
 *     console.log(args.email);
 *     return ctx.user;
 *   },
 * });
 *
 * @param query The query to be modified. Usually `query` or `internalQuery`
 *   from `_generated/server`.
 * @param customization The customization to be applied to the query, changing ctx and args.
 * @returns A new query builder using zod validation to define queries.
 */
export function zCustomQuery(query, customization) {
    return customFnBuilder(query, customization);
}
/**
 * zCustomMutation is like customMutation, but allows validation via zod.
 * You can define custom behavior on top of `mutation` or `internalMutation`
 * by passing a function that modifies the ctx and args. Or NoOp to do nothing.
 *
 * Example usage:
 * ```js
 * const myMutationBuilder = zCustomMutation(mutation, {
 *   args: { sessionId: v.id("sessions") },
 *   input: async (ctx, args) => {
 *     const user = await getUserOrNull(ctx);
 *     const session = await db.get(sessionId);
 *     const db = wrapDatabaseReader({ user }, ctx.db, rlsRules);
 *     return { ctx: { db, user, session }, args: {} };
 *   },
 * });
 *
 * // Using the custom builder
 * export const getSomeData = myMutationBuilder({
 *   args: { someArg: z.string() },
 *   handler: async (ctx, args) => {
 *     const { db, user, session, scheduler } = ctx;
 *     const { someArg } = args;
 *     // ...
 *   }
 * });
 * ```
 *
 * Simple usage only modifying ctx:
 * ```js
 * const myInternalMutation = zCustomMutation(
 *   internalMutation,
 *   customCtx(async (ctx) => {
 *     return {
 *       // Throws an exception if the user isn't logged in
 *       user: await getUserByTokenIdentifier(ctx),
 *     };
 *   })
 * );
 *
 * // Using it
 * export const getUser = myInternalMutation({
 *   args: { email: z.string().email() },
 *   handler: async (ctx, args) => {
 *     console.log(args.email);
 *     return ctx.user;
 *   },
 * });
 *
 * @param mutation The mutation to be modified. Usually `mutation` or `internalMutation`
 *   from `_generated/server`.
 * @param customization The customization to be applied to the mutation, changing ctx and args.
 * @returns A new mutation builder using zod validation to define queries.
 */
export function zCustomMutation(mutation, customization) {
    return customFnBuilder(mutation, customization);
}
/**
 * zCustomAction is like customAction, but allows validation via zod.
 * You can define custom behavior on top of `action` or `internalAction`
 * by passing a function that modifies the ctx and args. Or NoOp to do nothing.
 *
 * Example usage:
 * ```js
 * const myActionBuilder = zCustomAction(action, {
 *   args: { sessionId: v.id("sessions") },
 *   input: async (ctx, args) => {
 *     const user = await getUserOrNull(ctx);
 *     const session = await db.get(sessionId);
 *     const db = wrapDatabaseReader({ user }, ctx.db, rlsRules);
 *     return { ctx: { db, user, session }, args: {} };
 *   },
 * });
 *
 * // Using the custom builder
 * export const getSomeData = myActionBuilder({
 *   args: { someArg: z.string() },
 *   handler: async (ctx, args) => {
 *     const { db, user, session, scheduler } = ctx;
 *     const { someArg } = args;
 *     // ...
 *   }
 * });
 * ```
 *
 * Simple usage only modifying ctx:
 * ```js
 * const myInternalAction = zCustomAction(
 *   internalAction,
 *   customCtx(async (ctx) => {
 *     return {
 *       // Throws an exception if the user isn't logged in
 *       user: await getUserByTokenIdentifier(ctx),
 *     };
 *   })
 * );
 *
 * // Using it
 * export const getUser = myInternalAction({
 *   args: { email: z.string().email() },
 *   handler: async (ctx, args) => {
 *     console.log(args.email);
 *     return ctx.user;
 *   },
 * });
 *
 * @param action The action to be modified. Usually `action` or `internalAction`
 *   from `_generated/server`.
 * @param customization The customization to be applied to the action, changing ctx and args.
 * @returns A new action builder using zod validation to define queries.
 */
export function zCustomAction(action, customization) {
    return customFnBuilder(action, customization);
}
function customFnBuilder(builder, customization) {
    // Looking forward to when input / args / ... are optional
    const customInput = customization.input ?? NoOp.input;
    const inputArgs = customization.args ?? NoOp.args;
    return function customBuilder(fn) {
        const { args, handler = fn, returns: maybeObject, ...extra } = fn;
        const returns = maybeObject && !(maybeObject instanceof z.ZodType)
            ? z.object(maybeObject)
            : maybeObject;
        const returnValidator = returns && !fn.skipConvexValidation
            ? { returns: zodOutputToConvex(returns) }
            : null;
        if (args && !fn.skipConvexValidation) {
            let argsValidator = args;
            if (argsValidator instanceof z.ZodType) {
                if (argsValidator instanceof z.ZodObject) {
                    argsValidator = argsValidator._def.shape();
                }
                else {
                    throw new Error("Unsupported zod type as args validator: " +
                        argsValidator.constructor.name);
                }
            }
            const convexValidator = zodToConvexFields(argsValidator);
            return builder({
                args: addFieldsToValidator(convexValidator, inputArgs),
                ...returnValidator,
                handler: async (ctx, allArgs) => {
                    const added = await customInput(ctx, pick(allArgs, Object.keys(inputArgs)), extra);
                    const rawArgs = pick(allArgs, Object.keys(argsValidator));
                    const parsed = z.object(argsValidator).safeParse(rawArgs);
                    if (!parsed.success) {
                        throw new ConvexError({
                            ZodError: JSON.parse(JSON.stringify(parsed.error.errors, null, 2)),
                        });
                    }
                    const args = parsed.data;
                    const finalCtx = { ...ctx, ...added.ctx };
                    const finalArgs = { ...args, ...added.args };
                    const ret = await handler(finalCtx, finalArgs);
                    // We don't catch the error here. It's a developer error and we
                    // don't want to risk exposing the unexpected value to the client.
                    const result = returns ? returns.parse(ret) : ret;
                    if (added.onSuccess) {
                        await added.onSuccess({ ctx, args, result });
                    }
                    return result;
                },
            });
        }
        if (Object.keys(inputArgs).length > 0 && !fn.skipConvexValidation) {
            throw new Error("If you're using a custom function with arguments for the input " +
                "customization, you must declare the arguments for the function too.");
        }
        return builder({
            ...returnValidator,
            handler: async (ctx, args) => {
                const added = await customInput(ctx, args, extra);
                const finalCtx = { ...ctx, ...added.ctx };
                const finalArgs = { ...args, ...added.args };
                const ret = await handler(finalCtx, finalArgs);
                // We don't catch the error here. It's a developer error and we
                // don't want to risk exposing the unexpected value to the client.
                const result = returns ? returns.parse(ret) : ret;
                if (added.onSuccess) {
                    await added.onSuccess({ ctx, args, result });
                }
                return result;
            },
        });
    };
}
/**
 * Turn a Zod validator into a Convex Validator.
 * @param zod Zod validator can be a Zod object, or a Zod type like `z.string()`
 * @returns Convex Validator (e.g. `v.string()` from "convex/values")
 */
export function zodToConvex(zod) {
    const typeName = zod._def.typeName;
    switch (typeName) {
        case "ConvexId":
            return v.id(zod._def.tableName);
        case "ZodString":
            return v.string();
        case "ZodNumber":
        case "ZodNaN":
            return v.number();
        case "ZodBigInt":
            return v.int64();
        case "ZodBoolean":
            return v.boolean();
        case "ZodNull":
            return v.null();
        case "ZodAny":
        case "ZodUnknown":
            return v.any();
        case "ZodArray": {
            const inner = zodToConvex(zod._def.type);
            if (inner.isOptional === "optional") {
                throw new Error("Arrays of optional values are not supported");
            }
            return v.array(inner);
        }
        case "ZodObject":
            return v.object(zodToConvexFields(zod._def.shape()));
        case "ZodUnion":
        case "ZodDiscriminatedUnion":
            return v.union(...zod._def.options.map((v) => zodToConvex(v)));
        case "ZodTuple": {
            const allTypes = zod._def.items.map((v) => zodToConvex(v));
            if (zod._def.rest) {
                allTypes.push(zodToConvex(zod._def.rest));
            }
            return v.array(v.union(...allTypes));
        }
        case "ZodLazy":
            return zodToConvex(zod._def.getter());
        case "ZodLiteral":
            return v.literal(zod._def.value);
        case "ZodEnum":
            return v.union(...zod._def.values.map((l) => v.literal(l)));
        case "ZodEffects":
            return zodToConvex(zod._def.schema);
        case "ZodOptional":
            return v.optional(zodToConvex(zod.unwrap()));
        case "ZodNullable": {
            const nullable = zod.unwrap();
            if (nullable._def.typeName === "ZodOptional") {
                // Swap nullable(optional(Z)) for optional(nullable(Z))
                // Casting to any to ignore the mismatch of optional
                return v.optional(v.union(zodToConvex(nullable.unwrap()), v.null()));
            }
            return v.union(zodToConvex(nullable), v.null());
        }
        case "ZodBranded":
            return zodToConvex(zod.unwrap());
        case "ZodDefault": {
            const withDefault = zodToConvex(zod._def.innerType);
            if (withDefault.isOptional === "optional") {
                return withDefault;
            }
            return v.optional(withDefault);
        }
        case "ZodRecord": {
            const keyType = zodToConvex(zod._def.keyType);
            function ensureStringOrId(v) {
                if (v.kind === "union") {
                    v.members.map(ensureStringOrId);
                }
                else if (v.kind !== "string" && v.kind !== "id") {
                    throw new Error("Record keys must be strings or ids: " + v.kind);
                }
            }
            ensureStringOrId(keyType);
            return v.record(keyType, zodToConvex(zod._def.valueType));
        }
        case "ZodReadonly":
            return zodToConvex(zod._def.innerType);
        case "ZodPipeline":
            return zodToConvex(zod._def.in);
        default:
            throw new Error(`Unknown zod type: ${typeName}`);
        // N/A or not supported
        // case "ZodDate":
        // case "ZodSymbol":
        // case "ZodUndefined":
        // case "ZodNever":
        // case "ZodVoid":
        // case "ZodIntersection":
        // case "ZodMap":
        // case "ZodSet":
        // case "ZodFunction":
        // case "ZodNativeEnum":
        // case "ZodCatch":
        // case "ZodPromise":
    }
}
/**
 * Convert a zod validator to a convex validator that checks the value after
 * it has been validated (and possibly transformed) by the zod validator.
 */
export function zodOutputToConvex(zod) {
    const typeName = zod._def.typeName;
    switch (typeName) {
        // These are the special cases that differ from the input validator
        case "ZodDefault":
            // Here we return the non-optional inner type
            return zodOutputToConvex(zod._def.innerType);
        case "ZodEffects":
            console.warn("Note: ZodEffects (like z.transform) do not do output validation");
            return v.any();
        case "ZodPipeline":
            // IMPORTANT: The output type of the pipeline can differ from the input.
            return zodOutputToConvex(zod._def.out);
        // These are the same as input
        case "ConvexId":
            return v.id(zod._def.tableName);
        case "ZodString":
            return v.string();
        case "ZodNumber":
        case "ZodNaN":
            return v.number();
        case "ZodBigInt":
            return v.int64();
        case "ZodBoolean":
            return v.boolean();
        case "ZodNull":
            return v.null();
        case "ZodAny":
        case "ZodUnknown":
            return v.any();
        case "ZodArray": {
            const inner = zodOutputToConvex(zod._def.type);
            if (inner.isOptional === "optional") {
                throw new Error("Arrays of optional values are not supported");
            }
            return v.array(inner);
        }
        case "ZodObject":
            return v.object(zodOutputToConvexFields(zod._def.shape()));
        case "ZodUnion":
        case "ZodDiscriminatedUnion":
            return v.union(...zod._def.options.map((v) => zodOutputToConvex(v)));
        case "ZodTuple": {
            const allTypes = zod._def.items.map((v) => zodOutputToConvex(v));
            if (zod._def.rest) {
                allTypes.push(zodOutputToConvex(zod._def.rest));
            }
            return v.array(v.union(...allTypes));
        }
        case "ZodLazy":
            return zodOutputToConvex(zod._def.getter());
        case "ZodLiteral":
            return v.literal(zod._def.value);
        case "ZodEnum":
            return v.union(...zod._def.values.map((l) => v.literal(l)));
        case "ZodOptional":
            return v.optional(zodOutputToConvex(zod.unwrap()));
        case "ZodNullable": {
            const nullable = zod.unwrap();
            if (nullable._def.typeName === "ZodOptional") {
                // Swap nullable(optional(Z)) for optional(nullable(Z))
                // Casting to any to ignore the mismatch of optional
                return v.optional(v.union(zodOutputToConvex(nullable.unwrap()), v.null()));
            }
            return v.union(zodOutputToConvex(nullable), v.null());
        }
        case "ZodBranded":
            return zodOutputToConvex(zod.unwrap());
        case "ZodRecord": {
            const keyType = zodOutputToConvex(zod._def.keyType);
            function ensureStringOrId(v) {
                if (v.kind === "union") {
                    v.members.map(ensureStringOrId);
                }
                else if (v.kind !== "string" && v.kind !== "id") {
                    throw new Error("Record keys must be strings or ids: " + v.kind);
                }
            }
            ensureStringOrId(keyType);
            return v.record(keyType, zodOutputToConvex(zod._def.valueType));
        }
        case "ZodReadonly":
            return zodOutputToConvex(zod._def.innerType);
        default:
            throw new Error(`Unknown zod type: ${typeName}`);
        // N/A or not supported
        // case "ZodDate":
        // case "ZodSymbol":
        // case "ZodUndefined":
        // case "ZodNever":
        // case "ZodVoid":
        // case "ZodIntersection":
        // case "ZodMap":
        // case "ZodSet":
        // case "ZodFunction":
        // case "ZodNativeEnum":
        // case "ZodCatch":
        // case "ZodPromise":
    }
}
/**
 * Like zodToConvex, but it takes in a bare object, as expected by Convex
 * function arguments, or the argument to defineTable.
 *
 * @param zod Object with string keys and Zod validators as values
 * @returns Object with the same keys, but with Convex validators as values
 */
export function zodToConvexFields(zod) {
    return Object.fromEntries(Object.entries(zod).map(([k, v]) => [k, zodToConvex(v)]));
}
/**
 * Like zodOutputToConvex, but it takes in a bare object, as expected by Convex
 * function arguments, or the argument to defineTable.
 * This is different from zodToConvexFields because it generates the Convex
 * validator for the output of the zod validator, not the input.
 *
 * @param zod Object with string keys and Zod validators as values
 * @returns Object with the same keys, but with Convex validators as values
 */
export function zodOutputToConvexFields(zod) {
    return Object.fromEntries(Object.entries(zod).map(([k, v]) => [k, zodOutputToConvex(v)]));
}
export class Zid extends z.ZodType {
    _parse(input) {
        return z.string()._parse(input);
    }
}
/**
 * Zod helper for adding Convex system fields to a record to return.
 *
 * @param tableName - The table where records are from, i.e. Doc<tableName>
 * @param zObject - Validators for the user-defined fields on the document.
 * @returns - Zod shape for use with `z.object(shape)` that includes system fields.
 */
export const withSystemFields = (tableName, zObject) => {
    return { ...zObject, _id: zid(tableName), _creationTime: z.number() };
};
// This is a copy of zod's ZodBranded which also brands the input.
export class ZodBrandedInputAndOutput extends z.ZodType {
    _parse(input) {
        const { ctx } = this._processInputParams(input);
        const data = ctx.data;
        return this._def.type._parse({
            data,
            path: ctx.path,
            parent: ctx,
        });
    }
    unwrap() {
        return this._def.type;
    }
}
/**
 * Add a brand to a zod validator. Used like `zBrand(z.string(), "MyBrand")`.
 * Compared to zod's `.brand`, this also brands the input type, so if you use
 * the branded validator as an argument to a function, the input type will also
 * be branded. The normal `.brand` only brands the output type, so only the type
 * returned by validation would be branded.
 *
 * @param validator A zod validator - generally a string, number, or bigint
 * @param brand A string, number, or symbol to brand the validator with
 * @returns A zod validator that brands both the input and output types.
 */
export function zBrand(validator, brand) {
    return validator.brand(brand);
}
/**
 * Turn a Convex validator into a Zod validator.
 * @param convexValidator Convex validator can be any validator from "convex/values" e.g. `v.string()`
 * @returns Zod validator (e.g. `z.string()`) with inferred type matching the Convex validator
 */
export function convexToZod(convexValidator) {
    const isOptional = convexValidator.isOptional === "optional";
    let zodValidator;
    switch (convexValidator.kind) {
        case "id":
            zodValidator = zid(convexValidator.tableName);
            break;
        case "string":
            zodValidator = z.string();
            break;
        case "float64":
            zodValidator = z.number();
            break;
        case "int64":
            zodValidator = z.bigint();
            break;
        case "boolean":
            zodValidator = z.boolean();
            break;
        case "null":
            zodValidator = z.null();
            break;
        case "any":
            zodValidator = z.any();
            break;
        case "array": {
            const arrayValidator = convexValidator;
            zodValidator = z.array(convexToZod(arrayValidator.element));
            break;
        }
        case "object": {
            const objectValidator = convexValidator;
            zodValidator = z.object(convexToZodFields(objectValidator.fields));
            break;
        }
        case "union": {
            const unionValidator = convexValidator;
            const memberValidators = unionValidator.members.map((member) => convexToZod(member));
            zodValidator = z.union([
                memberValidators[0],
                memberValidators[1],
                ...memberValidators.slice(2),
            ]);
            break;
        }
        case "literal": {
            const literalValidator = convexValidator;
            zodValidator = z.literal(literalValidator.value);
            break;
        }
        case "record": {
            const recordValidator = convexValidator;
            zodValidator = z.record(convexToZod(recordValidator.key), convexToZod(recordValidator.value));
            break;
        }
        default:
            throw new Error(`Unknown convex validator type: ${convexValidator.kind}`);
    }
    return isOptional
        ? z.optional(zodValidator)
        : zodValidator;
}
/**
 * Like convexToZod, but it takes in a bare object, as expected by Convex
 * function arguments, or the argument to defineTable.
 *
 * @param convexValidators Object with string keys and Convex validators as values
 * @returns Object with the same keys, but with Zod validators as values
 */
export function convexToZodFields(convexValidators) {
    return Object.fromEntries(Object.entries(convexValidators).map(([k, v]) => [k, convexToZod(v)]));
}
