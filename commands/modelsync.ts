import Game from "../model/game";
import Coordinate from "../types/coordinate";
import Controller from "../controller";
import Command from "./command";
import * as ClientCommands from "../model/clientcommands";

export default class CommandModelSync extends Command {
    private handlers: { [id: string] : (ModelChange) => void };

    public constructor(controller: Controller) {
        super(controller);

        this.handlers = {
            "fieldModelAddMoveSquare": this.handleAddMoveSquare,
            "fieldModelRemoveMoveSquare": this.handleRemoveMoveSquare,
            "fieldModelAddTrackNumber": this.handleAddTrackNumber,
            "fieldModelRemoveTrackNumber": this.handleRemoveTrackNumber,
            "fieldModelSetPlayerCoordinate": this.handleSetPlayerCoordinate,
            "fieldModelSetPlayerState": this.handleSetPlayerState,
        };
    }

    public processCommand(data: FFB.Protocol.Messages.ServerModelSync) {
        console.log("Processing model sync command", data);

        for (let change of data.modelChangeList.modelChangeArray) {
            let changeId = change.modelChangeId;
            if (this.handlers[changeId]) {
                this.handlers[changeId].call(this, change);
            } else {
                console.log("Unhandled model change", changeId);
            }
        }
    }

    private handleAddMoveSquare(change: FFB.Protocol.Messages.ModelChangeType) {
        let [x,y] = change.modelChangeValue.coordinate;
        let coordinate = new Coordinate(x, y);
        this.controller.enqueueCommand(new ClientCommands.AddMoveSquare(coordinate));
    }

    private handleRemoveMoveSquare(change: FFB.Protocol.Messages.ModelChangeType) {
        let [x,y] = change.modelChangeValue.coordinate;
        let coordinate = new Coordinate(x, y);
        this.controller.enqueueCommand(new ClientCommands.RemoveMoveSquare(coordinate));
    }

    private handleAddTrackNumber(change: FFB.Protocol.Messages.ModelChangeType) {
        let [x,y] = change.modelChangeValue.coordinate;
        let trackNumber = change.modelChangeValue.number;
        let coordinate = new Coordinate(x, y);
        this.controller.enqueueCommand(new ClientCommands.AddTrackNumber(trackNumber, coordinate));
    }

    private handleRemoveTrackNumber(change: FFB.Protocol.Messages.ModelChangeType) {
        let [x,y] = change.modelChangeValue.coordinate;
        let trackNumber = change.modelChangeValue.number;
        let coordinate = new Coordinate(x, y);
        this.controller.enqueueCommand(new ClientCommands.RemoveTrackNumber(trackNumber, coordinate));
    }

    private handleSetPlayerCoordinate(change: FFB.Protocol.Messages.ModelChangeType) {
        let playerId = change.modelChangeKey;
        let [x, y] = change.modelChangeValue;
        let coordinate = new Coordinate(x,y);

        this.controller.enqueueCommand(new ClientCommands.MovePlayer(playerId, coordinate));
    }

    private handleSetPlayerState(change: FFB.Protocol.Messages.ModelChangeType) {
        let playerId = change.modelChangeKey;
        let state = parseInt(change.modelChangeValue);

        this.controller.enqueueCommand(new ClientCommands.SetPlayerState(playerId, state));
    }
}
