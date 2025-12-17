import {patches, makeF, patchIndexPerVertex} from "./patches.js";

export function radToRGB(): Float32Array{
    let B: Float32Array = solveRad(10);

    let radRGB: Float32Array = new Float32Array(3 * patches.length);

    for (let i: number = 0; i < patches.length; i++) {
        const Bi: number = B[i];

        radRGB[3 * i] = Bi;
        radRGB[3 * i + 1] = Bi;
        radRGB[3 * i + 2] = Bi;
    }

    return radRGB;
}

function solveRad(iters: number): Float32Array {
    let B: Float32Array = new Float32Array(patches.length)
    let E: Float32Array = makeE()
    let rho: Float32Array = makeRho()
    let F: number[][] = makeF();

    for (let i: number = 0; i < patches.length; i++) {
        B[i] = E[i];
    }

    for (let i: number = 0; i < iters; i++) {
        for (let j: number = 0; j < patches.length; j++) {
            let sum: number = 0.0;
            for (let k: number = 0; k < patches.length; k++) {
                sum += F[k][j] * B[k];
            }
            B[j] = E[j] + rho[j] * sum;
        }
    }

    return B;
}

function makeE(): Float32Array {
    let E: Float32Array = new Float32Array(patches.length);

    for (let i: number = 0; i < patches.length; i++) {
        E[i] = 0.0;
    }
    //light source
    E[0] = 3.0;

    return E;
}

function makeRho(): Float32Array {
    let rho: Float32Array = new Float32Array(patches.length);

    for (let i: number = 0; i < patches.length; i++) {
        rho[i] = 1.5;
    }
    //light source
    rho[0] = 0.0;

    return rho;
}