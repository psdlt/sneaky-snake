class Snake {
    // constants
    APPLE = 1;
    EMPTY = 0;
    TAIL = -1;

    // properties
    tail = [];
    direction = [-1, 0]; // UP
    dead = true;
    clock = null;
    running = false;
    score = 0;
    defaultSpeed;

    constructor(pitSize, speed) {
        this.pitSize = pitSize;
        this.defaultSpeed = speed;

        this.takeCommands();
        this.makePit();
        this.draw();

        document.getElementById("start-stop").onclick = this.startStop.bind(this);
    }

    takeCommands() {
        window.addEventListener("keydown", (event) => {
            const oldDirection = this.direction;

            switch (event.key) {
                // up
                case "w":
                case "ArrowUp":
                    this.direction = [-1, 0];
                    break;

                // left
                case "a":
                case "ArrowLeft":
                    this.direction = [0, -1];
                    break;

                // right
                case "d":
                case "ArrowRight":
                    this.direction = [0, 1];
                    break;

                // down
                case "s":
                case "ArrowDown":
                    this.direction = [1, 0];
                    break;

                // go faster!
                case "f":
                    this.goFaster();
                    break;

                // decrease board size
                case "o":
                    this.changeBoardSize(-1);
                    break;

                // increase board size
                case "p":
                    this.changeBoardSize(1);
                    break;

                // start/stop/restart game
                case " ":
                    this.startStop();
                    break;
            }

            // did we just change the direction?
            if (oldDirection[0] !== this.direction[0] || oldDirection[1] !== this.direction[1]) {
                // why yes, we did! move instantly!
                this.goFast();
                this.move();
            }
        });
    }

    changeBoardSize(difference) {
        if (this.pitSize < 10 || this.pitSize > 100) {
            // have some sanity!
            return;
        }

        this.stop();
        this.cleanUp();

        this.pitSize += difference;
        this.makePit();
        this.draw();
    }

    cleanUp() {
        this.dead = true;
        this.running = false;
        this.direction = [-1, 0];
        this.score = 0;
        this.speed = this.defaultSpeed;

        this.makePit();
    }

    startOver() {
        this.cleanUp();

        this.dead = false;
        this.running = true;

        this.makePit();
        this.newSnake();
        this.produceApple();
        this.goFast();

        // reset controls
        document.getElementById("speed").innerText = Math.floor(this.speed);
    }

    goFast() {
        this.stop();
        this.start();
    }

    stop() {
        clearInterval(this.clock);
    }

    start() {
        this.clock = setInterval(this.move.bind(this), this.speed);
    }

    startStop() {
        const $button = document.getElementById("start-stop");

        if (this.dead) {
            // we dead? start over!
            $button.innerText = "Pause (space)";
            this.startOver();
            return;
        }

        if (this.running) {
            // pause
            this.stop();

            $button.innerText = "Resume (space)";
        }
        if (!this.running) {
            // start / unpause
            this.start();

            $button.innerText = "Pause (space)";
        }

        this.running = !this.running;
    }

    makePit() {
        // reset the PIT
        this.pit = [];
        for (let i=0; i<this.pitSize; i++) {
            this.pit[i] = [];

            for (let j=0; j<this.pitSize; j++) {
                this.pit[i][j] = 0;
            }
        }
    }

    newSnake() {
        // place snake in it's initial position - middle of the board, 3 units long
        const center = Math.ceil(this.pitSize / 2);
        this.tail = [
            [center + 1, center],
            [center, center],
            [center - 1, center],
        ];

        // modify pit accordingly
        for (let i=0; i<this.tail.length; i++) {
            this.markPit(this.tail[i], this.TAIL);
        }
    }


    move() {
        // dead shall remain dead!
        if (this.dead) {
            return;
        }

        // calculate the next position
        let x, y;
        [x, y] = this.tail[this.tail.length - 1];
        x += this.direction[0];
        y += this.direction[1];

        // did we hit the wall?
        if (x < 0 || y < 0 || x+1 > this.pitSize || y+1 > this.pitSize) {
            this.snakeDied();
            return;
        }

        // did we bit ourselves?
        for (let i=0; i<this.tail.length; i++) {
            if (this.tail[i][0] === x && this.tail[i][1] === y) {
                this.snakeDied();
                return;
            }
        }

        let shed = true;

        // have we reached that sweat, sweat apple?
        if (this.pit[x][y] === this.APPLE) {
            this.getBig();
            shed = false;
        }

        // shall we shed out tail?
        if (shed) {
            this.markPit(this.tail.shift(), this.EMPTY);
        }

        // add new head
        this.tail.push([x, y]);
        this.markPit([x, y], this.TAIL);

        // redraw the pit
        this.draw();
    }

    draw() {
        const canvas = document.getElementById("snake-pit");
        while (canvas.firstChild) {
            canvas.removeChild(canvas.firstChild);
        }

        for (let i=0; i<this.pitSize; i++) {
            for (let j=0; j<this.pitSize; j++) {
                const square = document.createElement("div");
                const classes = ["square"];

                // anything special in this square?
                if (this.pit[i][j] === this.TAIL) {
                    classes.push("tail");
                }
                if (this.pit[i][j] === this.APPLE) {
                    classes.push("apple");
                }

                // is this the last square in a row?
                if (j+1 === this.pitSize) {
                    classes.push("last");
                }

                square.className = classes.join(" ");

                canvas.appendChild(square);
            }
            const clear = document.createElement("div");
            clear.className = "clear";
            canvas.appendChild(clear);
        }
    }

    snakeDied() {
        this.dead = true;
        this.stop();
        document.getElementById("start-stop").innerText = "Restart (space)";
    }

    getBig() {
        this.produceApple();
        this.score++;

        // increase speed?
        if (this.score % 5 === 0) {
            this.goFaster();
        }

        // adjust controls
        document.getElementById("score").innerText = this.score;
    }

    goFaster() {
        if (this.dead) {
            return;
        }

        // decrease timeout
        this.speed *= 0.90;
        this.stop();
        this.start();

        // update controls
        document.getElementById("speed").innerText = Math.floor(this.speed);
    }

    produceApple() {
        const x = Math.floor(this.pitSize * Math.random());
        const y = Math.floor(this.pitSize * Math.random());

        // is the new random location empty?
        if (this.pit[x][y] !== this.EMPTY) {
            // no? let's do a recursion!
            return this.produceApple();
        }

        this.markPit([x, y], this.APPLE);
    }

    markPit(position, value) {
        let x, y;
        [x, y] = position;

        this.pit[x][y] = value;
    }
}

new Snake(25, 150);