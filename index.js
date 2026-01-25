const fs = require('fs');
const { ImapFlow } = require('imapflow');
const nodemailer = require('nodemailer');
const openpgp = require('openpgp');
console.log('This is a proof of concept for the mail media proposal.');

// Step #1: Gather Information
console.log('Gathering information...');
// In production, implement a more secure way of storing credentials.
const full_name = 'John Doe';
const email_username = 'your_email@example.com';
const email_password = 'your_email_password@example.com';
const pgp_password = 'thisisatest';

// Step #2: Generate Keypair
console.log('Generating keypair...');
// RSA for simplicity. Change cipher on final product!
(async () => {
    const { priKey, pubKey } = await openpgp.generateKey({
        type: 'rsa',
        rsaBits: 4096,
        userIDs: [{ name: full_name, email: email_username }],
        passphrase: pgp_password 
    });
    localStorage.setItem("testPub", pubKey);
    localStorage.setItem("testPri", priKey);
})();

// There are a lot more email providers out there. Make sure they support IMAP & SMTP connections.
const email_providers = {
	'gmail.com': 'smtp.gmail.com',
	'outlook.com': 'smtp-mail.outlook.com',
	'yahoo.com': 'smtp.mail.yahoo.com',
	'icloud.com': 'smtp.mail.me.com',
	'me.com': 'smtp.mail.me.com',
	'mac.com': 'smtp.mail.me.com'
};

// Step #3: Create Data for Storage & Usage
console.log('Creating data for storage & usage...');
class email_settings {
	constructor (user_address, user_password, pubKey, priKey) {
		let provider = user_address.trim().split('@')[1].toLowerCase();
		if (provider in email_providers) {
			this.host = email_providers['provider'];
		} else {
			throw new Error('Unsupported email address provided.');
		}
		this.SMTPport = 587;
		this.IMAPport = 993;
		this.secure = true;
		this.auth_user = user_address;
		this.auth_password = user_password;
		this.public_key = pubKey;
		this.private_key = priKey;
	}
}
const new_user = new email_settings(email_username, email_password, localStorage.getItem('testPub'), localStorage.getItem('testPri'));
console.log(`User Information: ${new_user}`);
// By this point, you'd choose where to store this newly generated user data.
localStorage.setItem('testuser', new_user);

// Step #4: Retrieve Data & Send Encrypted Test Email
localStorage.getItem('testuser');
console.log('Sending test email...')
const transporter = nodemailer.createTransport({
  host: new_user.host,
  port: new_user.SMTPport,
  secure: new_user.secure,
  auth: {
    user: new_user.auth_user,
    pass: new_user.auth_password,
  },
});

// Get Template Email
const email = fs.readFile('./email_template.html', 'utf8', (err, data) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log(data);
});

(async () => {
  const message = await transporter.sendMail({
    from: '"nodejsmailmedia@example.com"',
    to: new_user.auth_user,
    subject: 'NodeJS Mail Media Test Message',
    html: email,
  });
  console.log("Message sent:", message.messageId);
})();

// Step #5: Ensure Email Received + Data Parsable
const emailClient = new ImapFlow({
    host: new_user.host,
    port: new_user.IMAPport,
    secure: new_user.secure,
    auth: {
        user: new_user.auth_user,
        pass: new_user.auth_password
    },
    logger: false
});

async function inboxSession() {
	console.log('Checking inbox...');
	console.log('Please wait while the program looks for and receives the test message.');    
	await emailClient.connect();
    console.log('Connected!');

	let lock = await emailClient.getMailboxLock('INBOX');
	try {
		let searchedSubject = await emailClient.search({ subject: 'NodeJS Mail Media Test Message' }, { uid: true })
    	console.log('Email found!');
		console.log('Attempting retrieval...');
		let retrievedMessage = await emailClient.fetchOne(searchedSubject, { envelope: true, bodyStructure: true}, { uid: true });
		console.log('Email retrieved!');
		console.log(retrievedMessage.envelope);
	} catch (err) {
		console.log('Search & retrieval failed!');
		console.log(err);
		return;
	} finally {
  	  lock.release();
	}
}

inboxSession().catch(err => {
    console.error('Connection error:', err);
});
