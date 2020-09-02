+++
date = 2020-09-01T18:30:00Z
draft = true
image_upload = ""
layout = "post"
permalink = "dynamodb-cheetsheat-nodejs-javascript"
tags = ["database", "dynamodb", "serverless", "aws"]
title = "DynamoDB CheatSheet For NodeJS/JavaScript"

+++
Amazon DynamoDB is a fully managed NoSQL database service that provides fast and predictable performance with seamless scalability. DynamoDB lets you offload the administrative burdens of operating and scaling a distributed database so that you don't have to worry about hardware provisioning, setup, and configuration, replication, software patching, or cluster scaling. DynamoDB also offers encryption at rest, which eliminates the operational burden and complexity involved in protecting sensitive data.

This cheat sheet will cover the most commonly used scenarios of data operations in DynamoDB with AWS DynamoDB Document client for JavaScript/Nodejs. The DynamoDB Document Client is the easiest and most preferred way to interact with a DynamoDB database from a Nodejs or JavaScript application.

## GETTING STARTED

#### Install

`npm install aws-sdk`

#### Configure

```js
const AWS = require('aws-sdk')

const ddb = new AWS.DynamoDB.DocumentClient()
```

#### CREATE ITEM

Let's create a new item for the new user. This user will have one album and one image in the album.

```js
async function createItem (buildInfo) {
  console.log('Creating new item')
  let params = {
    TableName: tableName,
    Item: {
      'userId': 'johnDoe',
      'createdAt': 1598362623,
      'updatedAt': 1598362623,
      'albums': {
         'album1': {
            'id': 'album-kjuijhs342',
            'createdAt': 1598362623,
            'updatedAt': 1598362623,
            'description': 'My First Album',
            'Title': 'Holidays',
            'images': {
               'img-1': {
                  'filename': 'johndoe/album1/e8TtkC5xyv4.jpg',
                  's3Url': 's3://photo-bucket/johndoe/album1/e8TtkC5xyv4.jpg',
                  'tags': ['nature', 'animals']
                }
            }
         }
      }
    }
  }
  try {
    await ddb.put(params).promise()
  } catch (error) {
    console.log(error)
  }
}
```

#### SCAN

Scan and returns all items in a table

```js
async function scan() {
  let params = {
    TableName: tableName
  }

  try {
    let x = await ddb.scan(params).promise()
    console.log(x)
  } catch (error) {
    console.error(error)
  }
}
```

#### GET ITEM

Get a single item from the table

```js
async function getItem() {
  var params = {
    TableName: tableName,
    Key: {
      'userId': 'johnDoe'
    }
  }

  try {
    let res = await ddb.get(params).promise()
    console.log(res)
  } catch (error) {
    console.error(error)
  }

}
```

#### GET ONLY SOME DATA FROM AN ITEM

this will return only the tags from img1 and img2 in the result.

```js
async function getSome() {
  var params = {
    TableName: tableName,
    ProjectionExpression: `albums.album1.images.#imageName1.tags, albums.album1.images.#imageName2.tags`,
    ExpressionAttributeNames: {
      '#imageName1': 'img-1',
      '#imageName2': 'img-2'
    },
    Key: {
      'userId': 'johnDoe',
    }
  }

  try {
    let result = await ddb.get(params).promise()
    console.log(JSON.stringify(result))
  } catch (error) {
    console.error(error)
  }
}
```

#### DELETE ITEM

deletes a single item from the table

```js
async function deleteItem () {
  let params = {
    TableName: tableName,
     Key: {
       userId: 'johnDoe',
     }
  }

  try {
    await ddb.delete(params).promise()
  } catch (error) {
    console.error(error)
  }
}
```

#### QUERY

Query an item from a table

```js
async function query () {
  let params = {
    TableName: tableName,
    KeyConditionExpression: 'userId = :id ',
    ExpressionAttributeValues: { ':id': 'johnDoe' }
  }

  try {
    let result = await ddb.query(params).promise()
    console.log(result)
  } catch (error) {
    console.error(error)
  }
}
```

#### UPDATE A TOP-LEVEL ATTRIBUTE

Let's update the \`updatedAt\` key

```js
async function updateItem () {
  const params = {
    TableName: tableName,
    Key: {
      userId: 'johnDoe'
    },
    UpdateExpression: 'set updatedAt = :newUpdatedAt',
    ExpressionAttributeValues: {
      ':newUpdatedAt': 1598367687
    },
    ReturnValues: 'UPDATED_NEW'
  }

  try {
    await ddb.update(params).promise()
  } catch (error) {
    console.error(error)
  }
}
```

#### UPDATE A NESTED ATTRIBUTE

Here we will add a new attribute(size) to \`img-1\` of \`album1\`

```js
async function updateNestedAttribute() {
  let params = {
    TableName: tableName,
    Key: {
      userId: 'johnDoe'
    },
    UpdateExpression: `set albums.album1.images.#img.size  = :newImage`,
    ConditionExpression: `attribute_not_exists(albums.album1.images.#img.size)`, // only creates if size attribute doestnt exists
    ExpressionAttributeNames: {
      '#img': 'img-1'
    },
    ExpressionAttributeValues: {
      ':newImage': 2048
    }
  }

  try {
    await ddb.update(params).promise()
  } catch (error) {
    console.error(error)
  }
}
```

> **NOTE**: If an attribute name begins with a number or contains a space, a special character, or a reserved word, then you must use an expression attribute name to replace that attribute's name in the expression. In the above example, `img-2` attribute has `-` in its name. So if we set the update expression to \``et albums.album1.images.image-2  = :newImage``it will throw an error.

#### APPEND TO A NESTED OBJECT

Here we will add a new image to album1

```js
async function appendToAnObject () {

  let newImage = {
    'filename': 'johndoe/album1/food-826349.jpg',
    's3Url': 's3://photo-bucket/johndoe/album1/food-826349.jpg',
    'tags': ['burger', 'food']
  }

  let params = {
    TableName: tableName,
    Key: {
      userId: 'johnDoe'
    },
    UpdateExpression: `set albums.album1.images.#image  = :newImage`,
    ExpressionAttributeNames: {
      '#image': 'img-2'
    },
    ExpressionAttributeValues: {
      ':newImage': newImage
    }
  }

  try {
    await ddb.update(params).promise()
  } catch (error) {
    console.error(error)
  }
}
```

#### APPEND TO A LIST

Here we will add a couple of tags to one of the image. Tags are stored as an array

```js
async function appendToList() {

  let params = {
    TableName: tableName,
    Key: {
      userId: 'johnDoe'
    },
    UpdateExpression: 'SET albums.album1.images.#image1.tags = list_append(albums.album1.images.#image1.tags, :newTags)',
    ExpressionAttributeNames: {
      '#image1': 'img-1'
    },
    ExpressionAttributeValues: {
      ':newTags': ['burger', 'pizza']
    }
  }

  try {
    await ddb.update(params).promise()
  } catch (error) {
    console.error(error)
  }
}
```