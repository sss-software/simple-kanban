import { render } from "react-dom";
import * as React from "react";
import Nav from "./components/nav/Nav";
import Board from "./components/Board";
import {taskModel} from "./model/model";
import {setModel, setCatalog} from "./context";
import initializeModel from "./model/initializeModel";
import * as BoardActions from "./actions/boardActions";
import TemplateCatalog from "./model/Templates/TemplateCatalog";
import * as Modal from "react-modal";
import "./styles.css";

setModel(taskModel);
setCatalog(new TemplateCatalog());

taskModel.init()

    .then(() => {
        return initializeModel(taskModel);
    })

    .then(() => {

        const cont = document.getElementById("cont");

        if (cont === null) {
            throw new Error("Could not find main container element.");
        }

        render(
            <div>
                <Nav />
                <Board  />
            </div>
            , cont);

        Modal.setAppElement(cont);
        BoardActions.dispatchRefreshFull();

        document.addEventListener("visibilitychange", () => {

            if (! document.hidden) {
                BoardActions.dispatchRefreshFull();
            }

        }, false);

    })

    .catch((reason) => {
       console.error("Error while initializing app", reason);
    });
