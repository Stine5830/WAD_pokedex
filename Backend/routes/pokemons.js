const express = require('express');
const router = express.Router();

const Pokemon = require('../models/pokemon');
const authenticate = require("../middleware/authenticate");
const admin = require("../middleware/admin");

// get all pokemons endpoint "public"
router.get('/', async (req, res) => {
    let pokTypeId;
    if (req.query.pokType) {
        pokTypeId = parseInt(req.query.pokType);
        if (!pokTypeId) return res.status(400).send(JSON.stringify({ errorMessage: 'Bad request: ?pokType= should refer a type id' }));
    }

    try {
        const pokPokemon = await Pokemon.readAll(pokTypeId);
        return res.send(JSON.stringify(pokPokemon));
    } catch (err) {
        return res.status(500).send(JSON.stringify({ errorMessage: err }));
    }
});
// get all pokemons logged in endpoint "private"
router.get('/member', [authenticate], async (req, res) => {
    let pokTypeId;
    if (req.query.pokType) {
        pokTypeId = parseInt(req.query.pokType);
        if (!pokTypeId) return res.status(400).send(JSON.stringify({ errorMessage: 'Bad request: ?pokType= should refer a type id' }));
    }

    try {
        const pokPokemon = await Pokemon.readAllWithFavorites([req.account.userId, pokTypeId]);
        return res.send(JSON.stringify(pokPokemon));
    } catch (err) {
        return res.status(500).send(JSON.stringify({ errorMessage: err }));
    }
});
// get all favorite pokemons endpoint "private"
router.get('/member/favorites', [authenticate], async (req, res) => {

    try {
        const pokPokemon = await Pokemon.readByUserId(req.account.userId);
        return res.send(JSON.stringify(pokPokemon));
    } catch (err) {
        return res.status(500).send(JSON.stringify({ errorMessage: err }));
    }
});
// add or remove favorite pokemon endpoint "private"
router.put('/member/favorites/:pokPokemonId', [authenticate], async (req, res) => {

    let pokPokemonId;
    if (req.query.pokPokemonId) {
        pokPokemonId = parseInt(req.query.pokPokemonId);
        if (!pokPokemonId) return res.status(400).send(JSON.stringify({ errorMessage: 'Bad request: pokPokemonId should refer a type id' }));
    }

    try {
        const oldPokPokemon = await Pokemon.readById(req.params.pokPokemonId);
        const pokPokemon = await oldPokPokemon.toggleFavorite(req.account.userId);

        return res.send(JSON.stringify(pokPokemon));

    } catch (err) {
        return res.status(500).send(JSON.stringify({ errorMessage: err }));
    }
});
// get specific pokemon endpoint "public"
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
// make new pokemon endpoint "only admin"
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
// delete specific pokemon endpoint "only admin"
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
// update specific pokemon endpoint "only admin"
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


module.exports = router;