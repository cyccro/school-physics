import * as babylon from "babylonjs";
import { engine, scene as gscene } from "./globals";
import { rad } from "./math";

export class AstroCamera {
  camera: babylon.ArcRotateCamera;
  look_at_target: babylon.Nullable<babylon.Vector3> = null;
  protected update_state = 0;
  protected last_target = new babylon.Vector3(0, 0, 0);
  protected rotate_speed = 0.1;
  protected dist = 0;
  constructor(engine: babylon.Engine, astro?: Astro) {
    this.camera = new babylon.ArcRotateCamera('camera', Math.PI / 4, Math.PI / 3, 8, astro ? astro.position : babylon.Vector3.Zero());
    this.camera.attachControl(engine.getRenderingCanvas(), true);
  }
  look_at(target: babylon.Vector3) {

    this.look_at_target = target;
    this.last_target = this.camera.target;
    this.dist = babylon.Vector3.DistanceSquared(this.camera.target, target);
  }
  update() {
    if (!this.look_at_target) return;
    this.camera.setTarget(babylon.Vector3.Lerp(this.last_target, this.look_at_target, this.update_state += this.rotate_speed));
    this.rotate_speed = (this.dist / (this.dist + this.update_state + this.rotate_speed)) / 90;
    if (this.update_state >= 0.99) { //due to f64 imprecision
      this.update_state = 0;
      this.look_at_target = null;
      this.rotate_speed = 0.1;
      this.dist = 0;
    }
  }
}

export class Astro {
  static astros: Array<Astro> = new Array(0);
  static constant = 6.67 //6.67e-11 but for avoiding precision, everything will be ne+11 bigger;
  static camera: AstroCamera = new AstroCamera(engine);
  name = "astro";
  mesh: babylon.Mesh;
  direction = babylon.Vector3.Zero();
  is_worm = false;
  worm_parent: babylon.Nullable<Wormhole> = null;
  constructor(material: babylon.Material, public mass: number, public r: number = mass * 5, scene = gscene) {
    (this.mesh = babylon.MeshBuilder.CreateSphere(this.name, {
      diameter: r,
      segments: 5
    }, scene)).material = material;
    Astro.astros.push(this);
  }
  get position(): babylon.Vector3 {
    return this.mesh.position;
  }
  set position(v: Vector3) {
    this.mesh.position.set(v.x, v.y, v.z);
  }
  gforce(other: Astro): number { //gravity force
    return Astro.constant * this.mass * other.mass / babylon.Vector3.DistanceSquared(this.position, other.position); //G(m1(m2))/d²
  }

  attract(other: Astro, dt: number) {
    if (this.is_worm && other.is_worm) return;
    const force = this.gforce(other);
    if (force > 0.5) {
      const attractor = this.mass >= other.mass ? this : other;
      const attracted = this.mass >= other.mass ? other : this;
      attracted.mesh.rotateAround(attractor.position, babylon.Vector3.Up(), rad);
      attracted.position.addInPlace(attractor.position.subtract(attracted.position).normalize().scale(force * dt));
      if (!attracted.is_worm && attractor.is_worm) {
        const parent = attractor.worm_parent!;
        if (babylon.Vector3.DistanceSquared(attracted.position, attractor.position) <= attractor.r ** 2) {
          const vec = attracted.position.normalize().scale(attractor.r / 2).add(parent.b == attractor ? parent.a.position : parent.b.position);
          attracted.position.set(vec.x, vec.y, vec.z);
        }
      }
    }
  }
}
export class Wormhole {
  static material(n: number) {
    const material = new babylon.StandardMaterial('wormhole', gscene);
    material.wireframe = true;
    material.diffuseColor = new babylon.Color3((n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff);
    return material;
  }
  a = new Astro(Wormhole.material(0xff0000), 200, 50);
  b = new Astro(Wormhole.material(0x0000ff), 200, 50);
  constructor(a: babylon.Vector3, b: babylon.Vector3) {
    this.a.position.set(a.x, a.y, a.z);
    this.b.position.set(b.x, b.y, b.z);
    this.a.is_worm = this.b.is_worm = true;
    this.a.worm_parent = this.b.worm_parent = this;
  }
}
