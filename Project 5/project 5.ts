"use strict";

import {initFileShaders, perspective, vec2, vec4, mat4, flatten, lookAt, translate,rotateX, rotateY} from '../helperfunctions.js';
import {makeBuffer} from './makeSphereAndBuffer.js'

//<editor-fold desc="Variables">
let gl:WebGLRenderingContext;
let program:WebGLProgram;

//uniform locations
let umv:WebGLUniformLocation; //uniform for mv matrix
let uproj:WebGLUniformLocation; //uniform for projection matrix

//matrices
let mv:mat4; //local mv
let p:mat4; //local projection

let uTextureSampler:WebGLUniformLocation; //pointer to sampler2D

//document elements
let canvas:HTMLCanvasElement;

//interaction and rotation state
let xAngle:number;
let yAngle:number;
let mouse_button_down:boolean = false;
let prevMouseX:number = 0;
let prevMouseY:number = 0;
let zoom:number = 45;

//we can have multiple textures in graphics memory
let earth:WebGLTexture;

//and we need a main memory location to load the files into
let earthImage:HTMLImageElement;


let anisotropic_ext: EXT_texture_filter_anisotropic;


let numOfPts:number;

//</editor-fold>

window.onload = function init() {
    canvas = document.getElementById("gl-canvas") as HTMLCanvasElement ;
    gl = canvas.getContext('webgl2', {antialias:true}) as WebGLRenderingContext;
    if (!gl) {
        alert("WebGL isn't available");
    }

    //allow the user to rotate mesh with the mouse
    canvas.addEventListener("mousedown", mouse_down);
    canvas.addEventListener("mousemove", mouse_drag);
    canvas.addEventListener("mouseup", mouse_up);

    //black background
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    program = initFileShaders(gl, "vshader.glsl", "fshader.glsl");

    gl.useProgram(program);
    umv = gl.getUniformLocation(program, "model_view");
    uproj = gl.getUniformLocation(program, "projection");

    //todo
    //note, still just one texture per object, so even though there are
    //multiple textures total, we just need the one texture sampler on the shader side
    uTextureSampler = gl.getUniformLocation(program, "textureSampler");//get reference to sampler2D

    //set up basic perspective viewing
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    p = perspective(zoom, (canvas.clientWidth / canvas.clientHeight), 1, 20);
    gl.uniformMatrix4fv(uproj, false, p.flatten());

    //load in the texture files to main memory
    initTextures();

    numOfPts = makeBuffer(gl, program);

    //initialize rotation angles
    xAngle = 0;
    yAngle = 0;

    window.addEventListener("keydown" ,keyDownListener);

    requestAnimationFrame(render);

};

//<editor-fold desc="Input Fxns">
function keyDownListener(event:KeyboardEvent) {
    switch (event.key) {
        case "ArrowDown":
            if (zoom < 170) {
                zoom += 5;
            }
            break;
        case "ArrowUp":
            if (zoom > 10) {
                zoom -= 5;
            }
            break;
        case "l":
            gl.bindTexture(gl.TEXTURE_2D, checkerTex);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);//try different min and mag filters
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            console.log("linear");
            break;
        case "n":
            gl.bindTexture(gl.TEXTURE_2D, checkerTex);
            //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);//try different min and mag filters
            //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            break;

    }
}

//update rotation angles based on mouse movement
function mouse_drag(event:MouseEvent){
    let thetaY:number, thetaX:number;
    if (mouse_button_down) {
        thetaY = 360.0 *(event.clientX-prevMouseX)/canvas.clientWidth;
        thetaX = 360.0 *(event.clientY-prevMouseY)/canvas.clientHeight;
        prevMouseX = event.clientX;
        prevMouseY = event.clientY;
        xAngle += thetaX;
        yAngle += thetaY;
    }
    requestAnimationFrame(render);
}

//record that the mouse button is now down
function mouse_down(event:MouseEvent) {
    //establish point of reference for dragging mouse in window
    mouse_button_down = true;
    prevMouseX= event.clientX;
    prevMouseY = event.clientY;
    requestAnimationFrame(render);
}

//record that the mouse button is now up, so don't respond to mouse movements
function mouse_up(){
    mouse_button_down = false;
    requestAnimationFrame(render);
}
//</editor-fold>


function initTextures() {
    earth = gl.createTexture();
    earthImage = new Image();
    earthImage.onload = function() { handleTextureLoaded(earthImage, earth); };
    earthImage.src = 'Earth.png';

}

function handleTextureLoaded(image:HTMLImageElement, texture:WebGLTexture) {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);  //disagreement over what direction Y axis goes
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    anisotropic_ext = gl.getExtension('EXT_texture_filter_anisotropic');
    gl.texParameterf(gl.TEXTURE_2D, anisotropic_ext.TEXTURE_MAX_ANISOTROPY_EXT, 4);
    //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.bindTexture(gl.TEXTURE_2D, null);
}

//draw a frame
function render(){
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    //position camera 5 units back from origin
    mv = lookAt(new vec4(0, 0, 5, 1), new vec4(0, 0, 0, 1), new vec4(0, 1, 0, 0));

    //rotate if the user has been dragging the mouse around
    mv = mv.mult(rotateY(yAngle).mult(rotateX(xAngle)));

    //send the modelview matrix over
    gl.uniformMatrix4fv(umv, false, mv.flatten());


    //make sure the appropriate texture is sitting on texture unit 0
    //we could do this once since we only have one texture per object, but eventually you'll have multiple textures
    //so you'll be swapping them in and out for each object
    gl.activeTexture(gl.TEXTURE0); //we're using texture unit 0
    gl.bindTexture(gl.TEXTURE_2D, earth); //we want domokun on that texture unit for the next object drawn
    //when the shader runs, the sampler2D will want to know what texture unit the texture is on
    //It's on texture unit 0, so send over the value 0
    gl.uniform1i(uTextureSampler, 0);

    gl.drawArrays(gl.TRIANGLES, 0, numOfPts);

    /*
    //We have transparency in this one, so enable blending and disable depth write
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
    gl.depthMask(false);

    mv = camera.mult(rotateY(-90).mult(translate(0,0,1)));
    gl.uniformMatrix4fv(umv, false, mv.flatten());
    gl.bindTexture(gl.TEXTURE_2D, logotex); //we're still talking about texture unit 0, but we want a logo on the next object drawn
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    */


    //and now put it back to appropriate values for opaque objects
    gl.disable(gl.BLEND);
    gl.depthMask(true);

}