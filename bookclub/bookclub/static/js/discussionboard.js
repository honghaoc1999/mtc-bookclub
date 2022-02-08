"use strict";
console.log("htllo");
// update discussionboard page
function getRooms() {
  let xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function () {
    if (xhr.readyState != 4) return;
    updatePage(xhr);
  };

  xhr.open("GET", "/bookclub/get-rooms", true);
  xhr.send();
}

function updatePage(xhr) {
  if (xhr.status == 200) {
    console.log(xhr.responseText);
    let response = JSON.parse(xhr.responseText);
    updateRooms(response);
    return;
  }

  if (xhr.status == 0) {
    displayError("Cannot connect to server");
    return;
  }

  if (!xhr.getResponseHeader("content-type") == "application/json") {
    displayError("Received status=" + xhr.status);
    return;
  }

  let response = JSON.parse(xhr.responseText);
  if (response.hasOwnProperty("error")) {
    displayError(response.error);
    return;
  }

  displayError(response);
}

function displayError(message) {
  let errorElement = document.getElementById("error");
  errorElement.innerHTML = message;
}

function updateRooms(items) {
  //console.log(items);

  let rooms = document.getElementById("id_room_list");

  // add posts
  let newRooms = items["rooms"];
  for (let i = 0; i < newRooms.length; i++) {
    let room = newRooms[i];
    // check if room already exists
    if (
      document.getElementById("id_room_cardbody_" + room.id) === null ||
      document.getElementById("id_room_cardbody_" + room.id) === undefined
    ) {
      let container = generateRoomContainer(room);
      rooms.prepend(container);
    }
  }
}

/**
 * GENERATE UI
 */
function generateRoomContainer(item) {
  // book title
  let bookTitle = document.createElement("h1");
  bookTitle.setAttribute("class", "book_title card_title");
  bookTitle.setAttribute("id", "id_book_title_" + item.id);
  bookTitle.innerHTML = item.book_title;

  // book author
  let bookAuthor = document.createElement("h4");
  bookAuthor.setAttribute("class", "book_author");
  bookAuthor.setAttribute("id", "id_book_author_" + item.id);
  bookAuthor.textContent = "By " + item.book_author;

  let hr = document.createElement("hr");
  hr.setAttribute("class", "my-4");
  let hr1 = document.createElement("hr");
  hr1.setAttribute("class", "my-4");

  // book description
  let bookDescription = document.createElement("div");
  bookDescription.setAttribute("class", "book_description");
  bookDescription.setAttribute("id", "id_book_description_" + item.id);
  bookDescription.textContent = item.book_description;

  // book cover
  let bookCover = document.createElement("img");
  bookCover.setAttribute("class", "book_cover img-thumbnail");
  bookCover.setAttribute("id", "id_book_cover_container_" + item.id);
  bookCover.setAttribute("src", "/book_cover/" + item.id);
  bookCover.setAttribute("style", "height: 300px;");

  // join room button
  let btn = document.createElement("button");
  btn.setAttribute("id", "id_join_room_button_" + item.id);
  btn.setAttribute("onclick", "joinRoom(this.id)");
  btn.setAttribute("class", "btn btn-outline-success");
  btn.textContent = "Join Room ";

  //room admin
  // let roomAdmin = document.createElement("div");
  // roomAdmin.setAttribute("class", "room_creator");
  // roomAdmin.setAttribute("id", "id_room_creator_container_" + item.id);
  // roomAdmin.textContent = item.admin;

  let card = document.createElement("div");
  card.setAttribute("class", "card border-success mb-3");
  card.setAttribute("style", "width: 70vw");

  let cardHeader = document.createElement("div");
  cardHeader.setAttribute("class", "card-header");
  cardHeader.innerHTML =
    "<i class='bi bi-caret-right-square'></i>" +
    "<span> On-going Discussion </span>";

  let cardBody = document.createElement("div");
  cardBody.setAttribute("class", "card-body");
  card.setAttribute("id", "id_room_cardbody_" + item.id);

  cardBody.appendChild(bookTitle);
  cardBody.appendChild(bookAuthor);
  cardBody.appendChild(hr1);
  cardBody.appendChild(bookCover);
  cardBody.appendChild(hr);
  cardBody.appendChild(bookDescription);
  // cardBody.appendChild(roomAdmin);

  let cardFooter = document.createElement("div");
  cardFooter.setAttribute("class", "card-footer");
  cardFooter.appendChild(btn);

  card.appendChild(cardHeader);
  card.appendChild(cardBody);
  card.appendChild(cardFooter);

  return card;
}

function joinRoom(elemId) {
  var roomId = elemId.substring("id_join_room_button_".length, elemId.length);
  window.location.pathname = "/chatroom/" + roomId + "+" + username + "/";
}
