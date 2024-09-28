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
function loop_fn() {
  const dt = (-t + (t = Date.now())) / 1000;
  scene.render();
  Astro.camera.update();
  for (let i = 0, j = Astro.astros.length - 1; i < j; i++) {
    const astro = Astro.astros[i];
    if (i == 0) {
      astro.attract(Astro.astros[Astro.astros.length - 1], dt);
    } else {
      astro.attract(Astro.astros[i + 1], dt);
    }
  }
}

function earth_material() {
  const material = new StandardMaterial('earth', scene);
  material.ambientColor = new Color3(1, 0, 0);
  return material;
}
function moon_material() {
  const material = new StandardMaterial('moon', scene);
  material.ambientColor = new Color3(0, 0, 1);
  return material;
}
function main() {
  register_fns();
  const earth = new Astro(earth_material(), 20, 5);
  const moon = new Astro(moon_material(), 10, 3);
  const worm = new Wormhole(new Vector3(0, 0, 100), new Vector3(100, 0, 0));
  engine.runRenderLoop(loop_fn);
}
main();
