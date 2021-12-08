// let avatarImage = document.getElementById('avatar') // находим Image по id  

let inputSearch = document.getElementById('searchInput')

let buttonSearch = document.getElementById('buttonSearchInput')


function findUser() {
    let {
        value
    } = inputSearch

    window.location.search = `?search=${value}`
}

buttonSearch.addEventListener('click', findUser)