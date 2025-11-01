import {initFileShaders, mat4} from './helperfunctions.js';
import {drawWheels, drawCubes, drawSpheres, genRanSphereLocs, drawBackground,} from './drawers.js';
import {makeGround, makeWheel, makeCube, buildBuffer, makeSphere} from './shapes.js';
import {makeCameras, makeLights} from "./lightsAndCameras.js";

"use strict";

//<editor-fold desc="Web GL variables">
let gl:WebGLRenderingContext;
let canvas:HTMLCanvasElement;
let program:WebGLProgram;
let bufferId:WebGLBuffer;

//uniform locations
let umv:WebGLUniformLocation; //index of model_view in shader program
let uproj:WebGLUniformLocation; //index of projection in shader program
let ambient_light:WebGLUniformLocation;
//</editor-fold>

//<editor-fold desc="per vertex variables">
//shader variable indices for per vertex and material attributes
let vPosition:GLint;
let vNormal:GLint;
let vAmbientDiffuseColor:GLint;
let vSpecularColor:GLint;
let vSpecularExponent:GLint;
//</editor-fold>

//<editor-fold desc="Motion variables, constants, & struct">
let startIndex: number;
let numGroundPts: number;
let numWheelPts: number;
let numCubePts: number;
let numSpherePts: number;


//Car variables and constants
export type carState = {
    xLoc: number;
    zLoc: number;
    speed: number; //units per frame -forward, +backward
    steerAngle: number; //degrees -left, +right
    left: boolean; //are we turning left?
    right: boolean; //are we turning right?
    wheelSpin: number; //degrees
    yaw: number; //degrees
};

let car: carState = {xLoc: 0, zLoc: 0, speed: 0, steerAngle: 0, left: false, right: false, wheelSpin: 0, yaw: 0};

let headRotateLeft: boolean = false;
let headRotateRight: boolean = false;
let headAngle: number = 0;

const driveSpeed: number = 2;
const maxSteer: number = 45 ; //60 degrees
const steerRate: number = 90; //90 deg per sec
//</editor-fold>

//<editor-fold desc="Camera variables">
let fov: number = 45; //or zoom
let dolly: number = 20;
let whichCam: number = 1; //default to camrea 1
let camFocus: boolean = true; //default to center of stage
//</editor-fold>

//<editor-fold desc="Light booleans">
let headLightBool: boolean = true;
let bigLightBool: boolean = true;
let emerLightBool: boolean = true;
//</editor-fold>

window.onload = function init() {
    //reference to canvas element in the html
    canvas = document.getElementById("gl-canvas") as HTMLCanvasElement;
    //WebGL 2 context for the canvas
    gl = canvas.getContext('webgl2') as WebGLRenderingContext;
    if (!gl) {
        alert("WebGL isn't available");
    }

    //background color
    gl.clearColor(0.55, 0.75, 0.95, 1.0); //light blue sky

    //avoids having objects that are behind other objects show up anyway
    gl.enable(gl.DEPTH_TEST);

    //Take vertex and fragment shaders and compile them into a shader program
    program = initFileShaders(gl, "./vshader.glsl", "./fshader.glsl");
    gl.useProgram(program); //and we want to use that program for our rendering

    //<editor-fold desc="Getting uniform locations">
    umv = gl.getUniformLocation(program, "model_view");
    uproj = gl.getUniformLocation(program, "projection");
    ambient_light = gl.getUniformLocation(program, "ambient_light");
    vPosition = gl.getAttribLocation(program, "vPosition");
    vNormal = gl.getAttribLocation(program, "vNormal");
    vAmbientDiffuseColor = gl.getAttribLocation(program, "vAmbientDiffuseColor");
    vSpecularColor = gl.getAttribLocation(program, "vSpecularColor");
    vSpecularExponent = gl.getAttribLocation(program, "vSpecularExponent");
    //</editor-fold>

    window.addEventListener("keydown", keyDownListener);

    window.addEventListener("keyup", keyUpListener);

    //only have to do this once
    genRanSphereLocs();

    //ground
    numGroundPts = makeGround();
    //wheel
    numWheelPts =  makeWheel(8);
    //body
    numCubePts = makeCube();
    //spheres
    numSpherePts = makeSphere(31);

    buildBuffer(gl, bufferId, vPosition, vNormal);

    window.setInterval(update, 16); //target 60 frames per second
};

function keyDownListener(event:KeyboardEvent) {
    switch (event.key) {
        case "ArrowUp":
            if(!event.repeat) car.speed = driveSpeed;
            break;
        case "ArrowDown":
            if(!event.repeat) car.speed = -driveSpeed;
            break;
        case "ArrowLeft":
            car.left = true;
            break;
        case "ArrowRight":
            car.right = true;
            break;
        case " ":
            if (!event.repeat){
                car.speed = 0;
                car.left = false
                car.right = false;
            }
            break;
        case "z":
            headRotateLeft = true;
            break;
        case "x":
            headRotateRight = true;
            break;
        case "s":
            if (dolly <= 50){
                dolly += 1;
            } else {
                dolly = 50;
            }
            break;
        case "a":
            if (dolly >= -50){
                dolly -= 1;
            } else {
                dolly = -50;
            }
            break;
        case "w":
            if (fov <= 180){
                fov += 1;
            } else {
                fov = 180;
            }
            break;
        case "q":
            if (fov >= 0){
                fov -= 1;
            } else {
                fov = 0;
            }
            break;
        case "f":
            camFocus = !camFocus;
            break;
        case "r":
            dolly = 20;
            fov = 45
            camFocus = true;
            whichCam = 1;
            break;
        case "1":
            whichCam = 1;
            break;
        case "2":
            whichCam = 2;
            break;
        case "3":
            whichCam = 3;
            break;
        case "0":
            bigLightBool = !bigLightBool;
            break;
        case "9":
            headLightBool = !headLightBool;
            break;
        case "8":
            emerLightBool = !emerLightBool;
            break;
    }
}

