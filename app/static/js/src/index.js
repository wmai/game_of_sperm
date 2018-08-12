/*
* @Author: wmai
* @Date:   2017-08-03 14:49:44
* @Last Modified by:   wmai
* @Last Modified time: 2018-01-17 22:19:44
*/

// Adapted from Flocking Processing example by Daniel Schiffman:
// http://processing.org/learning/topics/flocking.html

var Boid = Base.extend({
    initialize: function(position, maxSpeed, maxForce) {
        var strength = Math.random() * 0.5
        var speed = Math.random() * 10
        this.acceleration = new Point()
        this.vector = Point.random() * 2 - 1
        this.position = position.clone()
        this.radius = 30
        this.maxSpeed = maxSpeed + speed
        this.maxForce = maxForce + strength
        this.amount = strength * 10 + 10
        this.count = 0
        this.color = colors[Math.floor(Math.random() * colors.length)]
        this.birthday = new Date()
        this.name = this.setupName(firstnames) + ' ' + this.setupName(lastnames)
        this.createItems()
    },

    run: function(boids) {
        this.lastLoc = this.position.clone()

        if (!groupTogether)
            this.flock(boids)
        else
            this.align(boids)

        this.borders()
        this.update()
        this.calculateTail()
        this.moveHead()
        this.moveInfo()
    },

    calculateTail: function() {
        var segments = this.path.segments,
            shortSegments = this.shortPath.segments
        var speed = this.vector.length
        var pieceLength = 5 + speed / 3
        var point = this.position
        segments[0].point = shortSegments[0].point = point
        // Chain goes the other way than the movement
        var lastVector = -this.vector
        for (var i = 1; i < this.amount; i++) {
            var vector = segments[i].point - point
            this.count += speed * 10
            var wave = Math.sin((this.count + i * 3) / 300)
            var sway = lastVector.rotate(90).normalize(wave)
            point += lastVector.normalize(pieceLength) + sway
            segments[i].point = point
            if (i < 3)
                shortSegments[i].point = point
            lastVector = vector
        }
        this.path.smooth()
    },

    createItems: function() {
        this.head = new Shape.Ellipse({
            center: [0, 0],
            size: [10 + (this.maxForce * 10), 5 + (this.maxForce * 10)],
            fillColor: this.color
        })

        this.path = new Path({
            strokeColor: '#333',
            strokeWidth: 2,
            strokeCap: 'round'
        })

        for (var i = 0; i < this.amount; i++)
            this.path.add(new Point())

        this.shortPath = new Path({
            strokeColor: this.color,
            strokeWidth: 2,
            strokeCap: 'round'
        })

        this.namePath = new PointText({
            point: view.center,
            justification: 'center',
            fontSize: 9,
            fillColor: 'white',
            content: this.name + '\n' + 'F: ' + this.maxForce.toFixed(2) + '\n' + 'S: ' + this.maxSpeed.toFixed(2)
        })

        for (var i = 0; i < Math.min(3, this.amount); i++)
            this.shortPath.add(new Point())
    },

    moveHead: function() {
        this.head.position = this.position
        this.head.rotation = this.vector.angle
    },

    moveInfo: function() {
        this.namePath.position.x = this.position.x
        this.namePath.position.y = this.position.y - 30
        this.namePath.visible = project.activeLayer.selected
    },

    // We accumulate a new acceleration each time based on three rules
    flock: function(boids) {
        var separation = this.separate(boids) * 3
        var alignment = this.align(boids)
        var cohesion = this.cohesion(boids)
        this.acceleration += separation + alignment + cohesion
    },

    update: function() {
        // Update velocity
        this.vector += this.acceleration
        // Limit speed (vector#limit?)
        this.vector.length = Math.min(this.maxSpeed, this.vector.length)
        this.position += this.vector
        // Reset acceleration to 0 each cycle
        this.acceleration = new Point()
    },

    seek: function(target) {
        this.acceleration += this.steer(target, false)
    },

    arrive: function(target) {
        this.acceleration += this.steer(target, true)
    },

    borders: function() {
        var vector = new Point()
        var position = this.position
        var radius = this.radius
        var size = view.size
        if (position.x < -radius) vector.x = size.width + radius
        if (position.y < -radius) vector.y = size.height + radius
        if (position.x > size.width + radius) vector.x = -size.width -radius
        if (position.y > size.height + radius) vector.y = -size.height -radius
        if (!vector.isZero()) {
            this.position += vector
            var segments = this.path.segments
            for (var i = 0; i < this.amount; i++) {
                segments[i].point += vector
            }
        }
    },

    // A method that calculates a steering vector towards a target
    // Takes a second argument, if true, it slows down as it approaches
    // the target
    steer: function(target, slowdown) {
        var steer,
            desired = target - this.position
        var distance = desired.length
        // Two options for desired vector magnitude
        // (1 -- based on distance, 2 -- maxSpeed)
        if (slowdown && distance < 100) {
            // This damping is somewhat arbitrary:
            desired.length = this.maxSpeed * (distance / 100)
        } else {
            desired.length = this.maxSpeed
        }
        steer = desired - this.vector
        steer.length = Math.min(this.maxForce, steer.length)
        return steer
    },

    separate: function(boids) {
        var desiredSeperation = 60
        var steer = new Point()
        var count = 0
        // For every boid in the system, check if it's too close
        for (var i = 0, l = boids.length; i < l; i++) {
            var other = boids[i]
            var vector = this.position - other.position
            var distance = vector.length
            if (distance > 0 && distance < desiredSeperation) {
                // Calculate vector pointing away from neighbor
                steer += vector.normalize(1 / distance)
                count++
            }
        }
        // Average -- divide by how many
        if (count > 0)
            steer /= count
        if (!steer.isZero()) {
            // Implement Reynolds: Steering = Desired - Velocity
            steer.length = this.maxSpeed
            steer -= this.vector
            steer.length = Math.min(steer.length, this.maxForce)
        }
        return steer
    },

    // Alignment
    // For every nearby boid in the system, calculate the average velocity
    align: function(boids) {
        var neighborDist = 25
        var steer = new Point()
        var count = 0
        for (var i = 0, l = boids.length; i < l; i++) {
            var other = boids[i]
            var distance = this.position.getDistance(other.position)
            if (distance > 0 && distance < neighborDist) {
                steer += other.vector
                count++
            }
        }

        if (count > 0)
            steer /= count
        if (!steer.isZero()) {
            // Implement Reynolds: Steering = Desired - Velocity
            steer.length = this.maxSpeed
            steer -= this.vector
            steer.length = Math.min(steer.length, this.maxForce)
        }
        return steer
    },

    // Cohesion
    // For the average location (i.e. center) of all nearby boids,
    // calculate steering vector towards that location
    cohesion: function(boids) {
        var neighborDist = 100
        var sum = new Point()
        var count = 0
        for (var i = 0, l = boids.length; i < l; i++) {
            var other = boids[i]
            var distance = this.position.getDistance(other.position)
            if (distance > 0 && distance < neighborDist) {
                sum += other.position // Add location
                count++
            }
        }
        if (count > 0) {
            sum /= count
            // Steer towards the location
            return this.steer(sum, false)
        }
        return sum
    },

    shouldIDie: function() {
        var now = new Date()
        if ((now - this.birthday) > lifeTime) {
            this.head.remove()
            this.path.remove()
            this.shortPath.remove()
            this.namePath.remove()
            return true
        }
        return false
    },

    setupName: function(list) {
        var i = Math.floor(Math.random() * list.length)
        return list[i]
    }
})

