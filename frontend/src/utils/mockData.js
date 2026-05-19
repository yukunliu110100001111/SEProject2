
export const mockMeals = [
  {
    mealId: 1,
    name: "Chicken Salad",
    description: "Classic chicken salad with organic greens.",
    calories: 450,
    protein: 30,
    sustainabilityScore: 8,
    ingredients: [
      { ingredientId: 1, name: "Chicken", weight_g: 150 },
      { ingredientId: 2, name: "Organic Greens", weight_g: 100 }
    ],
    tags: ["low-carbon", "high-protein"]
  },
  {
    mealId: 2,
    name: "Vegan Tofu Bowl",
    description: "100% plant-based energy bowl.",
    calories: 380,
    protein: 25,
    sustainabilityScore: 10, 
    ingredients: [
      { ingredientId: 3, name: "Tofu", weight_g: 200 },
      { ingredientId: 4, name: "Quinoa", weight_g: 150 }
    ],
    tags: ["vegan", "zero-carbon"]
  },
  {
    mealId: 3,
    name: "Mushroom Pasta",
    description: "Wild mushroom pasta with truffle oil.",
    calories: 520,
    protein: 15,
    sustainabilityScore: 6,
    ingredients: [
      { ingredientId: 5, name: "Mushroom", weight_g: 100 },
      { ingredientId: 6, name: "Pasta", weight_g: 200 }
    ],
    tags: ["vegetarian"]
  }
];