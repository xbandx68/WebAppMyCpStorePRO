/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';
// Firebase App is always required and must be first
//var firebase = require("firebase/app");

// Add additional services you want to use
//require("firebase/auth");
//require("firebase/database");

// Shortcuts to DOM Elements.
var messageForm = document.getElementById('message-form');
var messageInput = document.getElementById('new-post-message');
var titleInput = document.getElementById('new-post-title');
var signInButton = document.getElementById('sign-in-button');
var signInGeneralButton = document.getElementById('classic-sign-in-form');
var emailInput = document.getElementById('email-input');
var passwordInput = document.getElementById('password-input');
var signOutButton = document.getElementById('sign-out-button');
var splashPage = document.getElementById('page-splash');

var homeSection = document.getElementById('home-list');
var previsionSection = document.getElementById('prevision-list');
var settingsSection = document.getElementById('settings-list');

var homeMenuButton = document.getElementById('menu-home');
var previsionMenuButton = document.getElementById('menu-prevision');
var settingsMenuButton = document.getElementById('menu-settings');

var listeningFirebaseRefs = [];
/**
 * The ID of the currently signed-in User. We keep track of this to detect Auth state change events that are just
 * programmatic token refresh but not a User status change.
 */
var currentUID;
var myUserId;

// Bindings on load.
console.log('Bindings on load')
window.addEventListener('load', function() {
  // Bind Sign in button.
  signInButton.addEventListener('click', function() {
    var provider = new firebase.auth.GoogleAuthProvider();
    console.log(provider);
    firebase.auth().signInWithPopup(provider);
  });

  // Bind Sign general email button.
  signInGeneralButton.onsubmit = function(e) {
    var email = emailInput.value;
    var password = passwordInput.value;
    console.log('Email:' + email + ' Password:' + password);
    firebase.auth().signInWithEmailAndPassword(email, password)
    .then(function(firebaseUser) {
        // Success
        console.log('Firebase Login Success!');
    })
    .catch(function(error) {
    // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        if (errorCode === 'auth/wrong-password') {
          alert('Wrong password.');
        } else {
          alert(errorMessage);
        }
        console.log('Firebase Login Error!:' + error);
    });
  };


  // Bind Sign out button.
  signOutButton.addEventListener('click', function() {
    firebase.auth().signOut().then(function() {
        // Sign-out successful.
        console.log('User Logged Out!');
      }).catch(function(error) {
        // An error happened.
        console.log(error);
      });
  });

  // Listen for auth state changes
  firebase.auth().onAuthStateChanged(onAuthStateChanged);

  // // Saves message on form submit.
  // messageForm.onsubmit = function(e) {
  //   e.preventDefault();
  //   var text = messageInput.value;
  //   var title = titleInput.value;
  //   if (text && title) {
  //     newPostForCurrentUser(title, text).then(function() {
  //       previsionMenuButton.click();
  //     });
  //     messageInput.value = '';
  //     titleInput.value = '';
  //   }
  // };

  // Bind menu buttons.
  homeMenuButton.onclick = function() {
    showSection(homeSection, homeMenuButton);
  };
  previsionMenuButton.onclick = function() {
    showSection(previsionSection, previsionMenuButton);
  };
  settingsMenuButton.onclick = function() {
    showSection(settingsSection, settingsMenuButton);
  };

  homeMenuButton.onclick();
}, false);


/**
 * Triggers every time there is a change in the Firebase auth state (i.e. user signed-in or user signed out).
 */
function onAuthStateChanged(user) {
  // We ignore token refresh events.
  if (user && currentUID === user.uid) {
    return;
  }
  console.log('user: ' + user);
  // User is signed in.
  var displayName = user.displayName;
  var email = user.email;
  var emailVerified = user.emailVerified;
  var photoURL = user.photoURL;
  var isAnonymous = user.isAnonymous;
  var uid = user.uid;
  // The user's ID, unique to the Firebase project. Do NOT use
  // this value to authenticate with your backend server, if
  // you have one. Use User.getToken() instead.
  var providerData = user.providerData;

  //myUserId = firebase.auth().currentUser.uid;
  console.log('Userid: ' + uid + ' DisplayName:' + displayName + " Email:" + email);

  cleanupUi();
  if (user) {
    currentUID = user.uid;
    splashPage.style.display = 'none';
    writeUserData(user.uid, user.displayName, user.email, user.photoURL);
    // fai la prima query per ricavare i dati
    startDatabaseQueries();
  } else {
    // No user is signed in.
    // Set currentUID to null.
    currentUID = null;
    // Display the splash page where you can sign-in.
    splashPage.style.display = '';
  }
}

