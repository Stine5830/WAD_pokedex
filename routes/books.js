// Opdateret

const express = require('express');
const router = express.Router();

const pokPokemon = require('../models/pokPokemon');

router.get('/', async (req, res) => {
    let pokTypeId;
    if (req.query.pokType) {
        pokTypeId = parseInt(req.query.pokType);
        if (!pokTypeId) return res.status(400).send(JSON.stringify({ errorMessage: 'Bad request: ?pokType= should refer a type id (integer)' }));
    }

    try {
        const pokPokemon = await pokPokemon.readAll(pokTypeId);
        return res.send(JSON.stringify(pokPokemon));
    } catch (err) {
        return res.status(500).send(JSON.stringify({ errorMessage: err }));
    }
});

router.get('/:pokPokemonId', async (req, res) => {
    
    const { error } = pokPokemon.validate(req.params);
    if (error) return res.status(400).send(JSON.stringify({ errorMessage: 'Bad request: pokPokemonId has to be an integer', errorDetail: error.details[0].message }));

    try {
        const pokPokemon = await pokPokemon.readById(req.params.pokPokemonId);
        return res.send(JSON.stringify(pokPokemon));
    } catch (err) {
        return res.status(500).send(JSON.stringify({ errorMessage: err }));
    }
});

router.post('/', async (req, res) => {

    const { error } = pokPokemon.validate(req.body);
    if (error) return res.status(400).send(JSON.stringify({ errorMessage: 'Bad request: pokPokemon payload formatted incorrectly', errorDetail: error.details[0].message }));

    try {
        const newPokPokemon = new pokPokemon(req.body);
        const pokPokemon = await newPokPokemon.create();
        return res.send(JSON.stringify(pokPokemon));
    } catch (err) {
        return res.status(500).send(JSON.stringify({ errorMessage: err }));
    }
});

router.delete('/:pokPokemon', async (req, res) => {
  
    const { error } = pokPokemon.validate(req.params);
    if (error) return res.status(400).send(JSON.stringify({ errorMessage: 'Bad request: pokPokemonId has to be an integer', errorDetail: error.details[0].message }));

    try {
        const pokPokemon = await pokPokemon.delete(req.params.pokPokemonId);
        return res.send(JSON.stringify(pokPokemon));
    } catch (err) {
        return res.status(500).send(JSON.stringify({ errorMessage: err }));
    }
});

router.put('/:pokPokemonId', async (req, res) => {
  
    const pokPokemonidValidate = pokPokemon.validate(req.params);
    if (pokPokemonidValidate.error) return res.status(400).send(JSON.stringify({ errorMessage: 'Bad request: pokPokemonId has to be an integer', errorDetail: error.details[0].message }));

    const payloadValidate = pokPokemon.validate(req.body);
    if (payloadValidate.error) return res.status(400).send(JSON.stringify({ errorMessage: 'Bad request: pokPokemon payload formatted incorrectly', errorDetail: error.details[0].message }));

    try {
        const oldPokPokemon = await pokPokemon.readById(req.params.pokPokemonId);
        oldPokPokemon.copy(req.body);
        const pokPokemon = await oldPokPokemon.update();
        return res.send(JSON.stringify(pokPokemon));
    } catch (err) {
        return res.status(500).send(JSON.stringify({ errorMessage: err }));
    }
});


module.exports = router;