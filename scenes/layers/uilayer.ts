import Phaser from "phaser";
import * as Comp from "../components";
import { EventListener, EventType } from "../../types/eventlistener";
import * as Model from "../../model";

export class UILayer implements EventListener {
    public container: Phaser.GameObjects.Container;
    private scene: Phaser.Scene;
    private scale: number;

    private component: Comp.UIComponent;

    public constructor(scene: Phaser.Scene, game: Model.Game) {
        this.scene = scene;
        this.container = scene.make.container({});

        this.component = new Comp.Panel({
            width: "100%",
            height: "100%",
            children: [
                new Comp.Panel({
                    x: 0,
                    y: 0,
                    width: "100%",
                    height: 1,
                    anchor: Comp.Anchor.NORTH,
                    parentAnchor: Comp.Anchor.NORTH,
                    background: 0x003300,
                    children: [
                        new Comp.Label({
                            id: "HomeTeam",
                            x: 0.5,
                            y: 0,
                            height: 1,
                            anchor: Comp.Anchor.WEST,
                            parentAnchor: Comp.Anchor.WEST,
                            color: 0xffffff,
                            text: game.teamHome.name,
                        }),
                        new Comp.Label({
                            id: "AwayTeam",
                            x: -0.5,
                            y: 0,
                            height: 1,
                            anchor: Comp.Anchor.EAST,
                            parentAnchor: Comp.Anchor.EAST,
                            color: 0xffffff,
                            text: game.teamAway.name,
                        }),
                        new Comp.Panel({
                            id: "ScorePanel",
                            width: 4,
                            height: 1,
                            background: 0x003300,
                            children: [
                                new Comp.Label({
                                    id: "HomeScore",
                                    x: -0.5,
                                    height: 1,
                                    anchor: Comp.Anchor.EAST,
                                    parentAnchor: Comp.Anchor.CENTER,
                                    color: 0xffffff,
                                    text: "0"
                                }),
                                new Comp.Label({
                                    id: "ScoreDash",
                                    x: 0,
                                    height: 1,
                                    anchor: Comp.Anchor.CENTER,
                                    parentAnchor: Comp.Anchor.CENTER,
                                    color: 0xffffff,
                                    text: "-"
                                }),
                                new Comp.Label({
                                    id: "AwayScore",
                                    x: 0.5,
                                    height: 1,
                                    anchor: Comp.Anchor.WEST,
                                    parentAnchor: Comp.Anchor.CENTER,
                                    color: 0xffffff,
                                    text: "0"
                                }),
                            ]
                        }),
                    ]
                }),
            ]
        });
    }

    public handleEvent(eventType: EventType, data?: any) {
        if (eventType == EventType.Resized) {
            this.scale = data.scale;
            this.redraw(data.w, data.h);
        }
    }

    public redraw(w: number, h: number) {
        console.log("uilayer redraw()", w, h);
        let g = this.component.render({
            scene: this.scene,
            parent: null,
            w: w,
            h: h,
            scale: this.scale,
            x: 0,
            y: 0,
        });
        this.container.add(g);
    }
}