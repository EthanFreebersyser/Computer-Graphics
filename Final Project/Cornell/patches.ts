import {vec3, vec4} from './helperfunctions.js';

export interface Patch {
    center: vec4;
    normal: vec4;
    area: number;
    rho: vec3;
    emission: vec3;
}

export let patches: Patch[] = [];

export let patchIndexPerVertex: number [] = [];

export function resetPatches() {
    patches = [];
    patchIndexPerVertex = [];
}

export function makeF(): Float32Array {
    const numOfPatchs: number = patches.length;

    const F: Float32Array = new Float32Array(numOfPatchs * numOfPatchs);

    const normals: vec4[] = new Array(numOfPatchs);
    for (let i: number = 0; i < numOfPatchs; i++) {
        normals[i] = patches[i].normal.normalize();
    }

    // skip very small contributions
    const MIN_CONTRIBUTION = 0.0001;

    for (let i: number = 0; i < numOfPatchs; i++) {
        const Pi: vec4 = patches[i].center;
        const Ni: vec4 = normals[i];
        const Pi0: number = Pi[0], Pi1: number  = Pi[1], Pi2: number  = Pi[2];
        const Ni0: number = Ni[0], Ni1: number  = Ni[1], Ni2: number  = Ni[2];

        for (let j: number = i + 1; j < numOfPatchs; j++) { //only do upper tri
            const Pj: vec4 = patches[j].center;
            const Nj: vec4 = normals[j]

            const dx: number = Pj[0] - Pi0;
            const dy: number = Pj[1] - Pi1;
            const dz: number = Pj[2] - Pi2;

            const r2: number = dx*dx + dy*dy + dz*dz;
            if (r2 < 0.00001) continue;

            const r: number = Math.sqrt(r2);
            const invR: number = 1.0 / r;

            // Normalized direction
            const dirX: number = dx * invR;
            const dirY: number = dy * invR;
            const dirZ: number = dz * invR;

            // Cosines using dot products
            const cosThetaI: number = Ni0*dirX + Ni1*dirY + Ni2*dirZ;
            if (cosThetaI <= 0) continue;

            const cosThetaJ: number = -(Nj[0]*dirX + Nj[1]*dirY + Nj[2]*dirZ);
            if (cosThetaJ <= 0) continue;

            const geomTerm: number = (cosThetaI * cosThetaJ) / (Math.PI * r2);

            // F[i][j] - how much j contributes to i
            const Fij: number = geomTerm * patches[j].area;
            if (Fij > MIN_CONTRIBUTION) {
                F[i * numOfPatchs + j] = Fij;
            }

            // F[j][i] - how much i contributes to j (reciprocity)
            const Fji: number = geomTerm * patches[i].area;
            if (Fji > MIN_CONTRIBUTION) {
                F[j * numOfPatchs + i] = Fji;
            }
        }
    }

    return F;
}

