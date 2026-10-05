const Todo = require("../models/Todo");

const sendError = (res, err) => {
  console.error(err);
  const status = ["ValidationError", "CastError"].includes(err.name) ? 400 : 500;
  res.status(status).json({ message: err.message });
};

// GET /api/todos
const getTodos = async (req, res) => {
  try {
    const todos = await Todo.find().sort({ createdAt: -1 });
    res.json(todos);
  } catch (err) {
    sendError(res, err);
  }
};

// POST /api/todos
const createTodo = async (req, res) => {
  const body = req.body ?? {};
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) {
    return res.status(400).json({ message: "A non-empty title is required." });
  }

  try {
    const todo = await Todo.create({ title });
    res.status(201).json(todo);
  } catch (err) {
    sendError(res, err);
  }
};

// PUT /api/todos/:id
const updateTodo = async (req, res) => {
  const body = req.body ?? {};
  const updates = {};
  if (body.title !== undefined) {
    if (typeof body.title !== "string" || !body.title.trim()) {
      return res.status(400).json({ message: "Title must be a non-empty string." });
    }
    updates.title = body.title.trim();
  }
  if (body.completed !== undefined) {
    if (typeof body.completed !== "boolean") {
      return res.status(400).json({ message: "Completed must be a boolean." });
    }
    updates.completed = body.completed;
  }
  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ message: "Provide a title or completed value to update." });
  }

  try {
    const todo = await Todo.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });
    if (!todo) {
      return res.status(404).json({ message: "Todo not found." });
    }
    res.json(todo);
  } catch (err) {
    sendError(res, err);
  }
};

// DELETE /api/todos/:id
const deleteTodo = async (req, res) => {
  try {
    const todo = await Todo.findByIdAndDelete(req.params.id);
    if (!todo) {
      return res.status(404).json({ message: "Todo not found." });
    }
    res.json(todo);
  } catch (err) {
    sendError(res, err);
  }
};

module.exports = { getTodos, createTodo, updateTodo, deleteTodo };
