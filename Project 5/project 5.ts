"use strict";

import {initFileShaders, perspective, vec4, mat4, lookAt, rotateX, rotateY} from '../helperfunctions.js';
import {makeBuffer} from './makeSphereAndBuffer.js'
import {loadColor, loadClouds, loadNight, loadSpec, loadNormal} from "./loadTextures.js";

//<editor-fold desc="WebGL Variables">
let gl:WebGLRenderingContext;
let program:WebGLProgram;

//uniform locations
let umv:WebGLUniformLocation; //uniform for mv matrix
let uproj:WebGLUniformLocation; //uniform for projection matrix

//uniform indices for light properties
let light_position:WebGLUniformLocation;
let light_color:WebGLUniformLocation;
let ambient_light:WebGLUniformLocation;

//matrices
let mvOG:mat4; //local mv
let p:mat4; //local projection

let uColorSampler: WebGLUniformLocation;
let uCloudSampler: WebGLUniformLocation;
let uNightSampler: WebGLUniformLocation;
let uNormalSampler: WebGLUniformLocation;
let uSpecSampler: WebGLUniformLocation;

let useColor: WebGLUniformLocation;
let useClouds: WebGLUniformLocation;
let useNight: WebGLUniformLocation;
let useNormal: WebGLUniformLocation;
let useSpec: WebGLUniformLocation;

//document elements
let canvas:HTMLCanvasElement;

let landPts: number;
let cloudPts: number;
//</editor-fold>

//<editor-fold desc="Input Variables">
//interaction and rotation state
let xAngle:number;
let yAngle:number;
let mouse_button_down:boolean = false;
let prevMouseX:number = 0;
let prevMouseY:number = 0;
let zoom:number = 45;

let landSpin: number = 0;
let cloudSpin: number = 0;

let colorB: number = 0;
let cloudB: number = 0;
let nightB: number = 0;
let normalB: number = 0;
let specB: number = 0;

//</editor-fold>

//<editor-fold desc="Texture Variables">
//we can have multiple textures in graphics memory
let colorT:WebGLTexture;
let cloudT:WebGLTexture;
let nightT:WebGLTexture;
let normalT:WebGLTexture;
let specT:WebGLTexture;

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
    light_position = gl.getUniformLocation(program, "light_position");
    light_color = gl.getUniformLocation(program, "light_color");
    ambient_light = gl.getUniformLocation(program, "ambient_light");

    uColorSampler = gl.getUniformLocation(program, "colorSampler");
    uCloudSampler = gl.getUniformLocation(program, "cloudSampler");
    uNightSampler = gl.getUniformLocation(program, "nightSampler");
    uNormalSampler = gl.getUniformLocation(program, "normalSampler");
    uSpecSampler = gl.getUniformLocation(program, "specSampler");

    useColor = gl.getUniformLocation(program, "useColor");
    useClouds = gl.getUniformLocation(program, "useClouds");
    useNight = gl.getUniformLocation(program, "useNight");
    useNormal = gl.getUniformLocation(program, "useNormal");
    useSpec = gl.getUniformLocation(program, "useSpec");

    //set up basic perspective viewing
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    p = perspective(zoom, (canvas.clientWidth / canvas.clientHeight), 1, 20);
    gl.uniformMatrix4fv(uproj, false, p.flatten());

    //load in the texture files to main memory
    initTextures();

    landPts = makeBuffer(gl, program, 180, 1);
    cloudPts = makeBuffer(gl,program, 180, 1.025)

    //initialize rotation angles
    xAngle = 0;
    yAngle = 0;

    window.addEventListener("keydown" ,keyDownListener);

    window.setInterval(update, 16);
};

function initTextures() {
    colorT = loadColor(gl);
    cloudT = loadClouds(gl);
    nightT = loadNight(gl);
    normalT = loadNormal(gl);
    specT = loadSpec(gl);
}

//<editor-fold desc="Input Functions">
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
        case "1": //Color
            if (colorB == 1) {
                colorB = 0;
            } else {
                colorB = 1;
            }
            break;
        case "2": //
            if (cloudB == 1) {
                cloudB = 0;
            } else {
                cloudB = 1;
            }
            break;
        case "3": //
            if (nightB == 1) {
                nightB = 0;
            } else {
                nightB = 1;
            }
            break;
        case "4": //
            if (normalB == 1) {
                normalB = 0;
            } else {
                normalB = 1;
            }
            break;
        case "5": //
            if (specB == 1) {
                specB = 0;
            } else {
                specB = 1;
            }
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

function update(){
    landSpin += 0.1;
    cloudSpin += 0.05;

    render();
}

function render(){
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    //position camera 5 units back from origin
    mvOG = lookAt(new vec4(0, 0, 5, 1), new vec4(0, 0, 0, 1), new vec4(0, 1, 0, 0));

    gl.uniform4fv(light_color, [1, 1, 1, 1]);
    gl.uniform4fv(ambient_light, [0.1,0.1,0.1,1.0]);

    //rotate if the user has been dragging the mouse around
    mvOG = mvOG.mult(rotateY(yAngle).mult(rotateX(xAngle)));

    gl.uniform4fv(light_position, mvOG.mult(new vec4(5, 5, 5, 1)).flatten());
    let mv: mat4 = mvOG.mult(rotateY(landSpin));

    //send the modelview matrix over
    gl.uniformMatrix4fv(umv, false, mv.flatten());

    drawTextures();
}

function drawTextures(){
    //land draws
    gl.uniform1i(useColor, colorB);
    gl.uniform1i(useClouds, 0);
    gl.uniform1i(useNight, nightB);
    gl.uniform1i(useNormal, normalB);
    gl.uniform1i(useSpec, specB);

    gl.disable(gl.BLEND);
    gl.depthMask(true);

    //color
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, colorT);
    gl.uniform1i(uColorSampler, 0);

    //night
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, nightT);
    gl.uniform1i(uNightSampler, 1);

    //normal
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, normalT);
    gl.uniform1i(uNormalSampler, 2);

    //spec
    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, specT);
    gl.uniform1i(uSpecSampler, 3);

    gl.drawArrays(gl.TRIANGLES, 0, landPts);

    //clouds
    if (cloudB == 1) {
        gl.uniform1i(useColor, 0);
        gl.uniform1i(useClouds, cloudB);
        gl.uniform1i(useNight, 0);
        gl.uniform1i(useNormal, 0);
        gl.uniform1i(useSpec, 0);

        let mv: mat4 = mvOG.mult(rotateY(cloudSpin));
        //send the modelview matrix over
        gl.uniformMatrix4fv(umv, false, mv.flatten());

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.depthMask(false);
        gl.activeTexture(gl.TEXTURE4);
        gl.bindTexture(gl.TEXTURE_2D, cloudT);
        gl.uniform1i(uCloudSampler, 4);

        gl.drawArrays(gl.TRIANGLES, landPts, landPts + cloudPts);

        gl.depthMask(true);
        gl.disable(gl.BLEND);
    }
}
