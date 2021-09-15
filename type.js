const config = require('config');

const sql = require('mssql');
const con = config.get('dbConfig_UCN');

const Joi = require('joi');

const _ = require('lodash');

class Type {
    constructor(typeObj) {
        this.typeId = typeObj.typeId;
        this.typeName = typeObj.typeName;
}

    static validate(typeObj) {
        const schema = Joi.object({
            typeId: Joi.number()
                .integer()
                .min(1),
            typeName: Joi.string()
                .min(1)
                .max(50)
        });

        return schema.validate(typeObj);
    }

    static readById(typeId) {
        return new Promise((resolve, reject) => {
            (async () => {
                // connect to DB
                // query DB
                // transform the result into the object structure of Author
                // validate
                // resolve (author)
                // reject (error)
                // CLOSE DB connection

                try {
                    const pool = await sql.connect(con);
                    const result = await pool.request()
                        .input('typeId', sql.Int(), typeId)
                        .query(`
                            SELECT *
                            FROM pokType pt
                            WHERE pt.typeId = @typeId
                        `)

                    const types = [];
                    result.recordset.forEach(record => {
                        const type = {
                            typeid: record.authorid,
                            typename: record.firstname,
                        }

                        types.push(type);
                    });

                    if (types.length == 0) throw { statusCode: 404, errorMessage: `Type not found with provided typeid: ${typeid}` }
                    if (types.length > 1) throw { statusCode: 500, errorMessage: `Multiple hits of unique data. Corrupt database, typeid: ${typeid}` }

                    const { error } = Type.validate(types[0]);
                    if (error) throw { statusCode: 500, errorMessage: `Corrupt type informaion in database, typeid: ${typeid}` }

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