var Egg = Base.extend({
    initialize: function(position) {
        this.position = position.clone()
        this.createItems()
    },

    getRandomArbitrary: function(min, max) {
        return Math.random() * (max - min) + min
    },

    createItems: function() {
        this.core = new Path.Circle({
            center: {
                x: this.position.x + this.getRandomArbitrary(-20, 20),
                y: this.position.y + this.getRandomArbitrary(-20, 20),
            },
            radius: 15,
            fillColor: '#662055',
            strokeColor: '#540904',
            strokeWidth: 1,
            opacity: 0.5,
        })

        this.inner = new Path.Circle({
            center: this.position,
            radius: 70,
            fillColor: '#792D54',
            strokeColor: '#540904',
            strokeWidth: 1,
            opacity: 0.3,
        })
        this.length = this.inner.length

        this.outter = new Path.Circle({
            center: this.position,
            radius: 100,
            fillColor: '#A36BC3',
            strokeColor: '#540904',
            strokeWidth: 1,
            opacity: 0.1,
        })
    },

    myGetPointAt: function(length) {
        // Calculates the point on the path at the given offset
        return this.inner.getPointAt(length)
    },

    dies: function(length) {
        // Calculates the point on the path at the given offset
        this.core.remove()
        this.inner.remove()
        this.outter.remove()
    },
})

