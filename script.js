const { readAll } = require("./models/pokemon");
const { readById } = require("./models/type");

const loginDiv = document.querySelector('#logIn');
const logoutDiv = document.querySelector('#logOut');
const userEmail = document.querySelector('#userEmail');
const userPassword = document.querySelector('#userPassword');
const loginButton = document.querySelector('#loginButton');
const logoutButton = document.querySelector('#logoutButton');
// const publicArticle = document.querySelector('#publicArticle');
// const privateArticle = document.querySelector('#privateArticle');

const APIaddress = 'http://127.0.0.1:8434';

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

logoutButton.addEventListener('click', (e) => {
    window.localStorage.removeItem('x-authenticate-token');
    window.localStorage.removeItem('accountInfo');
    console.log('Account logged out.');

    loginDiv.classList.toggle('hidden');
    logoutDiv.classList.toggle('hidden');
});

window.addEventListener('load', (e) => {
    const token = window.localStorage.getItem('x-authenticate-token');

    const fetchOptions = {
        headers: {
            'Content-Type': 'application/json',
        }
    }
    console.log(fetchOptions.headers['Content-Type']);
    if (token) fetchOptions.headers['x-authenticate-token'] = token;
    console.log(fetchOptions.headers);

    // // render the public article
    // fetchOptions.method = 'GET';
    // fetch(APIaddress + '/api/pokemons', fetchOptions)
    //     .then(response => {
    //         return response.json()
    //     })
    //     .then(data => {
    //         publicArticle.innerHTML = data.message;
    //     })
    //     .catch(error => console.log(error));

    // // render the private article if logged in
    // if (token) {
    //     fetchOptions.method = 'GET';
    //     fetch(APIaddress + '/api/pokemons/favorites', fetchOptions)
    //         .then(response => {
    //             return response.json()
    //         })
    //         .then(data => {
    //             privateArticle.innerHTML = data.message;
    //         })
    //         .catch(error => console.log(error));

    // }

    // render the login/logout divs on the condition of being logged in or not
    if (token) {
        loginDiv.classList.add('hidden');
    } else {
        logoutDiv.classList.add('hidden');
    }

})

// Filtrering

// const pokemonType = //call the function we already have

// function checkType(pokemonType) {
//   return pokemonType = document.getElementById("relevantid").value;
// }

// function frontendType() {
//   document.getElementById("filter").innerHTML = pokemontype.filter(checkType);
// }

// Da fuck is dis?

// function grass() {
//     return readAll(pokTypeId == 1);
// }
// document.getElementById("grass").innerHTML = grass();