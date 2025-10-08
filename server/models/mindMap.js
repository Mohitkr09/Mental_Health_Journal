import mongoose from "mongoose";

const nodeSchema = new mongoose.Schema({
  id: { type: String, required: true },
  data: { type: Object, required: true }, // { label: "happy" }
  position: { 
    x: { type: Number, required: true }, 
    y: { type: Number, required: true } 
  },
  style: { type: Object }, // optional styling
});

const edgeSchema = new mongoose.Schema({
  id: { type: String, required: true },
  source: { type: String, required: true },
  target: { type: String, required: true },
  animated: { type: Boolean, default: false },
  style: { type: Object }, // optional styling
});

const mindMapSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    nodes: [nodeSchema],
    edges: [edgeSchema],
  },
  { timestamps: true }
);

const MindMap = mongoose.model("MindMap", mindMapSchema);

export default MindMap;
