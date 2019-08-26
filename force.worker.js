importScripts('node_modules/d3/dist/d3.min.js');   

onmessage = (event) => {
    var string = event.data + '----response';
    console.log(d3);
    postMessage(string);
};