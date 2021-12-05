// console.log("i am avatar script")


function uploadFile(url, data, name) {
    console.log("i am uploadFile", url, data, name)
        // define data and connections
    var blob = new Blob([JSON.stringify(data)]);
    var url = URL.createObjectURL(blob);
    var xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);

    // define new form
    var formData = new FormData();
    formData.append('image', blob, name);

    // action after uploading happens
    xhr.onload = function(e) {
        console.log("File uploading completed!");
    };

    xhr.onerror = function(e) {
        console.log("Erorr", e);
    };

    // do the uploading
    console.log("File uploading started!");
    xhr.send(formData);
}

let form = document.getElementById('form') //находим form

let avatarImage = document.getElementById('avatar') // находим Image по id
console.log("avatarImage", avatarImage)

let avatarInput = document.getElementById('avatarInput') //находим Input по id
console.log("avatarInput", avatarInput)

let avatarInputChange = function(event) {

        const input = event.target; // то где произошло событие (event) 

        if (input.files && input.files[0]) { // проверка на выбраный файл в input
            var reader = new FileReader(); // создание FileReader
            reader.onload = function(e) { // прослушиваем загрузку reader
                avatarImage.src = e.target.result; // устанавливаем загруженую картинку в tag Image
                uploadFile(window.location.origin + "/upload", input.files[0], input.files[0].name);
                // form.elements["image"].value = e.target.result; // устанавливаем base64 строку в значения input
                // console.log("e.target.result", e.target.result)
            };
            reader.readAsDataURL(input.files[0]); // загруженый файл превращаем в ссылку 
        }
        console.log(event)

    } // функция для прослушивания ивента 
avatarInput.addEventListener("change", avatarInputChange) // устанавливаем функцию прослушивания действия на выбор картинки

let avatarImageClick = function() { // объявление функции для клика по картинке 
    if (avatarInput) { // проверяем существует ли avatarInput

        avatarInput.click(); // имитируем клик по Input
    }
}

avatarImage.addEventListener("click", avatarImageClick) // функция прослушивания действия на клик по картинке