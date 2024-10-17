import './style.css';
import { scene, engine } from './globals';
import { Astro, LightAstro, Wormhole } from './astro';
import { IPointerEvent, PickingInfo, Vector3 } from 'babylonjs';

function pointer_down(_: IPointerEvent, result: PickingInfo) {
  if (result.hit) Astro.camera.lock_at(result.pickedMesh!.position);
  //console.log(mesh);
}

function register_fns() {
  scene.onPointerDown = pointer_down;
}
let t = Date.now();
let len: number;
function loop_fn() {
  let now = Date.now();
  const dt = (now - t) * 0.001;
  t = now;
  scene.render();
  Astro.camera.update(dt);
  for (const i of Astro.astros) for (const j of Astro.astros) if (i == j) continue; else i.attract(j, dt);
}
function main() {
  register_fns();
  const sun = new LightAstro('sunny', 50, 50);
  sun.position = new Vector3(0, 0, 300);

  const earth = new Astro('earth', 12, 12);
  earth.position = new Vector3(0, 0, 273);

  const mars = new Astro('mars', 6, 6);
  mars.position = new Vector3(0, 0, 250);

  const worm = new Wormhole(new Vector3(0, 0, 500), new Vector3(1200, 0, 0));

  Astro.camera.camera.position = new Vector3(0, 50, -50);
  Astro.camera.lock_at(sun.position);
  len = Astro.astros.length;

  engine.runRenderLoop(loop_fn);
}
main();
