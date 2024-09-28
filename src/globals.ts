import { Scene, Engine, HemisphericLight, Vector3, Color4 } from "babylonjs";

export function create_renderer() {
  const canvas = document.createElement('canvas');
  canvas.className = "renderer";
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);
  return canvas;
}
export const engine = new Engine(create_renderer(), true);
export const scene = new Scene(engine);
scene.clearColor = new Color4(0, 0, 0, 1);
new HemisphericLight('light', new Vector3(0, 10, 0), scene);
