const loginDiv = document.querySelector('#logIn');
const logoutDiv = document.querySelector('#logOut');
const userEmail = document.querySelector('#userEmail');
const userPassword = document.querySelector('#userPassword');
const loginButton = document.querySelector('#loginButton');
const logoutButton = document.querySelector('#logoutButton');

const APIaddress = 'http://127.0.0.1:8434';

// Login - save token in localstorage - toggle login/logout buttons
loginButton.addEventListener('click', (e) => {
    if (userEmail.value && userPassword.value) {
        const payload = {
            userEmail: userEmail.value,
            userPassword: userPassword.value
        }

        const fetchOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        }

        fetch(APIaddress + '/api/accounts/login', fetchOptions)
            .then(response => {
                const token = response.headers.get('x-authenticate-token');
                window.localStorage.setItem('x-authenticate-token', token);
                console.log(token);

                return response.json()
            })
            .then(data => {
                console.log(data);
                window.localStorage.setItem('accountInfo', JSON.stringify(data));
                console.log(window.localStorage.getItem('accountInfo'));
                window.location.reload();

                loginDiv.classList.toggle('hidden');
                logoutDiv.classList.toggle('hidden');
            })
            .catch(error => {
                alert('Invalid user name or password.');
            })

    } else {
        alert('Please enter user email and password!');
    }
});

// Logout - toggle logout/login buttons
logoutButton.addEventListener('click', (e) => {
    window.localStorage.removeItem('x-authenticate-token');
    window.localStorage.removeItem('accountInfo');
    console.log('Account logged out.');
    window.location.reload();

    loginDiv.classList.toggle('hidden');
    logoutDiv.classList.toggle('hidden');
});

// on load check if token - if token renderwithfavoritepokemon - if not token renderpokemon
window.addEventListener('load', (e) => {
    const token = window.localStorage.getItem('x-authenticate-token');

    const fetchOptions = {
        headers: {
            'Content-Type': 'application/json'
        }
    }
    console.log(fetchOptions.headers['Content-Type']);
    if (token) fetchOptions.headers['x-authenticate-token'] = token;
    console.log(fetchOptions.headers);

    if (token) {
        loginDiv.classList.add('hidden');
    } else {
        logoutDiv.classList.add('hidden');
    }

    if (token) {
        fetch(APIaddress + "/api/pokemons/member", fetchOptions)
            .then(response => {
                return response.json()
            })
            .then(data => {
                renderPokemonWithFavorite(data);
            })
    } else {
        fetch(APIaddress + "/api/pokemons", fetchOptions)
            .then(response => {
                return response.json()
            })
            .then(data => {
                renderPokemon(data);
            })
    }
})

// public pokemons rendered from database
function renderPokemon(pokData) {
    document.querySelectorAll(".pokemons")[0].innerHTML = "";
    pokData.forEach(pokemon => {
        const pokDiv = document.createElement("div");
        pokDiv.classList.add("pokemon");
        pokDiv.dataset.id = pokemon.pokPokemonId;

        const pokImg = document.createElement("img");
        pokImg.src = "/images/pikachu-5527377_1920.jpg"; // Placeholder image

        const pokInfoDiv = document.createElement("div");
        pokInfoDiv.classList.add("text");

        const pokId = document.createElement("p");
        pokId.innerText = `Pokemon ID: ${pokemon.pokPokemonId}`;

        const pokName = document.createElement("p");
        pokName.innerText = `Name: ${pokemon.pokName}`;

        const pokType = document.createElement("p");
        pokType.innerText = `Type: ${pokemon.pokTypes[0].pokTypeName}`;

        const pokAbilities = document.createElement("p");
        pokAbilities.innerText = `Abilities: ${pokemon.pokAbilities}`;

        const pokWeight = document.createElement("p");
        pokWeight.innerText = `Weight: ${pokemon.pokWeight}`;

        const pokHeight = document.createElement("p");
        pokHeight.innerText = `Height: ${pokemon.pokHeight}`;

        const pokGender = document.createElement("p");
        pokGender.innerText = `Gender: ${pokemon.pokGender}`;

        pokInfoDiv.appendChild(pokId);
        pokInfoDiv.appendChild(pokName);
        pokInfoDiv.appendChild(pokType);
        pokInfoDiv.appendChild(pokAbilities);
        pokInfoDiv.appendChild(pokWeight);
        pokInfoDiv.appendChild(pokHeight);
        pokInfoDiv.appendChild(pokGender);

        pokDiv.appendChild(pokImg);
        pokDiv.appendChild(pokInfoDiv);

        document.querySelectorAll(".pokemons")[0].appendChild(pokDiv);
    });

}

