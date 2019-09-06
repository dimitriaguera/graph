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
        this.nodes = [];
        this.links = [];
        this.getSvg();
        this.getParams();
        this.getHandlers();
        this.getWorkers();
        this.getSelectors();
    }

    getSvg() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.svg = d3.select('svg');
        this.svg.attr('width', this.width);
        this.svg.attr('height', this.height);
    }

    getParams() {
        this.params = {
            centerX: this.width / 2,
            centerY: this.height / 2,
            radius: 15,
            forceStrength: 0.03,
            transitionDuration: 400,
            distanceLink: 400,
        };
    }

    getHandlers() {
        this.draw = this.draw.bind(this);
        this.dragStart = this.dragStart.bind(this);
        this.dragDrag = this.dragDrag.bind(this);
        this.dragEnd = this.dragEnd.bind(this);
    }

    getSimulation() {
        this.simulation = d3.forceSimulation()
            .velocityDecay(0.4)
            .force('x', d3.forceX().strength(this.params.forceStrength).x(this.params.centerX))
            .force('y', d3.forceY().strength(this.params.forceStrength).y(this.params.centerY))
            .force('link', d3.forceLink().id(d => d.id).distance(this.params.distanceLink))
            .force('collide', d3.forceCollide(this.params.radius));
    }

    getWorkers() {
        this.worker = new WorkerApi('force.worker.js', event => this.handleMessage(event));
    }

    getSelectors() {
        this.link = this.svg.append('g')
            .attr('class', 'links')
            .selectAll('line');

        this.node = this.svg.selectAll('.node')
    }

    init( data ) {
        this.worker.post({
            ...data,
            type: 'init',
            params: this.params
        });
    }

    update( data ) {
        this.worker.post({
            type: 'update',
            nodesFrom: this.nodes,
            nodesTo: data.nodes,
            links: data.links,
            centerX: this.params.centerX,
            centerY: this.params.centerY
        });
    }

    handleInit( data ) {
        this.getSimulation();
        this.storeData(data);
        this.applyData();
        this.simulation.on('tick', this.draw);
    }

    handleUpdate( data ) {
        this.storeData( data );
        this.applyData();
        this.simulation.alphaTarget(0.1).restart();
    }

    storeData(data) {
        if(data && data.nodes) this.nodes = data.nodes;
        if(data && data.links) this.links = data.links;
    }

    applyData() {
        this.applyNode();
        this.applyLink();
        this.applyForce();
    }

    applyForce() {
        this.simulation.nodes(this.nodes);
        this.simulation.force('link').links(this.links);
    }

    applyNode() {
        this.node = this.node.data(this.nodes);

        this.node.exit()
            .transition()
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
                .attr('r', this.params.radius)
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


    draw() {
        this.link.attr('x1', d => d.source.x )
            .attr('y1', d => d.source.y )
            .attr('x2', d => d.target.x )
            .attr('y2', d => d.target.y );
        this.node.attr('transform', d => `translate(${d.x},${d.y})`);
    }

    dragStart(d) {
        if (!d3.event.active) this.simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }
    
    dragDrag(d) {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
    }
    
    dragEnd(d) {
        if (!d3.event.active) this.simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }

    handleMessage(event) {
        switch(event.type) {
            case 'error':
                $('#error').text(event.data);
                break;

            case 'progress':
                $('#counter').text(event.data);
                break;

            case 'init':
                graph.handleInit(event.data);
                break;

            case 'update':
                graph.handleUpdate(event.data);
                break;
        }
    }
}

var graph = new Graph();

Api.get(300, function(data) {
    current_data = data;
    graph.init(data);
});

$('#button-1').on('click', () => {
    Api.getRandom(300, function(data) {
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
            var check = ( l.source.id !== rNode.id && l.target.id !== rNode.id );
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