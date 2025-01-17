﻿// BlazorChat Javascript interop to SignalR

// We cannot pass Javascript objects back to Blazor so this library will store
// each connection created using a key in the `connections` object.
// 
var connections = {};

// v0.5.0 interop changes - use a window.{object} as a container
//
window.ChatClient = {


    // key: key to use to access the SignalR client created
    // hubUrl: url to the chat hub
    // assembly:   the assembly containing the method
    // method: name of the method to call, with [JSInvokable] attribute
    Start: function (key, hubUrl, assembly, method) {
        // key is the unique key we use to store/retrieve connections
        console.log("Connection start");

        // create a client
        console.log("Connection being started for " + hubUrl);
        var connection = new signalR.HubConnectionBuilder()
            .withUrl(hubUrl)
            .build();

        console.log("Connection created, adding receive handler");

        // create an inbound message handler for the "ReceiveMessage" event
        connection.on("ReceiveMessage", (username, message) => {
            console.log("Connection message received for " + key + " from " + username);
            // invoke Blazor dotnet method 
            // we pass the key in so we know which client received the message
            DotNet.invokeMethod(assembly, method, key, "ReceiveMessage", username, message);
        });

        // start the connection
        var result = connection.start();

        // store connection in our lookup object
        connections[key] = connection;

        console.log("Connection start: returning a promise?");
        return result;
    },

    // 
    // function called when Blazor client wishes to register username
    //
    Register: function (key, username) {
        console.log("Connection register user " + username);
        var connection = connections[key];
        if (!connection) throw "Connection not found for " + key;
        console.log("Connection located");
        // send message (async)
        return connection.invoke("Register", username);
    },
    
    // 
    // function called when Blazor client wishes to send a message via SignalR
    //
    Send: function (key, username, message) {
        console.log("Connection send request");
        var connection = connections[key];
        if (!connection) throw "Connection not found for " + key;
        console.log("Connection located");
        // send message (async)
        return connection.invoke("SendMessage", username, message);
    },

    //
    // close and dispose of a connection
    //
    Stop: function (key) {
        console.log("Connection stop request: " + key);
        // locate the SignalR connection
        var connection = connections[key];
        if (connection) {
            // stop
            var result = connection.stop();
            console.log("Connection stopping");
            // remove refs
            delete connections[key];
            connection = null;
            return result;
        }
        else
            console.log("Connection not found for " + key);
        return null;
    }
};

