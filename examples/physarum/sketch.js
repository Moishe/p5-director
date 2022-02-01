let director

class MoldDirector extends Director {
  create(parent) {
    let actor = super.create(parent)
    actor.d = Math.random() * PI * 2
    actor.v = 1
    return actor
  }

  update(actor) {
    let result = super.update(actor)
    if (result) {
      let dirs = [-Math.PI / 4, 0, Math.PI / 4]
      let max_c = 255
      let dir = actor.d
      for (let i = 0; i < dirs.length; i++) {
        let look_x = actor.x + cos(dirs[i] + actor.d) * 5
        let look_y = actor.y + sin(dirs[i] + actor.d) * 5
        let c = get(look_x, look_y)[0]
        if (c < max_c) {
          c = max_c
          dir = dirs[i] + actor.d
        }
      }

      actor.d = lerp(actor.d, dir, Math.random())
      actor.d += (Math.random() - 0.5) * PI / 16
    }
    return result
  }

  should_spawn(actor) {
    return Math.random() > actor.age / actor.lifetime
  }

  draw(actor) {
    stroke(0, 0, 0, 128)
    strokeWeight(0.5)
    point(actor.x, actor.y)
  }

  spawn(actor) {
    let new_actor = super.spawn(actor)
    if (new_actor) {
      new_actor.d = actor.d + (Math.random() - 0.5) * PI
      new_actor.v = actor.v
      new_actor.lifetime = get(new_actor.x, new_actor.y)[0]
    }
    return new_actor
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  background(255)
  director = new MoldDirector(
    1000,   // max actors
    1       // seed actors
  )
  director.initialize()
}

function draw() {
  director.process_and_draw()
}
