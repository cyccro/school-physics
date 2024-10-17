import * as babylon from "babylonjs";
import { engine, scene as gscene } from "./globals";

export class AstroCamera {
  camera: babylon.ArcRotateCamera;
  look_at_target: babylon.Nullable<babylon.Vector3> = null;
  protected update_state = 0;
  protected last_target = new babylon.Vector3(0, 0, 0);
  protected rotate_speed = 0.1;
  protected dist = 0;
  public locked: babylon.Nullable<babylon.Vector3> = null;
  constructor(engine: babylon.Engine, astro?: Astro) {
    this.camera = new babylon.ArcRotateCamera('camera', Math.PI / 4, Math.PI / 3, 8, astro ? astro.position : babylon.Vector3.Zero());
    this.camera.attachControl(engine.getRenderingCanvas(), true);
  }
  look_at(target: babylon.Vector3) {

    this.look_at_target = target;
    this.last_target = this.camera.target.clone();
    this.dist = babylon.Vector3.DistanceSquared(this.camera.target, target);
  }
  lock_at(target: babylon.Vector3) {
    this.look_at(target);
    this.locked = target;
  }
  update(dt: number) {
    if (!this.look_at_target) return;
    this.camera.setTarget(babylon.Vector3.Lerp(this.last_target, this.look_at_target, this.update_state += this.rotate_speed));
    this.rotate_speed = (this.dist / (this.dist + this.update_state + this.rotate_speed)) * dt;
    console.log(this.update_state);
    if (this.update_state >= 0.99 && this.locked) { //due to f64 imprecision
      this.update_state = 0;
      this.camera.setTarget(this.locked);
      this.look_at_target = null;
      this.rotate_speed = 0.1;
      this.dist = 0;
    }
  }
}
const up = babylon.Vector3.Up();
export class Astro {
  static astros: Array<Astro> = new Array(0);
  static constant = 6.67 //6.67e-11 but for avoiding precision, everything will be ne+11 bigger;
  static camera: AstroCamera = new AstroCamera(engine);
  mesh: babylon.Mesh;
  is_worm = false;
  worm_parent: babylon.Nullable<Wormhole> = null;
  private energy = 0;
  private runtime_radius
  constructor(public id: string, public mass: number, public r: number = mass * 5, scene = gscene) {
    this.mesh = babylon.MeshBuilder.CreateSphere("astro", {
      diameter: r,
      segments: 10
    }, scene);
    const material = new babylon.StandardMaterial(id);
    material.diffuseTexture = new babylon.Texture(`/${id}.jpg`);
    this.mesh.material = material;
    this.runtime_radius = 12 * r;
    Astro.astros.push(this);
  }
  get position(): babylon.Vector3 {
    return this.mesh.position;
  }
  set position(v: babylon.Vector3) {
    this.mesh.position.set(v.x, v.y, v.z);
  }
  gforce(other: Astro, distance = babylon.Vector3.DistanceSquared(this.position, other.position)): number { //gravity force
    return Astro.constant * this.mass * other.mass / distance; //G(m1(m2))/d²
  }
  attract(other: Astro, dt: number) {
    if (this.is_worm && other.is_worm) return;
    const distance = babylon.Vector3.DistanceSquared(this.position, other.position);
    const force = this.gforce(other, distance);
    if (force > 0.1) {
      const attractor = this.mass >= other.mass ? this : other;
      const attracted = this.mass >= other.mass ? other : this;
      if (attracted.is_worm) return;
      const dtforce = dt * force;
      attracted.mesh.rotateAround(attractor.position, up, dtforce);
      if (!attractor.is_worm) return;
      const toadd = attracted.energy > 0 ?
        attractor.position.add(attracted.position).normalize().scaleInPlace(4.0 * dtforce * (attracted.energy -= 0.07)) :
        attractor.position.subtract(attracted.position).normalize().scaleInPlace(dtforce);
      attracted.position.addInPlace(toadd);
      const parent = attractor.worm_parent!;
      //move attracted to wormhole
      //distance requires taking sqrt, so square both sides and check for not requiring sqrt calculation
      if (distance >= attractor.runtime_radius) return;
      const target = parent.b == attractor ? parent.a : parent.b;
      attracted.position = attracted.position.normalize().scale(target.r * 0.5).add(target.position);
      attracted.energy = 4;
    }
  }
}
export class LightAstro extends Astro {
  light: babylon.PointLight;
  constructor(id: string, mass: number, r: number, scene = gscene) {
    super(id, mass, r, scene);
    const material = this.mesh.material as babylon.StandardMaterial;
    material.emissiveTexture = material.diffuseTexture;
    this.light = new babylon.PointLight('light', this.mesh.position);
    this.light.diffuse = new babylon.Color3(254 / 0xff, 242 / 0xff, 220 / 0xff);
  }
  attract(other: Astro, dt: number) {
    super.attract(other, dt);
    this.light.position = this.mesh.position;
  }
}

export class Wormhole {
  a = new Astro('wormhole', 100, 50);
  b = new Astro('wormhole', 100, 50);
  constructor(a: babylon.Vector3, b: babylon.Vector3) {
    this.a.position.set(a.x, a.y, a.z);
    this.b.position.set(b.x, b.y, b.z);
    this.a.is_worm = this.b.is_worm = true;
    this.a.worm_parent = this.b.worm_parent = this;
    (this.a.mesh.material as babylon.StandardMaterial).disableLighting = (this.b.mesh.material as babylon.StandardMaterial).disableLighting = false;
  }
}
