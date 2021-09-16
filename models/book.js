const config = require('config');

const sql = require('mssql');
const con = config.get('dbConfig_UCN');

const Joi = require('joi');

const _ = require('lodash');

const Author = require('./author');

class Book {
    constructor(bookObj) {
        this.bookid = bookObj.bookid;
        this.title = bookObj.title;
        this.year = bookObj.year;
        this.link = bookObj.link;
        if (bookObj.authors) this.authors = _.cloneDeep(bookObj.authors);
    }

    copy(bookObj) {
        // if (bookObj.bookid) this.bookid = bookObj.bookid;
        if (bookObj.title) this.title = bookObj.title;
        if (bookObj.year) this.year = bookObj.year;
        if (bookObj.link) this.link = bookObj.link;
        if (bookObj.authors) this.authors = _.cloneDeep(bookObj.authors);
    }

    static validate(bookWannabeeObj) {
        const schema = Joi.object({
            bookid: Joi.number()
                .integer()
                .min(1),
            title: Joi.string()
                .min(1)
                .max(255),
            year: Joi.number()
                .integer(),
            link: Joi.string()
                .uri()
                .max(255)
                .allow(null),   // <-- need to allow null values for links
            authors: Joi.array()
                .items(
                    Joi.object({
                        authorid: Joi.number()
                            .integer()
                            .min(1)
                            .required(),
                        firstname: Joi.string()
                            .max(50),
                        lastname: Joi.string()
                            .min(1)
                            .max(50)
                    })
                )
        });

        return schema.validate(bookWannabeeObj);
    }

    static readAll(authorid) {
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

                    if (authorid) {
                        result = await pool.request()
                            .input('authorid', sql.Int(), authorid)
                            .query(`
                            SELECT b.bookid, b.title, b.year, b.link, a.authorid, a.firstname, a.lastname 
                            FROM liloBook b
                            JOIN liloBookAuthor ba
                                ON b.bookid = ba.FK_bookid
                            JOIN liloAuthor a
                                ON ba.FK_authorid = a.authorid
                            WHERE b.bookid IN (
                                SELECT b.bookid
                                FROM liloBook b
                                JOIN liloBookAuthor ba
                                    ON b.bookid = ba.FK_bookid
                                JOIN liloAuthor a
                                    ON ba.FK_authorid = a.authorid
                                WHERE a.authorid = @authorid
                            )
                            ORDER BY b.bookid, a.authorid
                        `);
                    } else {
                        result = await pool.request()
                            .query(`
                            SELECT b.bookid, b.title, b.year, b.link, a.authorid, a.firstname, a.lastname 
                            FROM liloBook b
                            JOIN liloBookAuthor ba
                                ON b.bookid = ba.FK_bookid
                            JOIN liloAuthor a
                                ON ba.FK_authorid = a.authorid
                            ORDER BY b.bookid, a.authorid
                        `);
                    }

                    const books = [];   // this is NOT validated yet
                    let lastBookIndex = -1;
                    result.recordset.forEach(record => {
                        if (books[lastBookIndex] && record.bookid == books[lastBookIndex].bookid) {
                            console.log(`Book with id ${record.bookid} already exists.`);
                            const newAuthor = {
                                authorid: record.authorid,
                                firstname: record.firstname,
                                lastname: record.lastname
                            }
                            books[lastBookIndex].authors.push(newAuthor);
                        } else {
                            console.log(`Book with id ${record.bookid} is a new book.`)
                            const newBook = {
                                bookid: record.bookid,
                                title: record.title,
                                year: record.year,
                                link: record.link,
                                authors: [
                                    {
                                        authorid: record.authorid,
                                        firstname: record.firstname,
                                        lastname: record.lastname
                                    }
                                ]
                            }
                            books.push(newBook);
                            lastBookIndex++;
                        }
                    });

                    const validBooks = [];
                    books.forEach(book => {
                        const { error } = Book.validate(book);
                        if (error) throw { errorMessage: `Book.validate failed.` };

                        validBooks.push(new Book(book));
                    });

                    resolve(validBooks);

                } catch (error) {
                    reject(error);
                }

