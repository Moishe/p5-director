# p5-director
This is a class to make it easier to write actor-based graphics in P5. The
Director class provides memory management for a fixed-maximum number of actors,
and also handles general actor movement (via 2D coordinates and a direction and
velocity), actor "death" based on an age and lifespan, and actor "spawning".

# Using the Director for a Physarum Simulation

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
