const config = require('config');

const sql = require('mssql');
const con = config.get('dbConfig_UCN');

const Joi = require('joi');

const _ = require('lodash');

const Type = require('./type');
const { reject } = require('lodash');

class Pokemon {
    constructor(pokemonObj) {
        this.pokPokemonId = pokemonObj.pokPokemonId;
        this.pokName = pokemonObj.pokName;
        this.pokHeight = pokemonObj.pokHeight;
        this.pokWeight = pokemonObj.pokWeight;
        this.pokAbilities = pokemonObj.pokAbilities;
        if (pokemonObj.pokType) this.pokTypes = _.cloneDeep(pokemonObj.pokTypes);
    }

    copy(pokemonObj) {
        // if (bookObj.bookid) this.bookid = bookObj.bookid;
        if (pokemonObj.pokName) this.pokName = pokemonObj.pokName;
        if (pokemonObj.pokHeight) this.pokHeight = pokemonObj.pokHeight;
        if (pokemonObj.pokWeight) this.pokWeight = pokemonObj.pokWeight;
        if (pokemonObj.pokAbilities) this.pokAbilities = pokemonObj.pokAbilities;
        if (pokemonObj.pokType) this.pokTypes = _.cloneDeep(pokemonObj.pokTypes);
    }

    static validate(pokemonWannabeeObj) {
        const schema = Joi.object({
            pokPokemonId: Joi.number()
                .integer()
                .min(1),
            pokName: Joi.string()
                .min(1)
                .max(50)
                .required(),
            pokHeight: Joi.number()
                .integer(),
            pokWeight: Joi.number()
                .integer()
                .allow(null),
            pokAbilities: Joi.string()
                .max(255), // <-- need to allow null values for links
            pokTypes: Joi.array()
                .items(
                    Joi.object({
                        pokPokemonId: Joi.number()
                            .integer()
                            .min(1)
                            .required(),
                        pokTypeName: Joi.string()
                            .max(50),
                        pokTypeDescription: Joi.string()
                            .max(255)
                    })
                )
        });

        return schema.validate(pokemonWannabeeObj);
    }

