var firebase = require("firebase");
var bodyParser = require('body-parser');
var json = require('json');
var url = require('url');
var http = require('http')
const express = require('express');  
const app = express();  
const port = 3000;

// Massively testing URL for reference:
// https://api.massively.ai/hiring/test?domain=https://573280fc.ngrok.io&email=cloudy.sonata@gmail.com

// Firebase configuration
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
app.use(function(req, res, next){
   var data = "";
   req.on('data', function(chunk){ data += chunk})
   req.on('end', function(){
      req.rawBody = data;
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
    console.log(request.rawBody);
    try {
        // Retrieve JSON body from the request
        var body = JSON.stringify(request.body);
        
        // Invalid characters are ".", "#", "$", "/", "[", or "]"
        // Replace those with corresponding (modified) HTML codes
        // Leave out "[" and "]" since they are used to make lists
        body = body.split('.').join('&46;');
        body = body.split('#').join('&35;');
        body = body.split('$').join('&36;');
        body = body.split('/').join('&47;');
        
        // Handle the null character too
        body = body.split("null").join('\"&00;\"');
        
        console.log("POST /data, body: ", body);
        
        firebase.database().ref('json_data/').set(JSON.parse(body));
            
        // Report OK status
        response.sendStatus(200);
    } catch (err) {
        // Not JSON
        firebase.database().ref('json_data/').set(request.body)
        
        // Report OK status
        response.sendStatus(200);
    }
    
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
    var data = firebase.database().ref('json_data/').once("value").then(function(snapshot) {
        var json_data = JSON.stringify(snapshot.val());
        
        // Invalid characters are ".", "#", "$", "/", "[", or "]"
        // Undo the invalid character replacements
        json_data = json_data.split('&46;').join('.');
        json_data = json_data.split('&35;').join('#');
        json_data = json_data.split('&36;').join('$');
        json_data = json_data.split('&47;').join('/');
        
        // Reverse the null substitution
        json_data = json_data.split("\"&00;\"").join('null');
        
        console.log("JSON data: ", json_data);
        
        response.send(json_data)
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
    var query_city = request.query.city;
    
    // Check if city is in the "valid cities" list
    if(["Toronto", "New York", "Tokyo"].indexOf(query_city) == -1) {
        console.log("GET /weather, INVALID city: ", query_city);
        response.sendStatus(400);
    } else {
        console.log("GET /weather, city: ", query_city);
    
    // query = city
    // units = metric
    // APPID = API key
    var url = 'http://api.openweathermap.org/data/2.5/weather?q=' 
        + query_city + '&units=metric&APPID=21c61098ba0334a94abe1bdfb587b236'
        
    console.log("URL: ", url)
    http.get(url, (res) => {
        console.log(`Got response: ${res.statusCode}`);
        
        res.on('data', function (chunk) {
            // Parse the return string as JSON
            json_weather = JSON.parse(chunk)
            
            // Get the temperature from the JSON string
            // Have to append "°C" since JSON response excludes units
            // Format: {"temperature": 25.48°C"}
            json_temperature = JSON.stringify({temperature: json_weather.main.temp + "°C"})
            console.log('Body: ', json_temperature);
            response.send(json_temperature)
        });
        
        res.resume();
    });
    }
        
    
    
    
})

// Listen
app.listen(port, (err) => {  
  if (err) {
    return console.log('Error:', err);
  }
  
  
  console.log(`Server listening on ${port}`);
})