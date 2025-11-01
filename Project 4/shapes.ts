
let allPts:vec4[] = [];

import {vec4, flatten} from './helperfunctions.js';

export function makeGround(){
    let groundPts:vec4[] = [];
    let groundY: number = -0.25;
    // Upward normal; w = 0.0 since it's a direction
    const groundNormal = new vec4(0.0, 1.0, 0.0, 0.0);

    //Triangle 1
    groundPts.push(new vec4(-1.0, groundY, -1.0, 1.0));
    groundPts.push(groundNormal);
    groundPts.push(new vec4(1.0, groundY, -1.0, 1.0));
    groundPts.push(groundNormal);
    groundPts.push(new vec4(1.0, groundY, 1.0, 1.0));
    groundPts.push(groundNormal);

    //Triangle 2
    groundPts.push(new vec4(-1.0, groundY, -1.0, 1.0));
    groundPts.push(groundNormal);
    groundPts.push(new vec4(1.0, groundY, 1.0, 1.0));
    groundPts.push(groundNormal);
    groundPts.push(new vec4(-1.0, groundY, 1.0, 1.0));
    groundPts.push(groundNormal);

    for (let pt of groundPts) {
        allPts.push(pt);
    }

    return groundPts.length / 2;
}

export function makeWheel(slices: number){
    let wheelPts:vec4[] = [];

    const radius: number = 0.25;
    const width: number = 0.125;
    const centerTop = new vec4(0, width/2, 0, 1.0);
    const centerBottom = new vec4(0, -width/2, 0, 1.0);

    // cap normals
    const nTop = new vec4(0,1,0,1.0);
    const nBottom = new vec4(0,-1,0,1.0);


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

        //side normals
        const nStart = new vec4(rimXStart / radius, 0.0, rimZStart / radius, 0.0);
        const nEnd = new vec4(rimXEnd / radius, 0.0 , rimZEnd / radius,0.0);

        //Side: 2 Triangles
        //triangle 1
        wheelPts.push(bottomRimStart);
        wheelPts.push(nStart);
        wheelPts.push(bottomRimEnd);
        wheelPts.push(nEnd);
        wheelPts.push(topRimEnd);
        wheelPts.push(nEnd);

        //triangle 2
        wheelPts.push(bottomRimStart);
        wheelPts.push(nStart);
        wheelPts.push(topRimEnd);
        wheelPts.push(nEnd);
        wheelPts.push(topRimStart);
        wheelPts.push(nStart);

        //Top Cap
        //triangle 3
        wheelPts.push(centerTop);
        wheelPts.push(nTop);
        wheelPts.push(topRimStart);
        wheelPts.push(nTop);
        wheelPts.push(topRimEnd);
        wheelPts.push(nTop);

        //Bottom Cap
        //triangle 4
        wheelPts.push(centerBottom);
        wheelPts.push(nBottom);
        wheelPts.push(bottomRimEnd);
        wheelPts.push(nBottom);
        wheelPts.push(bottomRimStart);
        wheelPts.push(nBottom);

    }

    for (let pt of wheelPts) {
        allPts.push(pt);
    }

    return wheelPts.length / 2; //number of vertices in the wheel
}

export function makeCube(){
    let cubePts:vec4[] = [];
    // Face normals
    const nFront = new vec4( 0,  0,  1, 0); // +Z
    const nBack  = new vec4( 0,  0, -1, 0); // -Z
    const nLeft  = new vec4( 1,  0,  0, 0); // +X
    const nRight  = new vec4(-1,  0,  0, 0); // -X
    const nTop  = new vec4( 0,  1,  0, 0); // +Y (top)
    const nBottom  = new vec4( 0, -1,  0, 0); // -Y (bottom)

    //front face = 6 verts, position then normal
    cubePts.push(new vec4(1.0, -1.0, 1.0, 1.0));
    cubePts.push(nFront);
    cubePts.push(new vec4(1.0, 1.0, 1.0, 1.0));
    cubePts.push(nFront);
    cubePts.push(new vec4(-1.0, 1.0, 1.0, 1.0));
    cubePts.push(nFront);
    cubePts.push(new vec4(-1.0, 1.0, 1.0, 1.0));
    cubePts.push(nFront);
    cubePts.push(new vec4(-1.0, -1.0, 1.0, 1.0));
    cubePts.push(nFront);
    cubePts.push(new vec4(1.0, -1.0, 1.0, 1.0));
    cubePts.push(nFront);

    //back face
    cubePts.push(new vec4(-1.0, -1.0, -1.0, 1.0));
    cubePts.push(nBack);
    cubePts.push(new vec4(-1.0, 1.0, -1.0, 1.0));
    cubePts.push(nBack);
    cubePts.push(new vec4(1.0, 1.0, -1.0, 1.0));
    cubePts.push(nBack);
    cubePts.push(new vec4(1.0, 1.0, -1.0, 1.0));
    cubePts.push(nBack);
    cubePts.push(new vec4(1.0, -1.0, -1.0, 1.0));
    cubePts.push(nBack);
    cubePts.push(new vec4(-1.0, -1.0, -1.0, 1.0));
    cubePts.push(nBack);

    //left face
    cubePts.push(new vec4(1.0, 1.0, 1.0, 1.0));
    cubePts.push(nLeft);
    cubePts.push(new vec4(1.0, -1.0, 1.0, 1.0));
    cubePts.push(nLeft);
    cubePts.push(new vec4(1.0, -1.0, -1.0, 1.0));
    cubePts.push(nLeft);
    cubePts.push(new vec4(1.0, -1.0, -1.0, 1.0));
    cubePts.push(nLeft);
    cubePts.push(new vec4(1.0, 1.0, -1.0, 1.0));
    cubePts.push(nLeft);
    cubePts.push(new vec4(1.0, 1.0, 1.0, 1.0));
    cubePts.push(nLeft);

    //right face
    cubePts.push(new vec4(-1.0, 1.0, -1.0, 1.0));
    cubePts.push(nRight);
    cubePts.push(new vec4(-1.0, -1.0, -1.0, 1.0));
    cubePts.push(nRight);
    cubePts.push(new vec4(-1.0, -1.0, 1.0, 1.0));
    cubePts.push(nRight);
    cubePts.push(new vec4(-1.0, -1.0, 1.0, 1.0));
    cubePts.push(nRight);
    cubePts.push(new vec4(-1.0, 1.0, 1.0, 1.0));
    cubePts.push(nRight);
    cubePts.push(new vec4(-1.0, 1.0, -1.0, 1.0));
    cubePts.push(nRight);

    //top
    cubePts.push(new vec4(1.0, 1.0, 1.0, 1.0));
    cubePts.push(nTop);
    cubePts.push(new vec4(1.0, 1.0, -1.0, 1.0));
    cubePts.push(nTop);
    cubePts.push(new vec4(-1.0, 1.0, -1.0, 1.0));
    cubePts.push(nTop);
    cubePts.push(new vec4(-1.0, 1.0, -1.0, 1.0));
    cubePts.push(nTop);
    cubePts.push(new vec4(-1.0, 1.0, 1.0, 1.0));
    cubePts.push(nTop);
    cubePts.push(new vec4(1.0, 1.0, 1.0, 1.0));
    cubePts.push(nTop);

    //bottom
    cubePts.push(new vec4(1.0, -1.0, -1.0, 1.0));
    cubePts.push(nBottom);
    cubePts.push(new vec4(1.0, -1.0, 1.0, 1.0));
    cubePts.push(nBottom);
    cubePts.push(new vec4(-1.0, -1.0, 1.0, 1.0));
    cubePts.push(nBottom);
    cubePts.push(new vec4(-1.0, -1.0, 1.0, 1.0));
    cubePts.push(nBottom);
    cubePts.push(new vec4(-1.0, -1.0, -1.0, 1.0));
    cubePts.push(nBottom);
    cubePts.push(new vec4(1.0, -1.0, -1.0, 1.0));
    cubePts.push(nBottom);

    for (let pt of cubePts) {
        allPts.push(pt);
    }

    return cubePts.length / 2;
}

