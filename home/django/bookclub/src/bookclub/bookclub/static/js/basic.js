"use strict";

var dateObj = new Date();

// update global stream
function getGlobal() {
  let xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function () {
    if (xhr.readyState != 4) return;
    updatePage(xhr);
  };

  xhr.open("GET", "/bookclub/get-global", true);
  xhr.send();
}

// update follower stream
function getFollower() {
  let xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function () {
    if (xhr.readyState != 4) return;
    updatePage(xhr);
  };

  xhr.open("GET", "/bookclub/get-follower", true);
  xhr.send();
}

function updatePage(xhr) {
  if (xhr.status == 200) {
    console.log("Update page successfully");
    let response = JSON.parse(xhr.responseText);
    updateStream(response);
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
    displayError("has error" + response.error);
    return;
  }
}

function displayError(message) {
  /*
  let errorElement = document.getElementById("error");
  errorElement.innerHTML = message; */
  // console.log("Error happened:", message);
}

function updateStream(items) {
  //console.log(items);

  let stream = document.getElementById("stream_container");

  // add posts
  let newPosts = items["posts"];
  for (let i = 0; i < newPosts.length; i++) {
    let post = newPosts[i];
    // check if post already exists
    if (
      document.getElementById("id_post_text_" + post.id) === null ||
      document.getElementById("id_post_text_" + post.id) === undefined
    ) {
      let container = generateStreamPost(post);
      stream.prepend(container);
    }
  }

  // add comments
  let newComments = items["comments"];
  for (let j = 0; j < newComments.length; j++) {
    let comment = newComments[j];
    // check if comment already exists
    if (
      document.getElementById("id_comment_text_" + comment.id) === null ||
      document.getElementById("id_comment_text_" + comment.id) === undefined
    ) {
      insertComment(comment);
    }
  }
}

function insertComment(comment) {
  let postContainer = document.getElementById(
    "id_indiv_comment_container_" + comment.post_id
  );
  let commentContainer = generateStreamComment(comment);
  postContainer.appendChild(commentContainer);
}

function addComment(postId) {
  let itemTextElement = document.getElementById(
    "id_comment_input_text_" + postId
  );
  let itemTextValue = itemTextElement.value;

  // Clear input box and old error message (if any)
  itemTextElement.value = "";
  displayError("");

  let xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function () {
    if (xhr.readyState != 4) return;
    updatePage(xhr);
  };

  xhr.open("POST", addCommentUrl, true);
  xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  let nameParam = "comment_text=" + itemTextValue;
  let postIdParam = "post_id=" + postId;
  xhr.send(
    nameParam + "&" + postIdParam + "&csrfmiddlewaretoken=" + getCSRFToken()
  );
}

/**
 * GENERATE UI
 */

function generateStreamComment(item) {
  let container = document.createElement("div");
  let card = document.createElement("div");
  card.setAttribute("class", "card border-success mb-3 rounded-lg");
  card.setAttribute("style", "width: 20rem;");
  container.setAttribute("class", "card-body");
  container.setAttribute("id", "id_comment_div_" + item.id);
  card.appendChild(container);

  // comment text
  let text = document.createElement("p");
  text.setAttribute("class", "text-secondary card-text");
  text.setAttribute("id", "id_comment_text_" + item.id);
  text.textContent = item.text;

  let hr = document.createElement("hr");
  hr.setAttribute("class", "my-4");

  // comment date
  let time = new Date(item.creation_time);
  let timeText =
    time.toLocaleDateString() +
    " " +
    time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  // comment user link
  let userLink = document.createElement("a");
  userLink.setAttribute("id", "id_comment_profile_" + item.id);
  userLink.setAttribute("class", "card-link");
  let hrefVal =
    item.user_id === item.current_user_id
      ? "/userprofile"
      : "/otherprofile/" + item.user_id;
  userLink.setAttribute("href", hrefVal);
  userLink.textContent = "Posted by " + item.user_full_name + " on " + timeText;

  container.appendChild(text);
  container.appendChild(hr);
  container.appendChild(userLink);

  return card;
}

