import {initShaders, vec4, flatten} from "./helperfunctions.js";

"use strict"
let gl:WebGLRenderingContext;
let canvas:HTMLCanvasElement;
let program:WebGLProgram;
let bufferId:WebGLBuffer;

//do this when the page first loads
window.onload = function(){
    canvas = document.getElementById("gl-canvas") as HTMLCanvasElement;
    //and the canvas has a webgl rendering context associated already
    gl = canvas.getContext("webgl2") as WebGLRenderingContext;
    if(!gl){
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
}

function makeTriangleAndBuffer(){
    let trianglePoints:vec4[] = []; //create a local (RAM) array

    //create three vertices and add to local array
    //we haven't discussed projection. so stay between -1 to 1
    trianglePoints.push(new vec4(-0.5, -0.5, 0.0, 1.0)); //vertex 1
    trianglePoints.push(new vec4(1, 0, 0, 1));  //opaque red

    trianglePoints.push(new vec4(0, 0.5, 0.0, 1.0)); //vertex 2
    trianglePoints.push(new vec4(0, 1, 0, 1)); // opaque green

    trianglePoints.push(new vec4(0.5, -0.5, 0.0, 1.0)); //vertex 3
    trianglePoints.push(new vec4(0, 0, 1, 1)); // opaque blue

    //get some graphics card memory
    bufferId = gl.createBuffer();
    //tell WebGl that the buffer we just created is the one to work with now
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    //send the local data over to the graphics card
    //flatten converts to ID array
    gl.bufferData(gl.ARRAY_BUFFER, flatten(trianglePoints), gl.STATIC_DRAW);

    //Data is packed in groups of 4 floats which are 4 bytes each, 32 bytes total for position and color
    // position             color
    // x    y    z    w       r     g     b     a
    // 0-3 4-7 8-11 12-15   16-19 20-23 24-27 28-31

    //tell openGl what the data means
    let vPosition:GLint = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 32, 0);
    gl.enableVertexAttribArray(vPosition);

    let vColor:GLint = gl.getAttribLocation(program, "vColor");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 32, 16);
    gl.enableVertexAttribArray(vColor);
}

function render(){
    //start by clearing all buffers
    gl.clear(gl.COLOR_BUFFER_BIT);

    //if we needed to we could bind to the correct drawing buffer
    //but if we're already bout to it, this would have no impact
    //gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);

    gl.drawArrays(gl.TRIANGLES, 0, 3);
}
