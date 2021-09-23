const sql = require('mssql');
const config = require('config');
const Joi = require('joi');
const bcrypt = require('bcryptjs');

const con = config.get('dbConfig_UCN');
const salt = parseInt(config.get('saltRounds'));

class Account {
    
    constructor(accountObj) {
        this.userEmail = accountObj.userEmail;
        this.userPassword = accountObj.userPassword;
        this.userName = accountObj.userName;
    }

    static validate(accountObj) {
        const schema = Joi.object({
            userEmail: Joi.string()
                .required()
                .email(),
            userPassword: Joi.string()
                .min(1)
                .max(255)
                .required(),
            userName: Joi.string()
                .alphanum()
                .min(1)
                .max(50)
        });

        return schema.validate(accountObj);
    }

    static validateResponse(accountResponse) {
        const schema = Joi.object({
            userId: Joi.number()
                .integer()
                .required(),
            userName: Joi.string()
                .alphanum()
                .min(1)
                .max(50)
                .required(),
            userRole: Joi.object({
                roleId: Joi.number()
                    .integer()
                    .required(),
                roleName: Joi.string()
                    .alphanum()
                    .min(1)
                    .max(50)
                    .required()
            }).required()
        });

        return schema.validate(accountResponse);
    }

    static checkCredentials(accountObj) {
        return new Promise((resolve, reject) => {
            (async () => {
                try {
                    const pool = await sql.connect(con);
                    const result = await pool.request()
                        .input('userEmail', sql.NVarChar(255), accountObj.userEmail)
                        .query(`
                            SELECT u.userId, u.userName, r.roleId, r.roleName, p.passwordValue
                            FROM pokUser u
                            JOIN pokPassword p
                                ON u.userId = p.FK_userId
                            JOIN pokRole r
                                ON u.FK_roleId = r.roleId
                            WHERE u.userEmail = @userEmail
                        `);

                    if (!result.recordset[0]) throw { statusCode: 404, errorMessage: 'User not found with provided credentials.' }
                    if (result.recordset.length > 1) throw { statusCode: 500, errorMessage: 'Multiple hits of unique data. Corrupt database.' }

                    const bcrypt_result = await bcrypt.compare(accountObj.userPassword, result.recordset[0].passwordValue);
                    if (!bcrypt_result) throw { statusCode: 404, errorMessage: 'User not found with provided credentials.' }

                    const accountResponse = {
                        userId: result.recordset[0].userId,
                        userName: result.recordset[0].userName,
                        userRole: {
                            roleId: result.recordset[0].roleId,
                            roleName: result.recordset[0].roleName
                        }
                    }
                    
                    const { error } = Account.validateResponse(accountResponse);
                    if (error) throw { statusCode: 500, errorMessage: 'Corrupt user account informaion in database.' }

                    resolve(accountResponse);

                } catch (error) {
                    console.log(error);
                    reject(error);
                }

                sql.close();
            })();
        });
    }

    static readByEmail(accountObj) {
        return new Promise((resolve, reject) => {
            (async () => {
                try {
                    const pool = await sql.connect(con);
                    const result = await pool.request()
                        .input('userEmail', sql.NVarChar(255), accountObj.userEmail)
                        .query(`
                            SELECT u.userId, u.userName, r.roleId, r.roleName
                            FROM pokUser u
                            JOIN pokRole r
                                ON u.FK_roleId = r.roleId
                            WHERE u.userEmail = @userEmail 
                        `);

                    if (!result.recordset[0]) throw { statusCode: 404, errorMessage: 'User not found with provided credentials.' }
                    if (result.recordset.length > 1) throw { statusCode: 500, errorMessage: 'Multiple hits of unique data. Corrupt database.' }

                    const accountResponse = {
                        userId: result.recordset[0].userId,
                        userName: result.recordset[0].userName,
                        userRole: {
                            roleId: result.recordset[0].roleId,
                            roleName: result.recordset[0].roleName
                        }
                    }

                    const { error } = Account.validateResponse(accountResponse);
                    if (error) throw { statusCode: 500, errorMessage: 'Corrupt user account informaion in database.' }

                    resolve(accountResponse);

                } catch (error) {
                    console.log(error);
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
                    const account = await Account.readByEmail(this);  
                    
                    reject({ statusCode: 409, errorMessage: 'Conflict: user email is already in use.' })
                } catch (error) {
                    
                    console.log(error);
                    if (!error.statusCode) reject(error);
                    if (error.statusCode != 404) reject(error);

                    try {
                    
                        const hashedPassword = await bcrypt.hash(this.userPassword, salt);

                        const pool = await sql.connect(con);
                        const result00 = await pool.request()
                            .input('userName', sql.NVarChar(50), this.userName)
                            .input('userEmail', sql.NVarChar(255), this.userEmail)
                            .input('hashedPassword', sql.NVarChar(255), hashedPassword)
                            .query(`
                        INSERT INTO pokUser([userName], [userEmail], [FK_roleId])
                        VALUES (@userName, @userEmail, 2);

                        SELECT u.userId, u.userName, r.roleId, r.roleName
                        FROM pokUser u
                        JOIN pokRole r
                            ON u.FK_roleId = r.roleId
                        WHERE u.userId = SCOPE_IDENTITY();

                        INSERT INTO pokPassword([passwordValue], [FK_userId])
                        VALUES (@hashedPassword, SCOPE_IDENTITY());
                    `);
                        if (!result00.recordset[0]) throw { statusCode: 500, errorMessage: 'Something went wrong, login is not created.' }

                        const accountResponse = {
                            userId: result00.recordset[0].userId,
                            userName: result00.recordset[0].userName,
                            userRole: {
                                roleId: result00.recordset[0].roleId,
                                roleName: result00.recordset[0].roleName
                            }
                        }
                        
                        const { error } = Account.validateResponse(accountResponse);
                        console.log(error);
                        if (error) throw { statusCode: 500, errorMessage: 'Corrupt user account informaion in database.' }

                        resolve(accountResponse);

                    } catch (error) {
                        console.log(error);
                        reject(error);
                    }
                }

                sql.close();
            })();
        });
    }
}

module.exports = Account;