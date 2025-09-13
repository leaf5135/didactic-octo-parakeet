/**
 * Construct Triggers to register functions that run whenever a table changes.
 * Sample usage:
 *
 * ```
 * import { mutation as rawMutation } from "./_generated/server";
 * import { DataModel } from "./_generated/dataModel";
 * import { Triggers } from "convex-helpers/server/triggers";
 * import { customCtx, customMutation } from "convex-helpers/server/customFunctions";
 *
 * const triggers = new Triggers<DataModel>();
 * triggers.register("myTableName", async (ctx, change) => {
 *   console.log("Table changed", change);
 * });
 *
 * // Use `mutation` to define all mutations, and the triggers will get called.
 * export const mutation = customMutation(rawMutation, customCtx(triggers.wrapDB));
 * ```
 */
export class Triggers {
    registered = {};
    register(tableName, trigger) {
        if (!this.registered[tableName]) {
            this.registered[tableName] = [];
        }
        this.registered[tableName].push(trigger);
    }
    wrapDB = (ctx) => {
        return { ...ctx, db: writerWithTriggers(ctx, ctx.db, this) };
    };
}
class Lock {
    promise = null;
    resolve = null;
    async withLock(f) {
        const unlock = await this._lock();
        try {
            return await f();
        }
        finally {
            unlock();
        }
    }
    async _lock() {
        while (this.promise !== null) {
            await this.promise;
        }
        [this.promise, this.resolve] = this._newLock();
        return () => {
            this.promise = null;
            this.resolve?.();
        };
    }
    _newLock() {
        let resolve;
        const promise = new Promise((r) => {
            resolve = r;
        });
        return [promise, () => resolve()];
    }
}
/**
 * Locking semantics:
 * - Database writes to tables with triggers are serialized with
 *   `innerWriteLock` so we can calculate the `change` object without
 *   interference from parallel writes.
 * - When the application (not a trigger) calls `insert`, `patch`, or `replace`,
 *   it will acquire the outer write lock and hold it while doing the write
 *   operation and all subsequent triggers, including recursive triggers.
 *   - This ensures atomicity in the simple case where a trigger doesn't call
 *     other triggers recursively.
 * - Recursive triggers are queued up, so they are executed in the same order
 *   as the database writes were. At a high level, this is a BFS traversal of
 *   the trigger graph.
 * - Note when there are multiple triggers, they can't be executed atomically
 *   with the writes that caused them, from the perspective of the other
 *   triggers. So if one trigger is making sure denormalized data is
 *   consistent, another trigger could see the data in an inconsistent state.
 *   To avoid such problems, triggers should be resilient to such
 *   inconsistencies or the trigger graph should be kept simple.
 */
const innerWriteLock = new Lock();
const outerWriteLock = new Lock();
const triggerQueue = [];
/** @deprecated use writerWithTriggers instead */
export class DatabaseWriterWithTriggers {
    writer;
    constructor(ctx, innerDb, triggers, isWithinTrigger = false) {
        this.system = innerDb.system;
        this.writer = writerWithTriggers(ctx, innerDb, triggers, isWithinTrigger);
    }
    delete(id) {
        return this.writer.delete(id);
    }
    get(id) {
        return this.writer.get(id);
    }
    insert(table, value) {
        return this.writer.insert(table, value);
    }
    patch(id, value) {
        return this.writer.patch(id, value);
    }
    query(tableName) {
        return this.writer.query(tableName);
    }
    normalizeId(tableName, id) {
        return this.writer.normalizeId(tableName, id);
    }
    replace(id, value) {
        return this.writer.replace(id, value);
    }
    system;
}
export function writerWithTriggers(ctx, innerDb, triggers, isWithinTrigger = false) {
    return {
        insert: async (table, value) => {
            if (!triggers.registered[table]) {
                return await innerDb.insert(table, value);
            }
            return await _execThenTrigger(ctx, innerDb, triggers, table, isWithinTrigger, async () => {
                const id = await innerDb.insert(table, value);
                const newDoc = (await innerDb.get(id));
                return [id, { operation: "insert", id, oldDoc: null, newDoc }];
            });
        },
        patch: async (id, value) => {
            const tableName = _tableNameFromId(innerDb, triggers.registered, id);
            if (!tableName) {
                return await innerDb.patch(id, value);
            }
            return await _execThenTrigger(ctx, innerDb, triggers, tableName, isWithinTrigger, async () => {
                const oldDoc = (await innerDb.get(id));
                await innerDb.patch(id, value);
                const newDoc = (await innerDb.get(id));
                return [undefined, { operation: "update", id, oldDoc, newDoc }];
            });
        },
        replace: async (id, value) => {
            const tableName = _tableNameFromId(innerDb, triggers.registered, id);
            if (!tableName) {
                return await innerDb.replace(id, value);
            }
            return await _execThenTrigger(ctx, innerDb, triggers, tableName, isWithinTrigger, async () => {
                const oldDoc = (await innerDb.get(id));
                await innerDb.replace(id, value);
                const newDoc = (await innerDb.get(id));
                return [undefined, { operation: "update", id, oldDoc, newDoc }];
            });
        },
        delete: async (id) => {
            const tableName = _tableNameFromId(innerDb, triggers.registered, id);
            if (!tableName) {
                return await innerDb.delete(id);
            }
            return await _execThenTrigger(ctx, innerDb, triggers, tableName, isWithinTrigger, async () => {
                const oldDoc = (await innerDb.get(id));
                await innerDb.delete(id);
                return [undefined, { operation: "delete", id, oldDoc, newDoc: null }];
            });
        },
        system: innerDb.system,
        get: innerDb.get,
        query: innerDb.query,
        normalizeId: innerDb.normalizeId,
    };
}
// Helper methods.
function _tableNameFromId(db, registered, id) {
    for (const tableName of Object.keys(registered)) {
        if (db.normalizeId(tableName, id)) {
            return tableName;
        }
    }
    return null;
}
async function _queueTriggers(ctx, innerDb, triggers, tableName, f) {
    return await innerWriteLock.withLock(async () => {
        const [result, change] = await f();
        const recursiveCtx = {
            ...ctx,
            db: writerWithTriggers(ctx, innerDb, triggers, true),
            innerDb: innerDb,
        };
        for (const trigger of triggers.registered[tableName]) {
            triggerQueue.push(async () => {
                await trigger(recursiveCtx, change);
            });
        }
        return result;
    });
}
async function _execThenTrigger(ctx, innerDb, triggers, tableName, isWithinTrigger, f) {
    if (isWithinTrigger) {
        return await _queueTriggers(ctx, innerDb, triggers, tableName, f);
    }
    return await outerWriteLock.withLock(async () => {
        const result = await _queueTriggers(ctx, innerDb, triggers, tableName, f);
        let e = null;
        while (triggerQueue.length > 0) {
            const trigger = triggerQueue.shift();
            try {
                await trigger();
            }
            catch (err) {
                if (e) {
                    console.error(err);
                }
                else {
                    e = err;
                }
            }
        }
        if (e !== null) {
            throw e;
        }
        return result;
    });
}
