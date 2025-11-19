import {initFileShaders, perspective, vec2, vec4, mat4, flatten, lookAt, translate,rotateX, rotateY} from '../helperfunctions.js';

//shader variable indices for material properties
let vPosition:GLint;
let vNormal:GLint;
let vTangent:GLint;
let vTexCoord:GLint;

let allPts:any[] = [];
let numOfPts:number;

export function makeBuffer(gl: WebGLRenderingContext, program: WebGLProgram, subdiv:number, radius:number) {
    numOfPts = makeSphere(subdiv,radius);

    let bufferID:WebGLBuffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, bufferID);

    gl.bufferData(gl.ARRAY_BUFFER, flatten(allPts), gl.STATIC_DRAW);

    vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 64, 0); //stride is 56 bytes total for position, normal, tangent texcoord
    gl.enableVertexAttribArray(vPosition);

    vNormal = gl.getAttribLocation(program, "vNormal");
    gl.vertexAttribPointer(vNormal, 4, gl.FLOAT, false, 64, 16);
    gl.enableVertexAttribArray(vNormal);

    vTangent = gl.getAttribLocation(program, "vTangent");
    gl.vertexAttribPointer(vTangent, 4, gl.FLOAT, false, 64, 32);
    gl.enableVertexAttribArray(vTangent);

    vTexCoord = gl.getAttribLocation(program, "vTexCoord");
    gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 64, 48);
    gl.enableVertexAttribArray(vTexCoord);

    return numOfPts;
}

function makeSphere(subdiv:number, radius: number): number{
    let spherePts:any[] = [];
    let step:number = (360.0 / subdiv)*(Math.PI / 180.0);

    for (let lat:number = 0; lat <= Math.PI ; lat += step){ //latitude
        for (let lon:number = 0; lon + step <= 2*Math.PI; lon += step){ //longitude
            const lat0 = lat;
            const lat1 = lat + step;
            const lon0 = lon;
            const lon1 = lon + step;

            //first tri: (lat0,lon0) -> (lat1,lon0) -> (lat1,lon1)
            spherePts.push(position(lat0, lon0, radius));
            spherePts.push(normal(lat0, lon0));
            spherePts.push(tangent(lat0, lon0));
            spherePts.push(texCoord(lat0, lon0));

            spherePts.push(position(lat1, lon0, radius));
            spherePts.push(normal(lat1, lon0));
            spherePts.push(tangent(lat1, lon0));
            spherePts.push(texCoord(lat1, lon0));

            spherePts.push(position(lat1, lon1, radius));
            spherePts.push(normal(lat1, lon1));
            spherePts.push(tangent(lat1, lon1));
            spherePts.push(texCoord(lat1, lon1));

            //second tri: (lat0,lon0) -> (lat1,lon1) -> (lat0,lon1)
            spherePts.push(position(lat0, lon0, radius));
            spherePts.push(normal(lat0, lon0));
            spherePts.push(tangent(lat0, lon0));
            spherePts.push(texCoord(lat0, lon0));

            spherePts.push(position(lat1, lon1, radius));
            spherePts.push(normal(lat1, lon1));
            spherePts.push(tangent(lat1, lon1));
            spherePts.push(texCoord(lat1, lon1));

            spherePts.push(position(lat0, lon1,radius));
            spherePts.push(normal(lat0, lon1));
            spherePts.push(tangent(lat0, lon1));
            spherePts.push(texCoord(lat0, lon1));
        }
    }

    for (let pt of spherePts) {
        allPts.push(pt);
    }

    return spherePts.length / 4;
}

//Position coordinates
function position(lat: number, lon: number, radius: number): vec4 {
    return new vec4(
        radius * Math.sin(lat) * Math.sin(lon),
        radius * Math.cos(lat),
        radius * Math.cos(lon) * Math.sin(lat),
        1.0 // position: w = 1
    );
}

//Normal coordinates
function normal(lat: number, lon: number): vec4 {
    return new vec4(
        Math.sin(lat) * Math.sin(lon),
        Math.cos(lat),
        Math.cos(lon) * Math.sin(lat),
        0.0 // normal: w = 1
    )
}

//Tangent coordinates
function tangent(lat: number, lon: number): vec4 {

    //lon undef at poles
    if (Math.abs(Math.sin(lat)) < 0.001){
        return new vec4(0.0,0.0,0.0,0.0);
    }

    let tx = Math.sin(lat) * Math.cos(lon);
    let ty = 0.0;
    let tz = -Math.sin(lat) * Math.sin(lon);

    const len = Math.sqrt(tx * tx + ty * ty + tz * tz);

    //normalize
    tx /= len;
    ty /= len;
    tz /= len;

    return new vec4(tx,ty,tz,0.0); // tangent: w = 0
}

//Texture coordinates
function texCoord(lat: number, lon: number): vec4 {
    const u: number = (lon / (2.0 * Math.PI));
    const v: number = (lat / Math.PI);
    return new vec4(u, v, 0.0, 0.0); // store (u, v) in x,y
}