// private pokemons rendered from database with favorite-heart
function renderPokemonWithFavorite(pokData) {
    document.querySelectorAll(".pokemons")[0].innerHTML = "";
    pokData.forEach(pokemon => {
        console.log(pokemon);

        const pokDiv = document.createElement("div");
        pokDiv.classList.add("pokemon");
        pokDiv.dataset.id = pokemon.pokPokemonId;

        const pokImg = document.createElement("img");
        pokImg.src = "/images/pikachu-5527377_1920.jpg";

        const pokInfoDiv = document.createElement("div");
        pokInfoDiv.classList.add("text");

        const pokId = document.createElement("p");
        pokId.innerText = `Pokemon ID: ${pokemon.pokPokemonId}`;

        const pokName = document.createElement("p");
        pokName.innerText = `Name: ${pokemon.pokName}`;

        const pokType = document.createElement("p");
        pokType.innerText = `Type: ${pokemon.pokTypes[0].pokTypeName}`;

        const pokAbilities = document.createElement("p");
        pokAbilities.innerText = `Abilities: ${pokemon.pokAbilities}`;

        const pokWeight = document.createElement("p");
        pokWeight.innerText = `Weight: ${pokemon.pokWeight}`;

        const pokHeight = document.createElement("p");
        pokHeight.innerText = `Height: ${pokemon.pokHeight}`;

        const pokGender = document.createElement("p");
        pokGender.innerText = `Gender: ${pokemon.pokGender}`;

        const pokFav = document.createElement("i");
        pokFav.classList.add("fa-heart");
        if (pokemon.pokFavorite) {
            pokFav.classList.add("fas");
        } else {
            pokFav.classList.add("far");
        }
        pokFav.addEventListener('click', (e) => {
            const token = window.localStorage.getItem('x-authenticate-token');

            const fetchOptions = {
                headers: {
                    'Content-Type': 'application/json'
                },
                method: "PUT"
            }
            console.log(fetchOptions.headers['Content-Type']);
            if (token) fetchOptions.headers['x-authenticate-token'] = token;

            fetch(APIaddress + "/api/pokemons/member/favorites/" + pokemon.pokPokemonId, fetchOptions)
                .then(response => {
                    return response.json()
                })
                .then(data => {
                    console.log(data);
                    window.location.reload();
                    return false;
                })
        });

        pokInfoDiv.appendChild(pokId);
        pokInfoDiv.appendChild(pokName);
        pokInfoDiv.appendChild(pokType);
        pokInfoDiv.appendChild(pokAbilities);
        pokInfoDiv.appendChild(pokWeight);
        pokInfoDiv.appendChild(pokHeight);
        pokInfoDiv.appendChild(pokGender);
        pokInfoDiv.appendChild(pokFav);

        pokDiv.appendChild(pokImg);
        pokDiv.appendChild(pokInfoDiv);

        document.querySelectorAll(".pokemons")[0].appendChild(pokDiv);
    });
}

// Filtrering public and private pokemon types
function filterPokemon(pokTypeId) {

    const token = window.localStorage.getItem('x-authenticate-token');

    const fetchOptions = {
        headers: {
            'Content-Type': 'application/json',
        }
    }
    console.log(fetchOptions.headers['Content-Type']);
    if (token) fetchOptions.headers['x-authenticate-token'] = token;
    console.log(fetchOptions.headers);

    if (token) {
        fetch(APIaddress + "/api/pokemons/member?pokType=" + pokTypeId, fetchOptions)
            .then(response => {
                return response.json()
            })
            .then(data => {
                renderPokemonWithFavorite(data);
            })
    } else {
        fetch(APIaddress + "/api/pokemons?pokType=" + pokTypeId, fetchOptions)
            .then(response => {
                return response.json()
            })
            .then(data => {
                console.log(data);
                renderPokemon(data);
            })
    }
}