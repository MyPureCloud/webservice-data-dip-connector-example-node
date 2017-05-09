# webservice-data-dip-connector-example-node

This project is an example node.js [Web Services Data Dip Connector](https://developer.mypurecloud.com/api/webservice-datadip/) integration web service that's used in the blog post: TBD

# Running the web service

1. Clone this repo: `git clone https://github.com/MyPureCloud/webservice-data-dip-connector-example-node.git`
2. `cd` to the repo's directory
3. Run `npm install` to install dependencies
4. Run `node app.js` to start the service at http://localhost:8080 (or your IP or hostname)

# Using the service

## WSDD Action Endpoints

### Standard action: POST /GetContactByPhoneNumber

This resource implements the standard WSDD contract for [POST /GetContactByPhoneNumber](https://developer.mypurecloud.com/api/webservice-datadip/service-contracts.html#GetContactByPhoneNumber). The action fulfils the request by normalizing phone numbers to digits only then searching through the list of contacts and returning the first contact with a matching phone number. If no contact is found, a 404 response with no body will be returned.

### Custom action: POST /searchContactsByName

This resource implements a custom WSDD action. This action fulfils the request by looking for a case-insensitive partial match based on the first or last name of the contact and optionally searching the `FullName` property.

Request schema:

```
{
  "$schema": "http://json-schema.org/draft-04/schema#",
  "title": "SearchRequest",
  "description": "A search request body",
  "type": "object",
  "properties": {
    "firstName": {
      "type": "string",
      "description": "The first name for which to search"
    },
    "lastName": {
      "type": "string",
      "description": "The last name for which to search"
    },
    "searchFullName": {
      "type": "boolean",
      "description": "[true] to search in the contact's FullName field"
    }
  },
  "additionalProperties": true
}
```

Request:

```
{
  "firstName": "Luke",
  "lastName": "Skywalker",
  "searchFullName": true
}
```

The response adheres to the same schema as the standard action [POST /GetContactByPhoneNumber](https://developer.mypurecloud.com/api/webservice-datadip/service-contracts.html#GetContactByPhoneNumber). If no contact is found, a 404 response with no body will be returned.


## Other Endpoints

These endpoints are not used by the bridge server, but illustrate adding additional methods to the integration service.

### POST /data/contacts

This resource adds or overwrites (like a PUT request) a contact. The contact will be added to the in-memory list as well as written to local storage (`./data/contacts.json`).

Request:

```
POST /data/contacts HTTP/1.1
Host: localhost:8080
Content-Type: application/json

{
  "Contact": {
    "EmailAddresses": {
      "EmailAddress": [
        {
          "EmailAddress": "test@test.com",
          "EmailType": 0
        }
      ]
    },
    "FirstName": "Test",
    "LastName": "Account",
    "FullName": "Account, Test",
    "Id": "1001",
    "PhoneNumbers": {
      "PhoneNumber": [
        {
          "Number": "1 (303) 555-1001",
          "PhoneType": 0
        }
      ]
    },
    "Address": {
      "City": "Denver",
      "Country": "USA",
      "Line1": "1000 Test St.",
      "Line2": "",
      "Line3": "",
      "PostalCode": "80014",
      "State": "CO",
      "Type": 0
    },
    "CustomAttribute": "silly"
  }
}
```

The response adheres to the same schema as the standard action [POST /GetContactByPhoneNumber](https://developer.mypurecloud.com/api/webservice-datadip/service-contracts.html#GetContactByPhoneNumber). 

### DELETE /data/contacts/{id}

This resource deletes the contact with the given ID supplied in the request path. The contact is removed from the in-memory list as well as deleted from local storage (`./data/contacts.json`).

Request:

```
DELETE /data/contacts/1001 HTTP/1.1
Host: localhost:8080
```

The response will be a 202 as long as no errors were encountered during processing.