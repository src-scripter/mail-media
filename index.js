const fs = require('fs');
const imapflow = require('imapflow');
const nodemailer = require('nodemailer');
const openpgp = require('openpgp');
const postal_mime = require('postal-mime');

// Step #1: Gather Information
console.log('Gathering information...');
const full_name = 'John Doe';
const email_username = 'your_email@example.com';
const email_password = 'your_email_password@example.com';
const pgp_password = 'thisisatest'; // For proof of concept.

// Step #2: Generate Keypair
console.log('Generating keypair...');
// RSA for simplicity. Change cipher on final product!!!
(async () => {
    const { privateKey, publicKey } = await openpgp.generateKey({
        type: 'rsa',
        rsaBits: 4096,
        userIDs: [{ name: full_name, email: email_username }],
        passphrase: pgp_password 
    });
})();

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
	constructor () {
		let provider = email_username.trim().split('@')[1].toLowerCase();
		if (!provider in email_providers) {
			throw new Error('Unsupported email address provided.');
		} else {
			this.host = email_providers['provider'];
		}
		this.port = 587;
		this.secure = true;
		this.auth_user = email_username;
		this.auth_password = email_password;
		this.public_key = publicKey;
		this.private_key = privateKey;
	}
}
const new_user = new email_settings();
console.log(`User Information: ${new_user}`);

// By this point, you'd choose where to store this newly generated user data.
// Step #4: Retrieve Data & Send Encrypted Test Email
console.log('Sending test email...')
const transporter = nodemailer.createTransport({
  host: new_user.host,
  port: new_user.port,
  secure: new_user.secure,
  auth: {
    user: new_user.auth_user,
    pass: new_user.auth_password,
  },
});

// Get Template Email
fs.readFile('./email_template.html', 'utf8', (err, data) => {
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
    subject: "NodeJS Mail Media Test Message",
    html: "",
  });
  console.log("Message sent:", message.messageId);
})();

// Step #5: Ensure Email Received + Data Parsable
console.log('Checking inbox...');
// Will need to add a waiter while mailbox receives message
console.log('Please wait while the program looks for and receives the test message.');
