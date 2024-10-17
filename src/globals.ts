import { Scene, Engine, Texture, MeshBuilder, StandardMaterial, CubeTexture } from "babylonjs";
export function create_renderer() {
  const canvas = document.createElement('canvas');
  canvas.className = "renderer";
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);
  return canvas;
}
export function create_scene(engine: Engine) {
  const scene = new Scene(engine);
  const txt = new CubeTexture("/sky", scene, [
    "_px.png",
    "_py.png",
    "_pz.png",
    "_nx.png",
    "_ny.png",
    "_nz.png"
  ]);
  const box = MeshBuilder.CreateBox('skybox', { size: 8192 }, scene);
  box.infiniteDistance = true;
  const material = new StandardMaterial('skybox', scene);
  material.backFaceCulling = false;
  material.disableLighting = true;
  txt.coordinatesMode = Texture.SKYBOX_MODE;
  material.reflectionTexture = txt;
  box.material = material;
  box.isPickable = false;
  return scene;
}
export const engine = new Engine(create_renderer(), true);
export const scene = create_scene(engine);
