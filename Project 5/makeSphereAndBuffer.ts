import {initFileShaders, perspective, vec2, vec4, mat4, flatten, lookAt, translate,rotateX, rotateY} from '../helperfunctions.js';

//shader variable indices for material properties
let vPosition:GLint;
let vTexCoord:GLint;

let allPts:any[] = [];
let numOfPts:number;

export function makeBuffer(gl: WebGLRenderingContext, program: WebGLProgram) {
    numOfPts = makeSphere(31);

    let bufferID:WebGLBuffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, bufferID);

    gl.bufferData(gl.ARRAY_BUFFER, flatten(allPts), gl.STATIC_DRAW);

    vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 32, 0); //stride is 24 bytes total for position, texcoord
    gl.enableVertexAttribArray(vPosition);

    vTexCoord = gl.getAttribLocation(program, "texCoord");
    gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 32, 16); //stride is 24 bytes total for position, texcoord
    gl.enableVertexAttribArray(vTexCoord);

    return numOfPts;
}

function makeSphere(subdiv:number): number{
    let spherePts:any[] = [];
    let step:number = (360.0 / subdiv)*(Math.PI / 180.0);

    for (let lat:number = 0; lat <= Math.PI ; lat += step){ //latitude
        for (let lon:number = 0; lon + step <= 2*Math.PI; lon += step){ //longitude
            const lat0 = lat;
            const lat1 = lat + step;
            const lon0 = lon;
            const lon1 = lon + step;

            //first tri: (lat0,lon0) -> (lat1,lon0) -> (lat1,lon1)
            spherePts.push(position(lat0, lon0));
            spherePts.push(texCoord(lat0, lon0));

            spherePts.push(position(lat1, lon0));
            spherePts.push(texCoord(lat1, lon0));

            spherePts.push(position(lat1, lon1));
            spherePts.push(texCoord(lat1, lon1));

            //second tri: (lat0,lon0) -> (lat1,lon1) -> (lat0,lon1)
            spherePts.push(position(lat0, lon0));
            spherePts.push(texCoord(lat0, lon0));

            spherePts.push(position(lat1, lon1));
            spherePts.push(texCoord(lat1, lon1));

            spherePts.push(position(lat0, lon1));
            spherePts.push(texCoord(lat0, lon1));
        }
    }

    for (let pt of spherePts) {
        allPts.push(pt);
    }

    return spherePts.length / 2;
}

// Position on unit sphere
function position(lat: number, lon: number): vec4 {
    return new vec4(
        Math.sin(lat) * Math.sin(lon),
        Math.cos(lat),
        Math.cos(lon) * Math.sin(lat),
        1.0 // position: w = 1
    );
}

// Texture coordinates
function texCoord(lat: number, lon: number): vec4 {
    const u: number = (lon / (2.0 * Math.PI));
    const v: number = (lat / Math.PI);
    return new vec4(u, v, 0.0, 0.0); // store (u, v) in x,y
}