importScripts('https://d3js.org/d3.v4.min.js');   


var simulation = null;

function getNodeById( arr, id ) {
    return arr.find(d => d.id === id);
}

function updateArray(arr1, arr2, defaultX = 0, defaultY = 0) {
    if( arr1 && arr1.length ) {
        arr2.forEach(el2 => {
            var el = arr1.find(el1 => el1.id === el2.id );
            if( el ) {
                el2.x = el.x;
                el2.y = el.y;
            } else {
                el2.x = defaultX;
                el2.y = defaultY;
            }
        });    
    }
    return arr2;
}

onmessage = (event) => {

    try {
        switch(event.data.type) {
            case 'init':
                var { nodes, links, params } = event.data;

                nodes = nodes.map( n => {
                    n.x = params.centerX;
                    n.y = params.centerY;
                    return n;
                });

                simulation = d3.forceSimulation(nodes)
                    .force('x', d3.forceX().strength(params.forceStrength).x(params.centerX))
                    .force('y', d3.forceY().strength(params.forceStrength).y(params.centerY))
                    .force('link', d3.forceLink(links).id(d => d.id).distance(params.distanceLink))
                    .force('collide', d3.forceCollide(params.radius + 10))
                    .stop();
    
                for (var i = 0, n = Math.ceil(Math.log(simulation.alphaMin()) / Math.log(1 - simulation.alphaDecay())); i < n; ++i) {
                    postMessage({type: 'progress', data: i / n });
                    simulation.tick();
                }
    
                postMessage({type: 'init', data: {nodes, links}});
                break;
            
            case 'update':
                var { nodesFrom, nodesTo, centerX, centerY, links } = event.data;
                postMessage({
                    type: 'update', 
                    data: {
                        nodes: updateArray(nodesFrom, nodesTo, centerX, centerY),
                        links
                    }
                });
                break;

            default:
                throw new Error(`Invalid post type: ${event.data.type}`);
        }
    }

    catch(error) {
        postMessage({type: 'error', data: error.message});
    }
};