/**
 * Cleanups the UI and removes all Firebase listeners.
 */
function cleanupUi() {
  // Remove all previously displayed posts.
  settingsSection.getElementsByClassName('posts-container')[0].innerHTML = '';
  homeSection.getElementsByClassName('posts-container')[0].innerHTML = '';
  previsionSection.getElementsByClassName('posts-container')[0].innerHTML = '';

  // Stop all currently listening Firebase listeners.
  listeningFirebaseRefs.forEach(function(ref) {
    ref.off();
  });
  listeningFirebaseRefs = [];
}

/**
 * Writes the user's data to the database.
 */
// [START basic_write]
function writeUserData(userId, name, email, imageUrl) {
  firebase.database().ref('users/' + userId).set({
    username: name,
    email: email,
    profile_picture : imageUrl
  });
}

/**
 * Starts listening for new posts and populates posts lists.
 */
function startDatabaseQueries() {
  // [START my_top_posts_query]
  var myUserId = firebase.auth().currentUser.uid;
  console.log('start - startDatabaseQueries');
  console.log('currentUser.uid:' + myUserId);
  var listShop = firebase.database().ref(myUserId).limitToLast(100);
  console.log('listShop:' + listShop);
  //console.log(JSON.stringify(payload))
  // [END my_top_posts_query]
  // [START recent_posts_query]
  //var recentPostsRef = firebase.database().ref('posts').limitToLast(100);
  // [END recent_posts_query]
  // var userPostsRef = firebase.database().ref('user-posts/' + myUserId);
  //
  var postsData;
   var fetchPosts = function(postsRef, sectionElement) {
     postsRef.on('value', function(snapshot) {
       postsData = snapshot.val();
       // lunghezza postData
       var lenPostData = Object.values(postsData).length;
       // ottengo i valori iniziali
       var shop1 = Object.keys(postsData)[0];
       var shop2 = Object.keys(postsData)[1];

       var lenCpShop1 = Object.values(postsData)[0].tb_cp.length;
       var nomeCpShop1 = Object.values(postsData)[0].tb_cp[0].name;
       var rowCount = Object.values(postsData)[0].tb_store.length;

       var shops = new Array();
       shops.push(["Shop", "id", "Conservatore", "Gusto", "PutAt", "GetAt"]);
       for (var i = 0; i < rowCount; i++) {
            var dataItem = Object.assign({}, Object.values(postsData)[0].tb_store[i]);
            if(dataItem.hasOwnProperty('get_at'))
              shops.push([nomeCpShop1, dataItem.id, dataItem.loc_cp, dataItem.nome, dataItem.put_at, dataItem.get_at]);
            else
              shops.push([nomeCpShop1, dataItem.id, dataItem.loc_cp, dataItem.nome, dataItem.put_at, "-"]);
        }

        //Create a HTML Table element.
       var table = document.createElement("TABLE");
       table.border = "1";

       //Get the count of columns.
       var columnCount = shops[0].length;

       //Add the header row.
       var row = table.insertRow(-1);
       for (var i = 0; i < columnCount; i++) {
           var headerCell = document.createElement("TH");
           headerCell.innerHTML = shops[0][i];
           row.appendChild(headerCell);
       }
       //Add the data rows.
       for (var i = 1; i < shops.length; i++) {
           row = table.insertRow(-1);
           for (var j = 0; j < columnCount; j++) {
               var cell = row.insertCell(-1);
               cell.innerHTML = shops[i][j];
           }
       }
       var dvTable = document.getElementById("dvTable");
       dvTable.innerHTML = "";
       dvTable.appendChild(table);
       //var containerElement = sectionElement.getElementsByClassName('table-container')[0];
    });

  //   postsRef.on('child_changed', function(data) {
  //     var containerElement = sectionElement.getElementsByClassName('posts-container')[0];
  //     var postElement = containerElement.getElementsByClassName('post-' + data.key)[0];
  //     postElement.getElementsByClassName('mdl-card__title-text')[0].innerText = data.val().title;
  //     postElement.getElementsByClassName('username')[0].innerText = data.val().author;
  //     postElement.getElementsByClassName('text')[0].innerText = data.val().body;
  //     postElement.getElementsByClassName('star-count')[0].innerText = data.val().starCount;
  //   });
  //   postsRef.on('child_removed', function(data) {
  //     var containerElement = sectionElement.getElementsByClassName('posts-container')[0];
  //     var post = containerElement.getElementsByClassName('post-' + data.key)[0];
  //     post.parentElement.removeChild(post);
     };

  // Fetching and displaying all posts of each sections.
  //fetchPosts(topUserPostsRef, settingsSection);
  fetchPosts(listShop, homeSection);
  //fetchPosts(userPostsRef, previsionSection);

  // Keep track of all Firebase refs we are listening to.
  //listeningFirebaseRefs.push(topUserPostsRef);
  listeningFirebaseRefs.push(listShop);
//listeningFirebaseRefs.push(userPostsRef);
}

