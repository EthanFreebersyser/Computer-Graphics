import {patches, makeF, patchIndexPerVertex} from "./patches.js";

export function radToRGB(F: Float32Array, iters: number = 100): Float32Array{
    const n: number = patches.length;

    const B_r = new Float32Array(n);
    const B_g = new Float32Array(n);
    const B_b = new Float32Array(n);

    // Initialize with emission
    for (let i: number = 0; i < n; i++) {
        B_r[i] = patches[i].emission[0];
        B_g[i] = patches[i].emission[1];
        B_b[i] = patches[i].emission[2];
    }

    // Pre-get rho values for speed
    const rho_r = new Float32Array(n);
    const rho_g = new Float32Array(n);
    const rho_b = new Float32Array(n);
    const emit_r = new Float32Array(n);
    const emit_g = new Float32Array(n);
    const emit_b = new Float32Array(n);

    for (let i: number = 0; i < n; i++) {
        rho_r[i] = patches[i].rho[0];
        rho_g[i] = patches[i].rho[1];
        rho_b[i] = patches[i].rho[2];
        emit_r[i] = patches[i].emission[0];
        emit_g[i] = patches[i].emission[1];
        emit_b[i] = patches[i].emission[2];
    }

    // Gauss-Seidel iteration
    for (let iter: number = 0; iter < iters; iter++) {
        for (let j: number = 0; j < n; j++) {
            let sum_r: number = 0.0;
            let sum_g: number = 0.0;
            let sum_b: number = 0.0;

            for (let k: number = 0; k < n; k++) {
                const Fkj: number= F[k * n + j];  // F[k][j]
                if (Fkj > 0) {
                    sum_r += Fkj * B_r[k];
                    sum_g += Fkj * B_g[k];
                    sum_b += Fkj * B_b[k];
                }
            }

            B_r[j] = emit_r[j] + rho_r[j] * sum_r;
            B_g[j] = emit_g[j] + rho_g[j] * sum_g;
            B_b[j] = emit_b[j] + rho_b[j] * sum_b;
        }
    }

    // Pack results
    const radRGB = new Float32Array(3 * n);
    for (let i: number = 0; i < n; i++) {
        radRGB[3*i]     = B_r[i];
        radRGB[3*i + 1] = B_g[i];
        radRGB[3*i + 2] = B_b[i];
    }

    return radRGB;
}




