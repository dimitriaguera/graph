"use strict";

//var dataUrl = './geoData.json';

var $ = jQuery;
var Api = window.myApiSimulation;
var radius = 30;
var current_data = {
    nodes: [],
    links: []
};

class Graph {
    constructor() {
        var svg = d3.select('svg');
        var width = +svg.attr('width');
        var height = +svg.attr('height');

        this.nodes = [];
        this.links = [];

        this.ticked = this.ticked.bind(this);
        this.dragStart = this.dragStart.bind(this);
        this.dragDrag = this.dragDrag.bind(this);
        this.dragEnd = this.dragEnd.bind(this);

        this.simulation = d3.forceSimulation()
        .force('center', d3.forceCenter(width/2, height/2))                  
        //.force('charge', d3.forceManyBody())
        .force('collide', d3.forceCollide(radius + 10))
        .force('link', d3.forceLink().id(d => d.id).distance(200));

        this.link = svg.append('g')
            .attr('class', 'links')
            .selectAll('line');

        this.node = svg.append('g')
            .attr('class', 'nodes')
            .selectAll('.node')
    }

    start(data) {
        this.simulation.on('tick', this.ticked);
        this.storeData(data);
        this.applyData();
    }

    update(data) {
        this.simulation.alphaTarget(0.3).restart();
        this.storeData(data);
        this.applyData();
    }

    storeData(data) {
        if(data && data.nodes) {
            this.nodes = data.nodes;
        }

        if(data && data.links) {
            this.links = data.links;
        }
    }

    applyData() {
        this.applyNode();
        this.applyLink();
        this.applyForce();
    }

    applyNode() {
        var node = this.node.data(this.nodes);
        var nodes_enter = node.enter()
            .append('g')
            .attr('class', 'node')
            .call(d3.drag()
                .on('start', this.dragStart)
                .on('drag', this.dragDrag)
                .on('end', this.dragEnd)
        );

        nodes_enter.append('circle')
            .attr('class', 'node-circle')
            .attr('r', radius)
            .attr('fill', 'white')
            .attr('stroke', '#e3e3e3');

        nodes_enter.append('svg:image')
            .attr('xlink:href', d => {
                console.log('enter');
                return `img/${d.src}`
            })
            .attr('x', -21)
            .attr('y', -28)
            .attr('width', 40)
            .attr('height', 55);

        nodes_enter.append('title')
            .text( d => d.name );

        node.exit()
                .remove();

        this.node = node.merge(nodes_enter);
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

    applyForce() {
        this.simulation.nodes(this.nodes);
        this.simulation.force('link')
            .links(this.links);
    }

    ticked() {
        this.link
            .attr('x1', d => d.source.x )
            .attr('y1', d => d.source.y )
            .attr('x2', d => d.target.x )
            .attr('y2', d => d.target.y );

        this.node
            // .attr('cx', d => d.x )
            // .attr('cy', d => d.y );
            .attr('transform', d => `translate(${d.x},${d.y})`);
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
}

var graph = new Graph();

Api.get(8, function(data) {
    current_data = data;
    graph.start(data);
});

$('#button-1').on('click', () => {
    Api.get(12, function(data) {
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