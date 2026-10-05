/**
 * Shared JSON transform for the admin-module models (Claim, Escrow, ModerationCase).
 *
 * The admin frontend pages were written against MySQL rows that exposed a plain
 * `id` field. MongoDB documents use `_id`, so every response from these models
 * is reshaped to keep `id` (the ObjectId as a string) and to hide `_id` / `__v`.
 * That way the existing AngularJS pages keep working without changes.
 */
module.exports = function toClientJSON(extra) {
    return {
        virtuals: false,
        versionKey: false,
        transform: (doc, ret) => {
            ret.id = ret._id.toString();
            delete ret._id;
            if (typeof extra === "function") extra(doc, ret);
            return ret;
        }
    };
};
