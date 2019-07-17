class Snake {
    // constants
    APPLE = 1;
    EMPTY = 0;
    TAIL = -1;

    // properties
    tail = [];
    direction = [-1, 0]; // UP
    headDirection = "head-up";
    dead = true;
    clock = null;
    running = false;
    score = 0;
    speedLevel = 1;
    defaultSpeed;

    constructor(pitSize, speed) {
        this.pitSize = pitSize;
        this.defaultSpeed = speed;

        this.takeCommands();
        this.makePit();

        document.getElementById("start-stop").onclick = this.startStop.bind(this);
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
        this.updateHud();
    }

    takeCommands() {
        window.addEventListener("keydown", (event) => {
            const oldDirection = this.direction;

            switch (event.key) {
                // up
                case "w":
                case "ArrowUp":
                    if (!this.running) {
                        return;
                    }

                    this.direction = [-1, 0];
                    this.headDirection = "head-up";
                    break;

                // left
                case "a":
                case "ArrowLeft":
                    if (!this.running) {
                        return;
                    }

                    this.direction = [0, -1];
                    this.headDirection = "head-left";
                    break;

                // right
                case "d":
                case "ArrowRight":
                    if (!this.running) {
                        return;
                    }

                    this.direction = [0, 1];
                    this.headDirection = "head-right";
                    break;

                // down
                case "s":
                case "ArrowDown":
                    if (!this.running) {
                        return;
                    }

                    this.direction = [1, 0];
                    this.headDirection = "head-down";
                    break;

                // go faster!
                case "f":
                    if (!this.running) {
                        return;
                    }

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
            if (this.running && (oldDirection[0] !== this.direction[0] || oldDirection[1] !== this.direction[1])) {
                // why yes, we did! move instantly!
                this.goFast();
                this.move();
            }
        });
    }

    changeBoardSize(difference) {
        if (this.pitSize < 10 || this.pitSize > 75) {
            // have some sanity!
            return;
        }

        this.stop();
        this.cleanUp();

        this.pitSize += difference;
        this.makePit();
    }

    cleanUp() {
        this.dead = true;
        this.running = false;
        this.direction = [-1, 0];
        this.headDirection = "head-up";
        this.score = 0;
        this.speed = this.defaultSpeed;
        this.speedLevel = 1;

        this.makePit();
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
            this.startOver();
            this.updateHud();
            return;
        }

        if (this.running) {
            // pause
            this.stop();
        }
        if (!this.running) {
            // start / unpause
            this.start();
        }

        this.running = !this.running;

        this.updateHud();
    }

    makePit() {
        // reset DOM
        const canvas = document.getElementById("snake-pit");
        while (canvas.firstChild) {
            canvas.removeChild(canvas.firstChild);
        }

        // reset the PIT
        this.pit = [];
        for (let i=0; i<this.pitSize; i++) {
            this.pit[i] = [];

            const row = document.createElement("div");
            row.className = "snake-row";

            for (let j=0; j<this.pitSize; j++) {
                this.pit[i][j] = 0;

                const square = document.createElement("div");

                const classes = ["square"];

                square.className = classes.join(" ");
                square.id = "snake-pit-square-"+i+"-"+j;

                row.appendChild(square);
            }

            canvas.appendChild(row);
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

        // shall we shed our tail?
        if (shed) {
            this.markPit(this.tail.shift(), this.EMPTY);
        }

        // add new head
        this.tail.push([x, y]);
        this.markPit([x, y], this.TAIL);
    }

    snakeDied() {
        this.dead = true;
        this.stop();
        this.updateHud();
    }

    getBig() {
        this.produceApple();
        this.score++;

        // increase speed?
        if (this.score % 5 === 0) {
            this.goFaster();
        }

        // adjust controls
        this.updateHud();
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
        this.speedLevel++;
        this.updateHud();
    }

    updateHud() {
        document.getElementById("speed").innerText = this.speedLevel;
        document.getElementById("score").innerText = this.score;

        // update button
        const $button = document.getElementById("start-stop");
        if (this.running) {
            $button.innerText = "Pause (space)";
        }
        if (!this.running && !this.dead) {
            $button.innerText = "Resume (space)";
        }
        if (this.dead) {
            $button.innerText = "Restart (space)";
        }
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
        // update internal array
        let x, y;
        [x, y] = position;

        this.pit[x][y] = value;

        // update DOM
        const id = "snake-pit-square-"+x+"-"+y;
        const square = document.getElementById(id);
        const classes = ["square"];

        // anything special in this square?
        if (value === this.TAIL) {
            classes.push("tail");
        }
        if (value === this.APPLE) {
            classes.push("apple");
        }
        // is it our head?
        const lastTail = this.tail[this.tail.length - 1];
        if (lastTail[0] === x && lastTail[1] === y) {
            // it is our head!
            classes.push("head");
            classes.push(this.headDirection);

            // and make sure there is only one head in the pit!
            const oldHead = document.querySelector(".head");
            if (oldHead) {
                const oldClasses = oldHead.className.split(" ");
                const classesToRemove = ["head", "head-up", "head-down", "head-left", "head-right"];
                for (let i=0; i<classesToRemove.length; i++) {
                    const classIndex = oldClasses.indexOf(classesToRemove[i]);
                    if (classIndex !== -1) {
                        delete oldClasses[classIndex];
                    }
                }
                delete oldClasses[oldClasses.indexOf("head")];
                oldHead.className = oldClasses.join(" ");
            }
        }

        // update
        square.className = classes.join(" ");
    }
}

new Snake(30, 150);