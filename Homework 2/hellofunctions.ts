import {initShaders, vec4, flatten} from "./helperfunctions.js";

"use strict"
let gl:WebGLRenderingContext;
let canvas:HTMLCanvasElement;
let program:WebGLProgram;
let bufferId:WebGLBuffer;

//Add Color, learned from lots of googling
let uColor: WebGLUniformLocation | null = null;
let bodyStart = 0;
let bodyCount = 0;

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

    //another color addition
    uColor = gl.getUniformLocation(program, "uColor");

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
    // Ground
    trianglePoints.push(new vec4(-1.0,  0.9, 0.0, 1.0));
    trianglePoints.push(new vec4( 1.0,  0.9, 0.0, 1.0));
    trianglePoints.push(new vec4( 1.0,  1.0, 0.0, 1.0));

    trianglePoints.push(new vec4(-1.0,  0.9, 0.0, 1.0));
    trianglePoints.push(new vec4( 1.0,  1.0, 0.0, 1.0));
    trianglePoints.push(new vec4(-1.0,  1.0, 0.0, 1.0));

    // Shaft walls
    trianglePoints.push(new vec4(-0.2, 0.9, 0.0, 1.0));
    trianglePoints.push(new vec4( 0.2, 0.9, 0.0, 1.0));
    trianglePoints.push(new vec4( 0.2, 0.2, 0.0, 1.0));

    trianglePoints.push(new vec4(-0.2, 0.9, 0.0, 1.0));
    trianglePoints.push(new vec4( 0.2, 0.2, 0.0, 1.0));
    trianglePoints.push(new vec4(-0.2, 0.2, 0.0, 1.0));

    // Narrow tunnel to chamber
    trianglePoints.push(new vec4(-0.15, 0.2, 0.0, 1.0));
    trianglePoints.push(new vec4( 0.4, 0.2, 0.0, 1.0));
    trianglePoints.push(new vec4( 0.4, 0.0, 0.0, 1.0));

    trianglePoints.push(new vec4(-0.15, 0.2, 0.0, 1.0));
    trianglePoints.push(new vec4( 0.4, 0.0, 0.0, 1.0));
    trianglePoints.push(new vec4(-0.15, 0.0, 0.0, 1.0));

    // Chamber
    trianglePoints.push(new vec4( 0.4,  0.2, 0.0, 1.0));
    trianglePoints.push(new vec4( 0.9,  0.2, 0.0, 1.0));
    trianglePoints.push(new vec4( 0.9, 0.0, 0.0, 1.0));

    trianglePoints.push(new vec4( 0.4,  0.2, 0.0, 1.0));
    trianglePoints.push(new vec4( 0.9, 0.0, 0.0, 1.0));
    trianglePoints.push(new vec4( 0.4, 0.0, 0.0, 1.0));

    // Floor
    trianglePoints.push(new vec4(-1.0, -1.0, 0.0, 1.0));
    trianglePoints.push(new vec4( 1.0, -1.0, 0.0, 1.0));
    trianglePoints.push(new vec4( 1.0, -0.2, 0.0, 1.0));

    trianglePoints.push(new vec4(-1.0, -1.0, 0.0, 1.0));
    trianglePoints.push(new vec4( 1.0, -0.2, 0.0, 1.0));
    trianglePoints.push(new vec4(-1.0, -0.2, 0.0, 1.0));

    //so we know where to change the color
    bodyStart = trianglePoints.length;
    //torso
    trianglePoints.push(new vec4(0.55, 0.10, 0.0, 1.0));
    trianglePoints.push(new vec4(0.80, 0.10, 0.0, 1.0));
    trianglePoints.push(new vec4(0.80, 0.04, 0.0, 1.0));

    trianglePoints.push(new vec4(0.55, 0.10, 0.0, 1.0));
    trianglePoints.push(new vec4(0.80, 0.04, 0.0, 1.0));
    trianglePoints.push(new vec4(0.55, 0.04, 0.0, 1.0));

    // Head
    trianglePoints.push(new vec4(0.50, 0.09, 0.0, 1.0));
    trianglePoints.push(new vec4(0.55, 0.09, 0.0, 1.0));
    trianglePoints.push(new vec4(0.55, 0.05, 0.0, 1.0));

    trianglePoints.push(new vec4(0.50, 0.09, 0.0, 1.0));
    trianglePoints.push(new vec4(0.50, 0.05, 0.0, 1.0));
    trianglePoints.push(new vec4(0.55, 0.05, 0.0, 1.0));

    //feet
    trianglePoints.push(new vec4(0.77, 0.10, 0.0, 1.0));
    trianglePoints.push(new vec4(0.80, 0.13, 0.0, 1.0));
    trianglePoints.push(new vec4(0.80, 0.10, 0.0, 1.0));

    trianglePoints.push(new vec4(0.77, 0.10, 0.0, 1.0));
    trianglePoints.push(new vec4(0.77, 0.13, 0.0, 1.0));
    trianglePoints.push(new vec4(0.80, 0.13, 0.0, 1.0));

    //how long the body is
    bodyCount = trianglePoints.length - bodyStart;

    //get some graphics card memory
    bufferId = gl.createBuffer();
    //tell WebGl that the buffer we just created is the one to work with now
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    //send the local data over to the graphics card
    //flatten converts to ID array
    gl.bufferData(gl.ARRAY_BUFFER, flatten(trianglePoints), gl.STATIC_DRAW);

    //tell openGl what the data means
    let vPosition:GLint = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
}

function render(){
    //start by clearing all buffers
    gl.clear(gl.COLOR_BUFFER_BIT);

    //if we needed to we could bind to the correct drawing buffer
    //but if we're already bout to it, this would have no impact
    //gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);

    //gl.drawArrays(gl.TRIANGLES, 0, 30);

    //draw non-body brown
    gl.uniform4f(uColor, 0.62, 0.47, 0.33, 1.0);      // dirt brown
    gl.drawArrays(gl.TRIANGLES, 0, bodyStart);

    //draw body red
    gl.uniform4f(uColor, 0.86, 0.09, 0.10, 1.0);      // red
    gl.drawArrays(gl.TRIANGLES, bodyStart, bodyCount);
}
