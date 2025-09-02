import { initShaders, vec4, flatten } from "./helperfunctions.js";
"use strict";
let gl;
let canvas;
let program;
let bufferId;
//do this when the page first loads
window.onload = function () {
    canvas = document.getElementById("gl-canvas");
    //and the canvas has a webgl rendering context associated already
    gl = canvas.getContext("webgl2");
    if (!gl) {
        alert("WebGL not Supported!");
    }
    // use the helperfunctions function to turn vertex and fragment shader into program
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);
    makeTriangleAndBuffer();
    //what part of the canvas should we use (all of it here)
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.clearColor(0.0, 0.0, 0.0, 1.0); //start out opaque black
    //request a frame to be drawn
    requestAnimationFrame(render); //render is the name of our drawing function below
};
function makeTriangleAndBuffer() {
    let trianglePoints = []; //create a local (RAM) array
    //create three vertices and add to local array
    //we haven't discussed projection. so stay between -1 to 1
    trianglePoints.push(new vec4(-0.5, -0.5, 0.0, 1.0));
    trianglePoints.push(new vec4(0, 0.5, 0.0, 1.0));
    trianglePoints.push(new vec4(0.5, -0.5, 0.0, 1.0));
    //get some graphics card memory
    bufferId = gl.createBuffer();
    //tell WebGl that the buffer we just created is the one to work with now
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    //send the local data over to the graphics card
    //flatten converts to ID array
    gl.bufferData(gl.ARRAY_BUFFER, flatten(trianglePoints), gl.STATIC_DRAW);
    //tell openGl what the data means
    let vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
}
function render() {
    //start by clearing all buffers
    gl.clear(gl.COLOR_BUFFER_BIT);
    //if we needed to we could bind to the correct drawing buffer
    //but if we're already bout to it, this would have no impact
    //gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
}