let Director = class {
  max_actors
  seed_actors

  actors = []
  next_free = -1

  constructor(max_actors,
    seed_actors) {
    this.max_actors = max_actors
    this.seed_actors = seed_actors
    this.generation = 0
  }

  initialize() {
    for (let i = 0; i < this.seed_actors; i++) {
      this.actors[i] = this.create()
    }

    for (let i = this.seed_actors; i < this.max_actors; i++) {
      this.actors[i] = {
        next_free: i == this.seed_actors ? -1 : i - 1,
        is_active: false
      }
    }
    this.next_free = this.max_actors - 1
  }

  process_and_draw() {
    this.generation += 1
    for (let i = 0; i < this.actors.length; i++) {
      if (!this.actors[i].is_active || this.actors[i].generation_created == this.generation) {
        continue
      }

      this.draw(this.actors[i])

      if (!this.update(this.actors[i])) {
        this.delete_actor(i)
      } else if (this.should_spawn(this.actors[i])) {
        let actor = this.spawn(this.actors[i])
        if (actor) {
          actor.generation_created = this.generation
        }
      }
    }
  }

  delete_actor(index) {
    this.actors[index] = {
      is_active: false,
      next_free: this.next_free
    }
    this.next_free = index
  }

  /*
   * Override this to change the properties of newly-created actors. For instance,
   * you may want to randomly distribute actors, or you may want to give them initial
   * velocities or directions. You may also want to add other properties to your
   * actors, such as color or size.
   *
   * Note that you must preserve the properties assigned below for the Director to
   * work correctly.
   */

  create(parent = null) {
    if (parent) {
      let actor = Object.assign({}, parent)
      return actor
    } else {
      let actor = {
        x: width / 2,
        y: height / 2,
        d: 0,
        v: 0,
        lifetime: this.default_lifetime(),
        age: 0,
        is_active: true,
        generation_created: 0,
        next_free: -1
      }
      return actor
    }
  }

  /*
   * Updates the actor's position based on its velocity and direction.
   * Returns false if the actor should be destroyed.
   *
   * Override this method to change an actor's behavior, eg. for a
   * physarum simulation, you could modify the actor's direction based
   * on the pixels around it.
   */

  update(actor) {
    actor.x += cos(actor.d) * actor.v
    actor.y += sin(actor.d) * actor.v

    actor.age += 1
    return actor.age < actor.lifetime &&
      actor.x >= 0 &&
      actor.y >= 0 &&
      actor.x < width &&
      actor.y < height
  }

  /*
   * Spawn a new actor from an existing actor.
   * Returns the new actor.
   *
   * You can override this method to change how a new actor inherits
   * properties from its parent. Note, like create, that you must=
   * preserve the existence of the default properties, though you can
   * change their values.
   */

  spawn(actor) {
    if (this.next_free != -1) {
      let idx = this.next_free
      this.next_free = this.actors[idx].next_free

      this.actors[idx] = this.create(actor)
      this.actors[idx].x = actor.x
      this.actors[idx].y = actor.y
      this.actors[idx].lifetime = this.min_age + Math.floor(Math.random() * this.max_age)
      this.actors[idx].age = 0
      this.actors[idx].v = 0
      this.actors[idx].d = actor.d + (Math.random() - 0.5) * Math.PI / 2
      this.actors[idx].next_free = -1

      return this.actors[idx]
    }

    return null
  }

  /*
   * Draw an actor. Override this to change how actors appear on the screen.
   */

  draw(actor) {
    stroke(0, 0, 0, 255 - Math.floor(256 * (actor.age / actor.lifetime)))
    strokeWeight(0.5)
    point(actor.x, actor.y)
  }

  /*
   * Decide whether an actor should spawn a child actor. You can override this
   * to change spawning behavior based on the actor's properties.
   */

  should_spawn(actor) {
    return Math.random() < 0.1
  }

  /*
   * Default lifetime to use for an actor
   */
  default_lifetime() {
    return 100
  }
}