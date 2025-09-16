import {initShaders, vec4, flatten} from "../helperfunctions.js";

"use strict";
//we will want references to our WebGL objects
let gl:WebGLRenderingContext;
let canvas:HTMLCanvasElement;
let program:WebGLProgram;

let color:vec4; //this one lives in main memory
let ucolor:WebGLUniformLocation; //store location of shader uniform
let xoffset:number;
let yoffset:number;
let bufferId: WebGLBuffer;

//set up program when page first loads
window.onload = function init(){
    canvas = document.getElementById("gl-canvas") as HTMLCanvasElement;
    gl = canvas.getContext('webgl2') as WebGLRenderingContext;
    if (!gl){
        alert("WebGL isn't available");
    }

    //take the vertex and fragment shaders and compile them into a shader program
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    color = new vec4(1,1,1,1);//rgba for white
    ucolor = gl.getUniformLocation(program, "color");
    gl.uniform4fv(ucolor, color.flatten());

    //set up keyboard listener
    window.addEventListener("keydown", function(event:KeyboardEvent){
       switch (event.key) {
           case "r":
               color = new vec4(1, 0, 0, 1); //red
               break;
           case "g":
               color = new vec4(0, 1, 0, 1); //green
               break;
           case "b":
               color = new vec4(0, 0, 1, 1); //blue
               break;
           case "c":
               color = new vec4(Math.random(), Math.random(), Math.random(), 1);
               break;
       }
       //send main memory value over as uniform value
        gl.uniform4fv(ucolor, color.flatten());
       requestAnimationFrame(render); //we need a new frame, render() is our drawing function
    });

    canvas.addEventListener("mousedown", mouseDownListener);

    xoffset = 0;
    yoffset = 0;

    makeTriangleAndBuffer();

    //we'll cover what this is in a future lecture
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

    //what color is the background?
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    //request that a frame be drawn right now
    requestAnimationFrame(render); //provide the name of your render function
}

function mouseDownListener(event:MouseEvent){
    let rect:ClientRect = canvas.getBoundingClientRect(); //canvas has spacing to edge of window
    let canvasY:number = event.clientY - rect.top; //window -> canvas coordinates
    let flippedY:number = canvas.clientHeight - canvasY; //openGL wants origin lower left

    //need to keep things between -1 and 1 for default opengl view volume (for now)
    yoffset = 2 * flippedY / canvas.clientHeight - 1;
    //no need to flip x coordinate backwards
    xoffset = 2 * (event.clientX - rect.left)/canvas.clientWidth - 1;

    /////////////////////////////////////////////////
    //READ THIS !!!!!!! READ THIS!!!!!
    // DON'T DO THIS AFTER PROJECT 1!  IT'S BAD!!
    // NO NONONONONONONONO
    ////////////////////////////////////////////////
    let trianglePoints = []; //empty array
    //create 3 new triangle verts altered by mouse click offsets
    trianglePoints.push(new vec4(-0.5 + xoffset, -0.5 + yoffset, 0, 1));
    trianglePoints.push(new vec4(0 + xoffset, 0.5 + yoffset, 0, 1));
    trianglePoints.push(new vec4(0.5 + xoffset, -0.5 + yoffset, 0, 1));
    //just in case we have more than one buffer...
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    //send over this new vertex data
    gl.bufferData(gl.ARRAY_BUFFER, flatten(trianglePoints), gl.STATIC_DRAW);
    // END BAD STUFF
    ////////////////////////////////////////////////////
    requestAnimationFrame(render); //we're ready for a new image to be drawn with this info
}

function makeTriangleAndBuffer(){
    let trianglePoints:vec4[] = []; //empty array in main memory
    //create 3 vertices and add to main memory array
    //stay between -1 and 1 until we cover projection
    trianglePoints.push(new vec4(-0.5, -0.5, 0, 1));
    trianglePoints.push(new vec4(0, 0.5, 0, 1));
    trianglePoints.push(new vec4(0.5, -0.5, 0, 1));

    //need some graphics memory allocated
    bufferId = gl.createBuffer();
    //tell WebGL that the buffer we just created is the one we want to work with
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    //send main memory data to video memory.  Note use of Angel's flatten
    gl.bufferData(gl.ARRAY_BUFFER, flatten(trianglePoints), gl.STATIC_DRAW);

    //What is this data going to be used for?
    //The vertex shader code had an attribute named "vPosition".  This data feeds that
    let vPosition:GLint = gl.getAttribLocation(program, "vPosition"); //fetch by name
    //attrib location we just fetched, 4 elements per value, data type float, don't normalize
    //data has no gaps, starts righta way at index 0
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
}

//draw one frame
function render(){
    //start by clearing any buffers
    gl.clear(gl.COLOR_BUFFER_BIT);

    //if needed...
    //gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);

    //draw our geometry
    //draw triangles, start at index 0, there will be 3 verts total
    gl.drawArrays(gl.TRIANGLES, 0, 3);
}