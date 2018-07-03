import Phaser from "phaser";
import CommandHandler from "../commandhandler";
import * as Model from "../model";
import Controller from "../controller";
import { EventListener, EventType } from "../types/eventlistener";
import { Coordinate } from "../types";
import * as Layers from "./layers";
import { Dice } from "./animations/dice";

type IconState = {
    alpha: number,
    angle: number,
    frameOffset: number,
    visible: boolean,
}

export class MainScene extends Phaser.Scene implements EventListener {

    private pitch: Phaser.GameObjects.Image;
    private pitchScale: number;
    private frameNumber: number;
    private cursors: CursorKeys;
    private i: Phaser.Input.InputPlugin;
    private dragStart: Phaser.Geom.Point;
    private scale: number;
    private width: number;
    private height: number;
    private controller: Controller;
    private moveSquareIcons: Phaser.GameObjects.Graphics[];
    private trackNumberIcons: Phaser.GameObjects.Graphics[];
    private dirty: boolean;
    private ballIcon: Phaser.GameObjects.Graphics;
    private uiCamera;
    private gridSize: number; // Size of a grid square
    private d6_1: Phaser.GameObjects.Sprite;
    private d6_2: Phaser.GameObjects.Sprite;
    private dice: Dice;

    public constructor(controller: Controller) {
        super({
            key: 'mainScene',
        });
        console.log("Main Scene: constructed");
        this.controller = controller;
        this.moveSquareIcons = [];
        this.trackNumberIcons = [];

        controller.addEventListener(this);
    }

    public handleEvent(event: EventType) {
        switch(event) {
            case EventType.ModelChanged:
                this.dirty = true;
                break;
            case EventType.Resizing:
                this.resize();
                break;
            case EventType.Click:
                this.d6_1.visible = true;
                this.d6_2.visible = true;
                let target1 = Math.floor(Math.random() * 6 + 1);
                let anim1 = this.dice.getAnimation(this, "d6_1", target1);
                let target2 = Math.floor(Math.random() * 6 + 1);
                let anim2 = this.dice.getAnimation(this, "d6_2", target2);
                console.log(target1, target2);
                this.d6_1.anims.play(anim1);
                this.d6_2.anims.play(anim2);
                break;
        }
    }

    public init(config) {
        console.log('Main Scene: init', config);

        this.controller.scene = this.scene;

        this.cursors = this.input.keyboard.createCursorKeys();
        this.scale = 1.0;

        this.width = this.sys.canvas.width;
        this.height = this.sys.canvas.height;
    }

    public preload() {
        console.log('Main Scene: preload');
    }

