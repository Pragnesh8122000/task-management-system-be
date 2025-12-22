import mongoose from "mongoose";
import logger from "../common/logger.js";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
dotenv.config();

/**
 * Common Query handler for CRUD operation - FROM SAM AWS
 * @param {string} modelName -  Name of models for functions.
 * @param {string} operation -  Operation to perform.
 * @param {Object} data - Data to pass for the operation.
 * @returns {Promise<any>} - Returns result depending on the operation.
 */
export const performModelQuery = async (
    modelName,
    operation,
    data
) => {
    try {
        logger.info("Starting execution of the performModelQuery");
        if (!modelName) {
            throw new Error('Model name is required');
        }
        const Model = mongoose.model(modelName);

        // Helper function for population
        const populateNested = (queryBuilder, populateOptions) => {
            populateOptions.forEach((populateOption) => {
                const { path, select, populate } = populateOption;
                let populateConfig = { path, select };

                if (populate) {
                    populateConfig.populate = populate.map((populateItem) => ({
                        path: populateItem.path,
                        select: populateItem.select,
                    }));
                }
                queryBuilder = queryBuilder.populate(populateConfig);
            });
            return queryBuilder;
        };

        const operations = {
            create: async () => {
                const result = await Model.create([data.data], { session: data.session });
                return result ? result[0] : result;
            },
            read: async () => {
                const { page = 1, limit = 10, selectFields = {}, populate = [], sortBy = [], query } = data;
                const offset = (page - 1) * limit;
                let queryBuilder = Model.find(query || {})
                    .lean()
                    .skip(offset)
                    .limit(limit)
                    .where({ deletedAt: null });

                if (selectFields && Object.keys(selectFields).length > 0) {
                    queryBuilder = queryBuilder.select(selectFields);
                }

                if (populate && populate.length > 0) {
                    queryBuilder = populateNested(queryBuilder, populate);
                }

                const sortOptions = sortBy.reduce((acc, sort) => {
                    const [field, order] = sort.split(':');
                    acc[field] = order === 'desc' ? -1 : 1;
                    return acc;
                }, {});

                if (sortOptions.length > 0) {
                    queryBuilder = queryBuilder.sort(sortOptions);
                }

                const [documents, totalCount, remainingCount] = await Promise.all([
                    queryBuilder.exec(),
                    Model.countDocuments(query).where({ deletedAt: null }),
                    Model.countDocuments(query).skip(offset + limit).where({ deletedAt: null }),
                ]);

                const hasEntries = documents.length > 0;
                return {
                    result: documents,
                    totalPages: hasEntries ? Math.ceil(totalCount / limit) : 0,
                    currentPage: page,
                    totalCount: hasEntries ? totalCount : 0,
                    remainingCount,
                };
            },
            readAll: async () => {
                const { selectFields = {}, populate = [], sortBy = [], query } = data;
                let queryBuilder = Model.find(query)
                    .lean()
                    .where({ deletedAt: null });

                if (selectFields && Object.keys(selectFields).length > 0) {
                    queryBuilder = queryBuilder.select(selectFields);
                }

                if (populate && populate.length > 0) {
                    queryBuilder = populateNested(queryBuilder, populate);
                }

                if (sortBy && sortBy.length > 0) {
                    queryBuilder = queryBuilder.sort(sortBy.map((sort) => sort.split(':')));
                }

                const documents = await queryBuilder.exec();
                const totalCount = await Model.countDocuments(query).where({ deletedAt: null });
                return { result: documents, totalCount };
            },
            update: async () => await Model.updateOne(data.query, data.update, { session: data.session }).where({ deletedAt: null }),
            delete: async () => await Model.deleteOne(data).where({ deletedAt: null }),
            deleteMany: async () => await Model.deleteMany({ ...data.query, deletedAt: null }),
            rowDelete: async () => await Model.deleteOne(data),
            updateStatus: async () =>
                await Model.updateOne({ _id: data.query.id }, { $set: { status: data.update.status, updatedBy: data.update.updatedBy } }, { session: data.session }).where({ deletedAt: null }),
            find: async () => await Model.find().lean().where({ deletedAt: null }),
            findOne: async () => await Model.findOne(data.query, data?.selectFields).lean().where({ deletedAt: null }),
            findById: async () => await Model.findById(data.id).lean().where({ deletedAt: null }).select({ __v: 0 }),
            insertMany: async () => await Model.insertMany(data.data, { session: data.session }),
            softDelete: async () => await Model.updateOne({ _id: data.query.id }, { $set: { deletedAt: new Date() } }, { session: data.session }).where({ deletedAt: null }),
        };

        if (!operations[operation]) {
            throw new Error('Operation not supported');
        }

        return await operations[operation]();
    } catch (error) {
        logger.error("Error occurred while executing the performModelQuery: " + error);
        throw error;
    }
};

/**
 * Common function to check field value is exist or not
 * @param {String} modelName - The name of the mongoose model   
 * @param {ObjectId} id - Id Key for checking in database
 * @param {ObjectId} adminnId - to set the updatedBy field.
 * @returns {Object} returns object.
 */

export const softDeleteDocument = async (modelName, id, adminId) => {
    try {
        logger.info('Starting execution of the softDeleteDocument');
        const Model = mongoose.model(modelName);
        const result = await Model.updateOne({ _id: id }, { $set: { deletedAt: new Date(), status: 0, updatedBy: adminId } }).where({ deletedAt: null });
        return result;
    } catch (error) {
        logger.error('Starting execution of the softDeleteDocument \n', error);
        throw new Error(error)
    }
};

/**
* Counts documents in a MongoDB collection.
* 
* @param {mongoose.Model} modelName - The Mongoose model to query.
* @param {Object} filter - The filter object to apply to the query.
* @returns {Promise<Number>} - The count of documents that match the filter.
*/
export const countDocuments = async (modelName, filter = {}) => {
    logger.info('Starting execution of the countDocuments');
    try {
        const model = mongoose.model(modelName);
        const count = await model.countDocuments(filter) || 0;
        return count;
    } catch (error) {
        logger.error('Error occurred while executing countDocuments\n' + error);
        throw error;
    }
}

export const getJWTToken = (user) => {
    const payload = {
        id: user.id || user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        permissions: user.permissions || []
    };
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_TOKEN_EXPIRES_IN });
};