var boids = []
var groupTogether = false
var egg = null
var firstnames = ["Adamant", "Adroit", "Amatory", "Animistic", "Antic", "Arcadian", "Baleful", "Bellicose", "Bilious", "Boorish", "Calamitous", "Caustic", "Cerulean", "Comely", "Concomitant", "Contumacious", "Corpulent", "Crapulous", "Defamatory", "Didactic", "Dilatory", "Dowdy", "Efficacious", "Effulgent", "Egregious", "Endemic", "Equanimous", "Execrable", "Fastidious", "Feckless", "Fecund", "Friable", "Fulsome", "Garrulous", "Guileless", "Gustatory", "Heuristic", "Histrionic", "Hubristic", "Incendiary", "Insidious", "Insolent", "Intransigent", "Inveterate", "Invidious", "Irksome", "Jejune", "Jocular", "Judicious", "Lachrymose", "Limpid", "Loquacious", "Luminous", "Mannered", "Mendacious", "Meretricious", "Minatory", "Mordant", "Munificent", "Nefarious", "Noxious", "Obtuse", "Parsimonious", "Pendulous", "Pernicious", "Pervasive", "Petulant", "Platitudinous", "Precipitate", "Propitious", "Puckish", "Querulous", "Quiescent", "Rebarbative", "Recalcitant", "Redolent", "Rhadamanthine", "Risible", "Ruminative", "Sagacious", "Salubrious", "Sartorial", "Sclerotic", "Serpentine", "Spasmodic", "Strident", "Taciturn", "Tenacious", "Tremulous", "Trenchant", "Turbulent", "Turgid", "Ubiquitous", "Uxorious", "Verdant", "Voluble", "Voracious", "Wheedling", "Withering", "Zealous"];
var lastnames = ["Ninja", "Chair", "Pancake", "Statue", "Unicorn", "Rainbows", "Laser", "Senor", "Bunny", "Captain", "Nibblets", "Cupcake", "Carrot", "Gnomes", "Glitter", "Potato", "Salad", "Toejam", "Curtains", "Beets", "Toilet", "Exorcism", "Stick Figures", "Mermaid Eggs", "Sea Barnacles", "Dragons", "Jellybeans", "Snakes", "Dolls", "Bushes", "Cookies", "Apples", "Ice Cream", "Ukulele", "Kazoo", "Banjo", "Opera Singer", "Circus", "Trampoline", "Carousel", "Carnival", "Locomotive", "Hot Air Balloon", "Praying Mantis", "Animator", "Artisan", "Artist", "Colorist", "Inker", "Coppersmith", "Director", "Designer", "Flatter", "Stylist", "Leadman", "Limner", "Make-Up Artist", "Model", "Musician", "Penciller", "Producer", "Scenographer", "Set Decorator", "Silversmith", "Teacher", "Auto Mechanic", "Beader", "Bobbin Boy", "Clerk Of The Chapel", "Filling Station Attendant", "Foreman", "Maintenance Engineering", "Mechanic", "Miller", "Moldmaker", "Panel Beater", "Patternmaker", "Plant Operator", "Plumber", "Sawfiler", "Shop Foreman", "Soaper", "Stationary Engineer", "Wheelwright", "Woodworkers"];
var colors = ['#F44336', '#9C27B0', '#3F51B5', '#2196F3', '#009688', '#4CAF50', '#CDDC39', '#FFEB3B', '#FF9800'] // red, purple, indigo, blue, teal, green, lime, yellow, orange
var lifeTime = 1000 * 60 * 5

// Add the boids:
for (var i = 0; i < 84; i++) {
    // setTimeout(function () {
        var position = Point.random() * view.size
        var boid = new Boid(position, 10, 0.05)
        boids.push(boid)
    // }, i * 1000)
}

function onFrame(event) {
    for (var i = 0, l = boids.length; i < l; i++) {
        if (boids[i]) {
            if (groupTogether) {
                var length = ((i + event.count / 30) % l) / l * egg.length
                var point = egg.myGetPointAt(length)
                if (point)
                    boids[i].arrive(point)
            }

            boids[i].run(boids)

            if (boids[i].shouldIDie())
                boids.splice(i, 1)
        }
    }
}

function onKeyDown(event) {
    if (event.key == 'space') {
        var layer = project.activeLayer
        layer.selected = !layer.selected
        return false
    }
}

/**************************************************************************************************/

function onMouseDown(event) {
    if (!groupTogether) {
        egg = new Egg(event.point)
    } else {
        egg.dies()
    }

    groupTogether = !groupTogether
}
