import './style.css';
import { scene, engine } from './globals';
import { Astro, Wormhole } from './astro';
import { Color3, IPointerEvent, PickingInfo, StandardMaterial, Vector3 } from 'babylonjs';

function pointer_down(_: IPointerEvent, result: PickingInfo) {
  if (result.hit) Astro.camera.look_at(result.pickedMesh!.position);
  //console.log(mesh);
}

function register_fns() {
  scene.onPointerDown = pointer_down;
}
let t = Date.now();
let len: number;
function loop_fn() {
  const dt = (-t + (t = Date.now())) / 1000;
  scene.render();
  Astro.camera.update();
  for (let i = 0; i < len; i++) {
    for (let j = 0; j < len; j++) {
      if (i == j) continue;
      Astro.astros[i].attract(Astro.astros[j], dt);
    }
  }
}

function earth_material() {
  const material = new StandardMaterial('earth', scene);
  material.diffuseColor = new Color3(1, 0, 0);
  return material;
}
function moon_material() {
  const material = new StandardMaterial('moon', scene);
  material.diffuseColor = new Color3(0, 0, 1);
  return material;
}
function main() {
  register_fns();
  const earth = new Astro('terra', earth_material(), 20, 5);
  earth.position.x += 40;
  //Astro.camera.lock_at(earth, 10);
  const moon = new Astro('moon', moon_material(), 10, 3);
  const worm = new Wormhole(new Vector3(0, 0, 500), new Vector3(100, 0, 0));
  len = Astro.astros.length;
  engine.runRenderLoop(loop_fn);
}
main();
