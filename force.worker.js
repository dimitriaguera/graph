importScripts('https://d3js.org/d3.v4.min.js');   


var simulation = null;
var current_nodes = [];
var current_links = [];
var dragged = null;

function getNodeById( arr, id ) {
    return arr.find(d => d.id === id);
}

onmessage = (event) => {

    try {
        switch(event.data.type) {
            case 'init':
                var { nodes, links, params } = event.data;
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
    
                current_nodes = nodes;
                current_links = links;
                
                postMessage({type: 'update', data: {nodes: nodes, links: links}});
                break;
    
            case 'dragStart':
                var { id, active } = event.data;
                dragged = getNodeById(current_nodes, id);
    
                simulation.on('tick', () => {
                    postMessage({type: 'tick', data: {nodes: current_nodes, links: current_links}});
                });
    
                if (!active) simulation.alphaTarget(0.3).restart();
                dragged.fx = dragged.x;
                dragged.fy = dragged.y;

                postMessage({type: 'error', data: dragged.id});
                break;
    
            case 'dragDrag':
                var { id, x, y } = event.data;
                dragged.fx = x;
                dragged.fy = y;
                postMessage({type: 'error', data: `id:${dragged.id} | x:${x} | y:${y}`});
                break;
    
            case 'dragEnd':
                simulation.stop();

                var { id, active } = event.data;
                if (!active) simulation.alphaTarget(0);
                dragged.fx = null;
                dragged.fy = null;
                dragged = null;
                postMessage({type: 'error', data: dragged});
                break;
        }
    }

    catch(error) {
        postMessage({type: 'error', data: error});
    }
};

