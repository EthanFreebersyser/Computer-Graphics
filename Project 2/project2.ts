"use strict";
//it will be handy to have references to some of our WebGL related objects

let gl:WebGLRenderingContext;
let canvas:HTMLCanvasElement;
let program:WebGLProgram;
let bufferId:WebGLBuffer;

let umv:WebGLUniformLocation; //index of model_view in shader program
let uproj:WebGLUniformLocation; //index of projection in shader program

let vPosition:GLint; //shader attribute loc
let vColor:GLint; //color shader attribute loc

//TODO Add various animation parameters

import {initShaders, vec4, mat4, flatten, perspective, translate, lookAt, rotateX, rotateY, rotateZ, scalem} from './helperfunctions.js';

//We want some set up to happen immediately when the page loads
window.onload = function init() {
    //reference to canvas element in the html
    canvas = document.getElementById("gl-canvas") as HTMLCanvasElement;
    //WebGL 2 context for the canvas
    gl = canvas.getContext('webgl2') as WebGLRenderingContext;
    if (!gl) {
        alert("WebGL isn't available");
    }
    //Take vertex and fragment shaders and compile them into a shader program
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program); //and we want to use that program for our rendering

    umv = gl.getUniformLocation(program, "model_view");
    uproj = gl.getUniformLocation(program, "projection");

    //TODO initialize various animation parameters

    //TODO Add call to keyboard listener

    //TODO add call to make ground function

    //TODO Add call to make wheels, car body, and buffer function

    //background color
    gl.clearColor(0.0, 0.0, 0.0, 1.0); //black right now

    //avoids having objects that are behind other objects show up anyway
    gl.enable(gl.DEPTH_TEST);

    //TODO Uncomment when Update exists window.setInterval(update, 16); //target 60 frames per second
};

//TODO keyboard listener

//TODO make ground

//TODO make wheels, car body, and buffer

//TODO Update

//draw a new frame
function render(){
    //start by clearing any previous data for both color and depth
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    //projection matrices
    let p:mat4 = perspective(45.0, canvas.clientWidth / 2 / canvas.clientHeight, 1.0, 100.0);
    gl.uniformMatrix4fv(uproj, false, p.flatten());

    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

    //now set up the model view matrix and send it over as a uniform
    //the inputs to this lookAt are to move back 20 units, point at the origin, and the positive y axis is up
    //TODO construct a model view matrix and send it as a uniform to the vertex shader

    //model view matrix
    //lookAT parames: where is the camera? what is a location the camrea is looking at? what direction is up?
    let mv:mat4 = lookAt(new vec4(0,0,20,1), new vec4(0,0,0,1), new vec4(0,1,0,0));

    //multiply translate matrix to the right of lookAt matric
    //TODO add this mv = mv.mult(translate(xOffset,yOffset,zOffset));

    //send over model view matrix as a uniform
    gl.uniformMatrix4fv(umv,false, mv.flatten());

    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    //TODO draw the geometry we previously sent over.  It's a list of XXX triangle(s),
    //TODO we want to start at index 0, and there will be a total of XXX vertices (XXX faces with XXX vertices each)

    gl.drawArrays(gl.TRIANGLES, 0, 36);    // draw the car

    //TODO Add each wheel individually and the car body
}