function snapshotToArray(snapshot) {
    var returnArr = [];

    snapshot.forEach(function(childSnapshot) {
        var item = childSnapshot.val();
        item.key = childSnapshot.key;

        returnArr.push(item);
    });

    return returnArr;
};


function createHeaderElement() {

  var html =
    '<table class="table table-hover">'+
      '<thead>'+
        '<tr>'+
            '<th scope="col">Shop#</th>'+
            '<th scope="col">Prodotto</th>'+
            '<th scope="col">Quantità</th>'+
        '</tr>'+
      '</thead>';

  // Create the DOM element from the HTML.
  var div = document.createElement('div');
  div.innerHTML = html;
  var postElement = div.firstChild;
  if (componentHandler) {
    componentHandler.upgradeElements(postElement.getElementsByClassName('mdl-textfield')[0]);
  }

  return postElement;
}



// [END basic_write]
function createTableElement(postId, title, text, authorId, authorPic) {
  var uid = firebase.auth().currentUser.uid;

  var html =
      '<tbody>'+
        '<tr>'+
          '<th class="shop_name" scope="row">1</th>'+
          '<td class="flavors_name">gusto</td>'+
          '<td class="flavors_qta">quantità</td>'+
          '</tr>'+
      '</tbody>'+
    '</table>';

  // Create the DOM element from the HTML.
  var div = document.createElement('div');
  div.innerHTML = html;
  var postElement = div.firstChild;
  if (componentHandler) {
    componentHandler.upgradeElements(postElement.getElementsByClassName('mdl-textfield')[0]);
  }

  var nameShop = postElement.getElementsByClassName('shop_name')[0];
  var nameFlavors = postElement.getElementsByClassName('flavors_name')[0];
  var qtaFlavors = postElement.getElementsByClassName('flavors_qta')[0];

  // Set values.
  postElement.getElementsByClassName('shop_name')[0].innerText = text;

  // Listen for comments.
  // [START child_event_listener_recycler]
  // var commentsRef = firebase.database().ref('post-comments/' + postId);
  // commentsRef.on('child_added', function(data) {
  //   addCommentElement(postElement, data.key, data.val().text, data.val().author);
  // });
  //
  // commentsRef.on('child_changed', function(data) {
  //   setCommentValues(postElement, data.key, data.val().text, data.val().author);
  // });
  //
  // commentsRef.on('child_removed', function(data) {
  //   deleteComment(postElement, data.key);
  // });
  // [END child_event_listener_recycler]

  // Listen for likes counts.
  // [START post_value_event_listener]
//  var starCountRef = firebase.database().ref('posts/' + postId + '/starCount');
//  starCountRef.on('value', function(snapshot) {
//    updateStarCount(postElement, snapshot.val());
//  });
  // [END post_value_event_listener]

  // Listen for the starred status.
//  var starredStatusRef = firebase.database().ref('posts/' + postId + '/stars/' + uid);
//  starredStatusRef.on('value', function(snapshot) {
//    updateStarredByCurrentUser(postElement, snapshot.val());
//  });

  // Keep track of all Firebase reference on which we are listening.
//  listeningFirebaseRefs.push(commentsRef);
//  listeningFirebaseRefs.push(starCountRef);
//  listeningFirebaseRefs.push(starredStatusRef);

  // Create new comment.
  // addCommentForm.onsubmit = function(e) {
  //   e.preventDefault();
  //   createNewComment(postId, firebase.auth().currentUser.displayName, uid, commentInput.value);
  //   commentInput.value = '';
  //   commentInput.parentElement.MaterialTextfield.boundUpdateClassesHandler();
  // };

  // Bind starring action.
  // var onStarClicked = function() {
  //   var globalPostRef = firebase.database().ref('/posts/' + postId);
  //   var userPostRef = firebase.database().ref('/user-posts/' + authorId + '/' + postId);
  //   toggleStar(globalPostRef, uid);
  //   toggleStar(userPostRef, uid);
  // };
  // unStar.onclick = onStarClicked;
  // star.onclick = onStarClicked;

  return postElement;
}