    public create(config) {
        console.log('Main Scene: create', config);

        this.pitch = this.add.image(0, 0, 'pitch').setOrigin(0, 0);
        this.frameNumber = 0;

        console.log('Scaling', this.height, this.pitch.height);
        this.pitchScale = 1.0; //this.height / this.pitch.height;
        this.pitch.setScale(this.pitchScale);

        //this.pitch.setInteractive();
        //this.input.setDraggable(this.pitch);

        // this.input.on('dragstart', (pointer, gameObject) => {
        //     this.dragStart = new Phaser.Geom.Point(this.cameras.main.scrollX, this.cameras.main.scrollY);
        // });

        // this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
        //     let scaling = this.cameras.main.zoom;
        //     let sX = this.dragStart.x -dragX / scaling;
        //     let sY = this.dragStart.y -dragY / scaling;

        //     this.cameras.main.setScroll(sX, sY);
        // });

        let game = this.controller.getGameState();

        let icons = {};
        for (let i in game.teamAway.roster.positions) {
            let pos = game.teamAway.roster.positions[i];
            icons[pos['id']] = '/'+pos['iconURI'];
        }

        for (let i in game.teamHome.roster.positions) {
            let pos = game.teamHome.roster.positions[i];
            icons[pos['id']] = '/'+pos['iconURI'];
        }

        let awayPlayers = game.teamAway.getPlayers();
        for (let i in awayPlayers) {
            let player = awayPlayers[i];
            player.setTeam(Model.Side.Away);
            player.icon = this.add.sprite(0,0,icons[player.positionId], player.positionIcon * 4 + 2);
            player.icon.setOrigin(0.5,0.5);
            player.icon.visible=false;
        }

        let homePlayers = game.teamHome.getPlayers();
        for (let i in homePlayers) {
            let player = homePlayers[i];
            player.setTeam(Model.Side.Home);
            player.icon = this.add.sprite(0,0,icons[player.positionId], player.positionIcon * 4 + 0);
            player.icon.setOrigin(0.5,0.5);
            player.icon.visible=false;
        }

        if (!this.ballIcon) {
            // Ugly. Needs to be a sprite...
            this.ballIcon = this.add.graphics();
            this.ballIcon.clear();
            this.ballIcon.fillStyle(0xffff00, 1);
            this.ballIcon.fillCircle(0, 0, 5);
        }

        const FAR_AWAY = -10000;

        // Set up UI overlay
        let uiLayer = new Layers.UILayer(this, game, this.controller);

        uiLayer.container.setPosition(FAR_AWAY, FAR_AWAY);
        this.add.existing(uiLayer.container);

        //this.cameras.main.setBounds(0, 0, 0, 0);
        this.cameras.main.setRoundPixels(true);

        let uiCamera = this.cameras.add(0, 0, this.width, this.height);
        uiCamera.setZoom(1);
        uiCamera.setScroll(FAR_AWAY, FAR_AWAY);
        this.uiCamera = uiCamera;

        window.onresize = () => {
            this.controller.triggerEvent(EventType.Resizing);
        };

        this.redraw(this.controller.getGameState());
        this.resize();

        this.d6_1 = this.add.sprite(100, 100, "d6");
        this.d6_1.setScale(0.5, 0.5);
        this.d6_1.visible = false;
        this.d6_2 = this.add.sprite(150, 100, "d6");
        this.d6_2.setScale(0.5, 0.5);
        this.d6_2.visible = false;

        this.dice = new Dice();
    }

    public resize() {
        this.sys.canvas.style.width = "100%";
        this.sys.canvas.style.height = "100%";

        let w = this.sys.canvas.clientWidth;
        let h = this.sys.canvas.clientHeight;

        this.width = w;
        this.height = h;

        this.sys.game.resize(w, h);

        let marginTop = h / 16;
        let marginLeft = w * 0;
        let marginRight = w * 0;
        let marginBottom = h * 0;

        w -= marginLeft + marginRight;
        h -= marginTop + marginBottom;

        let zoomFactorX = w / this.pitch.width;
        let zoomFactorY = h / this.pitch.height;
        let zoomFactor = Math.min(zoomFactorX, zoomFactorY);

        this.gridSize = Math.floor(zoomFactor * this.pitch.width/26);

        this.pitch.setScale(zoomFactor);
        this.pitchScale = zoomFactor;
        this.controller.triggerEvent(EventType.ModelChanged);

        // Calculate margins to center field in viewport
        let scrollX = -Math.floor((w - this.pitch.displayWidth) / 2);
        let scrollY = -Math.floor((h - this.pitch.displayHeight) / 2);
        this.cameras.main.setScroll(scrollX, scrollY);

        this.cameras.main.setViewport(marginLeft, marginTop, w, h);
        this.uiCamera.setViewport(0, 0, this.width, this.height);

        this.controller.triggerEvent(EventType.Resized, {
            w: this.sys.canvas.clientWidth,
            h: this.sys.canvas.clientHeight,
            scale: this.gridSize
        });
    }

    public getGridSize(): number {
        return this.gridSize;
    }

    public update() {
        let game = this.controller.getGameState();

        if (this.dirty) {
            this.redraw(this.controller.getGameState());
            this.dirty = false;
        }

        if (this.cursors.shift.isDown) {
            if (this.cursors.up.isDown) {
                this.cameras.main.setZoom(2.0);

            } else if (this.cursors.down.isDown) {
                this.cameras.main.setZoom(1.0);
            }

            let scale = this.scale;
            //this.cameras.main.setZoom(scale);
            //this.cameras.main.setBounds(-this.width * ((scale-1)/(scale*2)), -this.height * ((scale-1)/(scale*2)), this.width * (2-1/scale), this.height * (2-1/scale));
        } else {
            if (this.cursors.up.isDown) {
                this.cameras.main.scrollY--;
            } else if (this.cursors.left.isDown) {
                this.cameras.main.scrollX--;
            } else if (this.cursors.down.isDown) {
                this.cameras.main.scrollY++;
            } else if (this.cursors.right.isDown) {
                this.cameras.main.scrollX++;
            }
        }
    }

