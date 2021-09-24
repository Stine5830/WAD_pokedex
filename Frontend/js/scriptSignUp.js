const APIaddress = 'http://127.0.0.1:8434';
const signUpButton = document.querySelector('#signUpButton');
const userEmail = document.querySelector('#userEmail');
const userPassword = document.querySelector('#userPassword');
const userName = document.querySelector("#userName");

// Signup with semiauto login
signUpButton.addEventListener('click', (e) => {
    if (userEmail.value && userPassword.value && userName.value) {
        const payload = {
            userEmail: userEmail.value,
            userName: userName.value,
            userPassword: userPassword.value
        }

        const fetchOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        }

        fetch(APIaddress + '/api/accounts', fetchOptions)
            .then(response => {
                return response.json()
            })
            .then(data => {
                console.log(data);

                const payload2 = {
                    userEmail: userEmail.value,
                    userPassword: userPassword.value
                }

                const fetchOptions2 = {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload2)
                }

                fetch(APIaddress + '/api/accounts/login', fetchOptions2)
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

                        window.location.href = "index.html";
                        return true
                    })
                    .catch(error => {
                        alert('Invalid user name or password.');
                    });

            }
            )
            .catch(err => {
                alert('Error signing up.');
            })
    } else {
        alert('Please enter user email and password!');
    }
});
