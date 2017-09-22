import * as React from "react";
import {Column, ColumnOptions, ColumnSize} from "../model/Column";
import {Task, TaskPresentationalOptions} from "../model/task";
import TaskComponent from "./TaskComponent";
import * as BoardActions from "../actions/boardActions";
import {classSet} from "../util";
import TaskEditDialog from "./dialogs/TaskEditDialog";
import ColumnEditDialog from "./dialogs/ColumnEditDialog";
import {draggable, droppable, Referrable} from "./dragAndDrop";

interface ColumnProps extends Referrable {
    column: Column;
    tasks: Array<Task>;
    inBackground?: boolean;
}

interface ColumnState {
    isTaskBeingAdded: boolean;
    isBeingEdited: boolean;
    isHoverMode: boolean;
}

class ColumnComponent extends React.Component<ColumnProps, ColumnState> {

    constructor() {

        super();

        this.state = {
            isTaskBeingAdded: false,
            isBeingEdited: false,
            isHoverMode: false
        };

        this.closeEditTask = this.closeEditTask.bind(this);
        this.onTaskSubmitted = this.onTaskSubmitted.bind(this);
        this.closeEditColumn = this.closeEditColumn.bind(this);
        this.onEditColumnSubmitted = this.onEditColumnSubmitted.bind(this);

    }

    render() {

        const taskCount = this.props.tasks.length;
        const tasks = this.props.tasks.map((task) => {
            return (
                <TaskComponent
                    type="task"
                    data={{id: task.id, sourceColumnId: this.props.column.id}}
                    key={task.id}
                    task={task}
                    column={this.props.column} />
            );
        });

        const isAboveWipLimit = taskCount > this.props.column.wipLimit;

        const isHalfCol = this.props.column.options && this.props.column.options.size === ColumnSize.HALF;
        const classNames = classSet({
            "column": true,
            "column-above-limit": isAboveWipLimit,
            "in-background": this.props.inBackground,
            "half-col": isHalfCol
        });

        return (
            <div
                ref={this.props.innerRef}
                className={classNames}
                onDoubleClick={() => this.onAddTask()}>

                <div className="column-header" title="double click to edit" onDoubleClick={e => this.editColumn(e)}>
                    <div>{this.props.column.name}</div>
                    <div className="wip">{taskCount} / {this.props.column.wipLimit}</div>
                </div>
                <div className="task-container">
                    {tasks}
                </div>
                {this.state.isTaskBeingAdded ? <TaskEditDialog
                    opened={this.state.isTaskBeingAdded}
                    onCloseEditTask={this.closeEditTask}
                    onEditSubmitted={this.onTaskSubmitted}
                    dialogTitle="Add a New Task"
                /> : null}
                {this.state.isBeingEdited ? <ColumnEditDialog
                    opened={this.state.isBeingEdited}
                    onEditClose={this.closeEditColumn}
                    column={this.props.column}
                    onEditSubmitted={this.onEditColumnSubmitted}
                /> : null}
            </div>
        );
    }

    private onAddTask() {
        this.setState({isTaskBeingAdded: true});
    }

    private editColumn(e: React.MouseEvent<HTMLElement>) {
        this.setState({isBeingEdited: true});
        e.stopPropagation();
    }

    private onEditColumnSubmitted(name: string, wipLimit: number, options: ColumnOptions) {
        if (name !== null && Number.isInteger(wipLimit) && wipLimit > 0) {
            name = name.trim();
            if (name.length > 0) {
                BoardActions.editColumn(this.props.column, name, wipLimit, options);
            }
        }

        this.setState({isBeingEdited: false});
    }

    private closeEditTask() {
        this.setState({isTaskBeingAdded: false});
    }

    private closeEditColumn() {
        this.setState({isBeingEdited: false});
    }

    private onTaskSubmitted(desc: string, longdesc: string, presentationalOptions: TaskPresentationalOptions) {
        BoardActions.addTask(this.props.column, desc, longdesc, presentationalOptions);
    }

}

const DraggableDroppableColumnComponent = droppable(draggable<ColumnProps>(ColumnComponent));
export default DraggableDroppableColumnComponent;