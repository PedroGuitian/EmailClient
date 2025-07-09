document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');

  // Add event listener for the compose button
  document.querySelector('#compose-form').addEventListener('submit', function(event) {
    event.preventDefault();
    send_email();
  });

});
function archive_email (id) {
  //Archive the email
  fetch(`/emails/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      archived: true
    })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.text().then(text => text ? JSON.parse(text) : {});
  })
  .then(result => {
    load_mailbox('inbox');
  })
  .catch(error => {
    console.log('Error:', error);
    alert('Failed to archive email');
  })
}
function unarchive_email (id) {
  //Archive the email
  fetch(`/emails/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      archived: false
    })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.text().then(text => text ? JSON.parse(text) : {});
  })
  .then(result => {
    load_mailbox('archive');
  })
  .catch(error => {
    console.log('Error:', error);
    alert('Failed to archive email');
  })
}
function send_email(){
  // get values
  const recipient = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;

  // Sent email usint post
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: recipient,
      subject: subject,
      body: body
    })
  })
  .then(response => response.json())
  .then(result => {
    if (result.message){
      console.log(result.message);
      load_mailbox('sent');
    }
    else {
      alert(result.error);
    }
  })
}

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  document.querySelector('#emails-view').innerHTML = '';

  // Fetch emails for the apropriate mailbox
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    // Show the mailbox name
    document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
    // Show emails
    emails.forEach(email => {
      new_email_instance = document.createElement('div');
      new_email_instance.className = 'email-instance';
      new_email_instance.dataset.id = email.id;
      // Add a background color based on read status
      if (email.read) {
        new_email_instance.style.backgroundColor = 'lightgray';
      }
      else {
        new_email_instance.style.backgroundColor = 'white';
      }
      //Sender, subject line, and timestamp
      if (mailbox === 'inbox') {
        new_email_instance.innerHTML = `
          <div class="inbox-email-header">
            <h3>${email.sender}</h3>
            <button class="archive-button">Archive</button>
          </div>
          <h5>Subject: ${email.subject}</h5>
          <p>${email.timestamp}</p>
          `;
        // Archive event
        const archive_button = new_email_instance.querySelector('.archive-button');
          archive_button.addEventListener('click', function(event) {
          event.stopPropagation();
          archive_email(email.id);
      })
      }
      else if (mailbox === 'archive') {
        new_email_instance.innerHTML = `
          <div class="inbox-email-header">
            <h3>${email.sender}</h3>
            <button class="archive-button">Unarchive</button>
          </div>
          <h5>Subject: ${email.subject}</h5>
          <p>${email.timestamp}</p>
          `;
          // Archive event
        const unarchive_button = new_email_instance.querySelector('.archive-button');
        unarchive_button.addEventListener('click', function(event) {
        event.stopPropagation();
        unarchive_email(email.id);
      })
      }
      else {
        new_email_instance.innerHTML = `
          <div class="inbox-email-header">
            <h3>${email.sender}</h3>
          </div>
          <h5>Subject: ${email.subject}</h5>
          <p>${email.timestamp}</p>
          `;
      }

      document.querySelector('#emails-view').append(new_email_instance);
    })
    // Add click event to each email instance
    document.querySelectorAll('.email-instance').forEach(email_instance => {
      email_instance.addEventListener('click', function() {
        // Get the id of the email from the data attribute
        const email_id = email_instance.getAttribute('data-id');
        // Load the email
        load_email(email_id);
      })
    })
  })
}

function load_email(id) {

  //Get the email by its id
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {
    document.querySelector('#emails-view').style.display = 'block';
    document.querySelector('#compose-view').style.display = 'none';
    
    //Show email details
    document.querySelector('#emails-view').innerHTML = '<h3> From: ' + email.sender + '<h3>'
    + '<h3> To: ' + email.recipients.join(', ') + '<h3>'
    + '<h3> Subject: ' + email.subject + '<h3>'
    + '<p> ' + email.timestamp + ' </p>'
    + '<p> ' + email.body + ' </p>'
    + '<button id="reply-button">Reply</button>';
    // Reply button event listener
    const reply_button = document.querySelector('#reply-button');
    reply_button.addEventListener('click', function() {
      // Display compose view
      compose_email();
      // Prefil form values
      document.querySelector('#compose-recipients').value = email.sender;
      if (email.subject.startsWith('Re:')) {
        document.querySelector('#compose-subject').value = email.subject;
      }
      else {
        document.querySelector('#compose-subject').value = 'Re: ' + email.subject;
      }
      document.querySelector('#compose-body').value = 'On ' + email.timestamp + ', ' + email.sender + ' wrote:\n' + email.body + '\n\n';
    })
    // Mark email as read
    fetch(`/emails/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        read: true
      })
    })
  })
}