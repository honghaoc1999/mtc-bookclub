"use strict";
console.log("htllo")
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
    console.log(xhr.responseText)
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
    // check if post already exists
    if (
      document.getElementById("id_room_container_" + room.id) === null ||
      document.getElementById("id_room_container_" + room.id) === undefined
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
   let roomContainer = document.createElement("div");
   roomContainer.setAttribute("class", "indiv_room_container");
   roomContainer.setAttribute("id", "id_room_container_" + item.id);

   // book title
   let bookTitle = document.createElement("div");
   bookTitle.setAttribute("class", "book_title");
   bookTitle.setAttribute("id", "id_book_title_" + item.id);
   bookTitle.innerHTML = "<span>"+item.book_title+"</span><button id='id_join_room_button_"+item.id+"' onclick=joinRoom(this.id)>Join Room</button>";

   // book author
   let bookAuthor = document.createElement("div");
   bookAuthor.setAttribute("class", "book_author");
   bookAuthor.setAttribute("id", "id_book_author_" + item.id);
   bookAuthor.textContent = item.book_author;

   // book description
   let bookDescription = document.createElement("div");
   bookDescription.setAttribute("class", "book_description");
   bookDescription.setAttribute("id", "id_book_description_" + item.id);
   bookDescription.textContent = item.book_description;

   // book cover
   let bookCover = document.createElement("div");
   bookCover.setAttribute("class", "book_cover");
   bookCover.setAttribute("id", "id_book_cover_container_" + item.id);
   bookCover.innerHTML = "<img id='id_book_cover_"+item.id+"' src='/book_cover/"+item.id+"'/>";

   //room admin
   let roomAdmin = document.createElement("div");
   roomAdmin.setAttribute("class", "room_creator");
   roomAdmin.setAttribute("id", "id_room_creator_container_" + item.id);
   roomAdmin.textContent = item.admin;

   roomContainer.appendChild(bookTitle);
   roomContainer.appendChild(bookAuthor);
   roomContainer.appendChild(bookDescription);
   roomContainer.appendChild(bookCover);
   roomContainer.appendChild(roomAdmin);

   return roomContainer;
 }

 function joinRoom(elemId) {
   var roomId = elemId.substring("id_join_room_button_".length, elemId.length);
   window.location.pathname = '/bookclub/' + roomId + '+' + username + '/';
 }
