"use strict";

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}

var api = {
    get: function( n, callback ) {
        var json = api.getRandomItems(n, false);
        setTimeout(function(){
            callback(json);
        }, 100);
    },

    getRandom: function( n, callback ) {
        var json = api.getRandomItems(n, true);
        setTimeout(function(){
            callback(json);
        }, 100);
    },

    getRandomItems: function (nodes_number, random) {
        var nodes = [];
        var links = [];

        nodes_number = random ? 
            getRandomInt(4, nodes_number) :
            nodes_number;

        var i = 0;

        while( i < nodes_number ) {
            var tid = getRandomInt(0, nodes_number);
            
            if( i === tid ) {
                if( tid === 0 ) tid++;
                else tid--;
            }

            nodes.push(api.getNode(i));
            links.push(api.getLink(i, tid));
            i++;
        }

        return {
            nodes: nodes,
            links: links
        };
    },

    getNode: function (index) {
        return {
            id: `id${index}`,
            name: `Catcheur ${index}`,
            src: `pic${index}.png`
        }
    },

    getLink: function (sid, tid) {
        return {
            source: `id${sid}`,
            target: `id${tid}`,
        } 
    }
}

window.myApiSimulation = api;