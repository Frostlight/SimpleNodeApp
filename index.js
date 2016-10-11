const firebase = require("firebase");
const http = require('http');
const express = require('express');  
const app = express();  
const port = 3000;

// Use Postman Chrome App for testing endpoints 
// Massively testing URL for reference:
// Replace xxxxxxxx.ngrok.io with instance of ngrok being used
// Run ngrok from command prompt "ngrok.exe http 8080", where 8080 is the port being used
// https://api.massively.ai/hiring/test?domain=https://3d9a422c.ngrok.io&email=cloudy.sonata@gmail.com

// Firebase configuration
// Fine to leave here since firebase app has been deleted
var config = {
    apiKey: "AIzaSyBYO54bS7oXnnQFoo0N-UxnZQA1PiZgR2w",
    authDomain: "massively-611b8.firebaseapp.com",
    databaseURL: "https://massively-611b8.firebaseio.com",
    storageBucket: "massively-611b8.appspot.com",
};

// Initialise Firebase
firebase.initializeApp(config);
var database = firebase.database(); // Get a reference to the database service

// Raw body middleware for requests
// Source: http://stackoverflow.com/questions/17644836/get-rawbody-in-express
app.use(function(req, res, next){
    var data = "";
    req.on('data', function(chunk){ 
        data += chunk;
    });
    
    // request.body contains the raw body of the input
    req.on('end', function(){
        req.body = data;
        next();
    })
})

/* Endpoint 0: Root
 *  Hello world!
 */
app.get('/', (request, response) => {  
    response.send('Hello, welcome to Vinh\'s solution for the Massively NodeJS test!');
})

/* Endpoint 1: Store data
 *  This API extracts the arbitrary JSON from the body of the HTTP request, and stores it into 
 *  Firebase (a Google database). You will need to set up an account at: https://firebase.google.com/
 *
 *      Method: POST
 *      URL: /data
 *      Query Parameters: none
 *      Body: application/json
 *      Returns: HTTP 200 status code
 */
app.post('/data', (request, response) => {
    // Store into firebase as plain text
    database.ref('data/').set(request.body);
        
    // Report OK status
    response.sendStatus(200);
})

/* Endpoint 2: Retrieve data
 *  This API retrieves the last thing that was stored in Firebase, and returns it as JSON. 
 *  You will need to perform a database read.
 *
 *      Method: GET
 *      URL: /data
 *      Query Parameters: none
 *      Returns: application/json
 */
app.get('/data', (request, response) => {
    // Get a snapshot of the database, and return the JSON last set there
    database.ref('data/').once("value").then(function(snapshot) {
        var data = snapshot.val();
        console.log("/data GET: ", data);
        
        // Return the stored data
        response.send(data);
    });
})

/* Endpoint 3: Retrieve weather
 * 
 *  This API retrieves the current temperature for a city, rounded to the nearest degree celsius.
 *  Valid cities for this API will be: Toronto, New York, and Tokyo (case insensitive)
 *  If this API is used without a valid city, return a 400 HTTP status code.
 *  The response from your API should resemble the following JSON:
 *
 *  {
 *  "temperature": "26°C"
 *  }
 *
 *  Use this 3rd party service for the current weather: http://openweathermap.org
 *  For example, the link below will return the current weather for Toronto.
 *  http://openweathermap.org/data/2.5/find?appid=b1b15e88fa797225412429c1c50c122a&q=toronto
 *
 *      Method: GET
 *      URL: /weather
 *      Query Parameters: city (should be one of Toronto, New York, or Tokyo - case insensitive)
 *      Returns: application/json
 */
app.get('/weather', (request, response) => {
    // Get the city from parsing query
    // Should be 'undefined' if query parameter doesn't exist
    var query_city = request.query.city;
    
    // Check if city is in the "valid cities" list
    // This catches 'undefined' city as well
    if(["toronto", "new york", "tokyo"].indexOf(query_city) == -1) {
        // Request parameter was for an invalid city
        console.log("/weather GET, Invalid city: ", query_city);
        response.sendStatus(400);
    } else {
        console.log("/weather GET, city: ", query_city);
    
        // query = city
        // units = metric
        // APPID = API key
        var url = 'http://api.openweathermap.org/data/2.5/weather?q=' 
            + query_city + '&units=metric&APPID=21c61098ba0334a94abe1bdfb587b236';
            
        console.log("URL: ", url)
        http.get(url, (res) => {
            console.log("Response from openweathermap API: " + res.statusCode);
            
            res.on('data', function (chunk) {
                // Parse the return string as JSON
                json_weather = JSON.parse(chunk);
                
                // Get the temperature from the JSON string
                // openweathermap returns temperature with decimal points, which should be removed
                // Also have to append "°C" since JSON response excludes units
                // Format: {"temperature": 25°C"}
                json_temperature = JSON.stringify({temperature: Math.round(json_weather.main.temp) + "°C"});
                console.log('Body: ', json_temperature);
                response.send(json_temperature);
            });
            
            res.resume();
        });
    }
})

// "Hey, Listen!"
app.listen(port, (err) => {  
    if (err) {
        return console.log('Error:', err);
    }
      
    console.log(`Server listening on ${port}`);
})