export function makeSphere(subdiv:number): number{
    let spherePts = [];
    let step:number = (360.0 / subdiv)*(Math.PI / 180.0);

    for (let lat:number = 0; lat <= Math.PI ; lat += step){ //latitude
        for (let lon:number = 0; lon + step <= 2*Math.PI; lon += step){ //longitude
            //triangle 1
            spherePts.push(new vec4(Math.sin(lat) * Math.sin(lon) ,Math.cos(lat) , Math.cos(lon) * Math.sin(lat), 1.0));
            spherePts.push(new vec4(Math.sin(lat) * Math.sin(lon), Math.cos(lat),Math.cos(lon) * Math.sin(lat),  0.0));
            spherePts.push(new vec4(Math.sin(lat) * Math.sin(lon + step), Math.cos(lat),Math.sin(lat) * Math.cos(lon + step),  1.0));
            spherePts.push(new vec4(Math.sin(lat) * Math.sin(lon + step),  Math.cos(lat),Math.sin(lat) * Math.cos(lon + step), 0.0));
            spherePts.push(new vec4(Math.sin(lat + step) * Math.sin(lon + step), Math.cos(lat + step),Math.cos(lon + step) * Math.sin(lat + step),  1.0));
            spherePts.push(new vec4(Math.sin(lat + step) * Math.sin(lon + step), Math.cos(lat + step),Math.cos(lon + step) * Math.sin(lat + step),  0.0));

            //triangle 2
            spherePts.push(new vec4(Math.sin(lat + step) * Math.sin(lon + step),  Math.cos(lat + step),Math.cos(lon + step) * Math.sin(lat + step), 1.0));
            spherePts.push(new vec4(Math.sin(lat + step) * Math.sin(lon + step),  Math.cos(lat + step),Math.cos(lon + step) * Math.sin(lat + step), 0.0));
            spherePts.push(new vec4(Math.sin(lat + step) * Math.sin(lon), Math.cos(lat + step),Math.sin(lat + step) * Math.cos(lon),  1.0));
            spherePts.push(new vec4(Math.sin(lat + step) * Math.sin(lon), Math.cos(lat + step), Math.sin(lat + step) * Math.cos(lon), 0.0));
            spherePts.push(new vec4(Math.sin(lat) * Math.sin(lon), Math.cos(lat),Math.cos(lon) * Math.sin(lat),  1.0));
            spherePts.push(new vec4(Math.sin(lat) * Math.sin(lon),  Math.cos(lat),Math.cos(lon) * Math.sin(lat), 0.0));
        }
    }

    for (let pt of spherePts) {
        allPts.push(pt);
    }

    return spherePts.length / 2;
}

export function buildBuffer(gl: WebGLRenderingContext, bufferId: WebGLBuffer, vPosition: GLint, vNormal: GLint){
    gl.disableVertexAttribArray(vPosition); //incase the indices change
    gl.disableVertexAttribArray(vNormal);

    bufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(allPts), gl.STATIC_DRAW);

    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 32, 0);
    gl.enableVertexAttribArray(vPosition);

    gl.vertexAttribPointer(vNormal, 4, gl.FLOAT, false, 32, 16);
    gl.enableVertexAttribArray(vNormal);
}

