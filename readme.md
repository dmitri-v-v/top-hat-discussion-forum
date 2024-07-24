# Top Hat Discussion Forum API

My implementation of Top Hat's "Discussion Forum" API take home exercise.

## Setup Instructions

1. Run `npm install` in the root project folder. This might take some time as one of the dependencies is an in-memory
   database for running unit tests.

2. Put an `.env` file into the root folder with a `MONGODB_URI` connection string as an environment variable.

3. Starting the server seeds some sample users so that the API was immediately useable, but if you want to add your own, 
    modify the `users.json` file in `/src/data` directory. Note that this must be done before first startup as seeding 
    from that file only happens if there aren't any existing users in the database.

## Run Instructions

1. Run `npm start`.

2. The console would output the server location, but navigate to http://localhost:8080. There's a `/health` endpoint to
check that the connection to the DB works, and http://localhost:8080/api-docs has the complete Swagger API documentation 
on how to use this API.

3. Run `npm test` to run unit tests.

## Technical Decisions & Implementation Notes

### Part 1: Database

I decided to go with a NoSQL DB because:

1. Everything would be happening in the context of a single Discussion. My initial thought was that since this would be 
all text data, even storing all comments within one Discussion document would be more than enough to fit within the 16MB document size limit. Turned out to not even need that as MongoDB is more than fast enough to be able to do the join with
the Comments collection.

2. There are only three relationships involved - between a Discussion and a Comment, and between a User and each of 
those. So using a relational DB did not seem like it would be beneficial enough, and the flexibility of NoSQL schemas 
meant that new functionality/properties could be added to schemas with ease. 

3. I haven't used MongoDB before and wanted to try it out, and the fact that MongoDB Atlas offers a free cloud instance 
makes setting up a DB very easy.

### Part 2: Models/Schemas

* The Comment and Discussion schemas include some additional properties that weren't mentioned in the instructions, but
    I thought they'd make those models a bit more realistic/production-ready - things like `isArchived` or `isDeleted`,
    or `commentCount`.

* Users, although they have a `firstName` and `lastName` are referenced in the API via their `userName` and as such,
    I've denormalized the `userName` value for both Comments and Discussions.

### Part 3: The API

* The instructions said not to worry about authentication, so although in the API responses Users are identified via 
    their `userName`s, I thought it would be a little bit more secure if the requests needed the `userId` when making
    comments/discussions. I added a special endpoint under `/users` to get the `userId` for a given `userName`.

* The instructions said that "any user can start a new discussion", but I thought it would be more fun to add a bit of 
    complexity by only allowing professors to create discussions. Please note that this is not a reflection of my
    professional approach of overriding requirements "bEcAuSe I tHiNk I kNoW bEtTeR" or anything. I literally only added
    it to have some functional difference between adding discussions and comments as an extra personal challenge. 

* Adding/retrieving comments is done through the `/discussions/{discussionId}/comments` endpoint rather than a 
    `/comments/{discussionId}` endpoint because I felt that was more RESTful in representing that the comments are
    additional resources within the context of a discussion. But an argument could be made for the other way too (that
    the resource you're creating/getting is a comment that's identified by a discussion.)

* I added an extra GET `/discussions` endpoint to list all active dicussions as I felt that's a really basic usecase for
    a discussion forum. Part of the response is a URL for getting the comments of each discussion so technically you can
    navigate the entire API through the browser. Postman/curl is only needed for adding discussions/comments (although
    it's also possible through the Swagger API docs mentioned earlier).
