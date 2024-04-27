const reg_form = document.getElementById("reg_form");
reg_form.addEventListener("submit", function (event) {
    event.preventDefault();
    var data = {
        login: document.getElementById("login").value,
        password_hash: document.getElementById("password").value,
        name: document.getElementById("name").value,
        description: ""
    };
    
    $.ajax({
        type: 'POST',
        url: 'https://localhost:3000/user/create',
        //url: `http://localhost:3000/user/create?login=${data.login}&password_hash=${data.password_hash}&name=${data.name}&description=`,
        data: JSON.stringify(data),
        contentType: 'application/json',
        success: function(response) {
            console.log('Success:', response);
        },
        error: function(xhr, status, error) {
            console.error('Error:', error);
        }
    });

    /*
    fetch(`http://localhost:3000/user/create?login=${data.login}&password_hash=${data.password_hash}&name=${data.name}&description=`)
    .then(response => response.json())
    .then(data => console.log(data))
    .catch(error => console.error(error));
    */
});