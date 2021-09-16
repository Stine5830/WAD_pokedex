const config = require('config');

const sql = require('mssql');
const con = config.get('dbConfig_UCN');

const Joi = require('joi');

const _ = require('lodash');

class Author {
    constructor(authorObj) {
        this.authorid = authorObj.authorid;
        this.firstname = authorObj.firstname;
        this.lastname = authorObj.lastname;
        this.biolink = authorObj.biolink;
    }

    static validate(authorObj) {
        const schema = Joi.object({
            authorid: Joi.number()
                .integer()
                .min(1),
            firstname: Joi.string()
                .max(50),
            lastname: Joi.string()
                .min(1)
                .max(50),
            biolink: Joi.string()
                .uri()
                .max(255)
        });

        return schema.validate(authorObj);
    }

    static readById(authorid) {
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
                        .input('authorid', sql.Int(), authorid)
                        .query(`
                            SELECT *
                            FROM liloAuthor a
                            WHERE a.authorid = @authorid
                        `)

                    const authors = [];
                    result.recordset.forEach(record => {
                        const author = {
                            authorid: record.authorid,
                            firstname: record.firstname,
                            lastname: record.lastname,
                            biolink: record.biolink
                        }

                        authors.push(author);
                    });

                    if (authors.length == 0) throw { statusCode: 404, errorMessage: `Author not found with provided authorid: ${authorid}` }
                    if (authors.length > 1) throw { statusCode: 500, errorMessage: `Multiple hits of unique data. Corrupt database, authorid: ${authorid}` }

                    const { error } = Author.validate(authors[0]);
                    if (error) throw { statusCode: 500, errorMessage: `Corrupt Author informaion in database, authorid: ${authorid}` }

                    resolve(new Author(authors[0]));

                } catch (error) {
                    reject(error);
                }

                sql.close();
            })();
        });
    }
}

module.exports = Author;