    public redraw(game: Model.Game) {
        for (let player of game.getPlayers()) {
            if (player) {
                let iconScale = Math.max(1, Math.floor(this.pitchScale));
                player.icon.setScale(iconScale, iconScale);
                player.icon.setScaleMode(Phaser.ScaleModes.NEAREST);
                let [x, y] = player.coordinate;

                let iconState = this.getIconState(player);

                let pX = this.pitchScale * (15 + x * 30);
                let pY = this.pitchScale * (15 + y * 30);

                player.icon.setFrame(player.getBaseIconFrame() + iconState.frameOffset);
                player.icon.angle = iconState.angle;
                player.icon.setAlpha(iconState.alpha);
                player.icon.visible = iconState.visible;

                player.icon.setPosition(pX, pY);
            }
        }

        this.moveSquareIcons.map((i) => i.visible = false);

        let i=0;
        let squares = game.getMoveSquares();
        for (let index in squares) {
            let coordinate = squares[i]
            if (i == this.moveSquareIcons.length) {
                let icon = this.add.graphics();
                icon.clear();
                icon.fillStyle(0xffffff, 0.25);
                icon.fillRect(0, 0, 30, 30);
                this.moveSquareIcons.push(icon);
            }
            let icon = this.moveSquareIcons[i];

            let [x,y] = coordinate;
            let pX = this.pitchScale * (15 + x * 30) - 15;
            let pY = this.pitchScale * (15 + y * 30) - 15;

            icon.setPosition(pX, pY);
            icon.visible = true;
            i++;
        }

        this.trackNumberIcons.map((i) => i.visible = false);
        i=0;
        squares = game.getTrackNumbers();
        for (let index in squares) {
            let coordinate = squares[i]
            if (i == this.trackNumberIcons.length) {
                let icon = this.add.graphics();
                icon.clear();
                icon.fillStyle(0xff9F00, 1);
                icon.fillCircle(0, 0, 5);
                this.trackNumberIcons.push(icon);
            }
            let icon = this.trackNumberIcons[i];

            let [x,y] = coordinate;
            let pX = this.pitchScale * (15 + x * 30);
            let pY = this.pitchScale * (15 + y * 30);

            icon.setPosition(pX, pY);
            icon.visible = true;
            i++;
        }

        let ballCoordinate = game.getBallCoordinate();

        if (ballCoordinate) {
            let [x,y] = ballCoordinate;
            let pX = this.pitchScale * (25 + x * 30);
            let pY = this.pitchScale * (25 + y * 30);

            this.ballIcon.setPosition(pX, pY);
            this.ballIcon.visible = true;
        } else {
            this.ballIcon.visible = false;
        }
    }

    private getIconState(player: Model.Player): IconState {
        let result: IconState = {
            alpha: 0,
            angle: 0,
            frameOffset: 0,
            visible: false
        };

        switch(player.getState()) {
            case Model.PlayerState.Prone:
                result.angle = -90;
                result.frameOffset = 1;
                break;
            case Model.PlayerState.Stunned:
                result.angle = 90;
                result.frameOffset = 1;
                break;
            case Model.PlayerState.Moving:
                result.angle = 0;
                result.frameOffset = 1;
                break;
            case Model.PlayerState.Falling:
                result.angle = 90;
                result.frameOffset = 0;
                break;
            default:
                result.angle = 0;
                result.frameOffset = 0;
                break;
        }

        let flags = player.getFlags();

        if (flags & Model.PlayerState._bit_active) {
            result.alpha = 1;
        } else {
            result.alpha = 0.5;
        }

        if (player.getTeam() == Model.Side.Away) {
            result.angle = -result.angle;
        }

        let [x, y] = player.coordinate;
        result.visible = x >= 0 && x <= 25;

        return result;
    }
}
