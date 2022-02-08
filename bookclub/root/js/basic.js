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
    displayError(response.error);
    return;
  }

  displayError(response);
}

function displayError(message) {
  /*
  let errorElement = document.getElementById("error");
  errorElement.innerHTML = message; */
  console.log("Error happened", message);
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
  container.setAttribute("class", "indiv_comment_container");
  container.setAttribute("id", "id_comment_div_" + item.id);

  // comment text
  let text = document.createElement("span");
  text.setAttribute("class", "comment_text");
  text.setAttribute("id", "id_comment_text_" + item.id);
  text.textContent = item.text;

  // comment date
  let timeText = document.createElement("span");
  timeText.setAttribute("id", "id_comment_date_time_" + item.id);
  timeText.setAttribute("class", "comment_date_time");
  let time = new Date(item.creation_time);
  timeText.textContent =
    time.toLocaleDateString() +
    " " +
    time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  // comment user link
  let userLink = document.createElement("a");
  userLink.setAttribute("id", "id_comment_profile_" + item.id);
  userLink.setAttribute("class", "comment_profile");
  let hrefVal =
    item.user_id === item.current_user_id
      ? "/userprofile"
      : "/otherprofile/" + item.user_id;
  userLink.setAttribute("href", hrefVal);
  userLink.textContent = item.user_full_name;

  container.appendChild(text);
  container.appendChild(timeText);
  container.appendChild(userLink);

  return container;
}

function generateStreamPost(item) {
  let postContainer = document.createElement("div");
  postContainer.setAttribute("id", "id_post_div_" + item.id);

  // post text
  let postText = document.createElement("span");
  postText.setAttribute("class", "post_text");
  postText.setAttribute("id", "id_post_text_" + item.id);
  postText.textContent = item.text;

  // post date
  let timeText = document.createElement("span");
  timeText.setAttribute("id", "id_post_date_time_" + item.id);
  timeText.setAttribute("class", "post_date_time");
  let time = new Date(item.creation_time);
  timeText.textContent =
    time.toLocaleDateString() +
    " " +
    time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  // post user link
  let userLink = document.createElement("a");
  userLink.setAttribute("id", "id_post_profile_" + item.id);
  userLink.setAttribute("class", "post_profile");
  let hrefVal =
    item.user_id === item.current_user_id
      ? "/userprofile"
      : "/otherprofile/" + item.user_id;
  userLink.setAttribute("href", hrefVal);
  userLink.textContent = "Post by " + item.user_full_name;

  // post pdf
  // <p><a href="{{ file }}" download>{{ file.name }}</a></p>
  let pdfLink = document.createElement("a");
  pdfLink.setAttribute("id", "id_post_pdf_link_" + item.id);
  pdfLink.setAttribute("class", "post_pdf_link");
  let pdfHref = "/pdf/" + item.id;
  pdfLink.setAttribute("href", pdfHref);
  pdfLink.textContent = "Download notes pdf";

  postContainer.appendChild(postText);
  postContainer.appendChild(timeText);
  postContainer.appendChild(userLink);
  postContainer.appendChild(pdfLink);

  // comment
  let commentForm = document.createElement("div");
  commentForm.setAttribute("class", "indiv_comment_form");

  let label = document.createElement("label");
  label.textContent = "Comment: ";

  let input = document.createElement("input");
  input.setAttribute("type", "text");
  input.setAttribute("id", "id_comment_input_text_" + item.id);

  let btn = document.createElement("button");
  btn.setAttribute("id", "id_comment_button_" + item.id);
  btn.setAttribute("onclick", "addComment(" + item.id + ")");
  btn.textContent = "Submit";

  commentForm.appendChild(label);
  commentForm.appendChild(input);
  commentForm.appendChild(btn);

  // put together in inner wrapper
  let container = document.createElement("div");
  let commentContainer = document.createElement("div");
  commentContainer.setAttribute("id", "id_indiv_comment_container_" + item.id);
  commentContainer.appendChild(commentForm);
  container.setAttribute("id", "id_indiv_post_comment_container_" + item.id);
  container.setAttribute("class", "indiv_post_comment_container row");
  container.appendChild(postContainer);
  container.appendChild(commentContainer);

  commentContainer.setAttribute(
    "class",
    "indiv_comment_container column right"
  );
  postContainer.setAttribute("class", "indiv_post_container column left");
  return container;
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