function keyUpListener(event:KeyboardEvent) {
    switch (event.key) {
        case "ArrowLeft":
            car.left = false;
            break;
        case "ArrowRight":
            car.right = false;
            break;
        case "z":
            headRotateLeft = false;
            break;
        case "x":
            headRotateRight = false;
            break;
    }
}

function update(){
    const dt: number = 1/60;

    //rotate head
    if (headRotateLeft && !headRotateRight) {
        headAngle += steerRate * dt; //deg
    }
    else if (headRotateRight && !headRotateLeft) {
        headAngle -= steerRate * dt; //deg
    }

    //wheel spin
    if (car.speed != 0 ){
        const angVelDeg = (car.speed / 0.25) * 180 / Math.PI; //0.25 is wheel Radius
        car.wheelSpin = (car.wheelSpin + angVelDeg * dt) % 360;
    }

    //turn the wheels
    let steerInput = 0;
    if (car.left && !car.right) {
        steerInput = 1;
    }
    else if (car.right && !car.left) {
        steerInput = -1;
    }

    //Steering angle degrees
    if (steerInput != 0){
        car.steerAngle += steerInput * steerRate * dt; //deg

        if (car.steerAngle > maxSteer) car.steerAngle = maxSteer;
        if (car.steerAngle < -maxSteer) car.steerAngle = -maxSteer;
    }

    //yaw
    const wheelBase = 1.5;
    if (car.speed != 0) {
        const distance = car.speed * dt;
        const steerRad = car.steerAngle * Math.PI / 180;
        const yawRad   = car.yaw * Math.PI / 180;

        // Forward unit vector
        const fwdX = -Math.sin(yawRad);
        const fwdZ = -Math.cos(yawRad);

        // Get front axle world position from current center point
        let xr = car.xLoc - (wheelBase * 0.5) * fwdX;
        let zr = car.zLoc - (wheelBase * 0.5) * fwdZ;

        //Heading change
        const dYaw = (distance / wheelBase) * Math.tan(steerRad); // radians

        // midpoint heading for translation
        const yawMid = yawRad + 0.5 * dYaw;
        const fwdMidX = -Math.sin(yawMid);
        const fwdMidZ = -Math.cos(yawMid);

        // Move the REAR axle along the body axis
        xr += distance * fwdMidX;
        zr += distance * fwdMidZ;

        // Commit new heading
        const yawNew = yawRad + dYaw;
        car.yaw = yawNew * 180 / Math.PI;

        // Recompute center point from the updated front axle
        const fwdNewX = -Math.sin(yawNew);
        const fwdNewZ = -Math.cos(yawNew);
        let nextX: number = xr + (wheelBase * 0.5) * fwdNewX;
        let nextZ: number = zr + (wheelBase * 0.5) * fwdNewZ;

        if (Math.abs(nextX) > 9 || Math.abs(nextZ) > 9) {
            car.speed = 0;

            nextX = Math.max(-10, Math.min(10,nextX))
            nextZ = Math.max(-10, Math.min(10,nextZ))
        }

        car.xLoc = nextX;
        car.zLoc = nextZ;
    }

    requestAnimationFrame(render);
}

function render(){
    //start by clearing any previous data for both color and depth
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

    gl.uniform4fv(ambient_light, [.2, .2, .2, 1]);

    let view:mat4 = makeCameras(gl, uproj, canvas, car, headAngle, fov, dolly, whichCam, camFocus);

    /*
        Apologies for the functions with a ton of parameters, it makes sense to me to
        split them up in this way so that render isn't so cluttered.
     */

    makeLights(gl, program, view, car, headLightBool, bigLightBool, emerLightBool);

    startIndex = 0;
    drawBackground(view, gl, umv, bufferId, startIndex, numGroundPts, vAmbientDiffuseColor, vSpecularColor, vSpecularExponent);

    startIndex += numGroundPts;
    drawWheels(view, car, gl, umv, bufferId, startIndex, numWheelPts, vAmbientDiffuseColor, vSpecularColor, vSpecularExponent);

    startIndex += numWheelPts;
    drawCubes(view, car, gl, umv, bufferId, headAngle, startIndex, numCubePts, vAmbientDiffuseColor, vSpecularColor, vSpecularExponent);

    startIndex += numCubePts;
    drawSpheres(view, gl, umv, bufferId, startIndex, numSpherePts+10, vAmbientDiffuseColor, vSpecularColor, vSpecularExponent);
}



