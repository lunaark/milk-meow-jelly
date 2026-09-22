import { makeVolumeMesh, repairRemoval } from '../physics/mesh.ts';
import type { VolumeMesh } from '../physics/mesh.ts';
import type { Bite } from '../physics/soft-body.ts';
import { PuddingSurface } from './surface.ts';

export interface Chunk { mesh:VolumeMesh; skin:PuddingSurface; positions:Float32Array }

/**
 * Builds the visible surface of a bite, frozen at the deformed positions it had when it was cut.
 * When removal also eats edge-touching crumbs, show the closed main piece on the spoon.
 * Those crumbs remain eaten; repair only discards cells and never invents uneaten material.
 */
export function buildChunk(bite:Bite):Chunk|null {
  const {mesh,position}=bite.source,keep=new Set(bite.cells),removed:number[]=[];
  for(let c=0;c<mesh.n*mesh.n*mesh.layers;c++)if(!keep.has(c))removed.push(c);
  function build():Chunk {
    const chunk=makeVolumeMesh(mesh.n,mesh.layers,removed),skin=new PuddingSurface(chunk);
    const p=new Float64Array(chunk.rest.length);
    for(let i=0;i<chunk.nodeIds.length;i++) {
      const j=mesh.lookup[chunk.nodeIds[i]];
      for(let k=0;k<3;k++)p[i*3+k]=j>=0?position[j*3+k]:chunk.rest[i*3+k];
    }
    skin.update(p,p,1);
    return {mesh:chunk,skin,positions:skin.positions.slice()};
  }
  try {
    return build();
  } catch {
    // The remaining pudding is repaired by scoop(), but its complement can still
    // have non-manifold edge/vertex contacts. Repair that separate display piece.
    try {
      const repaired=new Set(removed);
      repairRemoval(mesh.n,mesh.layers,repaired,cell=>mesh.cellVolumes[cell]);
      if(repaired.size===mesh.n*mesh.n*mesh.layers)return null;
      removed.splice(0,removed.length,...repaired);
      return build();
    } catch { return null; }
  }
}
