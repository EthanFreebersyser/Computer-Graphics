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

    makeGroundWheelBodyBuffer();

    //background color
    gl.clearColor(0.55, 0.75, 0.95, 1.0); //light blue sky
    //gl.clearColor(0.0, 0.0, 0.0, 1.0); //Black

    //avoids having objects that are behind other objects show up anyway
    gl.enable(gl.DEPTH_TEST);

    window.setInterval(update, 16); //target 60 frames per second
};

//TODO keyboard listener


//adds the ground, wheel and car body to the buffer and send to graphics card
function makeGroundWheelBodyBuffer(){
    let allPts:vec4[] = [];

    //<editor-fold desc="background pts">
    //start of the ground 0-6
        let groundPts:vec4[] = [];
        let groundY: number = -0.5;
        let groundColor:vec4 = new vec4(0.22, 0.65, 0.22, 1.0);

        //Triangle 1
        groundPts.push(new vec4(-1.0, groundY, -1.0, 1.0));
        groundPts.push(groundColor);
        groundPts.push(new vec4(1.0, groundY, -1.0, 1.0));
        groundPts.push(groundColor);
        groundPts.push(new vec4(1.0, groundY, 1.0, 1.0));
        groundPts.push(groundColor);

        //Triangle 2
        groundPts.push(new vec4(-1.0, groundY, -1.0, 1.0));
        groundPts.push(groundColor);
        groundPts.push(new vec4(1.0, groundY, 1.0, 1.0));
        groundPts.push(groundColor);
        groundPts.push(new vec4(-1.0, groundY, 1.0, 1.0));
        groundPts.push(groundColor);

        for (let pt of groundPts) {
            allPts.push(pt);
        }
    //end of ground
    //</editor-fold>

    //<editor-fold desc="wheel pts">
    //start wheel 6-?
        let wheelPts:vec4[] = [];
        //TODO add pts

        for (let pt of wheelPts) {
            allPts.push(pt);
        }
    //end wheel
    //</editor-fold>

    //<editor-fold desc="body pts">
    //start body ?-?
        let bodyPts:vec4[] = [];
        //TODO add pts

        for (let pt of bodyPts) {
            allPts.push(pt);
        }
    //end body
    //</editor-fold>


    //<editor-fold desc="build buffer">
    //start buffer
        bufferId = gl.createBuffer();
        //The buffer we want to work with
        gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
        //send the data to this buffer on the graphics card
        gl.bufferData(gl.ARRAY_BUFFER, flatten(allPts), gl.STATIC_DRAW);

        //Data is packed in groups of 4 floats which are 4 bytes each, 32 bytes total for position and color
        // position            color
        //  x   y   z     w       r    g     b    a
        // 0-3 4-7 8-11 12-15  16-19 20-23 24-27 28-31

        //associate part of data to vPosition
        vPosition = gl.getAttribLocation(program, "vPosition");

        //each position starts 32 bytes after the start of the previous one, and starts right away at index 0
        gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 32, 0);
        gl.enableVertexAttribArray(vPosition);

        //associate the other part of data to vColor
        vColor = gl.getAttribLocation(program, "vColor");

        //each color starts 32 bytes after the start of the previous one, and the first color starts 16 bytes into the data
        gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 32, 16);
        gl.enableVertexAttribArray(vColor);
    //end buffer
    //</editor-fold>
}

//TODO Update
function update(){
    //TODO do some animation updates here

    requestAnimationFrame(render);
}

//draw a new frame
function render(){
    //start by clearing any previous data for both color and depth
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    //projection matrices
    let p:mat4 = perspective(45.0, canvas.clientWidth / canvas.clientHeight, 1.0, 100.0);
    gl.uniformMatrix4fv(uproj, false, p.flatten());

    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

    //model view matrix
    //lookAT parames: where is the camera? what is a location the camrea is looking at? what direction is up?
    let mv:mat4 = lookAt(new vec4(0,5,20,1), new vec4(0,0,0,1), new vec4(0,1,0,0));

    //multiply translate matrix to the right of lookAt matric
    //TODO add this mv = mv.mult(translate(xOffset,yOffset,zOffset));
    mv = mv.mult(scalem(10, 1,10))

    //send over model view matrix as a uniform
    gl.uniformMatrix4fv(umv,false, mv.flatten());

    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    //TODO draw the geometry we previously sent over.  It's a list of ??? triangle(s),
    //TODO we want to start at index 0, and there will be a total of ??? vertices (??? faces with ??? vertices each)

    gl.drawArrays(gl.TRIANGLES, 0, 6);    // draw the background

    //TODO Add each wheel individually and the car body
}


