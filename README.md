# p5-director
This is a class to make it easier to write actor-based graphics in P5. The
Director class provides memory management for a fixed-maximum number of actors,
and also handles general actor movement (via 2D coordinates and a direction and
velocity), actor "death" based on an age and lifespan, and actor "spawning".

# Using the Director for a Physarum Simulation

Here's a live example of the code described below: https://editor.p5js.org/moishe/sketches/tYuJpHUGy

The `/examples/physarum` directory contains an implementation of a simple
Physarum simulation using the Director. Let's walk through how this is done:

We `extend` the `Director` class so we can add some custom behavior. We'll
talk about that below, but let's skip ahead to creating the class and calling
it first.

In the `setup` method, we instantiate our extended object, then initialize it:

```
function setup() {
  createCanvas(windowWidth, windowHeight);
  background(255)
  director = new MoldDirector(
    1000,   // max actors
    1       // seed actors
  )
  director.initialize()
}
```

When you create a director, you tell it how many "slots" it should allocate for
its actors, as well as how many initially active actors there will be.

Calling `director.initialize()` allocates all the slots for the potential maximum
number of actors, and creates the specified number of active actors.

Then, in the `draw` function, we tell the director to process and draw all the
actors:

```
function draw() {
  director.process_and_draw()
}
```

Note that, in this example, we don't clear the background every time we draw. This
is because the physarum simulation relies on the background to know how to grow.
In other kinds of actor simulations (for instance Boids) would call for clearing
the background.

Okay, so that's the basics of instantiating and calling the director. Let's look at
what class methods we override for the physarum behavior.

First, if you aren't familiar with the physarum algorithm, [Sage Jenson](https://cargocollective.com/sagejenson)
has a great [writeup](https://cargocollective.com/sagejenson/physarum) which I refer to often.
Our implementation doesn't have some of the steps Sage describes (in particular, it doesn't
blur or fade the pheromone trails) but it follows the basic pattern of
"move towards pheromone, depositing pheromone as you go."

The default Director doesn't do anything magic with its actors; it just lets them move at
random. We need to implement some moldy behavior.

First, when we create a "seed" actor, we want it looking in a random direction. Since we're
just creating one, this doesn't matter too much, but if you increase the number of seed
actors, you'll want them starting in different directions. Pretty straightforward, we call
the default method, then override the actor's `d` value, which is its direction, and its `v`
value, which is its velocity -- we want all our actors moving at a constant speed.

```
  create(parent) {
    let actor = super.create(parent)
    actor.d = Math.random() * PI * 2
    actor.v = 1
    return actor
  }
```

Next, we'll implement the heart of the algorithm. The `update` method's default implementation,
in the base `Director` class, moves the actor based on its `v` (velocity) and `d` members. We rely
on that behavior in our overridden method, but we also want to change the actor's direction
based on where the actor can see the most "pheromone" is (in other words, the darkest parts of
the canvas).

```
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
```

First, we call the base class's `update` method. As mentioned above, this will move the actor.
If this function returns `false`, it means the actor's age has exceeded its lifetime, and the
Director will handle deactivating it, and allow new actors to take its slot.

```
      let dirs = [-Math.PI / 4, 0, Math.PI / 4]
```
Then, we look at the pixel values in 3 directions: straight ahead, then left and right `PI / 4`
radians (an eighth of a circle in each direction). This is one of many magic numbers you'll see
in the example code, and you should feel free to tweak it to see different patterns in the
physarum!

```
        let look_x = actor.x + cos(dirs[i] + actor.d) * 5
        let look_y = actor.y + sin(dirs[i] + actor.d) * 5
        let c = get(look_x, look_y)[0]
```
Another magic number appears when we compute `look_x` and `look_y` -- we get the pixel value
5 pixels away in each direction. As a shortcut, in the `get` call, we only look at the red
channel for each of those pixels -- since our simulation is monochrome, that channel is a
fine proxy for all the channels.

```
      actor.d = lerp(actor.d, dir, Math.random())
```

After we've looked in all 3 directions, we try to turn towards the darkest pixel. We introduce
some randomness here by `lerp`ing between the current direction and the new "desired" direction,
so that we don't turn all the way. This contributes to the physarum looking a little more organic.

```
      actor.d += (Math.random() - 0.5) * PI / 16
```

Speaking of randomization, we also change the actor's direction a little bit. This is a minute
change, but it happens every time the actor moves.

Okay, so that's it for the `update` function. That's the heart of the physarum behavior, but
we override a few other functions too.

When we spawn a new actor from an existing actor, the Director calls the `spawn` method. By default,
this copies most of the parameters from the old actor to the new one. We tweak this a little bit:

```
  spawn(actor) {
    let new_actor = super.spawn(actor)
    if (new_actor) {
      new_actor.d = actor.d + (Math.random() - 0.5) * PI
      new_actor.v = actor.v
      new_actor.lifetime = get(new_actor.x, new_actor.y)[0]
    }
    return new_actor
  }
```

This bases the new actor's direction and velocity on the old actor's direction (with some randomization)
and velocity. It also sets the new actor's lifetime based on the brightness of the pixel where the new
actor is spawning. This has the effect of pushing actors away from completely-black areas of the screen,
since their lifetimes are very short in those areas.

By default, the Director decides to spawn new actors at random. We tweak that a little bit:

```
  should_spawn(actor) {
    return Math.random() > actor.age / actor.lifetime
  }
```

Our `should_spawn` implementation makes it so that younger actors are more likely to spawn (but it
still occurs at random).

Finally, we override the `draw` method:

```
  draw(actor) {
    stroke(0, 0, 0, 128)
    strokeWeight(0.5)
    point(actor.x, actor.y)
  }
```

The combination of a fine stroke weight and 50% alpha means that the pheromone that our actors leave behind
can "build up" as multiple actors visit the same pixel.

And that's it! I recommend experimenting with the various magic numbers scattered around in the code. Other
things you can do: import a picture and let the physarum grow on it. Experiment with different-colored
pheromones. Create multiple colonies by instantiating multiple Directors with different behaviors.

Have fun!