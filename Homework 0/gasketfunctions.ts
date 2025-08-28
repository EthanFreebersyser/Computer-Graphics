import {initShaders, vec2, flatten} from "./helperfunctions.js";
//modified from https://github.com/esangel/WebGL/blob/master/Chap2/gasket1.js

"use strict";
//it will be handy to have references to some of our WebGL related objects
let gl:WebGLRenderingContext;
let canvas:HTMLCanvasElement;
let program:WebGLProgram;
let points:vec2[];
const NumPoints:number = 5000;

//We want some set up to happen immediately when the page loads
window.onload = function init() {

    //fetch reference to the canvas element we defined in the html file
    canvas = document.getElementById("gl-canvas") as HTMLCanvasElement;
    //grab the WebGL 2 context for that canvas.  This is what we'll use to do our drawing
    gl = canvas.getContext('webgl2') as WebGLRenderingContext;
    if (!gl) {
        alert("WebGL isn't available");
    }


    //Take the vertex and fragment shaders we provided and compile them into a shader program
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program); //and we want to use that program for our rendering

    // First, initialize the corners of our gasket with three points.

    let vertices:vec2[] = [
        new vec2( -1, -1 ),
        new vec2(  0,  1 ),
        new vec2(  1, -1 )
    ];

    // Specify a starting point p for our iterations
    // p must lie inside any set of three vertices

    let u = new vec2(vertices[0][0] + vertices[1][0], vertices[0][1] + vertices[1][1] );
    let v = new vec2(vertices[0][0] + vertices[2][0], vertices[0][1] + vertices[2][1] );
    let p = new vec2(0.25*(u[0]+v[0]), 0.25*(u[1]+v[1]));

    // And, add our initial point into our array of points

    points = [ p ];

    // Compute new points
    // Each new point is located midway between
    // last point and a randomly chosen vertex

    for ( let i:number = 0; points.length < NumPoints; ++i ) {
        let j:number = Math.floor(Math.random() * 3);
        p = new vec2(0.5*(points[i][0] + vertices[j][0]), 0.5*(points[i][1] + vertices[j][1]) );
        points.push( p );
    }

    //we need some graphics memory for this information
    let bufferId:WebGLBuffer = gl.createBuffer();
    //tell WebGL that the buffer we just created is the one we want to work with right now
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    //send the local data over to this buffer on the graphics card.  Note our use of Angel's "flatten" function
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

    //What is this data going to be used for?
    //The vertex shader has an attribute named "vPosition".  Let's associate this data to that attribute
    let vPosition:GLint = gl.getAttribLocation(program, "vPosition");
    //attribute location we just fetched, 2 elements in each vector, data type float, don't normalize this data,
    //data has no gaps, and starts right away at index 0
    gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);


    //we'll talk more about this in a future lecture, but this is saying what part of the canvas
    //we want to draw to.  In this case, that's all of it.
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

    //What color do you want the background to be?  This sets it to black and opaque.
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    //request that a frame be drawn
    render(); //we'll have a better way to trigger a new frame soon, but this will work for now
};


//draw a new frame
function render(){
    //start by clearing any previous data
    gl.clear(gl.COLOR_BUFFER_BIT);

    //draw the geometry we previously sent over.  It's a list of 1 triangle(s),
    //we want to start at index 0, and there will be a total of 3 vertices
    gl.drawArrays(gl.POINTS, 0, points.length);

}
