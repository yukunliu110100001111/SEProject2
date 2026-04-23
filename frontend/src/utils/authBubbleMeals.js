const authBubbleMealPool = [
  'Chicken Salad',
  'Veggie Bowl',
  'Salmon Power Bowl',
  'Tofu Garden Bowl',
  'Shrimp Sweet Potato Plate',
  'Mushroom Quinoa Cup',
  'Beef Energy Box',
  'Avocado Egg Toast Bowl',
  'Green Crunch Salad',
  'Teriyaki Chicken Rice',
];

export const pickAuthBubbleMeals = (count = 3) => {
  const shuffled = [...authBubbleMealPool];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled.slice(0, count);
};
