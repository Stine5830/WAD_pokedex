const config = require('config');

const sql = require('mssql');
const con = config.get('dbConfig_UCN');

const Joi = require('joi');

const _ = require('lodash');

class Type {
    constructor(typeObj) {
        this.pokTypeId = typeObj.pokTypeId;
        this.pokTypeName = typeObj.pokTypeName;
        this.pokTypeDescription = typeObj.pokTypeDescription;
    }

    static validate(typeObj) {
        const schema = Joi.object({
            pokTypeId: Joi.number()
                .integer()
                .min(1),
            pokTypeName: Joi.string()
                .min(1)
                .max(255),
            pokTypeDescription: Joi.string()
                .max(255)
        });

        return schema.validate(typeObj);
    }

    static readById(pokTypeId) {
        return new Promise((resolve, reject) => {
            (async () => {
                try {
                    const pool = await sql.connect(con);
                    const result = await pool.request()
                        .input('pokTypeId', sql.Int(), pokTypeId)
                        .query(`
                            SELECT *
                            FROM pokType t
                            WHERE t.pokTypeId = @pokTypeId
                        `)

                    const types = [];
                    result.recordset.forEach(record => {
                        const type = {
                            pokTypeId: record.pokTypeId,
                            pokTypeName: record.pokTypeName,
                            pokTypeDescription: record.pokTypeDescription
                        }

                        types.push(type);
                    });

                    if (types.length == 0) throw { statusCode: 404, errorMessage: `Type not found with provided typeid: ${pokTypeId}` }
                    if (types.length > 1) throw { statusCode: 500, errorMessage: `Multiple hits of unique data. Corrupt database, typeid: ${pokTypeId}` }

                    const { error } = Type.validate(types[0]);
                    if (error) throw { statusCode: 500, errorMessage: `Corrupt type informaion in database, typeid: ${pokTypeId}` }

                    resolve(new Type(types[0]));

                } catch (error) {
                    reject(error);
                }

                sql.close();
            })();
        });
    }
}

module.exports = Type;
