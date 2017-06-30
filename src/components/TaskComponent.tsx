import * as React from "react";
import {Task} from "../model/task";
import * as BoardActions from "../actions/boardActions";
import {Column} from "../model/column";
import TaskEditDialog from "./TaskEditDialog";
import AnnotatedHashtagDiv from "./AnnotatedHashtagDiv";
import {draggable, Referrable} from "./dragAndDrop";

interface TaskProps extends Referrable {
    task: Task;
    column: Column;
}

interface TaskState {
    isBeingEdited: boolean;
}

class TaskComponent extends React.Component<TaskProps, TaskState> {

    constructor() {

        super();

        this.state = {
            isBeingEdited: false
        };

        this.closeEditTask = this.closeEditTask.bind(this);
        this.onTaskSubmitted = this.onTaskSubmitted.bind(this);

    }

    render() {

        const {desc, longdesc, createdAt, lastUpdatedAt} = this.props.task;

        return (
            <div
                ref={this.props.innerRef}
                className="task"
                onDoubleClick={e => this.editTask(e)}>

                <AnnotatedHashtagDiv text={desc} appliedClassName="hashtag" className="task-title"/>

                <TaskEditDialog
                    desc={desc}
                    longdesc={longdesc}
                    createdAt={createdAt}
                    lastUpdatedAt={lastUpdatedAt}
                    isBeingEdited={this.state.isBeingEdited}
                    onCloseEditTask={this.closeEditTask}
                    onEditSubmitted={this.onTaskSubmitted}
                    dialogTitle="Edit Task"
                />

            </div>
        );
    }

    private editTask(e: React.MouseEvent<HTMLElement>) {
        this.setState({isBeingEdited: true});
        e.stopPropagation();

    }

    private onTaskSubmitted(desc, longdesc) {
        if (desc) {
            BoardActions.editTask(this.props.task.id, desc, longdesc);
        }
        this.setState({isBeingEdited: false});
    }

    private closeEditTask() {
        this.setState({isBeingEdited: false});
    }

}

const DraggableTaskComponent = draggable<TaskProps>(TaskComponent);
export default DraggableTaskComponent;