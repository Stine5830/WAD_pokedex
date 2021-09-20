const express = require('express');
const router = express.Router();

const Pokemon = require('../models/pokemon');
const authenticate = require("../middleware/authenticate");
const admin = require("../middleware/admin");

router.get('/', async (req, res) => {
    let pokTypeId;
    if (req.query.pokType) {
        pokTypeId = parseInt(req.query.pokType);
        if (!pokTypeId) return res.status(400).send(JSON.stringify({ errorMessage: 'Bad request: ?pokType= should refer a type id (integer)' }));
    }

    try {
        const pokPokemon = await Pokemon.readAll(pokTypeId);
        return res.send(JSON.stringify(pokPokemon));
    } catch (err) {
        return res.status(500).send(JSON.stringify({ errorMessage: err }));
    }
});

router.get('/:pokPokemonId', async (req, res) => {

    const { error } = Pokemon.validate(req.params);
    if (error) return res.status(400).send(JSON.stringify({ errorMessage: 'Bad request: pokPokemonId has to be an integer', errorDetail: error.details[0].message }));

    try {
        const pokPokemon = await Pokemon.readById(req.params.pokPokemonId);
        return res.send(JSON.stringify(pokPokemon));
    } catch (err) {
        return res.status(500).send(JSON.stringify({ errorMessage: err }));
    }
});

router.post('/', [authenticate, admin], async (req, res) => {

    const { error } = Pokemon.validate(req.body);
    if (error) return res.status(400).send(JSON.stringify({ errorMessage: 'Bad request: pokPokemon payload formatted incorrectly', errorDetail: error.details[0].message }));

    try {
        const newPokPokemon = new Pokemon(req.body);
        const pokPokemon = await newPokPokemon.create();
        return res.send(JSON.stringify(pokPokemon));
    } catch (err) {
        return res.status(500).send(JSON.stringify({ errorMessage: err }));
    }
});

router.delete('/:pokPokemonId', [authenticate, admin], async (req, res) => {

    const { error } = Pokemon.validate(req.params);
    if (error) return res.status(400).send(JSON.stringify({ errorMessage: 'Bad request: pokPokemonId has to be an integer', errorDetail: error.details[0].message }));

    try {
        const pokPokemon = await Pokemon.delete(req.params.pokPokemonId);
        return res.send(JSON.stringify(pokPokemon));
    } catch (err) {
        return res.status(500).send(JSON.stringify({ errorMessage: err }));
    }
});

router.put('/:pokPokemonId', [authenticate, admin], async (req, res) => {

    const pokPokemonIdValidate = Pokemon.validate(req.params);
    if (pokPokemonIdValidate.error) return res.status(400).send(JSON.stringify({ errorMessage: 'Bad request: pokPokemonId has to be an integer', errorDetail: error.details[0].message }));

    const payloadValidate = Pokemon.validate(req.body);
    if (payloadValidate.error) return res.status(400).send(JSON.stringify({ errorMessage: 'Bad request: pokPokemon payload formatted incorrectly', errorDetail: error.details[0].message }));

    try {
        const oldPokPokemon = await Pokemon.readById(req.params.pokPokemonId);
        oldPokPokemon.copy(req.body);
        const pokPokemon = await oldPokPokemon.update();
        return res.send(JSON.stringify(pokPokemon));
    } catch (err) {
        return res.status(500).send(JSON.stringify({ errorMessage: err }));
    }
});

// router.get('/favorites', [authenticate], async (req, res) => {

// who is the user (req.account.userId)
// new method in model (pokemon.js in the class) - be able to read out all pokemons by userId

// let pokTypeId;
// if (req.query.pokType) {
//     pokTypeId = parseInt(req.query.pokType);
//     if (!pokTypeId) return res.status(400).send(JSON.stringify({ errorMessage: 'Bad request: ?pokType= should refer a type id (integer)' }));
// }

// try {
//     const pokPokemon = await Pokemon.readAll(pokTypeId); (await Pokemon.readByUserId(pokUserId, pokTypeId));
//     return res.send(JSON.stringify(pokPokemon));
// } catch (err) {
//     return res.status(500).send(JSON.stringify({ errorMessage: err }));
// }
// });


module.exports = router;