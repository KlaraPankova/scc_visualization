// id, model, name, description, n, edges, sugested

const EXAMPLES = [
       {
    id: "0",
    name: "Example 4",
    description: "Another example",
    mode: "sparse",
    n: 6,
    edges: [[1, 2], [0, 1], [5, 4], [3, 4], [4, 3], [4, 1]],
    suggestedEdge: [[2, 5]],
  },
    {
    id: "1",
    name: "Example 2",
    description: "Adding edge without starting back search",
    mode: "sparse",
    n: 7,
    edges: [[1, 2], [2, 1], [3, 4], [4, 5], [5, 6], [6, 0], [5, 3], [1, 4]],
    suggestedEdge: [[1,0]],
  },
    {
    id: "2",
    name: "Example 3",
    description: "Adding edge that does just the back search and end with merging new component",
    mode: "sparse",
    n: 5,
    edges: [[3, 4], [4, 3], [0, 1], [4, 1], [1, 2]],
    suggestedEdge: [[2, 0]],
  },
    {
    id: "3",
    name: "",
    description: "",
    mode: "dense",
    n: 10,
    edges: [[1, 2], [2, 3], [0, 3], [0, 6], [5, 4], [4, 5], [4, 7], [8, 7], [0, 9], [3, 1], [8, 4], [6, 4]],
    suggestedEdge: [[7, 0]]
  },
    {
    id: "4",
    name: "",
    description: "",
    mode: "dense",
    n: 5,
    edges: [[2,1], [0, 1], [1, 2], [1, 4], [3, 0], [3, 4]],
    suggestedEdge: null,
  },
]