/**
 * Displays the given section element and changes styling of the given button.
 */
function showSection(sectionElement, buttonElement) {
  homeSection.style.display = 'none';
  previsionSection.style.display = 'none';
  settingsSection.style.display = 'none';

  homeMenuButton.classList.remove('is-active');
  previsionMenuButton.classList.remove('is-active');
  settingsMenuButton.classList.remove('is-active');

  if (sectionElement) {
    sectionElement.style.display = 'block';
  }
  if (buttonElement) {
    buttonElement.classList.add('is-active');
  }
}



/**
 * Writes a new comment for the given post.
 */
function createNewComment(postId, username, uid, text) {
  firebase.database().ref('post-comments/' + postId).push({
    text: text,
    author: username,
    uid: uid
  });
}

/**
 * Creates a new post for the current user.
 */
function newPostForCurrentUser(title, text) {
  // [START single_value_read]
  // var userId = firebase.auth().currentUser.uid;
  // return firebase.database().ref('/users/' + userId).once('value').then(function(snapshot) {
  //   var username = (snapshot.val() && snapshot.val().username) || 'Anonymous';
  //   // [START_EXCLUDE]
  //   return writeNewPost(firebase.auth().currentUser.uid, username,
  //     firebase.auth().currentUser.photoURL,title, text);
  //   // [END_EXCLUDE]
  // });
  // [END single_value_read]
}

/**
 * Saves a new post to the Firebase DB.
 */
// [START write_fan_out]
// function writeNewPost(uid, username, picture, title, body) {
//   // A post entry.
//   var postData = {
//     author: username,
//     uid: uid,
//     body: body,
//     title: title,
//     starCount: 0,
//     authorPic: picture
//   };
//
//   // Get a key for a new Post.
//   var newPostKey = firebase.database().ref().child('posts').push().key;
//   console.log(newPostKey);
//
//   // Write the new post's data simultaneously in the posts list and the user's post list.
//   var updates = {};
//   updates['/posts/' + newPostKey] = postData;
//   updates['/user-posts/' + uid + '/' + newPostKey] = postData;
//
//   return firebase.database().ref().update(updates);
// }
// [END write_fan_out]

/**
 * Star/unstar post.
 */
// [START post_stars_transaction]
// function toggleStar(postRef, uid) {
//   postRef.transaction(function(post) {
//     if (post) {
//       if (post.stars && post.stars[uid]) {
//         post.starCount--;
//         post.stars[uid] = null;
//       } else {
//         post.starCount++;
//         if (!post.stars) {
//           post.stars = {};
//         }
//         post.stars[uid] = true;
//       }
//     }
//     return post;
//   });
// }
// [END post_stars_transaction]

/**
 * Creates a post element.
 */


/**
 * Updates the starred status of the post.
 */
// function updateStarredByCurrentUser(postElement, starred) {
//   if (starred) {
//     postElement.getElementsByClassName('starred')[0].style.display = 'inline-block';
//     postElement.getElementsByClassName('not-starred')[0].style.display = 'none';
//   } else {
//     postElement.getElementsByClassName('starred')[0].style.display = 'none';
//     postElement.getElementsByClassName('not-starred')[0].style.display = 'inline-block';
//   }
// }

/**
 * Updates the number of stars displayed for a post.
 */
// function updateStarCount(postElement, nbStart) {
//   postElement.getElementsByClassName('star-count')[0].innerText = nbStart;
// }

/**
 * Creates a comment element and adds it to the given postElement.
 */
// function addCommentElement(postElement, id, text, author) {
//   var comment = document.createElement('div');
//   comment.classList.add('comment-' + id);
//   comment.innerHTML = '<span class="username"></span><span class="comment"></span>';
//   comment.getElementsByClassName('comment')[0].innerText = text;
//   comment.getElementsByClassName('username')[0].innerText = author || 'Anonymous';
//
//   var commentsContainer = postElement.getElementsByClassName('comments-container')[0];
//   commentsContainer.appendChild(comment);
// }

/**
 * Sets the comment's values in the given postElement.
 */
// function setCommentValues(postElement, id, text, author) {
//   var comment = postElement.getElementsByClassName('comment-' + id)[0];
//   comment.getElementsByClassName('comment')[0].innerText = text;
//   comment.getElementsByClassName('fp-username')[0].innerText = author;
// }

/**
 * Deletes the comment of the given ID in the given postElement.
 */
// function deleteComment(postElement, id) {
//   var comment = postElement.getElementsByClassName('comment-' + id)[0];
//   comment.parentElement.removeChild(comment);
// }
