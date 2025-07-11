document.addEventListener('DOMContentLoaded', function() {

  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  load_mailbox('inbox');

  document.querySelector('#compose-form').addEventListener('submit', function(event) {
    event.preventDefault();
    send_email();
  });

});

function archive_email(id) {
  fetch(`/emails/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ archived: true })
  })
  .then(() => load_mailbox('inbox'))
  .catch(error => alert('Failed to archive email: ' + error));
}

function unarchive_email(id) {
  fetch(`/emails/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ archived: false })
  })
  .then(() => load_mailbox('archive'))
  .catch(error => alert('Failed to unarchive email: ' + error));
}

function send_email() {
  const recipient = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;

  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({ recipients: recipient, subject: subject, body: body })
  })
  .then(response => response.json())
  .then(result => {
    if (result.message) {
      load_mailbox('sent');
    } else {
      alert(result.error);
    }
  });
}

function compose_email() {
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(emails => {
      emails.forEach(email => {
        const email_div = document.createElement('div');
        email_div.className = 'email-instance';
        email_div.dataset.id = email.id;
        email_div.style.backgroundColor = email.read ? '#f1f3f4' : 'white';

        let actions = '';

        if (mailbox === 'inbox') {
          actions = `<button class="archive-button">Archive</button>`;
        } else if (mailbox === 'archive') {
          actions = `<button class="archive-button">Unarchive</button>`;
        }

        email_div.innerHTML = `
          <div class="email-header-top">
            <span class="email-sender">${email.sender}</span>
            <span class="email-timestamp">${email.timestamp}</span>
          </div>
          <div class="email-subject"><strong>${email.subject}</strong></div>
          <div class="email-body-preview">${email.body.slice(0, 50)}...</div>
          ${actions}
        `;

        if (mailbox === 'inbox') {
          email_div.querySelector('.archive-button').addEventListener('click', function(event) {
            event.stopPropagation();
            archive_email(email.id);
          });
        } else if (mailbox === 'archive') {
          email_div.querySelector('.archive-button').addEventListener('click', function(event) {
            event.stopPropagation();
            unarchive_email(email.id);
          });
        }

        email_div.addEventListener('click', function() {
          load_email(email.id);
        });

        document.querySelector('#emails-view').append(email_div);
      });
    });
}

function load_email(id) {
  fetch(`/emails/${id}`)
    .then(response => response.json())
    .then(email => {
      document.querySelector('#emails-view').innerHTML = `
        <div class="email-detail-card">
          <div class="email-detail-header">
            <p><strong>From:</strong> ${email.sender}</p>
            <p><strong>To:</strong> ${email.recipients.join(', ')}</p>
            <p><strong>Subject:</strong> ${email.subject}</p>
            <p class="email-detail-timestamp">${email.timestamp}</p>
          </div>
          <hr>
          <div class="email-detail-body">
            ${email.body.replace(/\n/g, '<br>')}
          </div>
          <button id="reply-button" class="reply-button">Reply</button>
        </div>
      `;

      document.querySelector('#reply-button').addEventListener('click', function() {
        compose_email();
        document.querySelector('#compose-recipients').value = email.sender;
        document.querySelector('#compose-subject').value = email.subject.startsWith('Re:') ? email.subject : 'Re: ' + email.subject;
        document.querySelector('#compose-body').value = `On ${email.timestamp}, ${email.sender} wrote:\n${email.body}\n\n${'-'.repeat(50)}\n\n\n`;
      });

      fetch(`/emails/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ read: true })
      });
    });
}