                sql.close();

            })();
        });
    }

    static readById(bookid) {
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
                        .input('bookid', sql.Int(), bookid)
                        .query(`
                            SELECT b.bookid, b.title, b.year, b.link, a.authorid, a.firstname, a.lastname 
                            FROM liloBook b
                            JOIN liloBookAuthor ba
                                ON b.bookid = ba.FK_bookid
                            JOIN liloAuthor a
                                ON ba.FK_authorid = a.authorid
                            WHERE b.bookid = @bookid
                    `)

                    const books = [];   // this is NOT validated yet
                    let lastBookIndex = -1;
                    result.recordset.forEach(record => {
                        if (books[lastBookIndex] && record.bookid == books[lastBookIndex].bookid) {
                            console.log(`Book with id ${record.bookid} already exists.`);
                            const newAuthor = {
                                authorid: record.authorid,
                                firstname: record.firstname,
                                lastname: record.lastname
                            }
                            books[lastBookIndex].authors.push(newAuthor);
                        } else {
                            console.log(`Book with id ${record.bookid} is a new book.`)
                            const newBook = {
                                bookid: record.bookid,
                                title: record.title,
                                year: record.year,
                                link: record.link,
                                authors: [
                                    {
                                        authorid: record.authorid,
                                        firstname: record.firstname,
                                        lastname: record.lastname
                                    }
                                ]
                            }
                            books.push(newBook);
                            lastBookIndex++;
                        }
                    });

                    if (books.length == 0) throw { statusCode: 404, errorMessage: `Book not found with provided bookid: ${bookid}` }
                    if (books.length > 1) throw { statusCode: 500, errorMessage: `Multiple hits of unique data. Corrupt database, bookid: ${bookid}` }

                    const { error } = Book.validate(books[0]);
                    if (error) throw { statusCode: 500, errorMessage: `Corrupt Book informaion in database, bookid: ${bookid}` }

                    resolve(new Book(books[0]));

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
                    this.authors.forEach(async (author) => {
                        const authorCheck = await Author.readById(author.authorid);
                    });

                    const pool = await sql.connect(con);
                    const resultCheckBook = await pool.request()
                        .input('title', sql.NVarChar(50), this.title)
                        .input('year', sql.Int(), this.year)
                        .query(`
                            SELECT *
                            FROM liloBook b
                            WHERE b.title = @title AND b.year = @year
                        `)

                    if (resultCheckBook.recordset.length == 1) throw { statusCode: 409, errorMessage: `Conflict. Book already exists, bookid: ${resultCheckBook.recordset[0].bookid}` }
                    if (resultCheckBook.recordset.length > 1) throw { statusCode: 500, errorMessage: `Multiple hits of unique data. Corrupt database, bookid: ${resultCheckBook.recordset[0].bookid}` }

                    await pool.connect();
                    const result00 = await pool.request()
                        .input('title', sql.NVarChar(50), this.title)
                        .input('year', sql.Int(), this.year)
                        .input('link', sql.NVarChar(255), this.link)
                        .input('authorid', sql.Int(), this.authors[0].authorid)
                        .query(`
                                INSERT INTO liloBook (title, year, link)
                                VALUES (@title, @year, @link);
                        
                                SELECT *
                                FROM liloBook
                                WHERE bookid = SCOPE_IDENTITY();

                                INSERT INTO liloBookAuthor (FK_bookid, FK_authorid)
                                VALUES (SCOPE_IDENTITY(), @authorid);
                        `)

                    if (!result00.recordset[0]) throw { statusCode: 500, errorMessage: `DB server error, INSERT failed.` }
                    const bookid = result00.recordset[0].bookid;

                    this.authors.forEach(async (author, index) => {
                        if (index > 0) {
                            await pool.connect();
                            const resultAuthors = await pool.request()
                                .input('bookid', sql.Int(), bookid)
                                .input('authorid', sql.Int(), author.authorid)
                                .query(`
                                    INSERT INTO liloBookAuthor (FK_bookid, FK_authorid)
                                    VALUES (@bookid, @authorid)
                                `)
                        }
                    })

                    sql.close();

                    const book = await Book.readById(bookid);

                    resolve(book);

                } catch (error) {
                    reject(error);
                }

                sql.close();

            })();
        });
    }

    static delete(bookid) {
        return new Promise((resolve, reject) => {
            (async () => {
                // › › connect to DB
                // › › query DB (SELECT Book JOIN BookAuthor JOIN Author WHERE bookid) <-- moving this before the DB connection, calling readById instead
                // › › query DB (DELETE BookAuthor WHERE bookid, DELETE Book WHERE bookid)
                // › › restructure DB result into the object structure needed (JOIN --> watch out for duplicates)
                // › › validate objects
                // › › close DB connection

                try {
                    const book = await Book.readById(bookid);

                    const pool = await sql.connect(con);
                    const result = await pool.request()
                        .input('bookid', sql.Int(), bookid)
                        .query(`
                        DELETE liloBookAuthor
                        WHERE FK_bookid = @bookid;

                        DELETE liloLoan
                        WHERE FK_bookid = @bookid;

                        DELETE liloBook
                        WHERE bookid = @bookid
                    `);

                    resolve(book);

                } catch (error) {
                    reject(error);
                }

                sql.close();

            })();
        });
    }

    update() {
        return new Promise((resolve, reject) => {
            (async () => {
                // › › check if book already exists in DB (i.e. Book.readById(bookid))
                // › › check if authors exist in DB (i.e. Author.readById(authorid))
                // › › connect to DB
                // › › query DB (UPDATE Book WHERE bookid)
                // › › queryDB (DELETE BookAuthor WHERE bookid, INSERT BookAuthor)
                // › › queryDB* (INSERT BookAuthor) as many more times needed (with bookid)
                // › › query DB query DB (SELECT Book JOIN BookAuthor JOIN Author WHERE bookid)
                // › › restructure DB result into the object structure needed (JOIN --> watch out for duplicates)
                // › › validate objects
                // › › close DB connection

                try {
                    const oldBook = await Book.readById(this.bookid);   // <-- this was (should have been) checked already in the route handler

                    this.authors.forEach(async (author) => {
                        const authorCheck = await Author.readById(author.authorid);
                    });

                    const pool = await sql.connect(con);
                    const result = await pool.request()
                        .input('title', sql.NVarChar(50), this.title)
                        .input('year', sql.Int(), this.year)
                        .input('link', sql.NVarChar(255), this.link)
                        .input('bookid', sql.Int(), this.bookid)
                        .input('authorid', sql.Int(), this.authors[0].authorid)
                        .query(`
                            UPDATE liloBook
                            SET
                                title = @title,
                                year = @year,
                                link = @link
                            WHERE bookid = @bookid;

                            DELETE liloBookAuthor
                            WHERE FK_bookid = @bookid;

                            INSERT INTO liloBookAuthor (FK_bookid, FK_authorid)
                            VALUES (@bookid, @authorid)
                        `);

                    this.authors.forEach(async (author, index) => {
                        if (index > 0) {
                            await pool.connect();
                            const resultAuthors = await pool.request()
                                .input('bookid', sql.Int(), this.bookid)
                                .input('authorid', sql.Int(), author.authorid)
                                .query(`
                                        INSERT INTO liloBookAuthor (FK_bookid, FK_authorid)
                                        VALUES (@bookid, @authorid)
                                    `);
                        }
                    });

                    sql.close();

                    const book = await Book.readById(this.bookid);

                    resolve(book);

                } catch (error) {
                    reject(error);
                }

                sql.close();

            })();
        });
    }

}

module.exports = Book;
