const env = require('dotenv').config();
const config = require('config');

const express = require('express');
const app = express();

const cors = require('cors');

// custom middleware
const setContentTypeJSON = require('./middleware/setResponseHeader');

const accounts = require('./routes/accounts');
const pokemons = require('./routes/pokemons');

app.use(express.json());
app.use(cors());
app.use(setContentTypeJSON);
app.use('/api/accounts', accounts);
app.use('/api/pokemons', pokemons);

app.listen(config.get('port'), () => console.log(`Listening on port ${config.get('port')}...`));