    static readAll(pokTypeId) {
        return new Promise((resolve, reject) => {
            (async () => {
                // › › connect to DB
                // › › create SQL query string (SELECT Book JOIN BookAuthor JOIN Author)
                // › › if authorid, add WHERE authorid to query string
                // › › query DB with query string
                // › › restructure DB result into the object structure needed (JOIN --> watch out for duplicates)
                // › › validate objects
                // › › close DB connection

                // DISCLAIMER: need to look up how to SELECT with the results of another SELECT
                //      right now only the author with the authorid is listed on the book in the response

                try {
                    const pool = await sql.connect(con);
                    let result;

                    if (pokTypeId) {
                        result = await pool.request()
                            .input('pokTypeId', sql.Int(), pokTypeId)
                            .query(`
                            SELECT p.pokPokemonId, p.pokName, p.pokHeight, p.pokWeight, t.pokTypeId, t.pokTypeName
                            FROM pokPokemon p
                            JOIN pokPokemonTypes pt
                                ON p.pokPokemonId = pt.FK_pokPokemonId
                            JOIN pokType t
                                ON pt.FK_pokTypeId = t.pokTypeId
                            WHERE p.pokPokemonId IN (
                                SELECT p.pokPokemonId
                                FROM pokPokemon p
                                JOIN pokPokemonTypes pt
                                    ON p.pokPokemonId = pt.FK_pokPokemonId
                                JOIN pokType t
                                    ON pt.FK_pokTypeId = t.pokTypeId
                                WHERE t.pokTypeId = @pokTypeId
                            )
                            ORDER BY p.pokPokemonId, t.pokTypeId
                        `);
                    } else {
                        result = await pool.request()
                            .query(`
                            SELECT p.pokPokemonId, p.pokName, p.pokHeight, p.pokWeight, t.pokTypeId, t.pokTypeName 
                            FROM pokPokemon p
                            JOIN pokPokemonTypes pt
                                ON p.pokPokemonId = pt.FK_pokPokemonId
                            JOIN pokType t
                                ON pt.FK_pokTypeId = t.pokTypeId
                            ORDER BY p.pokPokemonId, t.pokTypeId
                        `);
                    }

                    const pokemons = [];   // this is NOT validated yet
                    let lastPokemonIndex = -1;
                    result.recordset.forEach(record => {
                        if (pokemons[lastPokemonIndex] && record.pokPokemonId == pokemons[lastPokemonIndex].pokPokemonId) {
                            console.log(`Pokemon with id ${record.pokPokemonId} already exists.`);
                            const newType = {
                                pokTypeId: record.pokTypeId,
                                pokTypeName: record.pokTypeName,
                                pokTypeDescription: record.pokTypeDescription
                            }
                            pokemons[lastPokemonIndex].pokTypes.push(newType);
                        } else {
                            console.log(`Book with id ${record.bookid} is a new book.`)
                            const newPokemon = {
                                pokPokemonId: record.pokPokemonId,
                                pokName: record.pokName,
                                pokHeight: record.pokHeight,
                                pokWeight: record.pokWeight,
                                pokTypes: [
                                    {
                                        pokTypeId: record.pokTypeId,
                                        pokName: record.pokName,
                                        pokTypeDescription: record.pokTypeDescription
                                    }
                                ]
                            }
                            pokemons.push(newPokemon);
                            lastPokemonIndex++;
                        }
                    });

                    const validPokemons = [];
                    pokemons.forEach(pokemon => {
                        const { error } = Pokemon.validate(pokemon);
                        if (error) throw { errorMessage: `Pokemon.validate failed.` };

                        validPokemons.push(new Pokemon(pokemon));
                    });

                    resolve(validPokemons);

                } catch (error) {
                    reject(error);
                }

                sql.close();

            })();
        });
    }

    static readById(pokPokemonId) {
        return new Promise((resolve, reject) => {
            (async () => {
                // › › connect to DB
                // › › query DB (SELECT Book JOIN BookAuthor JOIN Author WHERE bookid)
                // › › restructure DB result into the object structure needed (JOIN --> watch out for duplicates)
                // › › validate objects
                // › › close DB connection

                try {
                    const pool = await sql.connect(con);
                    const result = await pool.request()
                        .input('pokPokemonId', sql.Int(), pokPokemonId)
                        .query(`
                            SELECT p.pokPokemonId, p.pokName, p.pokHeight, p.pokWeight, t.pokTypeId, t.pokTypeName, t.pokTypeDescription 
                            FROM pokPokemon p
                            JOIN pokPokemonTypes pt
                                ON p.pokPokemonId = pt.FK_pokPokemonId
                            JOIN pokType t
                                ON pt.FK_pokTypeId = t.pokTypeId
                            WHERE p.pokPokemonId = @pokPokemonId
                    `)

                    const pokemons = [];   // this is NOT validated yet
                    let lastPokemonIndex = -1;
                    result.recordset.forEach(record => {
                        if (pokemons[lastPokemonIndex] && record.pokPokemonId == pokemons[lastPokemonIndex].pokPokemonId) {
                            console.log(`Pokemons with id ${record.pokPokemonId} already exists.`);
                            const newType = {
                                pokTypeId: record.pokTypeId,
                                pokName: record.pokName,
                                pokTypeDescription: record.pokTypeDescription
                            }
                            pokemons[lastPokemonIndex].pokType.push(newType);
                        } else {
                            console.log(`Pokemon with id ${record.pokPokemonId} is a new pokemon.`)
                            const newPokemon = {
                                pokPokemonId: record.pokPokemonId,
                                pokName: record.pokName,
                                pokHeight: record.pokHeight,
                                pokWeight: record.pokWeight,
                                pokTypes: [
                                    {
                                        pokTypeId: record.pokTypeId,
                                        pokName: record.pokName,
                                        pokTypeDescription: record.pokTypeDescription
                                    }
                                ]
                            }
                            pokemons.push(newPokemon);
                            lastPokemonIndex++;
                        }
                    });

                    if (pokemons.length == 0) throw { statusCode: 404, errorMessage: `Pokemon not found with provided pokemonid: ${pokPokemonId}` }
                    if (Pokemon.length > 1) throw { statusCode: 500, errorMessage: `Multiple hits of unique data. Corrupt database, pokemonid: ${pokPokemonId}` }

                    const { error } = Pokemon.validate(pokemons[0]);
                    if (error) throw { statusCode: 500, errorMessage: `Corrupt Pokemon informaion in database, bookid: ${pokPokemonId}` }

                    resolve(new Pokemon(pokemons[0]));

                } catch (error) {
                    reject(error);
                }

                sql.close();
            })();
        });
    }

