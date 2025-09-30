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

type carState = {
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

const driveSpeed: number = 2;
const maxSteer: number = 45 ; //60 degrees
const steerRate: number = 90; //90 deg per sec

import {initShaders, vec4, vec3, mat4, flatten, perspective, translate, lookAt, rotateX, rotateY, rotateZ, scalem} from './helperfunctions.js';

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

    window.addEventListener("keydown", keyDownListener);

    window.addEventListener("keyup", keyUpListener);

    makeGroundWheelBodyBuffer();

    //background color
    gl.clearColor(0.55, 0.75, 0.95, 1.0); //light blue sky
    //gl.clearColor(0.0, 0.0, 0.0, 1.0); //Black

    //avoids having objects that are behind other objects show up anyway
    gl.enable(gl.DEPTH_TEST);

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
    }
}

//adds the ground, wheel and car body to the buffer and send to graphics card
function makeGroundWheelBodyBuffer(){
    let allPts:vec4[] = [];

    //<editor-fold desc="background pts">
    //start of the ground 0-6
        let groundPts:vec4[] = [];
        let groundY: number = -0.25;
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
    //start wheel 6-96
        let wheelPts:vec4[] = [];

        const radius: number = 0.25;
        const width: number = 0.125;
        const centerTop = new vec4(0, width/2, 0, 1.0);
        const centerBottom = new vec4(0, -width/2, 0, 1.0);
        const slices: number = 8;

        // two alternating color
        const wheelColor1:vec4 = new vec4(1, 0, 0, 1.0);
        const wheelColor2:vec4 = new vec4(0, 0, 1, 1.0);
        let colorChanger: boolean = true;

        for (let i: number = 0; i < slices; i++){
            //angles
            const angleStart: number = (2 * Math.PI * i) / slices;
            const angleEnd: number = (2 * Math.PI * (i+1)) / slices;

            //rim x,z locations
            const rimXStart: number = radius * Math.cos(angleStart);
            const rimZStart: number = radius * Math.sin(angleStart);
            const rimXEnd: number = radius * Math.cos(angleEnd);
            const rimZEnd: number  = radius * Math.sin(angleEnd);

            //rim start and ends
            const bottomRimStart = new vec4(rimXStart, -width/2, rimZStart,1.0);
            const bottomRimEnd = new vec4(rimXEnd, -width/2, rimZEnd,1.0);
            const topRimEnd = new vec4(rimXEnd, width/2, rimZEnd,1.0);
            const topRimStart = new vec4(rimXStart, width/2, rimZStart,1.0);

            //Side: 2 Triangles
                //triangle 1
                wheelPts.push(bottomRimStart);
                wheelPts.push(wheelColor1);
                wheelPts.push(bottomRimEnd);
                wheelPts.push(wheelColor1);
                wheelPts.push(topRimEnd);
                wheelPts.push(wheelColor1);

                //triangle 2
                wheelPts.push(bottomRimStart);
                wheelPts.push(wheelColor2);
                wheelPts.push(topRimEnd);
                wheelPts.push(wheelColor2);
                wheelPts.push(topRimStart);
                wheelPts.push(wheelColor2);

            let wheelColor: vec4;
            if (colorChanger){
                wheelColor = wheelColor1;
                colorChanger = !colorChanger;
            } else {
                wheelColor = wheelColor2
                colorChanger = !colorChanger;
            }
            //Top Cap
                //triangle 3
                wheelPts.push(centerTop);
                wheelPts.push(wheelColor);
                wheelPts.push(topRimStart);
                wheelPts.push(wheelColor);
                wheelPts.push(topRimEnd);
                wheelPts.push(wheelColor);

            //Bottom Cap
                //triangle 4
                wheelPts.push(centerBottom);
                wheelPts.push(wheelColor);
                wheelPts.push(bottomRimEnd);
                wheelPts.push(wheelColor);
                wheelPts.push(bottomRimStart);
                wheelPts.push(wheelColor);

        }

        for (let pt of wheelPts) {
            allPts.push(pt);
        }
    //end wheel
    //</editor-fold>

    //<editor-fold desc="body pts">
    //start body ?-?
        let cubepoints:vec4[] = [];
        //front face = 6 verts, position then color
        cubepoints.push(new vec4(1.0, -1.0, 1.0, 1.0));
        cubepoints.push(new vec4(0.0, 1.0, 1.0, 1.0)); //cyan
        cubepoints.push(new vec4(1.0, 1.0, 1.0, 1.0));
        cubepoints.push(new vec4(0.0, 1.0, 1.0, 1.0)); //cyan
        cubepoints.push(new vec4(-1.0, 1.0, 1.0, 1.0));
        cubepoints.push(new vec4(0.0, 1.0, 1.0, 1.0)); //cyan
        cubepoints.push(new vec4(-1.0, 1.0, 1.0, 1.0));
        cubepoints.push(new vec4(0.0, 1.0, 1.0, 1.0)); //cyan
        cubepoints.push(new vec4(-1.0, -1.0, 1.0, 1.0));
        cubepoints.push(new vec4(0.0, 1.0, 1.0, 1.0)); //cyan
        cubepoints.push(new vec4(1.0, -1.0, 1.0, 1.0));
        cubepoints.push(new vec4(0.0, 1.0, 1.0, 1.0)); //cyan

        //back face
        cubepoints.push(new vec4(-1.0, -1.0, -1.0, 1.0));
        cubepoints.push(new vec4(1.0, 0.0, 1.0, 1.0)); //magenta
        cubepoints.push(new vec4(-1.0, 1.0, -1.0, 1.0));
        cubepoints.push(new vec4(1.0, 0.0, 1.0, 1.0));//magenta
        cubepoints.push(new vec4(1.0, 1.0, -1.0, 1.0));
        cubepoints.push(new vec4(1.0, 0.0, 1.0, 1.0));//magenta
        cubepoints.push(new vec4(1.0, 1.0, -1.0, 1.0));
        cubepoints.push(new vec4(1.0, 0.0, 1.0, 1.0));//magenta
        cubepoints.push(new vec4(1.0, -1.0, -1.0, 1.0));
        cubepoints.push(new vec4(1.0, 0.0, 1.0, 1.0));//magenta
        cubepoints.push(new vec4(-1.0, -1.0, -1.0, 1.0));
        cubepoints.push(new vec4(1.0, 0.0, 1.0, 1.0));//magenta

        //left face
        cubepoints.push(new vec4(1.0, 1.0, 1.0, 1.0));
        cubepoints.push(new vec4(1.0, 1.0, 0.0, 1.0)); //yellow
        cubepoints.push(new vec4(1.0, -1.0, 1.0, 1.0));
        cubepoints.push(new vec4(1.0, 1.0, 0.0, 1.0)); //yellow
        cubepoints.push(new vec4(1.0, -1.0, -1.0, 1.0));
        cubepoints.push(new vec4(1.0, 1.0, 0.0, 1.0)); //yellow
        cubepoints.push(new vec4(1.0, -1.0, -1.0, 1.0));
        cubepoints.push(new vec4(1.0, 1.0, 0.0, 1.0)); //yellow
        cubepoints.push(new vec4(1.0, 1.0, -1.0, 1.0));
        cubepoints.push(new vec4(1.0, 1.0, 0.0, 1.0)); //yellow
        cubepoints.push(new vec4(1.0, 1.0, 1.0, 1.0));
        cubepoints.push(new vec4(1.0, 1.0, 0.0, 1.0)); //yellow

        //right face
        cubepoints.push(new vec4(-1.0, 1.0, -1.0, 1.0));
        cubepoints.push(new vec4(1.0, 0.0, 0.0, 1.0)); //red
        cubepoints.push(new vec4(-1.0, -1.0, -1.0, 1.0));
        cubepoints.push(new vec4(1.0, 0.0, 0.0, 1.0)); //red
        cubepoints.push(new vec4(-1.0, -1.0, 1.0, 1.0));
        cubepoints.push(new vec4(1.0, 0.0, 0.0, 1.0)); //red
        cubepoints.push(new vec4(-1.0, -1.0, 1.0, 1.0));
        cubepoints.push(new vec4(1.0, 0.0, 0.0, 1.0)); //red
        cubepoints.push(new vec4(-1.0, 1.0, 1.0, 1.0));
        cubepoints.push(new vec4(1.0, 0.0, 0.0, 1.0)); //red
        cubepoints.push(new vec4(-1.0, 1.0, -1.0, 1.0));
        cubepoints.push(new vec4(1.0, 0.0, 0.0, 1.0)); //red

        //top
        cubepoints.push(new vec4(1.0, 1.0, 1.0, 1.0));
        cubepoints.push(new vec4(0.0, 0.0, 1.0, 1.0)); //blue
        cubepoints.push(new vec4(1.0, 1.0, -1.0, 1.0));
        cubepoints.push(new vec4(0.0, 0.0, 1.0, 1.0)); //blue
        cubepoints.push(new vec4(-1.0, 1.0, -1.0, 1.0));
        cubepoints.push(new vec4(0.0, 0.0, 1.0, 1.0)); //blue
        cubepoints.push(new vec4(-1.0, 1.0, -1.0, 1.0));
        cubepoints.push(new vec4(0.0, 0.0, 1.0, 1.0)); //blue
        cubepoints.push(new vec4(-1.0, 1.0, 1.0, 1.0));
        cubepoints.push(new vec4(0.0, 0.0, 1.0, 1.0)); //blue
        cubepoints.push(new vec4(1.0, 1.0, 1.0, 1.0));
        cubepoints.push(new vec4(0.0, 0.0, 1.0, 1.0)); //blue

        //bottom
        cubepoints.push(new vec4(1.0, -1.0, -1.0, 1.0));
        cubepoints.push(new vec4(0.0, 1.0, 0.0, 1.0)); //green
        cubepoints.push(new vec4(1.0, -1.0, 1.0, 1.0));
        cubepoints.push(new vec4(0.0, 1.0, 0.0, 1.0)); //green
        cubepoints.push(new vec4(-1.0, -1.0, 1.0, 1.0));
        cubepoints.push(new vec4(0.0, 1.0, 0.0, 1.0)); //green
        cubepoints.push(new vec4(-1.0, -1.0, 1.0, 1.0));
        cubepoints.push(new vec4(0.0, 1.0, 0.0, 1.0)); //green
        cubepoints.push(new vec4(-1.0, -1.0, -1.0, 1.0));
        cubepoints.push(new vec4(0.0, 1.0, 0.0, 1.0)); //green
        cubepoints.push(new vec4(1.0, -1.0, -1.0, 1.0));
        cubepoints.push(new vec4(0.0, 1.0, 0.0, 1.0)); //green

        for (let pt of cubepoints) {
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

function update(){
    const dt: number = 1/60;

    //wheel spin
    if (car.speed != 0 ){
        const angVelDeg = (car.speed / 0.25) * 180 / Math.PI; //0.25 is wheel Radius
        car.wheelSpin = (car.wheelSpin + angVelDeg * dt) % 360;
    }

    //turn the wheels
    let steerInput = 0;
    if (car.left && !car.right) {
        steerInput = 1;
    } else if (car.right && !car.left) {
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

//draw a new frame
function render(){
    //start by clearing any previous data for both color and depth
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    //projection matrices
    let p:mat4 = perspective(45.0, canvas.clientWidth / canvas.clientHeight, 1.0, 100.0);
    gl.uniformMatrix4fv(uproj, false, p.flatten());

    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

    //OG model View Matrix
    let mvOG:mat4 = lookAt(new vec4(0,10,20,1), new vec4(0,0,0,1), new vec4(0,1,0,0));
    //<editor-fold desc="Draw Background">
        //model view matrix
        //lookAT parames: where is the camera? what is a location the camrea is looking at? what direction is up?
        let mv:mat4 = mvOG;

        //multiply matrix to the right of lookAt matrix
        mv = mv.mult(scalem(10, 1,10))

        //send over model view matrix as a uniform
        gl.uniformMatrix4fv(umv,false, mv.flatten());

        gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);

        gl.drawArrays(gl.TRIANGLES, 0, 6);    // draw the background 0-6
    //</editor-fold>

    //<editor-fold desc="Draw front left wheel">
        //model view matrix
        mv = mvOG

        //multiply matrix to the right of lookAt matrix
        mv = mv.mult(translate(car.xLoc, 0.0, car.zLoc));    // place wheel in world
        mv = mv.mult(rotateY(car.yaw));                         // orient wheel
        mv = mv.mult(translate(-0.5, 0, -0.75));          // move to this wheel hub
        mv = mv.mult(rotateY(car.steerAngle));                 // steer about car's up axis
        mv = mv.mult(rotateZ(90));                        // align cylinder's +Y to axle +X
        mv = mv.mult(rotateY(car.wheelSpin));                   // spin the wheel

        //send over model view matrix as a uniform
        gl.uniformMatrix4fv(umv,false, mv.flatten());

        gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);

        gl.drawArrays(gl.TRIANGLES, 6, 96);
    //</editor-fold>

    //<editor-fold desc="Draw front right wheel">
        //model view matrix
        mv = mvOG

        //multiply matrix to the right of lookAt matrix
        mv = mv.mult(translate(car.xLoc, 0.0, car.zLoc));    // place car in world
        mv = mv.mult(rotateY(car.yaw));                         // orient car
        mv = mv.mult(translate(0.5, 0, -0.75));          // move to this wheel hub
        mv = mv.mult(rotateY(car.steerAngle));                  // steer about car's up axis
        mv = mv.mult(rotateZ(90));                        // align cylinder's +Y to axle +X
        mv = mv.mult(rotateY(car.wheelSpin));                   // spin the wheel

        //send over model view matrix as a uniform
        gl.uniformMatrix4fv(umv,false, mv.flatten());

        gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);

        gl.drawArrays(gl.TRIANGLES, 6, 96);
    //</editor-fold>

    //<editor-fold desc="Draw back left wheel">
        //model view matrix
        mv = mvOG

        //multiply matrix to the right of lookAt matrix
        mv = mv.mult(translate(car.xLoc, 0.0, car.zLoc));    // place car in world
        mv = mv.mult(rotateY(car.yaw));                         // orient car
        mv = mv.mult(translate(-0.5, 0, 0.75));          // move to this wheel hub
        mv = mv.mult(rotateZ(90));                        // align cylinder's +Y to axle +X
        mv = mv.mult(rotateY(car.wheelSpin));                   // spin the wheel

        //send over model view matrix as a uniform
        gl.uniformMatrix4fv(umv,false, mv.flatten());

        gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);

        gl.drawArrays(gl.TRIANGLES, 6, 96);
    //</editor-fold>

    //<editor-fold desc="Draw back right wheel">
        //model view matrix
        mv = mvOG

        //multiply matrix to the right of lookAt matrix
        mv = mv.mult(translate(car.xLoc, 0.0, car.zLoc));    // place car in world
        mv = mv.mult(rotateY(car.yaw));                         // orient car
        mv = mv.mult(translate(0.5, 0, 0.75));          // move to this wheel hub
        mv = mv.mult(rotateZ(90));                        // align cylinder's +Y to axle +X
        mv = mv.mult(rotateY(car.wheelSpin));                   // spin the wheel


    //send over model view matrix as a uniform
        gl.uniformMatrix4fv(umv,false, mv.flatten());

        gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);

        gl.drawArrays(gl.TRIANGLES, 6, 96);
    //</editor-fold>

    //<editor-fold desc="Draw body">
        //model view matrix
        mv = mvOG

        //multiply matrix to the right of lookAt matrix
        mv = mv.mult(translate(car.xLoc, 0.2, car.zLoc));  // place car in world
        mv = mv.mult(rotateY(car.yaw));
        mv = mv.mult(scalem(.45, 0.25,0.75));       // orient car
        mv = mv.mult(translate(0, 0, 0));           // move to this wheel hub
        mv = mv.mult(rotateZ(90));                      // align cylinder's +Y to axle +X

    //send over model view matrix as a uniform
        gl.uniformMatrix4fv(umv,false, mv.flatten());

        gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);

        gl.drawArrays(gl.TRIANGLES, 6+96, 36);
    //</editor-fold>

}