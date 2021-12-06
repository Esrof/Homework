// console.log("i am avatar script")

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
                const formBody = new FormData(); // задаем экземпляр конструктора FormData куда мы будем помещать данные необходимые для отправки на сервер 
                formBody.append("image", input.files[0], input.files[0].name); //files[0] - первый загруженый файл // добавляем в formBody файл (имя ключя, файл, имя файла) 
                fetch('/upload', { // по какому пути находиться запрос в сервере 

                        method: "POST",
                        body: formBody // внутрь запроса плмещаем данные formBody

                    })
                    .then(res => {

                        console.log("Response: ", res)

                    }) //получает и обрабатывает ответ от сервера

                .catch(error => {
                        console.log("Error", error)
                    }) // оповещение об ошибке 
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