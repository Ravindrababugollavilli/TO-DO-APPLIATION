const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const isValid = require("date-fns/isValid");
const format = require("date-fns/format");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3012, () => {
      console.log("Server Running at http://localhost:3012/");
    });
  } catch (e) {
    console.log(`DB Error:${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryAndPriorityProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};
const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const hasDueDateProperty = (requestQuery) => {
  return requestQuery.dueDate !== undefined;
};

const isValidTodoPriority = (item) => {
  if (item === "HIGH" || item === "MEDIUM" || item === "LOW") {
    return true;
  } else {
    return false;
  }
};

const isValidTodoCategory = (item) => {
  if (item === "WORK" || item === "HOME" || item === "LEARNING") {
    return true;
  } else {
    return false;
  }
};

const isValidTodoStatus = (item) => {
  if (item === "TO DO" || item === "IN PROGRESS" || item === "DONE") {
    return true;
  } else {
    return false;
  }
};

const isValidTodoDueDate = (item) => {
  return isValid(new Date(item));
};

const convertDueDate = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    status: dbObject.status,
    category: dbObject.category,
    dueDate: dbObject.due_date,
  };
};

// API-1

app.get("/todos/", async (request, response) => {
  let date = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status, category } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `
            select *
            from
            todo
            where 
            todo like '%${search_q}%'
            and status='${status}'
            and priority='${priority}';`;
      if (isValidTodoPriority(priority) && isValidTodoStatus(status)) {
        data = await db.all(getTodosQuery);
        response.send(data.map((object) => convertDueDate(object)));
      } else if (isValidTodoPriority(priority)) {
        response.status(400);
        response.send("Invalid Todo Status");
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case hasCategoryAndStatusProperties(request.query):
      getTodosQuery = `
              select *
              from
              todo
              where
              todo like '%${search_q}%'
            and status='${status}'
            and category='${category}';`;
      if (isValidTodoCategory(category) && isValidTodoStatus(status)) {
        data = await db.all(getTodosQuery);
        response.send(data.map((object) => convertDueDate(object)));
      } else if (isValidTodoCategory(category)) {
        response.status(400);
        response.send("Invalid Todo Status");
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case hasCategoryAndPriorityProperties(request.query):
      getTodosQuery = `
              select *
              from
              todo
              where
              todo like '%${search_q}%'
            and priority='${priority}'
            and category='${category}';`;
      if (isValidTodoCategory(category) && isValidTodoPriority(priority)) {
        data = await db.all(getTodosQuery);
        response.send(data.map((object) => convertDueDate(object)));
      } else if (isValidTodoCategory(category)) {
        response.status(400);
        response.send("Invalid Todo Priority");
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case hasCategoryProperty(request.query):
      getTodosQuery = `
         select *
         from todo
         where
         todo like '%${search_q}%'
         and category='${category}';`;
      if (isValidTodoCategory(category)) {
        data = await db.all(getTodosQuery);
        response.send(data.map((object) => convertDueDate(object)));
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case hasPriorityProperty(request.query):
      getTodosQuery = `
         select *
         from todo
         where
         todo like '%${search_q}%'
         and priority='${priority}';`;
      if (isValidTodoPriority(priority)) {
        data = await db.all(getTodosQuery);
        response.send(data.map((object) => convertDueDate(object)));
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case hasStatusProperty(request.query):
      getTodosQuery = `
         select *
         from todo
         where
         todo like '%${search_q}%'
         and status='${status}';`;
      if (isValidTodoStatus(status)) {
        data = await db.all(getTodosQuery);
        response.send(data.map((object) => convertDueDate(object)));
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    default:
      getTodosQuery = `
         select *
         from todo
         where
         todo like '%${search_q}%';`;
      data = await db.all(getTodosQuery);
      response.send(data.map((object) => convertDueDate(object)));
  }
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
                        select
                        *
                        from
                        todo where
                        id=${todoId};`;
  const todo = await db.get(getTodoQuery);
  response.send(convertDueDate(todo));
});

//
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  if (date === undefined) {
    response.status(400);
    response.send("Invalid Due Date");
  } else {
    if (isValidTodoDueDate(date)) {
      const formattedDate = format(new Date(date), "yyyy-MM-dd");
      const getTodoQuery = `
            select *
            from
            todo
            where
            due_date='${formattedDate}';`;
      const todo = await db.all(getTodoQuery);
      response.send(todo.map((object) => convertDueDate(object)));
    } else {
      response.status(400);
      response.send("Invalid Due Date");
    }
  }
});

//
app.post("/todos/", async (request, response) => {
  const todoDetails = request.body;
  const { id, todo, priority, status, category, dueDate } = todoDetails;

  switch (false) {
    case isValidTodoPriority(priority):
      response.status(400);
      response.send("Invalid Todo Priority");
      break;
    case isValidTodoStatus(status):
      response.status(400);
      response.send("Invalid Todo Status");
      break;
    case isValidTodoCategory(category):
      response.status(400);
      response.send("Invalid Todo Category");
      break;
    case isValidTodoDueDate(dueDate):
      response.status(400);
      response.send("Invalid Due Date");
      break;
    default:
      const formattedDate = format(new Date(dueDate), "yyyy-MM-dd");
      const addTodoQuery = `Insert Into
            todo(id,todo,priority,status,category,due_date)
            values(
                ${id},
                '${todo}',
                '${priority}',
                '${status}',
                '${category}',
                '${formattedDate}');`;
      const dbResponse = await db.run(addTodoQuery);
      response.send("Todo Successfully Added");
      break;
  }
});

//
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const todoDetails = request.body;
  const { todo, priority, status, dueDate, category } = todoDetails;
  switch (true) {
    case hasStatusProperty(request.body):
      const updateTodoStatusQuery = `
         update
         todo
         set
         status='${status}'
         where
         id=${todoId};`;
      if (isValidTodoStatus(status)) {
        await db.run(updateTodoStatusQuery);
        response.send("Status Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;

    case hasCategoryProperty(request.body):
      const updateTodoCategoryQuery = `
         update
         todo
         set
         category='${category}'
         where
         id=${todoId};`;
      if (isValidTodoCategory(category)) {
        await db.run(updateTodoCategoryQuery);
        response.send("Category Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;

    case hasPriorityProperty(request.body):
      const updateTodoPriorityQuery = `
         update
         todo
         set
         priority='${priority}'
         where
         id=${todoId};`;
      if (isValidTodoPriority(priority)) {
        await db.run(updateTodoPriorityQuery);
        response.send("Priority Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    case hasDueDateProperty(request.body):
      const updateTodoDueDateQuery = `
         update
         todo
         set
         due_date='${dueDate}'
         where
         id=${todoId};`;
      if (isValidTodoDueDate(dueDate)) {
        await db.run(updateTodoDueDateQuery);
        response.send("Due Date Updated");
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
      break;

    default:
      const updateTodoQuery = ` 
          update
         todo
         set
         todo='${todo}'
         where
         id=${todoId};`;
      await db.run(updateTodoQuery);
      response.send("Todo Updated");
      break;
  }
});

//
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
    delete from
    todo
    where
    id=${todoId};`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
