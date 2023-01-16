import './scss/style.scss';
import config from './db_config.js';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  deleteDoc,
  Timestamp,
  query,
  orderBy,
  getDocs,
  onSnapshot,
  documentId,
  doc,
  updateDoc
} from 'firebase/firestore';
import scrollIntoView from 'scroll-into-view-if-needed';

const app = initializeApp(config);

const db = getFirestore(app);

/**
 * sends the message to the database
 * @param {object} message the message to send
 */
async function sendMessage(message) {
  const docRef = await addDoc(collection(db, 'messages'), message);
  console.log('Document written with ID: ', docRef.id);
}

function createMessage() {
  const message = document.querySelector('#message').value;
  const username = document.querySelector('#nickname').value;
  const tstamp = Timestamp.now().toDate();
  const date = tstamp.toLocaleString('hu-HU');
  return { message, username, date };
}

/**
 * downloads all messages from the database and displays them ordered by date
 */
async function displayAllMessages() {
  const q = query(collection(db, 'messages'), orderBy('date', 'asc'));
  const messages = await getDocs(q);
  document.querySelector('#messages').innerHTML = '';
  messages.forEach((doc) => {
    displayMessage(doc.data(), doc.id);
  });
}

function displayMessage(message, id) {
  const messageHTML = /*html*/ `
  <div class="message" data-id="${id}">
       <i class="fas fa-user"></i>
      <div>
        <span class="username">${message.username}
        <time>${message.date}</time>
        </span>
        <br>
        <span class="message-text">
          ${message.message}
        </span>
      </div>
      <div class="message-edit-buttons">
        <i class="fas fa-trash-alt"></i>
        <i class="fas fa-pen"></i>
      </div>
    </div>
  `;
  document.querySelector('#messages').insertAdjacentHTML('beforeend', messageHTML);
  scrollIntoView(document.querySelector('#messages'), {
    scrollMode: 'if-needed',
    block: 'end'
  });
  document
    .querySelector(`[data-id="${id}"] .fa-trash-alt`)
    .addEventListener('click', () => {
      deleteMessage(id);
      console.log('remove listener added for: ', id);
    });
  document.querySelector(`[data-id="${id}"] .fa-pen`).addEventListener('click', () => {
    displayEditMessage(id);
    console.log('edit listener added for: ', id);
  });
}

function displayEditMessage(id) {
  const editPopupHTML = /*html*/ `
    <div class="popup-container" id="popup">
      <div class="edit-message" id="edit-message" data-id="${id}">
        <div id="close-popup" class="button">
          Close <i class="fa fa-window-close" aria-hidden="true"></i>
        </div>
        <textarea id="edit" name="" cols="30" rows="10">${document
          .querySelector(`.message[data-id="${id}"] .message-text`)
          .textContent.trim()}</textarea>
        <div id="save-message" class="button">
          Save message<i class="fas fa-save"></i>
        </div>
      </div>
    </div>
`;
  document.querySelector('#messages').insertAdjacentHTML('beforeend', editPopupHTML);
  scrollIntoView(document.querySelector('#messages'), {
    scrollMode: 'if-needed',
    block: 'end'
  });
  document.querySelector(`#close-popup`).addEventListener('click', () => {
    const element = document.getElementById('popup');
    element.remove();
  });
  document.querySelector(`#save-message`).addEventListener('click', () => {
    console.log('saving edit');
    modifyMessage();
    const element = document.getElementById('popup');
    element.remove();
  });
}

async function modifyMessage() {
  const id = document.querySelector('#edit-message').dataset.id;
  var newMessage = document.querySelector(`#edit`).value;
  // console.log(id, newMessage);
  document.querySelector(`.message[data-id="${id}"] .message-text`).textContent =
    newMessage;
  const docRef = doc(db, 'messages', id);
  await updateDoc(docRef, { message: newMessage });
  console.log('Document updated with ID: ', id, 'to: ', newMessage);
}

function removeMessage(id) {
  const input = document.querySelector(`.message[data-id="${id}"]`);
  console.log('removeMessage: ', input);
  input.remove();
}

async function deleteMessage(id) {
  console.log('deleteclick', id);
  const docRef = doc(db, 'messages', id);
  await deleteDoc(docRef);
  console.log('Document deleted with ID: ', docRef.id);
  removeMessage(id);
}

function handleSubmit() {
  const message = createMessage();
  sendMessage(message);
  //displayMessage(message);
}

document.querySelector('#send').addEventListener('click', handleSubmit);

// send the message if the enter key is pressed
document.addEventListener('keyup', (event) => {
  if (event.key === 'Enter') {
    handleSubmit();
  }
});

window.addEventListener('DOMContentLoaded', () => {
  // the document is fully loaded
  displayAllMessages();
});

// document.querySelector('#messages').innerHTML = '';

let initialLoad = true;

const q = query(collection(db, 'messages'), orderBy('date', 'asc'));
onSnapshot(q, (snapshot) => {
  snapshot.docChanges().forEach((change) => {
    if (change.type === 'added') {
      console.log('added');
      if (!initialLoad) {
        displayMessage(change.doc.data());
      }
    }
    if (change.type === 'modified') {
      console.log('Modified');
    }
    if (change.type === 'removed') {
      console.log('Removed');
    }
  });
  initialLoad = false;
});
