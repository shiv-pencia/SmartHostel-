import mongoose from "mongoose";

/**
 * Checks whether the active MongoDB deployment supports transactions.
 * Transactions require a replica set or mongos cluster.
 */
export const supportsTransactions = () => {
    const topologyType =
        mongoose.connection.client?.topology?.description?.type;

    return Boolean(
        topologyType &&
            topologyType !== "Single" &&
            topologyType !== "Unknown"
    );
};

/**
 * Runs the given async callback inside a MongoDB transaction if the connected deployment
 * supports transactions (ReplicaSet or Mongos). If running on a standalone MongoDB instance
 * (Single node), it executes the callback without a transaction session.
 *
 * @template T
 * @param {(session: import('mongoose').ClientSession | null) => Promise<T>} callback
 * @returns {Promise<T>}
 */
export const withOptionalTransaction = async (callback) => {
    if (!supportsTransactions()) {
        return await callback(null);
    }

    const session = await mongoose.startSession();
    try {
        let result;
        await session.withTransaction(async () => {
            result = await callback(session);
        });
        return result;
    } catch (error) {
        if (
            error?.message?.includes(
                "Transaction numbers are only allowed on a replica set member or mongos"
            ) ||
            error?.message?.includes(
                "transactions are only supported on replica sets"
            )
        ) {
            return await callback(null);
        }
        throw error;
    } finally {
        await session.endSession();
    }
};