function generateStreamPost(item) {
  let postContainer = document.createElement("div");
  postContainer.setAttribute("id", "id_post_div_" + item.id);
  postContainer.setAttribute("class", "card-body");

  let cardBody = document.createElement("div");

  // post header
  let postHeader = document.createElement("div");
  postHeader.setAttribute("class", "card-header");
  // post user link
  let userLink = document.createElement("a");
  userLink.setAttribute("id", "id_post_profile_" + item.id);
  userLink.setAttribute("class", "post_profile card-link");
  let hrefVal =
    item.user_id === item.current_user_id
      ? "/userprofile"
      : "/otherprofile/" + item.user_id;
  userLink.setAttribute("href", hrefVal);
  const penIcon = '<i class="bi bi-pen"></i>';
  userLink.innerHTML =
    penIcon + "<span> Post by " + item.user_full_name + "</span>";
  postHeader.appendChild(userLink);

  // post date
  let timeText = document.createElement("span");
  timeText.setAttribute("id", "id_post_date_time_" + item.id);
  timeText.setAttribute(
    "class",
    "post_date_time card-subtitle mb-2 text-muted"
  );
  let time = new Date(item.creation_time);
  timeText.textContent =
    " on " +
    time.toLocaleDateString() +
    " " +
    time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  postHeader.appendChild(timeText);

  // post title
  let postTitle = document.createElement("h5");
  postTitle.textContent =
    "Review on " + item.book_title + " by Author " + item.book_author;
  postTitle.setAttribute("class", "card-title ");
  cardBody.appendChild(postTitle);

  // post image
  let imageContainer = document.createElement("div");
  // imageContainer.setAttribute("class", "center__container");
  let postImage = document.createElement("img");
  console.log(item)
  postImage.setAttribute("src", "/book_cover/" + item.room_id);
  postImage.setAttribute("class", "img-thumbnail bottom__margin");
  postImage.setAttribute("style", "height: 300px;");
  imageContainer.appendChild(postImage);
  postContainer.appendChild(imageContainer);

  // post text
  let postText = document.createElement("blockquote");
  postText.setAttribute("class", "post_text card-text");
  postText.setAttribute("id", "id_post_text_" + item.id);
  postText.textContent = '"' + item.text + '"';
  postContainer.appendChild(postText);

  // post pdf
  let pdfLink = document.createElement("a");
  pdfLink.setAttribute("id", "id_post_pdf_link_" + item.id);
  pdfLink.setAttribute("class", "post_pdf_link card-link");
  let pdfHref = "/pdf/" + item.id;
  pdfLink.setAttribute("href", pdfHref);
  pdfLink.textContent = "Download notes ";
  /* <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-download" viewBox="0 0 16 16">
  <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
  <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
</svg> */
  let icon = document.createElement("svg");
  icon.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  icon.setAttribute("width", "16");
  icon.setAttribute("height", "16");
  icon.setAttribute("viewBox", "0 0 16 16");
  icon.setAttribute("class", "bi bi-book");
  icon.setAttribute("fill", "currentColor");
  let path1 = document.createElement("path");
  let path2 = document.createElement("path");
  path1.setAttribute(
    "d",
    "M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"
  );
  path2.setAttribute(
    "d",
    "M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"
  );
  icon.appendChild(path1);
  icon.appendChild(path2);
  pdfLink.appendChild(icon);

  // comment
  let commentForm = document.createElement("div");
  commentForm.setAttribute("class", "input-group");

  let input = document.createElement("textarea");
  input.setAttribute("type", "text");
  input.setAttribute("id", "id_comment_input_text_" + item.id);
  input.setAttribute("class", "form-control");

  let btn = document.createElement("button");
  btn.setAttribute("id", "id_comment_button_" + item.id);
  btn.setAttribute("class", "btn btn-light");
  btn.setAttribute("onclick", "addComment(" + item.id + ")");
  btn.textContent = "Comment";

  //commentForm.appendChild(label);
  commentForm.appendChild(input);
  commentForm.appendChild(btn);

  // put together in inner wrapper
  let commentCard = document.createElement("div");
  // commentCard.setAttribute("class", "card");

  let commentWrapper = document.createElement("div");
  commentWrapper.setAttribute("id", "id_indiv_comment_container_" + item.id);
  // commentWrapper.setAttribute("class", "card-body");
  commentCard.appendChild(commentWrapper);

  cardBody.setAttribute("id", "id_indiv_post_comment_container_" + item.id);
  cardBody.setAttribute("class", "card-body");
  cardBody.appendChild(postContainer);
  let hr1 = document.createElement("hr");
  cardBody.appendChild(hr1);
  cardBody.appendChild(commentForm);

  let footer = document.createElement("div");
  footer.setAttribute("class", "card-footer");
  footer.appendChild(pdfLink);

  let card = document.createElement("div");
  card.setAttribute("class", "card border-success mb-3");
  //card.setAttribute("style", "width: 65vw;");

  card.appendChild(postHeader);
  card.appendChild(cardBody);
  card.appendChild(footer);

  let row = document.createElement("div");
  row.setAttribute("class", "row");

  let col1 = document.createElement("div");
  col1.setAttribute("class", "col-8");
  col1.appendChild(card);

  let col2 = document.createElement("div");
  col2.setAttribute("class", "col-4");
  col2.appendChild(commentCard);

  row.appendChild(col1);
  row.appendChild(col2);

  let overallContainer = document.createElement("div");
  overallContainer.setAttribute("style", "width: 80vw;");
  overallContainer.appendChild(row);

  let hr = document.createElement("hr");
  hr.setAttribute("class", "my-4");

  overallContainer.appendChild(hr);

  return overallContainer;
}

/**
 * UTILITY
 */

function sanitize(s) {
  // Be sure to replace ampersand first
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getCSRFToken() {
  let cookies = document.cookie.split(";");
  for (let i = 0; i < cookies.length; i++) {
    let c = cookies[i].trim();
    if (c.startsWith("csrftoken=")) {
      return c.substring("csrftoken=".length, c.length);
    }
  }
  return "unknown";
}
