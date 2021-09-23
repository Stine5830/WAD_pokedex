const config = require('config');

const sql = require('mssql');
const con = config.get('dbConfig_UCN');

const Joi = require('joi');

const _ = require('lodash');

const Type = require('./type');

class Pokemon {
    constructor(pokemonObj) {
        this.pokPokemonId = pokemonObj.pokPokemonId;
        this.pokName = pokemonObj.pokName;
        this.pokHeight = pokemonObj.pokHeight;
        this.pokWeight = pokemonObj.pokWeight;
        this.pokAbilities = pokemonObj.pokAbilities;
        this.pokGender = pokemonObj.pokGender;
        if (pokemonObj.pokFavorite) this.pokFavorite = pokemonObj.pokFavorite;
        if (pokemonObj.pokTypes) this.pokTypes = _.cloneDeep(pokemonObj.pokTypes);
    }

    copy(pokemonObj) {
        if (pokemonObj.pokName) this.pokName = pokemonObj.pokName;
        if (pokemonObj.pokHeight) this.pokHeight = pokemonObj.pokHeight;
        if (pokemonObj.pokWeight) this.pokWeight = pokemonObj.pokWeight;
        if (pokemonObj.pokAbilities) this.pokAbilities = pokemonObj.pokAbilities;
        if (pokemonObj.pokGender) this.pokGender = pokemonObj.pokGender;
        if (pokemonObj.pokFavorite) this.pokFavorite = pokemonObj.pokFavorite;
        if (pokemonObj.pokTypes) this.pokTypes = _.cloneDeep(pokemonObj.pokTypes);
    }

    static validate(pokemonWannabeeObj) {
        const schema = Joi.object({
            pokPokemonId: Joi.number()
                .integer()
                .min(1),
            pokName: Joi.string()
                .min(1)
                .max(50),
            pokHeight: Joi.string()
                .max(50),
            pokWeight: Joi.string()
                .max(50),
            pokAbilities: Joi.string()
                .max(255),
            pokGender: Joi.string()
                .max(50),
            pokFavorite: Joi.number()
                .integer()
                .min(1)
                .allow(null),
            pokTypes: Joi.array()
                .items(
                    Joi.object({
                        pokTypeId: Joi.number()
                            .integer()
                            .min(1)
                            .required(),
                        pokTypeName: Joi.string()
                            .min(1)
                            .max(255),
                        pokTypeDescription: Joi.string()
                            .max(255)
                            .allow(null)
                    })
                )
        });
        return schema.validate(pokemonWannabeeObj);
    }

