"use strict";

//var dataUrl = './geoData.json';

var $ = jQuery;
var Api = window.myApiSimulation;

var current_data = {
    nodes: [],
    links: []
};

var params = null;

class WorkerApi {
    constructor(src, callback) {
        this.worker = new Worker(src);
        this.worker.onmessage = e => {
            callback(e.data);
        };
    }

    post( data ) {
        this.worker.postMessage( data );
    }
}

class Graph {
    constructor() {
        var svg = d3.select('svg');

        this.width = window.innerWidth;
        this.height = window.innerHeight;
        
        svg.attr('width', this.width);
        svg.attr('height', this.height);

        this.centerX = this.width / 2;
        this.centerY = this.height / 2;
        this.radius = 15;
        this.forceStrength = 0.03;
        this.transitionDuration = 400;
        this.distanceLink = 400;

        params = {
            centerX: this.centerX,
            centerY: this.centerY,
            radius: this.radius,
            forceStrength: this.forceStrength,
            transitionDuration: this.transitionDuration,
            distanceLink: this.distanceLink,
        };

        this.nodes = [];
        this.links = [];

        this.ticked = this.ticked.bind(this);
        this.dragStart = this.dragStart.bind(this);
        this.dragDrag = this.dragDrag.bind(this);
        this.dragEnd = this.dragEnd.bind(this);

        this.link = svg.append('g')
            .attr('class', 'links')
            .selectAll('line');

        this.node = svg.selectAll('.node')
    }

    start(data) {
        this.storeData(data);
        this.applyData();
    }

    update(data) {
        this.storeData(data);
        this.applyData();
        this.ticked();
    }

    updateArray(arr1, arr2) {
        if( arr1 && arr1.length ) {
            arr2.forEach(el2 => {
                var el = arr1.find(el1 => el1.id === el2.id );
                if( el ) {
                    el2.x = el.x;
                    el2.y = el.y;
                }
            });    
        }
        return arr2;
    }

    storeData(data) {
        if(data && data.nodes) {
            //this.nodes = this.updateArray(this.nodes, data.nodes);
            this.nodes = data.nodes;
        }
        if(data && data.links) {
            this.links = data.links;
        }
    }

    applyData() {
        this.applyNode();
        this.applyLink();
    }

    applyNode() {
        this.node = this.node.data(this.nodes);

        this.node.exit().transition()
            .duration(this.transitionDuration)
            .style('opacity', 0)
            .remove();


        var enter = this.node.enter()
            .append('g')
            .attr('class', 'node')
            .attr('id', d => d.id)
            .call(d3.drag()
                .on('start', this.dragStart)
                .on('drag', this.dragDrag)
                .on('end', this.dragEnd)
            );

        enter.append('circle')
                .attr('class', 'node')
                .attr('r', this.radius)
                .attr('fill', 'white')
                .attr('stroke', '#e3e3e3');

        this.node = this.node.merge(enter);
    }

    applyLink() {
        this.link = this.link.data(this.links);
        var link_enter = this.link.enter()
                .append('line')
                .attr('class', 'line')
                .attr('stroke', '#e3e3e3');

        this.link.exit()
            .remove();

        this.link = this.link.merge(link_enter);
    }


    ticked() {
        this.link
            .attr('x1', d => d.source.x )
            .attr('y1', d => d.source.y )
            .attr('x2', d => d.target.x )
            .attr('y2', d => d.target.y );

        this.node.attr('transform', d => `translate(${d.x},${d.y})`);
    }

    dragStart(d) {
        console.log(d);
        // if (!d3.event.active) this.simulation.alphaTarget(0.3).restart();
        // d.fx = d.x;
        // d.fy = d.y;

        var event = {
            type: 'dragStart',
            id: d.id,
            active: d3.event.active,
        }
    
        worker.post(event);
    }
    
    dragDrag(d) {
        // d.fx = d3.event.x;
        // d.fy = d3.event.y;
        var event = {
            type: 'dragDrag',
            id: d.id,
            x: d3.event.x,
            y: d3.event.y,
        }
    
        worker.post(event);
    }
    
    dragEnd(d) {
        // if (!d3.event.active) this.simulation.alphaTarget(0);
        // d.fx = null;
        // d.fy = null;
        var event = {
            type: 'dragEnd',
            id: d.id,
            active: d3.event.active,
        }
    
        worker.post(event);
    }

    handleMessage(event) {
        switch(event.type) {
            case 'error':
                $('#error').text(event.data);
                break;
            case 'progress':
                $('#counter').text(event.data);
                break;

            case 'tick':
                console.log('tick: ', event.data.nodes);
                graph.storeData(event.data);
                graph.ticked();
                break;

            case 'update':
                graph.update(event.data);
                break;
        }
    }
}

var graph = new Graph();
var worker = new WorkerApi('force.worker.js', event => graph.handleMessage(event));

// worker.post('yooooo gros');

Api.get(10, function(data) {
    data.links = [];
    current_data = data;

    var event = {
        type: 'init',
        params: params,
        nodes: data.nodes,
        links: data.links
    }

    worker.post(event);
});

$('#button-1').on('click', () => {
    Api.get(30, function(data) {

        current_data = data;
        graph.update(data);
    });
});

$('#button-2').on('click', () => {
    var nodes = current_data.nodes;
    var links = current_data.links;
    var id = `id${nodes.length}`;
    var nNode = {
        id: id,
        name: `Catcheur ${nodes.length}`,
        src: `pic${nodes.length}.png`
    };

    var nLink = {
        source: id,
        target: 'id0'
    };

    nodes.push(nNode);
    links.push(nLink);

    graph.update(current_data);
});


$('#button-3').on('click', () => {
    var nodes = current_data.nodes;
    var links = current_data.links;
    var rNode = nodes.pop();

    current_data = {
        nodes: nodes,
        links: links.filter( l => {
            // console.log('removeId: ', rNode.id);
            // console.log('compare:', l.source.id, l.target.id);
            var check = ( l.source.id !== rNode.id && l.target.id !== rNode.id );
            console.log('check: ', check);
            return check;
        })
    }

    graph.update(current_data);
});

$('#button-4').on('click', () => {
    current_data = Object.assign({}, current_data);
    graph.update(current_data);
});

$('#button-5').on('click', () => {
    graph.simulation.tick(100);
});

function snapShoot(data) {
    var preservedData = JSON.stringify(data);
    preservedData = JSON.parse(preservedData);
    return preservedData;
}