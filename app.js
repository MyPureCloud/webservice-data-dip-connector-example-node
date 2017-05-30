const app = require('express')();
const bodyParser = require('body-parser');
const fs = require('fs-extra');
const _ = require('lodash');

const CONTACTS_PATH = './data/contacts.json';

// App setup
app.use(bodyParser.json());
var contacts = {};

var server = app.listen(8080, function () {
	// Load contacts from disk
	contacts = require(CONTACTS_PATH);
	console.log(`Loaded ${_.keys(contacts).length} contacts`);

	console.log("WSDD app listening at http://%s:%s", server.address().address, server.address().port);
});



/* Standard WSDD methods */

app.post('/GetContactByPhoneNumber', function (req, res) {
	try {
		logStartRequest(req);

		// Normalize input
		var targetPhone = normalizePhoneNumber(req.body.PhoneNumber);
		console.log(`PhoneNumber=${targetPhone}`);

		// Find the requested data
		var contact = _.find(contacts, function(c) {
			if (!c) return false;

			var match = _.find(c.Contact.PhoneNumbers.PhoneNumber, function(phoneNumber) {
				var haystack = normalizePhoneNumber(phoneNumber.Number);
				console.log(`haystack=${haystack}`);
				return haystack === targetPhone;
			});
			return match !== undefined;
		});

		// Return result
		if (contact) {
			console.log('Response: 200');
			res.status(200).send(contact);
		} else {
			console.log('Response: 404');
			res.status(404).end();
		}
	} catch (e) {
		console.log(e);
		console.log('Response: 500');
		res.status(500).send(e.message);
	}
});



/* Custom WSDD methods */

app.post('/searchContactsByName', function (req, res) {
	try {
		logStartRequest(req);

		// Normalize input
		var firstName = normalizeContactName(req.body.firstName);
		var lastName = normalizeContactName(req.body.lastName);
		var searchFullName = req.body.searchFullName === true;
		console.log(`firstName=${firstName}`);
		console.log(`lastName=${lastName}`);
		console.log(`searchFullName=${searchFullName}`);

		// Find the requested data
		var contact = _.find(contacts, function(c) {
			if (!c) return false;

			var firstNameMatch = c.Contact.FirstName !== undefined && normalizeContactName(c.Contact.FirstName).includes(firstName);
			var lastNameMatch = c.Contact.LastName !== undefined && normalizeContactName(c.Contact.LastName).includes(lastName);
			var fullNameMatch = searchFullName === true && c.Contact.FirstName !== undefined && 
				(normalizeContactName(c.Contact.FullName).includes(firstName) || 
				normalizeContactName(c.Contact.FullName).includes(firstName));
			
			return firstNameMatch || lastNameMatch || fullNameMatch;
		});

		// Return result
		if (contact) {
			console.log('Response: 200');
			res.status(200).send(contact);
		} else {
			console.log('Response: 404');
			res.status(404).end();
		}
	} catch (e) {
		console.log(e);
		console.log('Response: 500');
		res.status(500).send(e.message);
	}
});



/* Manual use API methods */

app.post('/data/contacts', function (req, res) {
	try {
		logStartRequest(req);

		// Do some basic validation. This doesn't fully validate the schema, so don't mess up your request body!
		if (!req.body.Contact)
			return res.status(400).send('Contact cannot be empty');
		if (!req.body.Contact.EmailAddresses)
			return res.status(400).send('Contact.EmailAddresses cannot be empty');
		if (!req.body.Contact.EmailAddresses.EmailAddress)
			return res.status(400).send('Contact.EmailAddresses.EmailAddress cannot be empty');
		if (req.body.Contact.EmailAddresses.EmailAddress === 0)
			return res.status(400).send('Contact.EmailAddresses.EmailAddress must have at least one member');
		if (!req.body.Contact.FirstName)
			return res.status(400).send('Contact.FirstName cannot be empty');
		if (!req.body.Contact.LastName)
			return res.status(400).send('Contact.LastName cannot be empty');
		if (!req.body.Contact.FullName)
			return res.status(400).send('Contact.FullName cannot be empty');
		if (!req.body.Contact.Id)
			return res.status(400).send('Contact.Id cannot be empty');
		if (!req.body.Contact.PhoneNumbers)
			return res.status(400).send('Contact.PhoneNumbers cannot be empty');
		if (!req.body.Contact.PhoneNumbers.PhoneNumber)
			return res.status(400).send('Contact.PhoneNumbers.PhoneNumber cannot be empty');
		if (req.body.Contact.PhoneNumbers.PhoneNumber.length === 0)
			return res.status(400).send('Contact.PhoneNumbers.PhoneNumber must have at least one member');
		if (!req.body.Contact.Address)
			return res.status(400).send('Contact.Address cannot be empty');

		// Add contact to in-memory list
		if (contacts[req.body.Contact.Id])
			console.log(`Contact ID ${req.body.Contact.Id} already exists, overwriting`);
		contacts[req.body.Contact.Id] = req.body;
		console.log(`Added contact ${req.body.Contact.Id}: ${req.body.Contact.LastName}, ${req.body.Contact.FirstName} "${req.body.Contact.FullName}"`);
		console.log(`Contact count is now ${_.keys(contacts).length}`);

		// Save to disk
		saveContacts();

		// Return result
		console.log('Response: 200');
		res.status(200).send(contacts[req.body.Contact.Id]);
	} catch (e) {
		console.log(e);
		console.log('Response: 500');
		res.status(500).send(e.message);
	}
});

app.delete('/data/contacts/:id', function (req, res) {
	try {
		logStartRequest(req);

		console.log(`id=${req.params.id}`);
		contacts[req.params.id] = undefined;
		saveContacts();

		console.log('Response: 200');
		res.status(200).end();
	} catch (e) {
		console.log(e);
		console.log('Response: 500');
		res.status(500).send(e.message);
	}
});



/* DATA ACCESS FUNCTIONS */

function saveContacts() {
	fs.outputFileSync(CONTACTS_PATH, JSON.stringify(contacts, null, 2));
}



/* HELPER FUNCTIONS */

function logStartRequest(req) {
	console.log(`\n=== ${req.method} ${req.path} ===`);
	console.log((new Date()).toString());
	if (req.body && Object.keys(req.body).length !== 0 && req.body.constructor !== Object)
		console.log(`body: ${JSON.stringify(req.body, null, 2)}`);
}

function normalizePhoneNumber(phoneNumber) {
	return phoneNumber.replace(/[^0-9]/gi, '');
}

function normalizeContactName(name) {
	return name === undefined ? undefined : name.toLowerCase();
}