    static readAll(pokTypeId) {
        return new Promise((resolve, reject) => {
            (async () => {
                try {
                    const pool = await sql.connect(con);
                    let result;

                    if (pokTypeId) {
                        result = await pool.request()
                            .input('pokTypeId', sql.Int(), pokTypeId)
                            .query(`
                            SELECT p.pokPokemonId, p.pokName, p.pokHeight, p.pokWeight, p.pokAbilities, p.pokGender, t.pokTypeId, t.pokTypeName
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
                            SELECT p.pokPokemonId, p.pokName, p.pokHeight, p.pokWeight, p.pokAbilities, p.pokGender, t.pokTypeId, t.pokTypeName 
                            FROM pokPokemon p
                            JOIN pokPokemonTypes pt
                                ON p.pokPokemonId = pt.FK_pokPokemonId
                            JOIN pokType t
                                ON pt.FK_pokTypeId = t.pokTypeId
                            ORDER BY p.pokPokemonId, t.pokTypeId
                        `);
                    }

                    const pokemons = [];
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
                            console.log(`Pokemon with id ${record.pokPokemonId} is a new pokemon.`)
                            const newPokemon = {
                                pokPokemonId: record.pokPokemonId,
                                pokName: record.pokName,
                                pokHeight: record.pokHeight,
                                pokWeight: record.pokWeight,
                                pokGender: record.pokGender,
                                pokAbilities: record.pokAbilities,
                                pokTypes: [
                                    {
                                        pokTypeId: record.pokTypeId,
                                        pokTypeName: record.pokTypeName,
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
                        if (error) throw { errorMessage: `Pokemon validation failed.` };

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

                    const pokemons = [];
                    let lastPokemonIndex = -1;
                    result.recordset.forEach(record => {
                        if (pokemons[lastPokemonIndex] && record.pokPokemonId == pokemons[lastPokemonIndex].pokPokemonId) {
                            console.log(`Pokemons with id ${record.pokPokemonId} already exists.`);
                            const newType = {
                                pokTypeId: record.pokTypeId,
                                pokTypeName: record.pokTypeName,
                                pokTypeDescription: record.pokTypeDescription
                            }
                            pokemons[lastPokemonIndex].pokTypes.push(newType);
                        } else {
                            console.log(`Pokemon with id ${record.pokPokemonId} is a new pokemon.`)
                            const newPokemon = {
                                pokPokemonId: record.pokPokemonId,
                                pokName: record.pokName,
                                pokHeight: record.pokHeight,
                                pokWeight: record.pokWeight,
                                pokGender: record.pokGender,
                                pokAbilities: record.pokAbilities,
                                pokTypes: [
                                    {
                                        pokTypeId: record.pokTypeId,
                                        pokTypeName: record.pokTypeName,
                                        pokTypeDescription: record.pokTypeDescription
                                    }
                                ]
                            }
                            pokemons.push(newPokemon);
                            lastPokemonIndex++;
                        }
                    });

                    if (pokemons.length == 0) throw { statusCode: 404, errorMessage: `Pokemon not found with provided pokemonid: ${pokPokemonId}` }
                    if (pokemons.length > 1) throw { statusCode: 500, errorMessage: `Multiple hits of same data. Corrupt database, pokemonid: ${pokPokemonId}` }

                    const { error } = Pokemon.validate(pokemons[0]);
                    if (error) throw { statusCode: 500, errorMessage: `Corrupt Pokemon information in database, pokPokemonId: ${pokPokemonId}` }

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
                try {
                    this.pokTypes.forEach(async (type) => {
                        const typeCheck = await Type.readById(type.pokTypeId);
                    });

                    const pool = await sql.connect(con);
                    const resultCheckPokemon = await pool.request()
                        .input('pokName', sql.NVarChar(50), this.pokName)
                        .input('pokHeight', sql.NVarChar(50), this.pokHeight)
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
                        .input('pokHeight', sql.NVarChar(50), this.pokHeight)
                        .input('pokWeight', sql.NVarChar(50), this.pokWeight)
                        .input("pokGender", sql.NVarChar(50), this.pokGender)
                        .input('pokAbilities', sql.NVarChar(255), this.pokAbilities)
                        .input('pokTypeId', sql.Int(), this.pokTypes[0].pokTypeId)
                        .query(`
                                INSERT INTO pokPokemon (pokName, pokHeight, pokWeight, pokAbilities, pokGender)
                                VALUES (@pokName, @pokHeight, @pokWeight, @pokAbilities, @pokGender);
                        
                                SELECT *
                                FROM pokPokemon
                                WHERE pokPokemonId = SCOPE_IDENTITY();

                                INSERT INTO pokPokemonTypes (FK_pokPokemonId, FK_pokTypeId)
                                VALUES (SCOPE_IDENTITY(), @pokTypeId);
                        `)

                    if (!result00.recordset[0]) throw { statusCode: 500, errorMessage: `Database error, INSERT failed.` }
                    const pokPokemonId = result00.recordset[0].pokemonId;

                    this.pokTypes.forEach(async (type, index) => {
                        if (index > 0) {
                            await pool.connect();
                            const resultTypes = await pool.request()
                                .input('pokPokemonId', sql.Int(), pokPokemonId)
                                .input('pokTypeid', sql.Int(), type.pokTypeId)
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

    static delete(pokPokemonId) {
        return new Promise((resolve, reject) => {
            (async () => {
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
    update() {
        return new Promise((resolve, reject) => {
            (async () => {

                try {
                    const oldPokemon = await Pokemon.readById(this.pokPokemonId);

                    this.pokTypes.forEach(async (type) => {
                        const typeCheck = await Type.readById(type.pokTypeId);
                    });

                    const pool = await sql.connect(con);
                    const result = await pool.request()
                        .input('pokName', sql.NVarChar(50), this.pokName)
                        .input('pokHeight', sql.NVarChar(50), this.pokHeight)
                        .input('pokWeight', sql.NVarChar(50), this.pokWeight)
                        .input('pokPokemonId', sql.Int(), this.pokPokemonId)
                        .input('pokTypeId', sql.Int(), this.pokTypes[0].pokTypeId)
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
                                .input('pokTypeId', sql.Int(), type.pokTypeId)
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

    static readByUserId(userId) {
        return new Promise((resolve, reject) => {
            (async () => {
                try {
                    const pool = await sql.connect(con);
                    const result = await pool.request()
                        .input('userId', sql.Int(), userId)
                        .query(`
                            SELECT u.userId, p.pokName, p.pokAbilities, p.pokHeight, p.pokWeight, p.pokGender, p.pokPokemonId, t.pokTypeId, t.pokTypeName
                            FROM pokUser u
                            JOIN pokFavoritPokemon f
                                ON u.userId = f.FK_userId
                            JOIN pokPokemon p
                                ON f.FK_pokPokemonId = p.pokPokemonId
                            JOIN pokPokemonTypes pt
                                ON pt.FK_pokPokemonId = p.pokPokemonId
                            JOIN pokType t
                                ON t.pokTypeId = pt.FK_pokPokemonId
                            WHERE u.userId = @userId
                    `)

                    const pokemons = [];
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
                            console.log(`Pokemon with id ${record.pokPokemonId} is a new pokemon.`)
                            const newPokemon = {
                                pokPokemonId: record.pokPokemonId,
                                pokName: record.pokName,
                                pokHeight: record.pokHeight,
                                pokWeight: record.pokWeight,
                                pokAbilities: record.pokAbilities,
                                pokGender: record.pokGender,
                                pokFavorite: record.userId,
                                pokTypes: [
                                    {
                                        pokTypeId: record.pokTypeId,
                                        pokTypeName: record.pokTypeName,
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
                        if (error) throw { errorMessage: `Pokemon validation failed.` };

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

    toggleFavorite(userId) {
        return new Promise((resolve, reject) => {
            (async () => {
                try {
                    const oldPokemon = await Pokemon.readById(this.pokPokemonId);

                    const pool = await sql.connect(con);
                    const result00 = await pool.request()
                        .input('userId', sql.Int(), userId)
                        .input('pokPokemonId', sql.Int(), this.pokPokemonId)
                        .query(`
                            SELECT *
                            FROM pokFavoritPokemon
                            WHERE FK_userId = @userId
                            AND FK_pokPokemonId = @pokPokemonId
                        `)

                        let result;
                    if (result00.recordset.length > 0) {
                        await pool.connect();
                        result = await pool.request()
                            .input('userId', sql.Int(), userId)
                            .input('pokPokemonId', sql.Int(), this.pokPokemonId)
                            .query(`
                            DELETE pokFavoritPokemon
                            WHERE FK_userId = @userId
                            AND FK_pokPokemonId = @pokPokemonId;

                            SELECT p.pokPokemonId, p.pokName, p.pokHeight, p.pokWeight, p.pokAbilities, p.pokGender, t.pokTypeId, t.pokTypeName, f.FK_userId 
                            FROM pokPokemon p
                            JOIN pokPokemonTypes pt
                                ON p.pokPokemonId = pt.FK_pokPokemonId
                            JOIN pokType t
                                ON pt.FK_pokTypeId = t.pokTypeId
                            LEFT JOIN (
                                SELECT *
                                FROM pokFavoritPokemon 
                                WHERE FK_userId = @userId
                            ) f
                                ON p.pokPokemonId = f.FK_pokPokemonId
                            WHERE p.pokPokemonId = @pokPokemonId
                            ORDER BY p.pokPokemonId, t.pokTypeId
                        `)
                    } else {

                        await pool.connect();
                        result = await pool.request()
                            .input('userId', sql.Int(), userId)
                            .input('pokPokemonId', sql.Int(), this.pokPokemonId)
                            .query(`
                            INSERT INTO pokFavoritPokemon
                            ([FK_userId], [FK_pokPokemonId])
                            VALUES
                            (@userId, @pokPokemonId);

                            SELECT p.pokPokemonId, p.pokName, p.pokHeight, p.pokWeight, p.pokAbilities, p.pokGender, t.pokTypeId, t.pokTypeName, f.FK_userId 
                            FROM pokPokemon p
                            JOIN pokPokemonTypes pt
                                ON p.pokPokemonId = pt.FK_pokPokemonId
                            JOIN pokType t
                                ON pt.FK_pokTypeId = t.pokTypeId
                            LEFT JOIN (
                                SELECT *
                                FROM pokFavoritPokemon 
                                WHERE FK_userId = @userId
                            ) f
                                ON p.pokPokemonId = f.FK_pokPokemonId
                            WHERE p.pokPokemonId = @pokPokemonId
                            ORDER BY p.pokPokemonId, t.pokTypeId
                        `)
                    }
                    const pokemons = [];
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
                            console.log(`Pokemon with id ${record.pokPokemonId} is a new pokemon.`)
                            const newPokemon = {
                                pokPokemonId: record.pokPokemonId,
                                pokName: record.pokName,
                                pokHeight: record.pokHeight,
                                pokWeight: record.pokWeight,
                                pokGender: record.pokGender,
                                pokAbilities: record.pokAbilities,
                                pokFavorite: record.FK_userId,
                                pokTypes: [
                                    {
                                        pokTypeId: record.pokTypeId,
                                        pokTypeName: record.pokTypeName,
                                        pokTypeDescription: record.pokTypeDescription
                                    }
                                ]
                            }
                            pokemons.push(newPokemon);
                            lastPokemonIndex++;
                        }
                    });

                    if (result.recordset.length == 0) throw { errorMessage: `Insert to favorites table in database failed` };

                    const { error } = Pokemon.validate(pokemons[0]);
                    if (error) throw { errorMessage: `Pokemon validation failed.` };

                    resolve(new Pokemon(pokemons[0]));

                } catch (error) {
                    reject(error)
                }

                sql.close();
            })();
        });

    }

    static readAllWithFavorites([userId, pokTypeId]) {
        return new Promise((resolve, reject) => {
            (async () => {
                try {
                    const pool = await sql.connect(con);
                    let result;

                    if (pokTypeId) {
                        result = await pool.request()
                            .input('pokTypeId', sql.Int(), pokTypeId)
                            .input('userId', sql.Int(), userId)
                            .query(`
                            SELECT p.pokPokemonId, p.pokName, p.pokHeight, p.pokWeight, p.pokAbilities, p.pokGender, t.pokTypeId, t.pokTypeName, f.FK_userId
                            FROM pokPokemon p
                            JOIN pokPokemonTypes pt
                                ON p.pokPokemonId = pt.FK_pokPokemonId
                            JOIN pokType t
                                ON pt.FK_pokTypeId = t.pokTypeId
                                LEFT JOIN (
                                    SELECT *
                                    FROM pokFavoritPokemon 
                                    WHERE FK_userId = @userId
                                ) f
                                    ON p.pokPokemonId = f.FK_pokPokemonId
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
                            .input('userId', sql.Int(), userId)
                            .query(`
                            SELECT p.pokPokemonId, p.pokName, p.pokHeight, p.pokWeight, p.pokAbilities, pokGender, t.pokTypeId, t.pokTypeName, f.FK_userId 
                            FROM pokPokemon p
                            JOIN pokPokemonTypes pt
                                ON p.pokPokemonId = pt.FK_pokPokemonId
                            JOIN pokType t
                                ON pt.FK_pokTypeId = t.pokTypeId
                            LEFT JOIN (
                                SELECT *
                                FROM pokFavoritPokemon 
                                WHERE FK_userId = @userId
                            ) f
                                ON p.pokPokemonId = f.FK_pokPokemonId
                            ORDER BY p.pokPokemonId, t.pokTypeId
                        `);
                    }

                    const pokemons = [];
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
                            console.log(`Pokemon with id ${record.pokPokemonId} is a new pokemon.`)
                            const newPokemon = {
                                pokPokemonId: record.pokPokemonId,
                                pokName: record.pokName,
                                pokHeight: record.pokHeight,
                                pokWeight: record.pokWeight,
                                pokGender: record.pokGender,
                                pokAbilities: record.pokAbilities,
                                pokFavorite: record.FK_userId,
                                pokTypes: [
                                    {
                                        pokTypeId: record.pokTypeId,
                                        pokTypeName: record.pokTypeName,
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
                        if (error) throw { errorMessage: `Pokemon validation failed.` };

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

}

module.exports = Pokemon;
