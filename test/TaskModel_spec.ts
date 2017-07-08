import {expect} from "chai";
import {MapBasedStorage} from "./MapBasedStorage";
import TaskModel, {ColumnInsertionMode} from "../src/model/TaskModel";
import LocalStorageDB from "../src/model/DB/LocalStorageDB";
import {DB} from "../src/model/DB/DB";
import {Column} from "../src/model/Column";
import 'mocha';

describe("task model", function () {

    let storageMock: DB;
    let origDateNow = Date.now;

    beforeEach(function () {
        storageMock = new LocalStorageDB(new MapBasedStorage());
    });

    afterEach(function () {
       Date.now = origDateNow;
    });

    it("getBoards should return no boards when no boards are added", async function () {

        const taskModel = new TaskModel(storageMock);
        const boards = await taskModel.getBoards();

        expect(boards.length).to.equal(0);

    });

    it("addBoard should add an item to the map of boards", async function () {

        const taskModel = new TaskModel(storageMock);
        const board = await taskModel.addBoard("default");
        await taskModel.setCurrentBoard(board);

        const boards = await taskModel.getBoards();

        expect(boards.length).to.equal(1);

    });

    it("getColumns should return the list of columns, by order", async function () {

        const taskModel = new TaskModel(storageMock);
        const board = await taskModel.addBoard("default");
        await taskModel.setCurrentBoard(board);

        await taskModel.addColumn("first");
        await taskModel.addColumn("second");

        const actualColumns: Array<Column> = await taskModel.getColumnsByBoard(board);

        expect(actualColumns[0].name).to.equal("first");
        expect(actualColumns[1].name).to.equal("second");

    });

    it("getTasks should return the list of tasks", async function () {

        const taskModel = new TaskModel(storageMock);
        const board = await taskModel.addBoard("default");
        await taskModel.setCurrentBoard(board);

        const key = await taskModel.addColumn("TODO");

        await taskModel.addTask(key, "foo");
        await taskModel.addTask(key, "bar");

        const actualTasksMap = await taskModel.getTasks();

        expect(actualTasksMap[0].desc).to.equal("foo");
        expect(actualTasksMap[1].desc).to.equal("bar");

    });

    it("delete task should remove the task from the list", async function () {

        const taskModel = new TaskModel(storageMock);
        const board = await taskModel.addBoard("default");
        await taskModel.setCurrentBoard(board);

        const columnKey = await taskModel.addColumn("TODO");

        await taskModel.addTask(columnKey, "foo");
        await taskModel.addTask(columnKey, "bar");

        const tasksForCol = await taskModel.getTasksByColumn(columnKey);

        await taskModel.deleteTask(columnKey, tasksForCol[0].id);

        const actualTasks = await taskModel.getTasks();

        expect(actualTasks.length).to.equal(1);

    });

    it("moveTask should move the task to the target column", async function () {

        const taskModel = new TaskModel(storageMock);
        const board = await taskModel.addBoard("default");
        await taskModel.setCurrentBoard(board);

        const firstCol = await taskModel.addColumn("foo");
        const secondCol = await taskModel.addColumn("bar");

        const taskKey = await taskModel.addTask(firstCol, "baz");
        await taskModel.moveTask(taskKey, firstCol, secondCol);

        const tasks = await taskModel.getTasksByColumn(secondCol);

        expect(tasks[0].id).to.equal(taskKey);

    });

    it("editTask should update the lastUpdatedAt property of the task", async function () {

        const taskModel = new TaskModel(storageMock);

        const dummyTimestamp = 1496000000000;
        Date.now = () => dummyTimestamp;

        const board = await taskModel.addBoard("default");
        await taskModel.setCurrentBoard(board);

        const col = await taskModel.addColumn("foo");
        const taskKey = await taskModel.addTask(col, "bar");

        await taskModel.editTask(taskKey, "modified bar");
        const tasks = await taskModel.getTasksByColumn(col);
        const theTask = tasks[0];

        if (! theTask.lastUpdatedAt) {
            expect.fail("lastUpdatedAt is undefined", "lastUpdatedAt should a Timestamp");
        } else {
            expect(theTask.lastUpdatedAt.value).to.equal(dummyTimestamp);
        }

    });

    it("getNextBoard should return the second board in a set of two boards", async function () {

        const taskModel = new TaskModel(storageMock);
        const board1 = await taskModel.addBoard("first");
        const board2 = await taskModel.addBoard("second");
        await taskModel.setCurrentBoard(board1);

        const nextBoard = await taskModel.getNextBoard();

        if (nextBoard === null) {
            throw new Error();
        }

        expect(nextBoard.id).to.equal(board2);

    });

    it("editCurrentBoard should only change the name of the current board", async function () {

        const taskModel = new TaskModel(storageMock);
        const board1 = await taskModel.addBoard("original name 1");
        await taskModel.addBoard("original name 2");
        await taskModel.setCurrentBoard(board1);

        await taskModel.editCurrentBoard("new name");

        const boards = await taskModel.getBoards();

        const boardName1 = boards[0];
        const boardName2 = boards[1];

        expect(boardName1.name).to.equal("new name");
        expect(boardName2.name).to.equal("original name 2");

    });

    it("getTasksByBoard should return the list of tasks in a board", async function () {

        const taskModel = new TaskModel(storageMock);
        const boardId = await taskModel.addBoard("default");
        await taskModel.setCurrentBoard(boardId);

        const columnKey = await taskModel.addColumn("TODO");

        const t1id = await taskModel.addTask(columnKey, "foo");
        const t2id = await taskModel.addTask(columnKey, "bar");

        const tasks = await taskModel.getTasksByBoard(boardId);

        expect(tasks[0].id).to.equal(t1id);
        expect(tasks[1].id).to.equal(t2id);

    });

    it("removeCurrentBoard should remove all columns", async function () {

        const taskModel = new TaskModel(storageMock);
        const boardId = await taskModel.addBoard("default");
        await taskModel.setCurrentBoard(boardId);

        await taskModel.addColumn("TODO");

        await taskModel.removeCurrentBoard();

        const cols = await taskModel.getColumns();

        expect(cols.length).to.equal(0);

    });


    it("reorderColumns with insertion mode 'before' should place the source column before the target column", async function () {

        const taskModel = new TaskModel(storageMock);
        const boardId = await taskModel.addBoard("default");
        await taskModel.setCurrentBoard(boardId);

        // State before reordering:
        // |source| |middle| |target|
        const sourceColId = await taskModel.addColumn("source");
        await taskModel.addColumn("middle");
        const targetColId = await taskModel.addColumn("target");

        await taskModel.reorderColumns(boardId, sourceColId, targetColId, ColumnInsertionMode.BEFORE);

        const cols = await taskModel.getColumnsByBoard(boardId);

        // Expected state after reordering:
        // |middle| |source| |target|
        expect([cols[0].name, cols[1].name, cols[2].name])
            .to.deep.equal(["middle", "source", "target"]);

    });

    it("reorderColumns with insertion mode 'after' should place the source column after the target column", async function () {

        const taskModel = new TaskModel(storageMock);
        const boardId = await taskModel.addBoard("default");
        await taskModel.setCurrentBoard(boardId);

        // State before reordering:
        // |middle0| |source| |middle1| |target| |middle2|
        await taskModel.addColumn("middle0");
        const sourceColId = await taskModel.addColumn("source");
        await taskModel.addColumn("middle1");
        const targetColId = await taskModel.addColumn("target");
        await taskModel.addColumn("middle2");

        await taskModel.reorderColumns(boardId, sourceColId, targetColId, ColumnInsertionMode.AFTER);

        const cols = await taskModel.getColumnsByBoard(boardId);

        // Expected state after reordering:
        // |middle0| |middle1| |target| |source| |middle2|
        expect(cols.map(col => col.name))
            .to.deep.equal(["middle0", "middle1", "target", "source", "middle2"]);

    });


    it("reorderColumns with insertion mode 'after' should place the source column after the target column (reverse)", async function () {

        const taskModel = new TaskModel(storageMock);
        const boardId = await taskModel.addBoard("default");
        await taskModel.setCurrentBoard(boardId);

        // State before reordering:
        // |middle0| |target| |middle1| |source| |middle2|
        await taskModel.addColumn("middle0");
        const targetColId = await taskModel.addColumn("target");
        await taskModel.addColumn("middle1");
        const sourceColId = await taskModel.addColumn("source");
        await taskModel.addColumn("middle2");

        await taskModel.reorderColumns(boardId, sourceColId, targetColId, ColumnInsertionMode.AFTER);

        const cols = await taskModel.getColumnsByBoard(boardId);

        // Expected state after reordering:
        // |middle0| |target| |source| |middle1| |middle2|
        expect(cols.map(col => col.name))
            .to.deep.equal(["middle0", "target", "source", "middle1", "middle2"]);

    });

});