    create() {
        return new Promise((resolve, reject) => {
            (async () => {
                // › › check if authors exist in DB (i.e. Author.readById(authorid))
                // › › connect to DB
                // › › check if book already exists in DB (e.g. matching title and year)
                // › › query DB (INSERT Book, SELECT Book WHERE SCOPE_IDENTITY(), INSERT BookAuthor)
                // › › check if exactly one result
                // › › keep bookid safe
                // › › queryDB* (INSERT BookAuthor) as many more times needed (with bookid)
                // › › ((query DB query DB (SELECT Book JOIN BookAuthor JOIN Author WHERE bookid))) ==>
                // › ›      close the DB because we are calling 
                // › ›             Book.readById(bookid)
                // › › // restructure DB result into the object structure needed (JOIN --> watch out for duplicates)
                // › › // validate objects
                // › › close DB connection

                try {
                    this.pokTypes.forEach(async (type) => {
                        const typeCheck = await Types.readById(type.pokTypesId);
                    });

                    const pool = await sql.connect(con);
                    const resultCheckPokemon = await pool.request()
                        .input('pokName', sql.NVarChar(50), this.pokName)
                        .input('pokHeight', sql.Int(), this.pokHeight)
                        .query(`
                            SELECT *
                            FROM pokPokemon p
                            WHERE p.pokName = @pokName AND p.pokHeight = @pokHeight
                        `)

                    if (resultCheckPokemon.recordset.length == 1) throw { statusCode: 409, errorMessage: `Conflict. Pokemon already exists, pokemonid: ${resultCheckPokemon.recordset[0].pokPokemonId}` }
                    if (resultCheckPokemon.recordset.length > 1) throw { statusCode: 500, errorMessage: `Multiple hits of unique data. Corrupt database, pokemonid: ${resultCheckPokemon.recordset[0].pokPokemonId}` }

                    await pool.connect();
                    const result00 = await pool.request()
                        .input('pokName', sql.NVarChar(50), this.pokName)
                        .input('pokHeight', sql.Int(), this.pokHeight)
                        .input('pokWeight', sql.Int(), this.pokWeight)
                        .input('pokAbilities', sql.NVarChar(255), this.pokAbilities)
                        .input('pokTypeId', sql.Int(), this.pokTypes[0].pokTypeId)
                        .query(`
                                INSERT INTO pokPokemon (pokName, pokHeight, pokWeight, pokAbilities)
                                VALUES (@pokName, @pokHeight, @pokWeight, @pokAbilities);
                        
                                SELECT *
                                FROM pokPokemon
                                WHERE pokPokemonId = SCOPE_IDENTITY();

                                INSERT INTO pokPokemonTypes (FK_pokPokemonId, FK_pokTypeId)
                                VALUES (SCOPE_IDENTITY(), @pokTypeId);
                        `)

                    if (!result00.recordset[0]) throw { statusCode: 500, errorMessage: `DB server error, INSERT failed.` }
                    const pokPokemonId = result00.recordset[0].pokemonId;

                    this.pokTypes.forEach(async (types, index) => {
                        if (index > 0) {
                            await pool.connect();
                            const resultTypes = await pool.request()
                                .input('pokPokemonId', sql.Int(), pokPokemonId)
                                .input('pokTypeid', sql.Int(), pokType.pokTypeId)
                                .query(`
                                    INSERT INTO pokPokemonTypes (FK_pokPokemonId, FK_pokPokemonId)
                                    VALUES (@pokPokemonId, @pokTypeId)
                                `)
                        }
                    })

                    sql.close();

                    const pokemon = await Pokemon.readById(pokPokemonId);

                    resolve(pokemon);

                } catch (error) {
                    reject(error);
                }

                sql.close();

            })();
        });
    }

    static delete(pokPokemonId){
        return new Promise((resolve, reject) => {
            (async () => {
                // connect to the DB
                // query DB (SELECT Book JOIN BookAuthor JOIN Author WHERE bookid <---- moving this before connecting to the DB)
                // query DB (DELETE BookAuthor WHERE bookid, DELETE Book WHERE bookid)
                // restructure DB result into the object structure needed (JOIN -----> watch out for )
                // validate objects
                // close DB connection

                try {
                    const pokemon = await Pokemon.readById(pokPokemonId);

                    const pool = await sql.connect(con);
                    const result = await pool.request()
                    .input('pokPokemonId', sql.Int(), pokPokemonId)
                    .query(`
                        DELETE pokPokemonTypes
                        WHERE FK_pokPokemonId = @pokPokemonId;

                        DELETE pokFavoritPokemon
                        WHERE FK_pokPokemonId = @pokPokemonId;

                        DELETE pokPokemon
                        WHERE pokPokemonId = @pokPokemonId
                    `);

                    resolve(pokemon);

                } catch (error) {
                    reject(error);
                }
                sql.close();
            })();
        })
    }
    update(){
        return new Promise((resolve, reject) => {
            (async () => {
                // to do list se slides

                try {
                    const oldPokemon = await Pokemon.readById(this.pokPokemonId); // this should have be checked already in the router handler

                    this.pokTypes.forEach(async (type) => {
                        const typeCheck = await this.pokTypes.readById(pokType.pokTypeId);
                    });

                    const pool = await sql.connect(con);
                    const result = await pool.request()
                    .input('pokName', sql.NVarChar(50), this.pokName)
                    .input('pokHeight', sql.Int(), this.pokHeight)
                    .input('pokWeight', sql.Int(), this.pokWeight)
                    .input('pokPokemonId', sql.Int(), this.pokPokemonId)
                    .input('pokTypes', sql.Int(), this.pokTypes[0].pokTypeId)
                    .query(`
                        UPDATE pokPokemon
                        SET 
                            pokName = @pokName,
                            pokHeight = @pokHeight,
                            pokWeight = @pokWeight
                        WHERE pokPokemonId = @pokPokemonId;

                        DELETE pokPokemonTypes
                        WHERE FK_pokPokemonId = @pokPokemonId;

                        INSERT INTO pokPokemonTypes (FK_pokPokemonId, FK_pokTypeId)
                        VALUES (@pokPokemonId, @pokTypeId)
                    `);

                    this.pokTypes.forEach(async (type, index) => {
                        if (index > 0) {
                            await pool.connect();
                            const resultTypes = await pool.request()
                                .input('pokPokemonId', sql.Int(), this.pokPokemonId)
                                .input('pokTypeId', sql.Int(), pokType.pokTypeId)
                                .query(`
                                    INSERT INTO pokPokemonTypes (FK_pokPokemonId, FK_pokTypeId)
                                    VALUES (@pokPokemonId, @pokTypeId)
                                `);
                        }
                    });

                    sql.close();

                    const pokemon = await Pokemon.readById(this.pokPokemonId);

                    resolve(pokemon);

                } catch (error) {
                    reject(error);
                }

                sql.close();
                
            })();
        });
    }
}

module.exports = Pokemon;
